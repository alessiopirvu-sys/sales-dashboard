"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import {
  ArrowUp,
  Bot,
  Check,
  Clock3,
  LoaderCircle,
  MessageSquarePlus,
  Pencil,
  Sparkles,
  Trash2,
  UserRound
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { buildDashboardUrl } from "@/lib/data/filters";
import {
  AssistantConversationMessage,
  AssistantConversationRecord,
  AssistantConversationSummary,
  DashboardFilters,
  DashboardResponse
} from "@/lib/types";

const HOME_FILTERS: DashboardFilters = {
  preset: "month",
  seller: "all"
};

const SUGGESTED_PROMPTS = [
  "Chi sta andando meglio questo mese?",
  "Dove stiamo andando peggio?",
  "Cosa dobbiamo fare subito per migliorare i risultati?",
  "Come stiamo andando rispetto al periodo precedente?"
];

const LOCAL_CONVERSATIONS_STORAGE_KEY = "cold-sales-assistant-conversations";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
  source?: "openai" | "fallback";
  model?: string | null;
  isStreaming?: boolean;
};

type AssistantStreamEvent =
  | {
      type: "start";
      source: "openai" | "fallback";
      model: string | null;
    }
  | {
      type: "delta";
      delta: string;
    }
  | {
      type: "done";
    };

type ParsedAssistantBlock =
  | {
      type: "table";
      headers: string[];
      rows: string[][];
    }
  | {
      type: "list";
      items: string[];
    }
  | {
      type: "section";
      title: string;
      body: string;
      tone: "neutral" | "positive" | "negative" | "action";
    }
  | {
      type: "paragraph";
      body: string;
    };

const INITIAL_ASSISTANT_MESSAGE: ChatMessage = {
  id: "assistant-welcome",
  role: "assistant",
  content:
    "Ciao, sono l'assistente KPI di Cold Sales. Chiedimi chi sta performando meglio, dove stiamo rallentando e quali azioni commerciali conviene fare subito.",
  source: "openai",
  model: null
};

function createMessageId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function mapStoredMessageToChatMessage(message: AssistantConversationMessage): ChatMessage {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    source: message.source,
    model: message.model ?? null
  };
}

function mapChatMessageToStoredMessage(message: ChatMessage): AssistantConversationMessage | null {
  const content = message.content.trim();

  if (!content) {
    return null;
  }

  return {
    id: message.id,
    role: message.role,
    content,
    source: message.source,
    model: message.model ?? null
  };
}

function buildConversationMessages(messages: ChatMessage[]) {
  return messages
    .map(mapChatMessageToStoredMessage)
    .filter((message): message is AssistantConversationMessage => message !== null);
}

function upsertConversationSummary(
  current: AssistantConversationSummary[],
  conversation: AssistantConversationSummary
) {
  return [conversation, ...current.filter((item) => item.id !== conversation.id)].sort((left, right) =>
    right.updated_at.localeCompare(left.updated_at)
  );
}

function buildConversationLabel(updatedAt: string) {
  return format(new Date(updatedAt), "dd MMM yyyy, HH:mm", { locale: it });
}

function readLocalConversations() {
  if (typeof window === "undefined") {
    return [] as AssistantConversationRecord[];
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_CONVERSATIONS_STORAGE_KEY);

    if (!raw) {
      return [] as AssistantConversationRecord[];
    }

    const parsed = JSON.parse(raw) as AssistantConversationRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [] as AssistantConversationRecord[];
  }
}

function writeLocalConversations(conversations: AssistantConversationRecord[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    LOCAL_CONVERSATIONS_STORAGE_KEY,
    JSON.stringify(conversations)
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-1.5">
      <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400 [animation-delay:0ms]" />
      <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400 [animation-delay:140ms]" />
      <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400 [animation-delay:280ms]" />
    </div>
  );
}

