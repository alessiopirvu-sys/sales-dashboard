import { NextRequest, NextResponse } from "next/server";

import {
  ASSISTANT_PROMPT_VERSION,
  buildAssistantResponseFormatPrompt,
  buildAssistantUserPrompt,
  buildAssistantSystemPrompt
} from "@/lib/assistant-openai";
import {
  buildStructuredAssistantFallback,
  generateAssistantAnswer
} from "@/lib/assistant-insights";
import { getOpenAIClient, OPENAI_MODEL } from "@/lib/openai";
import { AssistantReply, AssistantStructuredReply, DashboardResponse } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;
const ASSISTANT_CACHE_TTL_MS = 120_000;

type AssistantCacheEntry = {
  expiresAt: number;
  payload: AssistantReply;
};

const assistantReplyCache = new Map<string, AssistantCacheEntry>();

type AssistantRequestPayload = {
  prompt?: string;
  data?: DashboardResponse;
};

function buildFallbackReply(prompt: string, data: DashboardResponse): AssistantReply {
  return {
    answer: generateAssistantAnswer(prompt, data),
    source: "fallback",
    structured: buildStructuredAssistantFallback(prompt, data)
  };
}

function parseStructuredReply(content: string): AssistantStructuredReply | null {
  try {
    const parsed = JSON.parse(content) as AssistantStructuredReply;
    if (
      !parsed ||
      typeof parsed.headline !== "string" ||
      typeof parsed.summary !== "string" ||
      !Array.isArray(parsed.sections) ||
      !Array.isArray(parsed.metrics) ||
      !Array.isArray(parsed.sellerRows)
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AssistantRequestPayload;
    const prompt = body.prompt?.trim();
    const data = body.data;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt mancante." }, { status: 400 });
    }

    if (!data) {
      return NextResponse.json({ error: "Dati KPI mancanti." }, { status: 400 });
    }

    const cacheKey = JSON.stringify({
      prompt,
      model: OPENAI_MODEL,
      promptVersion: ASSISTANT_PROMPT_VERSION,
      lastUpdated: data.meta.lastUpdated,
      totalRows: data.meta.totalRows,
      sellerCount: data.meta.availableSellers.length
    });
    const cached = assistantReplyCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json(cached.payload, {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0"
        }
      });
    }

    const openai = getOpenAIClient();
    const response = await openai.responses.create({
      model: OPENAI_MODEL,
      input: [
        {
          role: "system",
          content: `${buildAssistantSystemPrompt()} ${buildAssistantResponseFormatPrompt()}`
        },
        {
          role: "user",
          content: buildAssistantUserPrompt(prompt, data)
        }
      ]
    });

    const answer = response.output_text?.trim();
    if (!answer) {
      return NextResponse.json(buildFallbackReply(prompt, data), {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0"
        }
      });
    }

    const structured = parseStructuredReply(answer);
    if (!structured) {
      return NextResponse.json(buildFallbackReply(prompt, data), {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0"
        }
      });
    }

    const payload = {
      answer: structured.summary,
      source: "openai",
      model: OPENAI_MODEL,
      structured
    } satisfies AssistantReply;

    assistantReplyCache.set(cacheKey, {
      payload,
      expiresAt: Date.now() + ASSISTANT_CACHE_TTL_MS
    });

    return NextResponse.json(payload, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0"
      }
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Errore durante la risposta dell'assistente.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
