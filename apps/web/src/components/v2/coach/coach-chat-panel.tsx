"use client";

import { useEffect, useRef, useState } from "react";
import { MessageSquareText, Send } from "lucide-react";
import { twMerge } from "tailwind-merge";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type CoachChatContext = {
  today: string;
  topGoalTitle: string | null;
  activeGoals: Array<{ title: string; domain: string }>;
  todayTasks: Array<{ title: string; domain: string }>;
  recentXp: Array<{ created_at: string; reason: string }>;
};

type CoachChatPanelProps = {
  demoMode: boolean;
  displayName: string;
  profileId: string;
  context: CoachChatContext;
};

function buildOpeningLine(context: CoachChatContext, displayName: string): string {
  const goalTitle = context.topGoalTitle ?? context.activeGoals[0]?.title ?? context.todayTasks[0]?.title ?? null;
  if (goalTitle) {
    return `Let's keep ${goalTitle} in view today, ${displayName}. What is the smallest next step?`;
  }

  return `Let's find one small move for today, ${displayName}. What's most important right now?`;
}

function normalizeMessages(raw: unknown): ChatMessage[] | null {
  if (!Array.isArray(raw)) {
    return null;
  }

  const next: ChatMessage[] = [];
  for (const item of raw) {
    if (
      item &&
      typeof item === "object" &&
      (item as ChatMessage).role &&
      ((item as ChatMessage).role === "user" || (item as ChatMessage).role === "assistant") &&
      typeof (item as ChatMessage).content === "string" &&
      (item as ChatMessage).content.trim().length > 0
    ) {
      next.push({
        role: (item as ChatMessage).role,
        content: (item as ChatMessage).content,
      });
    }
  }

  return next.length > 0 ? next : null;
}

export function CoachChatPanel({ demoMode, displayName, profileId, context }: CoachChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const listEndRef = useRef<HTMLDivElement | null>(null);
  const storageKey = `grove-coach-chat:${profileId}`;
  const openingLine = buildOpeningLine(context, displayName);

  useEffect(() => {
    let nextMessages: ChatMessage[] | null = null;
    try {
      const stored = window.sessionStorage.getItem(storageKey);
      nextMessages = stored ? normalizeMessages(JSON.parse(stored)) : null;
    } catch {
      nextMessages = null;
    }

    setMessages(
      nextMessages ?? [
        {
          role: "assistant",
          content: openingLine,
        },
      ],
    );
    setReady(true);
  }, [storageKey, openingLine]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    try {
      window.sessionStorage.setItem(storageKey, JSON.stringify(messages.slice(-30)));
    } catch {
      // Session storage is best-effort only.
    }
  }, [messages, ready, storageKey]);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) {
      return;
    }

    const nextMessages = [...messages, { role: "user" as const, content: text }];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/ai/mycelium-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          context,
        }),
      });

      const payload = (await response.json()) as {
        reply?: string;
        safety?: boolean;
        message?: string;
        error?: string;
      };

      if (payload.safety) {
        setError(payload.message ?? "Please reach out to local crisis resources if you need immediate help.");
        return;
      }

      if (!response.ok) {
        setError(payload.error ?? "Could not send your message right now.");
        return;
      }

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: payload.reply?.trim() || "I couldn't produce a reply just now.",
        },
      ]);
    } catch {
      setError("Could not send your message right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="flex h-full min-h-[520px] flex-col rounded-[28px] border border-border bg-card/95 p-5 shadow-panel dark:shadow-panel-dark">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquareText className="h-4 w-4 text-moss" aria-hidden="true" />
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Mycelium chat</p>
          </div>
          <h2 className="mt-2 text-2xl font-semibold text-foreground">Talk through what actually matters today.</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Conversation stays in this browser session. Demo mode still uses the same coaching flow.
          </p>
        </div>
        {demoMode ? (
          <span className="rounded-full border border-border bg-background px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Demo
          </span>
        ) : null}
      </div>

      {error ? (
        <p className="mb-3 rounded-2xl border border-border bg-background/80 px-4 py-3 text-sm leading-6 text-muted-foreground">
          {error}
        </p>
      ) : null}

      <div className="flex-1 space-y-3 overflow-y-auto rounded-[24px] border border-border bg-background/70 p-4">
        {messages.map((message, index) => (
          <div
            key={`${index}-${message.role}`}
            className={twMerge(
              "max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm",
              message.role === "user"
                ? "ml-auto bg-moss text-moss-fg"
                : "border border-border bg-card text-foreground",
            )}
          >
            {message.content}
          </div>
        ))}
        {loading ? (
          <div className="max-w-[92%] rounded-2xl border border-border bg-card px-4 py-3 text-sm leading-6 text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-moss" />
              <span className="h-2 w-2 animate-pulse rounded-full bg-moss/70 [animation-delay:120ms]" />
              <span className="h-2 w-2 animate-pulse rounded-full bg-moss/50 [animation-delay:240ms]" />
              Thinking
            </span>
          </div>
        ) : null}
        <div ref={listEndRef} />
      </div>

      <div className="mt-4 flex gap-2">
        <textarea
          className="min-h-[56px] min-w-0 flex-1 resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-moss"
          placeholder="Ask Mycelium a concrete question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
        />
        <button
          type="button"
          onClick={() => void send()}
          disabled={loading || input.trim().length === 0}
          className="inline-flex shrink-0 items-center justify-center gap-1 rounded-2xl bg-moss px-4 py-3 text-sm font-semibold text-moss-fg transition hover:bg-moss/90 disabled:pointer-events-none disabled:opacity-50"
        >
          <Send className="h-4 w-4" aria-hidden="true" />
          Send
        </button>
      </div>
    </section>
  );
}