function getSectionTone(title: string): "neutral" | "positive" | "negative" | "action" {
  const normalized = title.toLowerCase();

  if (
    normalized.includes("azione") ||
    normalized.includes("priorit") ||
    normalized.includes("fare") ||
    normalized.includes("subito")
  ) {
    return "action";
  }

  if (
    normalized.includes("risch") ||
    normalized.includes("critic") ||
    normalized.includes("peggio") ||
    normalized.includes("interven") ||
    normalized.includes("attenzione") ||
    normalized.includes("impatto")
  ) {
    return "negative";
  }

  if (
    normalized.includes("bene") ||
    normalized.includes("meglio") ||
    normalized.includes("forza") ||
    normalized.includes("opportun")
  ) {
    return "positive";
  }

  return "neutral";
}

function isMarkdownTableBlock(lines: string[]) {
  if (lines.length < 2) {
    return false;
  }

  const separatorLine = lines[1]?.trim();
  return (
    lines.every((line) => line.includes("|")) &&
    /^\|?[\s:-]+\|[\s|:-]*$/.test(separatorLine)
  );
}

function parseMarkdownTable(lines: string[]) {
  const normalizeRow = (line: string) =>
    line
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((cell) => cell.trim());

  const headers = normalizeRow(lines[0] ?? "");
  const rows = lines.slice(2).map(normalizeRow).filter((row) => row.length === headers.length);

  if (!headers.length || !rows.length) {
    return null;
  }

  return { headers, rows };
}

function parseAssistantContent(content: string): ParsedAssistantBlock[] {
  const trimmed = content.trim();

  if (!trimmed) {
    return [];
  }

  return trimmed
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      if (!lines.length) {
        return {
          type: "paragraph",
          body: block
        } satisfies ParsedAssistantBlock;
      }

      if (isMarkdownTableBlock(lines)) {
        const table = parseMarkdownTable(lines);
        if (table) {
          return {
            type: "table",
            headers: table.headers,
            rows: table.rows
          } satisfies ParsedAssistantBlock;
        }
      }

      if (lines.every((line) => /^[-*]\s+/.test(line))) {
        return {
          type: "list",
          items: lines.map((line) => line.replace(/^[-*]\s+/, "").trim())
        } satisfies ParsedAssistantBlock;
      }

      if (lines.length === 1) {
        const match = lines[0].match(/^([^:]{2,60}):\s*(.+)$/);
        if (match) {
          const [, title, body] = match;
          return {
            type: "section",
            title: title.trim(),
            body: body.trim(),
            tone: getSectionTone(title)
          } satisfies ParsedAssistantBlock;
        }
      }

      return {
        type: "paragraph",
        body: lines.join(" ")
      } satisfies ParsedAssistantBlock;
    });
}

