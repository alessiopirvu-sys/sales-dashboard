import { NextRequest, NextResponse } from "next/server";

import {
  getDevConversations,
  mapConversationRow,
  normalizeConversationTitle,
  sanitizeConversationMessages,
  setDevConversations,
  summarizeConversation
} from "@/lib/assistant-conversations";
import { toPublicError } from "@/lib/auth/errors";
import { requireAdmin } from "@/lib/auth/session";
import { AssistantConversationMessage } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type CreateConversationPayload = {
  title?: string;
  messages?: AssistantConversationMessage[];
};

function parseMessages(messages: unknown) {
  if (!Array.isArray(messages)) {
    return [];
  }

  return sanitizeConversationMessages(messages as AssistantConversationMessage[]);
}

export async function GET() {
  try {
    const context = await requireAdmin();

    if (context.isDevMode) {
      const conversations = getDevConversations(context.profile.id)
        .map((conversation) => summarizeConversation(conversation))
        .sort((left, right) => right.updated_at.localeCompare(left.updated_at));

      return NextResponse.json(
        { conversations },
        {
          headers: {
            "Cache-Control": "no-store, max-age=0"
          }
        }
      );
    }

    const { data, error } = await context.supabase
      .from("assistant_conversations")
      .select("id,title,created_at,updated_at,messages")
      .eq("profile_id", context.profile.id)
      .order("updated_at", { ascending: false });

    if (error) {
      throw error;
    }

    const conversations = (data ?? []).map((row) =>
      summarizeConversation({
        id: row.id,
        title: row.title,
        created_at: row.created_at,
        updated_at: row.updated_at,
        messages: row.messages as AssistantConversationMessage[]
      })
    );

    return NextResponse.json(
      { conversations },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0"
        }
      }
    );
  } catch (error) {
    const response = toPublicError(error, "Impossibile caricare le chat.");
    return NextResponse.json(response.body, { status: response.status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await requireAdmin();
    const body = (await request.json()) as CreateConversationPayload;
    const messages = parseMessages(body.messages);
    const title = normalizeConversationTitle(body.title, messages);

    if (context.isDevMode) {
      const now = new Date().toISOString();
      const conversation = {
        id: crypto.randomUUID(),
        title,
        messages,
        created_at: now,
        updated_at: now,
        message_count: messages.length,
        last_message_preview: messages.at(-1)?.content ?? null
      };

      const conversations = [conversation, ...getDevConversations(context.profile.id)];
      setDevConversations(context.profile.id, conversations);

      return NextResponse.json({ conversation });
    }

    const { data, error } = await context.supabase
      .from("assistant_conversations")
      .insert([
        {
          profile_id: context.profile.id,
          title,
          messages
        }
      ])
      .select("id,title,created_at,updated_at,messages")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      conversation: mapConversationRow({
        id: data.id,
        title: data.title,
        created_at: data.created_at,
        updated_at: data.updated_at,
        messages: data.messages as AssistantConversationMessage[]
      })
    });
  } catch (error) {
    const response = toPublicError(error, "Impossibile creare la chat.");
    return NextResponse.json(response.body, { status: response.status });
  }
}
