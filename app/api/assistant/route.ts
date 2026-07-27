import { NextRequest, NextResponse } from "next/server";

import {
  ASSISTANT_PROMPT_VERSION,
  buildAssistantUserPrompt,
  buildAssistantSystemPrompt
} from "@/lib/assistant-openai";
import {
  generateAssistantAnswer
} from "@/lib/assistant-insights";
import { toPublicError } from "@/lib/auth/errors";
import { requireAdmin } from "@/lib/auth/session";
import { getOpenAIClient, OPENAI_MODEL } from "@/lib/openai";
import { AssistantReply, DashboardResponse } from "@/lib/types";

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
    source: "fallback"
  };
}

function chunkTextForStreaming(text: string) {
  return text.match(/.{1,18}(\s|$)/g) ?? [text];
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
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
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        };

        const streamCachedReply = async (payload: AssistantReply) => {
          sendEvent({
            type: "start",
            source: payload.source,
            model: payload.model ?? null
          });

          for (const chunk of chunkTextForStreaming(payload.answer)) {
            sendEvent({ type: "delta", delta: chunk });
          }

          sendEvent({ type: "done" });
        };

        if (cached && cached.expiresAt > Date.now()) {
          await streamCachedReply(cached.payload);
          controller.close();
          return;
        }

        try {
          const openai = getOpenAIClient();
          const response = await openai.responses.create({
            model: OPENAI_MODEL,
            stream: true,
            input: [
              {
                role: "system",
                content: buildAssistantSystemPrompt()
              },
              {
                role: "user",
                content: buildAssistantUserPrompt(prompt, data)
              }
            ]
          });

          let answer = "";
          let started = false;

          for await (const event of response) {
            if (event.type !== "response.output_text.delta" || !event.delta) {
              continue;
            }

            if (!started) {
              sendEvent({
                type: "start",
                source: "openai",
                model: OPENAI_MODEL
              });
              started = true;
            }

            answer += event.delta;
            sendEvent({
              type: "delta",
              delta: event.delta
            });
          }

          const finalAnswer = answer.trim();
          if (!finalAnswer) {
            throw new Error("Empty assistant response.");
          }

          const payload = {
            answer: finalAnswer,
            source: "openai",
            model: OPENAI_MODEL
          } satisfies AssistantReply;

          assistantReplyCache.set(cacheKey, {
            payload,
            expiresAt: Date.now() + ASSISTANT_CACHE_TTL_MS
          });

          sendEvent({ type: "done" });
        } catch {
          const payload = buildFallbackReply(prompt, data);

          assistantReplyCache.set(cacheKey, {
            payload,
            expiresAt: Date.now() + ASSISTANT_CACHE_TTL_MS
          });

          await streamCachedReply(payload);
        } finally {
          controller.close();
        }
      }
    });

    return new NextResponse(stream, {
      status: 200,
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-store, max-age=0"
      }
    });
  } catch (error) {
    const response = toPublicError(error, "Errore durante la risposta dell'assistente.");
    return NextResponse.json(response.body, { status: response.status });
  }
}