function AssistantRichContent({ content }: { content: string }) {
  const blocks = parseAssistantContent(content);

  if (!blocks.length) {
    return null;
  }

  const toneClasses: Record<"neutral" | "positive" | "negative" | "action", string> = {
    neutral:
      "border-slate-200 bg-[linear-gradient(135deg,rgba(248,250,252,0.98),rgba(241,245,249,0.92))]",
    positive:
      "border-emerald-200 bg-[linear-gradient(135deg,rgba(236,253,245,0.98),rgba(209,250,229,0.92))]",
    negative:
      "border-amber-200 bg-[linear-gradient(135deg,rgba(255,251,235,0.98),rgba(254,243,199,0.92))]",
    action:
      "border-violet-200 bg-[linear-gradient(135deg,rgba(245,243,255,0.98),rgba(237,233,254,0.92))]"
  };

  const toneBadgeClasses: Record<"neutral" | "positive" | "negative" | "action", string> = {
    neutral: "bg-slate-950 text-white",
    positive: "bg-emerald-600 text-white",
    negative: "bg-amber-500 text-slate-950",
    action: "bg-primary text-white"
  };

  return (
    <div className="w-full space-y-3 text-[15px] leading-7 text-slate-800">
      {blocks.map((block, index) => {
        if (block.type === "section") {
          return (
            <div
              key={`${block.title}-${index}`}
              className={`w-full rounded-3xl border p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)] ${toneClasses[block.tone]}`}
            >
              <div className="mb-3 flex items-center gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] ${toneBadgeClasses[block.tone]}`}
                >
                  {block.title}
                </span>
              </div>
              <p className="text-[15px] leading-7 text-slate-700">{block.body}</p>
            </div>
          );
        }

        if (block.type === "list") {
          return (
            <div
              key={`list-${index}`}
              className="w-full rounded-3xl border border-slate-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(248,250,252,0.92))] p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]"
            >
              <ul className="space-y-2">
                {block.items.map((item, itemIndex) => (
                  <li key={`${item}-${itemIndex}`} className="flex items-start gap-3">
                    <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        }

        if (block.type === "table") {
          return (
            <div
              key={`table-${index}`}
              className="w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]"
            >
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="bg-slate-950 text-white">
                    <tr>
                      {block.headers.map((header) => (
                        <th
                          key={header}
                          className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.2em]"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                    {block.rows.map((row, rowIndex) => (
                      <tr key={`${row.join("-")}-${rowIndex}`} className="odd:bg-slate-50/70">
                        {row.map((cell, cellIndex) => (
                          <td key={`${cell}-${cellIndex}`} className="px-4 py-3 align-top">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        }

        return (
          <div
            key={`paragraph-${index}`}
            className="w-full rounded-3xl border border-slate-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(248,250,252,0.92))] p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]"
          >
            <p className="text-[15px] leading-7 text-slate-700">{block.body}</p>
          </div>
        );
      })}
    </div>
  );
}

export function AssistantHomePage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<AssistantConversationSummary[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [renamingConversationId, setRenamingConversationId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [conversationStoreMode, setConversationStoreMode] = useState<"remote" | "local">("remote");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isOpeningConversation, setIsOpeningConversation] = useState(false);
  const [isSavingConversation, setIsSavingConversation] = useState(false);
  const [isDeletingConversationId, setIsDeletingConversationId] = useState<string | null>(null);
  const [isAnswering, setIsAnswering] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const visibleMessages = messages.length > 0 ? messages : [INITIAL_ASSISTANT_MESSAGE];

  useEffect(() => {
    const controller = new AbortController();

    async function loadHomeData() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(buildDashboardUrl(HOME_FILTERS), {
          cache: "no-store",
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error("Impossibile caricare i dati per l'assistente KPI.");
        }

        const payload = (await response.json()) as DashboardResponse;
        setData(payload);
      } catch (requestError) {
        if (requestError instanceof Error && requestError.name === "AbortError") {
          return;
        }

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Errore sconosciuto durante il caricamento della home."
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadHomeData();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadConversations() {
      setIsLoadingConversations(true);

      try {
        const response = await fetch("/api/assistant/conversations", {
          cache: "no-store",
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error("Impossibile caricare le chat salvate.");
        }

        const payload = (await response.json()) as {
          conversations: AssistantConversationSummary[];
        };

        setConversations(payload.conversations);
        setConversationStoreMode("remote");

        if (payload.conversations.length > 0) {
          const firstConversation = payload.conversations[0];
          setIsOpeningConversation(true);

          const conversationResponse = await fetch(
            `/api/assistant/conversations/${firstConversation.id}`,
            {
              cache: "no-store",
              signal: controller.signal
            }
          );

          if (!conversationResponse.ok) {
            throw new Error("Impossibile aprire la chat piu recente.");
          }

          const conversationPayload = (await conversationResponse.json()) as {
            conversation: AssistantConversationRecord;
          };

          setCurrentConversationId(conversationPayload.conversation.id);
          setMessages(
            conversationPayload.conversation.messages.map(mapStoredMessageToChatMessage)
          );
        } else {
          setCurrentConversationId(null);
          setMessages([]);
        }
      } catch (requestError) {
        if (requestError instanceof Error && requestError.name === "AbortError") {
          return;
        }

        const localConversations = readLocalConversations().sort((left, right) =>
          right.updated_at.localeCompare(left.updated_at)
        );

        setConversationStoreMode("local");
        setConversations(
          localConversations.map((conversation) => ({
            id: conversation.id,
            title: conversation.title,
            created_at: conversation.created_at,
            updated_at: conversation.updated_at,
            message_count: conversation.message_count,
            last_message_preview: conversation.last_message_preview
          }))
        );

        if (localConversations[0]) {
          setCurrentConversationId(localConversations[0].id);
          setMessages(localConversations[0].messages.map(mapStoredMessageToChatMessage));
        } else {
          setCurrentConversationId(null);
          setMessages([]);
        }
      } finally {
        setIsLoadingConversations(false);
        setIsOpeningConversation(false);
      }
    }

    void loadConversations();

    return () => controller.abort();
  }, []);

  const lastUpdatedLabel = data?.meta.lastUpdated
    ? format(new Date(data.meta.lastUpdated), "dd MMM yyyy, HH:mm", { locale: it })
    : "In attesa di sincronizzazione";

  const currentConversation = currentConversationId
    ? conversations.find((conversation) => conversation.id === currentConversationId) ?? null
    : null;

  const upsertLocalConversation = (conversation: AssistantConversationRecord) => {
    const localConversations = [
      conversation,
      ...readLocalConversations().filter((item) => item.id !== conversation.id)
    ].sort((left, right) => right.updated_at.localeCompare(left.updated_at));

    writeLocalConversations(localConversations);
    setConversations(
      localConversations.map((item) => ({
        id: item.id,
        title: item.title,
        created_at: item.created_at,
        updated_at: item.updated_at,
        message_count: item.message_count,
        last_message_preview: item.last_message_preview
      }))
    );
    setCurrentConversationId(conversation.id);
    setConversationStoreMode("local");
  };

  const updateAssistantMessage = (
    messageId: string,
    updater: (message: ChatMessage) => ChatMessage
  ) => {
    setMessages((current) =>
      current.map((message) => (message.id === messageId ? updater(message) : message))
    );
  };

  const persistConversation = async (nextMessages: ChatMessage[]) => {
    const storedMessages = buildConversationMessages(nextMessages);

    if (!storedMessages.length) {
      return;
    }

    setIsSavingConversation(true);

    try {
      if (conversationStoreMode === "local") {
        const now = new Date().toISOString();
        const currentTitle =
          currentConversation?.title && currentConversation.title !== "Nuova chat"
            ? currentConversation.title
            : storedMessages.find((message) => message.role === "user")?.content?.slice(0, 72) || "Nuova chat";
        const conversation: AssistantConversationRecord = {
          id: currentConversationId ?? createMessageId("conversation"),
          title: currentTitle,
          created_at: currentConversation?.created_at ?? now,
          updated_at: now,
          message_count: storedMessages.length,
          last_message_preview: storedMessages.at(-1)?.content ?? null,
          messages: storedMessages
        };

        upsertLocalConversation(conversation);
        return;
      }

      const response = await fetch(
        currentConversationId
          ? `/api/assistant/conversations/${currentConversationId}`
          : "/api/assistant/conversations",
        {
          method: currentConversationId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            messages: storedMessages
          })
        }
      );

      if (!response.ok) {
        throw new Error("Impossibile salvare la chat.");
      }

      const payload = (await response.json()) as {
        conversation: AssistantConversationRecord;
      };

      const summary: AssistantConversationSummary = {
        id: payload.conversation.id,
        title: payload.conversation.title,
        created_at: payload.conversation.created_at,
        updated_at: payload.conversation.updated_at,
        message_count: payload.conversation.message_count,
        last_message_preview: payload.conversation.last_message_preview
      };

      setCurrentConversationId(payload.conversation.id);
      setConversations((current) => upsertConversationSummary(current, summary));
      setConversationStoreMode("remote");
      writeLocalConversations(
        [
          {
            ...payload.conversation,
            messages: payload.conversation.messages
          },
          ...readLocalConversations().filter((item) => item.id !== payload.conversation.id)
        ].sort((left, right) => right.updated_at.localeCompare(left.updated_at))
      );
    } catch {
      const now = new Date().toISOString();
      const currentTitle =
        currentConversation?.title && currentConversation.title !== "Nuova chat"
          ? currentConversation.title
          : storedMessages.find((message) => message.role === "user")?.content?.slice(0, 72) || "Nuova chat";
      const conversation: AssistantConversationRecord = {
        id: currentConversationId ?? createMessageId("conversation"),
        title: currentTitle,
        created_at: currentConversation?.created_at ?? now,
        updated_at: now,
        message_count: storedMessages.length,
        last_message_preview: storedMessages.at(-1)?.content ?? null,
        messages: storedMessages
      };

      upsertLocalConversation(conversation);
    } finally {
      setIsSavingConversation(false);
    }
  };

  const openConversation = async (conversationId: string) => {
    if (conversationId === currentConversationId || isAnswering) {
      return;
    }

    setError(null);
    setIsOpeningConversation(true);
    setRenamingConversationId(null);

    try {
      if (conversationStoreMode === "local") {
        const conversation = readLocalConversations().find((item) => item.id === conversationId);

        if (!conversation) {
          throw new Error("Impossibile aprire la chat selezionata.");
        }

        setCurrentConversationId(conversation.id);
        setMessages(conversation.messages.map(mapStoredMessageToChatMessage));
        return;
      }

      const response = await fetch(`/api/assistant/conversations/${conversationId}`, {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error("Impossibile aprire la chat selezionata.");
      }

      const payload = (await response.json()) as {
        conversation: AssistantConversationRecord;
      };

      setCurrentConversationId(payload.conversation.id);
      setMessages(payload.conversation.messages.map(mapStoredMessageToChatMessage));
    } catch {
      const conversation = readLocalConversations().find((item) => item.id === conversationId);

      if (conversation) {
        setConversationStoreMode("local");
        setCurrentConversationId(conversation.id);
        setMessages(conversation.messages.map(mapStoredMessageToChatMessage));
      } else {
        setError("Errore sconosciuto durante l'apertura della chat.");
      }
    } finally {
      setIsOpeningConversation(false);
    }
  };

  const handleStartNewChat = () => {
    if (isAnswering) {
      return;
    }

    setCurrentConversationId(null);
    setMessages([]);
    setPrompt("");
    setError(null);
    setRenamingConversationId(null);
    setRenameValue("");
  };

  const handleRenameConversation = async (conversationId: string) => {
    const title = renameValue.trim();

    if (!title) {
      setRenamingConversationId(null);
      setRenameValue("");
      return;
    }

    setIsSavingConversation(true);

    try {
      if (conversationStoreMode === "local") {
        const localConversations = readLocalConversations();
        const target = localConversations.find((item) => item.id === conversationId);

        if (!target) {
          throw new Error("Impossibile rinominare la chat.");
        }

        const updatedConversation: AssistantConversationRecord = {
          ...target,
          title,
          updated_at: new Date().toISOString()
        };

        upsertLocalConversation(updatedConversation);
        setRenamingConversationId(null);
        setRenameValue("");
        return;
      }

      const response = await fetch(`/api/assistant/conversations/${conversationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ title })
      });

      if (!response.ok) {
        throw new Error("Impossibile rinominare la chat.");
      }

      const payload = (await response.json()) as {
        conversation: AssistantConversationRecord;
      };

      const summary: AssistantConversationSummary = {
        id: payload.conversation.id,
        title: payload.conversation.title,
        created_at: payload.conversation.created_at,
        updated_at: payload.conversation.updated_at,
        message_count: payload.conversation.message_count,
        last_message_preview: payload.conversation.last_message_preview
      };

      setConversations((current) => upsertConversationSummary(current, summary));
      setRenamingConversationId(null);
      setRenameValue("");
      setConversationStoreMode("remote");
    } catch {
      const localConversations = readLocalConversations();
      const target = localConversations.find((item) => item.id === conversationId);

      if (target) {
        const updatedConversation: AssistantConversationRecord = {
          ...target,
          title,
          updated_at: new Date().toISOString()
        };

        upsertLocalConversation(updatedConversation);
        setRenamingConversationId(null);
        setRenameValue("");
      } else {
        setError("Errore sconosciuto durante la rinomina della chat.");
      }
    } finally {
      setIsSavingConversation(false);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (isAnswering || !window.confirm("Vuoi eliminare questa chat?")) {
      return;
    }

    setIsDeletingConversationId(conversationId);

    try {
      if (conversationStoreMode === "local") {
        const nextLocalConversations = readLocalConversations().filter((item) => item.id !== conversationId);
        writeLocalConversations(nextLocalConversations);
        setConversations(
          nextLocalConversations.map((item) => ({
            id: item.id,
            title: item.title,
            created_at: item.created_at,
            updated_at: item.updated_at,
            message_count: item.message_count,
            last_message_preview: item.last_message_preview
          }))
        );

        if (currentConversationId === conversationId) {
          if (nextLocalConversations[0]) {
            setCurrentConversationId(nextLocalConversations[0].id);
            setMessages(nextLocalConversations[0].messages.map(mapStoredMessageToChatMessage));
          } else {
            handleStartNewChat();
          }
        }

        return;
      }

      const response = await fetch(`/api/assistant/conversations/${conversationId}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        throw new Error("Impossibile eliminare la chat.");
      }

      const nextConversations = conversations.filter((conversation) => conversation.id !== conversationId);
      setConversations(nextConversations);

      if (currentConversationId === conversationId) {
        if (nextConversations[0]) {
          await openConversation(nextConversations[0].id);
        } else {
          handleStartNewChat();
        }
      }
    } catch {
      const nextLocalConversations = readLocalConversations().filter((item) => item.id !== conversationId);

      if (nextLocalConversations.length !== readLocalConversations().length) {
        writeLocalConversations(nextLocalConversations);
        setConversations(
          nextLocalConversations.map((item) => ({
            id: item.id,
            title: item.title,
            created_at: item.created_at,
            updated_at: item.updated_at,
            message_count: item.message_count,
            last_message_preview: item.last_message_preview
          }))
        );
        setConversationStoreMode("local");

        if (currentConversationId === conversationId) {
          if (nextLocalConversations[0]) {
            setCurrentConversationId(nextLocalConversations[0].id);
            setMessages(nextLocalConversations[0].messages.map(mapStoredMessageToChatMessage));
          } else {
            handleStartNewChat();
          }
        }
      } else {
        setError("Errore sconosciuto durante l'eliminazione della chat.");
      }
    } finally {
      setIsDeletingConversationId(null);
    }
  };

  const handleAsk = (nextPrompt?: string) => {
    if (!data || isAnswering) {
      return;
    }

    const value = (nextPrompt ?? prompt).trim();
    if (!value) {
      return;
    }

    const baseMessages = [...messages];
    const userMessageId = createMessageId("user");
    const assistantMessageId = createMessageId("assistant");
    const userMessage: ChatMessage = {
      id: userMessageId,
      role: "user",
      content: value
    };
    const assistantPlaceholder: ChatMessage = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      model: null,
      isStreaming: true
    };
    let assistantContent = "";
    let assistantSource: "openai" | "fallback" | undefined;
    let assistantModel: string | null = null;

    setPrompt("");
    setError(null);
    setIsAnswering(true);
    setMessages([...baseMessages, userMessage, assistantPlaceholder]);

    void (async () => {
      try {
        const response = await fetch("/api/assistant", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            prompt: value,
            data
          })
        });

        if (!response.ok || !response.body) {
          throw new Error("Impossibile ottenere la risposta AI.");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { value: chunk, done } = await reader.read();

          if (done) {
            break;
          }

          buffer += decoder.decode(chunk, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) {
              continue;
            }

            const event = JSON.parse(trimmed) as AssistantStreamEvent;

            if (event.type === "start") {
              assistantSource = event.source;
              assistantModel = event.model;
              updateAssistantMessage(assistantMessageId, (message) => ({
                ...message,
                source: event.source,
                model: event.model
              }));
              continue;
            }

            if (event.type === "delta") {
              assistantContent += event.delta;
              updateAssistantMessage(assistantMessageId, (message) => ({
                ...message,
                content: `${message.content}${event.delta}`
              }));
              continue;
            }

            if (event.type === "done") {
              updateAssistantMessage(assistantMessageId, (message) => ({
                ...message,
                isStreaming: false
              }));
            }
          }
        }

        updateAssistantMessage(assistantMessageId, (message) => ({
          ...message,
          isStreaming: false
        }));

        await persistConversation([
          ...baseMessages,
          userMessage,
          {
            id: assistantMessageId,
            role: "assistant",
            content: assistantContent.trim(),
            source: assistantSource,
            model: assistantModel,
            isStreaming: false
          }
        ]);
      } catch (requestError) {
        const fallbackMessage =
          "Non sono riuscito a completare la risposta in questo momento. Riprova tra qualche secondo.";

        updateAssistantMessage(assistantMessageId, (message) => ({
          ...message,
          content: fallbackMessage,
          source: "fallback",
          model: null,
          isStreaming: false
        }));

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Errore sconosciuto durante la richiesta all'assistente."
        );

        await persistConversation([
          ...baseMessages,
          userMessage,
          {
            id: assistantMessageId,
            role: "assistant",
            content: fallbackMessage,
            source: "fallback",
            model: null,
            isStreaming: false
          }
        ]);
      } finally {
        setIsAnswering(false);
      }
    })();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleAsk();
  };

  return (
    <main className="mx-auto max-w-[1480px] space-y-6">
      <div>
        <Card className="overflow-hidden border-slate-200 bg-white">
          <CardContent className="flex min-h-[760px] flex-col p-0 lg:flex-row">
            <aside className="flex w-full shrink-0 flex-col border-b border-slate-200 bg-[#0f1117] text-white lg:w-[270px] lg:border-b-0 lg:border-r lg:border-slate-800">
              <div className="border-b border-white/10 px-5 py-5">
                <button
                  type="button"
                  onClick={handleStartNewChat}
                  disabled={isAnswering}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <MessageSquarePlus className="h-4 w-4" />
                  Nuova chat
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-3 py-4">
                <div className="space-y-2">
                  {isLoadingConversations ? (
                    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                      <LoaderCircle className="h-4 w-4 animate-spin text-primary" />
                      Carico cronologia chat...
                    </div>
                  ) : conversations.length > 0 ? (
                    conversations.map((conversation) => {
                      const isActive = conversation.id === currentConversationId;
                      const isRenaming = conversation.id === renamingConversationId;

                      return (
                        <div
                          key={conversation.id}
                          className={`rounded-2xl border transition ${
                            isActive
                              ? "border-primary/60 bg-primary/15"
                              : "border-white/8 bg-white/[0.03] hover:bg-white/[0.06]"
                          }`}
                        >
                          {isRenaming ? (
                            <div className="space-y-3 p-3">
                              <input
                                value={renameValue}
                                onChange={(event) => setRenameValue(event.target.value)}
                                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500"
                                placeholder="Titolo chat"
                                autoFocus
                              />
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleRenameConversation(conversation.id)}
                                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRenamingConversationId(null);
                                    setRenameValue("");
                                  }}
                                  className="rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-300"
                                >
                                  Annulla
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => void openConversation(conversation.id)}
                              disabled={isAnswering}
                              className="w-full p-3 text-left"
                            >
                              <div className="flex items-start gap-3">
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-semibold text-white">
                                    {conversation.title}
                                  </p>
                                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">
                                    {conversation.last_message_preview ?? "Chat salvata"}
                                  </p>
                                  <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                                    {buildConversationLabel(conversation.updated_at)}
                                  </p>
                                </div>
                                <div className="flex shrink-0 items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      setRenamingConversationId(conversation.id);
                                      setRenameValue(conversation.title);
                                    }}
                                    className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      void handleDeleteConversation(conversation.id);
                                    }}
                                    className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-500/15 hover:text-rose-300"
                                  >
                                    {isDeletingConversationId === conversation.id ? (
                                      <LoaderCircle className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            </button>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-5 text-sm text-slate-400">
                      Nessuna chat salvata. La prima domanda creera automaticamente una nuova conversazione.
                    </div>
                  )}
                </div>
              </div>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col">
              <div className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.04),_transparent_38%),linear-gradient(180deg,#ffffff,#fbfbfd)] px-6 py-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-display text-[1.15rem] font-semibold text-slate-950">
                      {currentConversation?.title ?? "Cold Sales AI"}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                      <Clock3 className="h-4 w-4 text-primary" />
                      <span>{lastUpdatedLabel}</span>
                      {isSavingConversation ? <span>· salvataggio chat...</span> : null}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto bg-[#f7f7f8] px-3 py-6 sm:px-5 lg:px-6">
                <div className="mx-auto w-full max-w-[1600px] space-y-6">
                  {visibleMessages.map((message) => {
                  const isAssistant = message.role === "assistant";

                  return (
                    <div
                      key={message.id}
                      className={`flex items-start gap-4 ${isAssistant ? "justify-start" : "justify-end"}`}
                    >
                      {isAssistant ? (
                        <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white">
                          <Bot className="h-4 w-4" />
                        </div>
                      ) : null}

                      <div
                        className={`${
                          isAssistant ? "w-full" : "order-first ml-auto max-w-[82%]"
                        }`}
                      >
                        <div
                          className={`rounded-[28px] px-5 py-4 shadow-sm ${
                            isAssistant
                              ? "border border-slate-200 bg-white text-slate-800"
                              : "bg-slate-950 text-white"
                          }`}
                        >
                          {message.content ? (
                            isAssistant ? (
                              <AssistantRichContent content={message.content} />
                            ) : (
                              <div className="whitespace-pre-wrap text-[15px] leading-8">
                                {message.content}
                              </div>
                            )
                          ) : message.isStreaming ? (
                            <TypingIndicator />
                          ) : null}
                        </div>

                        {isAssistant && (message.source || message.model) ? (
                          <p className="mt-2 px-2 text-xs text-slate-400">
                            {message.source === "openai"
                              ? `Risposta in streaming${message.model ? ` · ${message.model}` : ""}`
                              : "Fallback KPI locale"}
                          </p>
                        ) : null}
                      </div>

                      {!isAssistant ? (
                        <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-700">
                          <UserRound className="h-4 w-4" />
                        </div>
                      ) : null}
                    </div>
                  );
                })}

                  {isLoading || isOpeningConversation ? (
                    <div className="flex items-center gap-3 rounded-[24px] border border-slate-200 bg-white px-5 py-4 text-sm text-slate-500 shadow-sm">
                      <LoaderCircle className="h-4 w-4 animate-spin text-primary" />
                      {isLoading
                        ? "Carico i KPI del periodo per preparare il contesto della chat..."
                        : "Apro la conversazione selezionata..."}
                    </div>
                  ) : null}

                  <div ref={messagesEndRef} />
                </div>
              </div>

              <div className="border-t border-slate-200 bg-white px-3 py-4 sm:px-5 lg:px-6">
                <div className="mx-auto w-full max-w-[1600px]">
                  <div className="mb-3 flex flex-wrap gap-2">
                    {SUGGESTED_PROMPTS.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => handleAsk(item)}
                        className="rounded-full border border-slate-200 bg-[#f7f7f8] px-4 py-2 text-sm text-slate-600 transition hover:border-slate-300 hover:bg-white hover:text-slate-950"
                        disabled={isLoading || isAnswering || isOpeningConversation}
                      >
                        {item}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handleSubmit}>
                    <div className="rounded-[28px] border border-slate-200 bg-white p-3 shadow-sm">
                      <div className="flex items-end gap-3">
                        <textarea
                          value={prompt}
                          onChange={(event) => setPrompt(event.target.value)}
                          placeholder="Scrivi una domanda sui KPI, sui venditori o sulle priorita del team..."
                          rows={1}
                          className="max-h-40 min-h-[56px] flex-1 resize-none border-0 bg-transparent px-3 py-3 text-[15px] text-slate-800 outline-none placeholder:text-slate-400"
                        />
                        <Button
                          type="submit"
                          className="h-11 w-11 rounded-full bg-slate-950 p-0 hover:bg-slate-800"
                          disabled={!data || isLoading || isAnswering || isOpeningConversation || !prompt.trim()}
                        >
                          {isAnswering ? (
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                          ) : (
                            <ArrowUp className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </form>

                  {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
