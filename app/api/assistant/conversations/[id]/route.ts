import { NextRequest, NextResponse } from "next/server";

import {
  getDefaultConversationTitle,
  getDevConversations,
  mapConversationRow,
  normalizeConversationTitle,
  sanitizeConversationMessages,
  setDevConversations
} from "@/lib/assistant-conversations";
import { AppError, toPublicError } from "@/lib/auth/errors";
import { requireAdmin } from "@/lib/auth/session";
import { AssistantConversationMessage } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteContext = {
  params: {
    id: string;
  };
};

type UpdateConversationPayload = {
  title?: string;
  messages?: AssistantConversationMessage[];
};

function parseMessages(messages: unknown) {
  if (!Array.isArray(messages)) {
    return undefined;
  }

  return sanitizeConversationMessages(messages as AssistantConversationMessage[]);
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const context = await requireAdmin();

    if (context.isDevMode) {
      const conversation = getDevConversations(context.profile.id).find((item) => item.id === params.id);

      if (!conversation) {
        throw new AppError("INTERNAL_ERROR", "Chat non trovata.", 404);
      }

      return NextResponse.json({ conversation });
    }

    const { data, error } = await context.supabase
      .from("assistant_conversations")
      .select("id,title,created_at,updated_at,messages")
      .eq("profile_id", context.profile.id)
      .eq("id", params.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new AppError("INTERNAL_ERROR", "Chat non trovata.", 404);
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
    const response = toPublicError(error, "Impossibile caricare la chat.");
    return NextResponse.json(response.body, { status: response.status });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const context = await requireAdmin();
    const body = (await request.json()) as UpdateConversationPayload;
    const nextMessages = parseMessages(body.messages);

    if (context.isDevMode) {
      const conversations = getDevConversations(context.profile.id);
      const index = conversations.findIndex((item) => item.id === params.id);

      if (index === -1) {
        throw new AppError("INTERNAL_ERROR", "Chat non trovata.", 404);
      }

      const current = conversations[index];
      const messages = nextMessages ?? current.messages;
      const nextTitle =
        typeof body.title === "string"
          ? normalizeConversationTitle(body.title, messages)
          : current.title === getDefaultConversationTitle()
            ? normalizeConversationTitle(current.title, messages)
            : current.title;

      const updatedConversation = {
        ...current,
        title: nextTitle,
        messages,
        updated_at: new Date().toISOString(),
        message_count: messages.length,
        last_message_preview: messages.at(-1)?.content ?? null
      };

      const updatedConversations = [...conversations];
      updatedConversations[index] = updatedConversation;
      updatedConversations.sort((left, right) => right.updated_at.localeCompare(left.updated_at));
      setDevConversations(context.profile.id, updatedConversations);

      return NextResponse.json({ conversation: updatedConversation });
    }

    const { data: existing, error: existingError } = await context.supabase
      .from("assistant_conversations")
      .select("id,title,created_at,updated_at,messages")
      .eq("profile_id", context.profile.id)
      .eq("id", params.id)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (!existing) {
      throw new AppError("INTERNAL_ERROR", "Chat non trovata.", 404);
    }

    const currentMessages = sanitizeConversationMessages(
      Array.isArray(existing.messages) ? (existing.messages as AssistantConversationMessage[]) : []
    );
    const messages = nextMessages ?? currentMessages;
    const title =
      typeof body.title === "string"
        ? normalizeConversationTitle(body.title, messages)
        : existing.title === getDefaultConversationTitle()
          ? normalizeConversationTitle(existing.title, messages)
          : existing.title;

    const { data, error } = await context.supabase
      .from("assistant_conversations")
      .update({
        title,
        messages
      })
      .eq("profile_id", context.profile.id)
      .eq("id", params.id)
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
    const response = toPublicError(error, "Impossibile aggiornare la chat.");
    return NextResponse.json(response.body, { status: response.status });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const context = await requireAdmin();

    if (context.isDevMode) {
      const conversations = getDevConversations(context.profile.id).filter((item) => item.id !== params.id);
      setDevConversations(context.profile.id, conversations);
      return NextResponse.json({ success: true });
    }

    const { error } = await context.supabase
      .from("assistant_conversations")
      .delete()
      .eq("profile_id", context.profile.id)
      .eq("id", params.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const response = toPublicError(error, "Impossibile eliminare la chat.");
    return NextResponse.json(response.body, { status: response.status });
  }
}
