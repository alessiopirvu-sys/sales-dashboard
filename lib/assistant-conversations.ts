import {
  AssistantConversationMessage,
  AssistantConversationRecord,
  AssistantConversationSummary
} from "@/lib/types";

type AssistantConversationRow = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: AssistantConversationMessage[] | null;
};

const DEFAULT_CONVERSATION_TITLE = "Nuova chat";
const MAX_TITLE_LENGTH = 120;
const AUTO_TITLE_MAX_LENGTH = 72;

const devConversationStore = new Map<string, AssistantConversationRecord[]>();

function compactWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function sanitizeConversationMessages(messages: AssistantConversationMessage[]) {
  return messages
    .filter((message) => typeof message.content === "string" && message.content.trim().length > 0)
    .map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content.trim(),
      source: message.source,
      model: message.model ?? null
    }));
}

export function generateConversationTitle(messages: AssistantConversationMessage[]) {
  const firstUserMessage = messages.find((message) => message.role === "user")?.content ?? "";
  const normalized = compactWhitespace(firstUserMessage);

  if (!normalized) {
    return DEFAULT_CONVERSATION_TITLE;
  }

  if (normalized.length <= AUTO_TITLE_MAX_LENGTH) {
    return normalized;
  }

  return `${normalized.slice(0, AUTO_TITLE_MAX_LENGTH - 1).trimEnd()}…`;
}

export function normalizeConversationTitle(title: string | null | undefined, messages: AssistantConversationMessage[]) {
  const normalized = compactWhitespace(title ?? "");

  if (!normalized) {
    return generateConversationTitle(messages);
  }

  return normalized.slice(0, MAX_TITLE_LENGTH);
}

export function summarizeConversation(row: AssistantConversationRow): AssistantConversationSummary {
  const messages = Array.isArray(row.messages) ? row.messages : [];
  const lastMessage = messages.at(-1)?.content ?? null;

  return {
    id: row.id,
    title: row.title,
    created_at: row.created_at,
    updated_at: row.updated_at,
    message_count: messages.length,
    last_message_preview: lastMessage ? generateConversationTitle([{ id: "preview", role: "user", content: lastMessage }]) : null
  };
}

export function mapConversationRow(row: AssistantConversationRow): AssistantConversationRecord {
  const safeMessages = sanitizeConversationMessages(Array.isArray(row.messages) ? row.messages : []);

  return {
    ...summarizeConversation({
      ...row,
      messages: safeMessages
    }),
    messages: safeMessages
  };
}

export function getDevConversations(profileId: string) {
  return devConversationStore.get(profileId) ?? [];
}

export function setDevConversations(profileId: string, conversations: AssistantConversationRecord[]) {
  devConversationStore.set(profileId, conversations);
}

export function getDefaultConversationTitle() {
  return DEFAULT_CONVERSATION_TITLE;
}
