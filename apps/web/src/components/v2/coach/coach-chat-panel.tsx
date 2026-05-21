"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MessageSquareText, Send } from "lucide-react";
import Link from "next/link";
import { twMerge } from "tailwind-merge";
import { CoachActionCard } from "@/components/v2/coach/coach-action-card";
import { JournalPromptCard } from "@/components/v2/coach/journal-prompt-card";
import { DopamineMenuPanel } from "@/components/v2/shared/dopamine-menu-panel";
import type { CoachAction } from "@/lib/coach-actions";
import type { CoachQuickAction } from "@/lib/coach-quick-actions";
import type { CoachBriefingSnapshot } from "@/lib/coach-dashboard-context";
import { clampBriefingLine, humanizeGoalLabel } from "@/lib/coach-briefing-copy";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  actions?: CoachAction[];
};

export type CoachChatContext = {
  today: string;
  topGoalTitle: string | null;
  activeGoals: Array<{ title: string; domain: string }>;
  todayTasks: Array<{ title: string; domain: string }>;
  recentXp: Array<{ created_at: string; reason: string }>;
};

type BriefingPayload = {
  greeting?: string;
  insight?: string;
  snapshot?: CoachBriefingSnapshot;
  quickActions?: CoachQuickAction[];
};

type CoachChatPanelProps = {
  demoMode: boolean;
  displayName: string;
  profileId: string;
  context: CoachChatContext;
  debriefPlannedCount?: number;
  hasTasks?: boolean;
  compactSend?: boolean;
};

function buildOpeningLine(context: CoachChatContext, displayName: string): string {
  const firstName = displayName.split(/\s+/)[0] || displayName;
  const rawGoal =
    context.topGoalTitle ?? context.activeGoals[0]?.title ?? context.todayTasks[0]?.title ?? null;
  if (rawGoal) {
    const goal = humanizeGoalLabel(rawGoal);
    return `Hey ${firstName} — you're still working on ${goal}. I'm here when you want to talk it through.`;
  }
  return `Hey ${firstName}. I'm here when you want to check in on today.`;
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

export function CoachChatPanel({
  demoMode,
  displayName,
  profileId,
  context,
  debriefPlannedCount = 0,
  hasTasks = false,
  compactSend = false,
}: CoachChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [greeting, setGreeting] = useState<string | null>(null);
  const [insight, setInsight] = useState<string | null>(null);
  const [quickActions, setQuickActions] = useState<CoachQuickAction[]>([]);
  const [showDopamine, setShowDopamine] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pendingActions, setPendingActions] = useState<CoachAction[]>([]);
  const listEndRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const nearBottomRef = useRef(true);
  const storageKey = `grove-coach-chat:${profileId}`;
  const openingLine = buildOpeningLine(context, displayName);
  const mainDone = context.todayTasks.length > 0;

  const ensureSession = useCallback(
    async (sessionType: CoachQuickAction["sessionType"]) => {
      if (demoMode || sessionId) {
        return sessionId;
      }
      try {
        const res = await fetch("/api/v2/coach/sessions", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ session_type: sessionType }),
        });
        if (!res.ok) return null;
        const data = (await res.json()) as { sessionId?: string };
        if (data.sessionId) {
          setSessionId(data.sessionId);
          return data.sessionId;
        }
      } catch {
        // best effort
      }
      return null;
    },
    [demoMode, sessionId],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/ai/coach-briefing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profileId, demoMode, debriefPlannedCount }),
        });
        if (!res.ok) return;
        const payload = (await res.json()) as BriefingPayload;
        if (cancelled) return;
        if (payload.greeting?.trim()) {
          setGreeting(clampBriefingLine(payload.greeting.trim(), 96));
        }
        if (payload.insight?.trim()) setInsight(payload.insight.trim());
        if (payload.quickActions?.length) setQuickActions(payload.quickActions);
      } catch {
        // fallback below
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profileId, demoMode, debriefPlannedCount]);

  useEffect(() => {
    let nextMessages: ChatMessage[] | null = null;
    try {
      const stored = window.sessionStorage.getItem(storageKey);
      nextMessages = stored ? normalizeMessages(JSON.parse(stored)) : null;
    } catch {
      nextMessages = null;
    }

    const opener = greeting ?? openingLine;
    setMessages(
      nextMessages ?? [
        {
          role: "assistant",
          content: opener,
        },
      ],
    );
    setReady(true);
  }, [storageKey, openingLine, greeting]);

  useEffect(() => {
    if (!ready) return;
    try {
      window.sessionStorage.setItem(storageKey, JSON.stringify(messages.slice(-30)));
    } catch {
      // best effort
    }
  }, [messages, ready, storageKey]);

  useEffect(() => {
    if (!nearBottomRef.current) return;
    listEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading, showDopamine, pendingActions]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    nearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }, []);

  async function endCurrentSession(msgs: ChatMessage[]) {
    if (!sessionId || demoMode) return;
    const summary =
      msgs.length >= 2
        ? msgs
            .slice(-4)
            .map((m) => `${m.role}: ${m.content.slice(0, 200)}`)
            .join(" | ")
        : null;
    await fetch(`/api/v2/coach/sessions/${sessionId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ transcript: msgs.slice(-30), summary, end: true }),
    });
  }

  async function startNewChat() {
    await endCurrentSession(messages);
    try {
      window.sessionStorage.removeItem(storageKey);
    } catch {
      // best effort
    }
    setSessionId(null);
    setPendingActions([]);
    setError(null);
    setShowDopamine(false);
    const opener = greeting ?? openingLine;
    setMessages([{ role: "assistant", content: opener }]);
    nearBottomRef.current = true;
  }

  async function patchSession(msgs: ChatMessage[]) {
    if (!sessionId || demoMode) return;
    const summary =
      msgs.length >= 2
        ? msgs
            .slice(-4)
            .map((m) => `${m.role}: ${m.content.slice(0, 200)}`)
            .join(" | ")
        : null;
    await fetch(`/api/v2/coach/sessions/${sessionId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        transcript: msgs.slice(-30),
        summary,
      }),
    });
  }

  async function sendMessage(text: string, sessionType: CoachQuickAction["sessionType"] = "free_chat") {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    if (trimmed.toLowerCase().includes("dopamine") || sessionType === "check_in") {
      // only show menu for explicit dopamine chip flow handled separately
    }

    await ensureSession(sessionType);
    const nextMessages = [...messages, { role: "user" as const, content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/ai/coach-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          profileId,
          context: {
            today: context.today,
            activeGoals: context.activeGoals,
            todayTasks: context.todayTasks,
          },
        }),
      });

      const payload = (await response.json()) as {
        reply?: string;
        actions?: CoachAction[];
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

      const actions = payload.actions ?? [];
      setPendingActions(actions);
      const withReply: ChatMessage[] = [
        ...nextMessages,
        {
          role: "assistant",
          content: payload.reply?.trim() || "I couldn't produce a reply just now.",
          actions: actions.length > 0 ? actions : undefined,
        },
      ];
      setMessages(withReply);
      nearBottomRef.current = true;
      void patchSession(withReply);
    } catch {
      setError("Could not send your message right now.");
    } finally {
      setLoading(false);
    }
  }

  async function handleQuickAction(action: CoachQuickAction) {
    if (action.id === "dopamine_break") {
      setShowDopamine(true);
      await ensureSession(action.sessionType);
      return;
    }
    await sendMessage(action.promptSeed, action.sessionType);
  }

  async function send() {
    await sendMessage(input);
  }

  return (
    <section className="flex max-h-[min(720px,calc(100vh-10rem))] min-h-[420px] flex-col rounded-[28px] border border-border bg-card/95 p-5 shadow-panel dark:shadow-panel-dark">
      <div className="mb-3 shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <MessageSquareText className="h-4 w-4 shrink-0 text-moss" aria-hidden="true" />
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Mycelium</p>
            </div>
            <h1 className="mt-2 text-xl font-semibold leading-snug text-foreground sm:text-2xl">
              {greeting ?? clampBriefingLine(`Hi ${displayName.split(/\s+/)[0] || displayName}.`, 96)}
            </h1>
            {insight ? (
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{insight}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            {demoMode ? (
              <span className="rounded-full border border-border bg-background px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Demo
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => void startNewChat()}
              className="rounded-full border border-border bg-background px-3 py-1 text-[11px] font-semibold text-muted-foreground transition hover:border-moss/40 hover:text-foreground"
            >
              New chat
            </button>
          </div>
        </div>

        {quickActions.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <button
                key={action.id}
                type="button"
                disabled={loading}
                onClick={() => void handleQuickAction(action)}
                className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-moss/40 hover:bg-moss/5 disabled:opacity-50"
              >
                {action.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="mb-3 rounded-2xl border border-border bg-background/80 px-4 py-3 text-sm leading-6 text-muted-foreground">
          {error}
        </p>
      ) : null}

      {showDopamine ? (
        <div className="mb-3">
          <DopamineMenuPanel mainDone={mainDone} />
          <button
            type="button"
            onClick={() => setShowDopamine(false)}
            className="mt-2 text-xs font-medium text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            Hide menu
          </button>
        </div>
      ) : null}

      <div className="mb-3 shrink-0">
        <JournalPromptCard
          onSaved={(confirmation) =>
            setMessages((current) => [...current, { role: "assistant", content: confirmation }])
          }
        />
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto rounded-[24px] border border-border bg-background/70 p-4"
      >
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
        {pendingActions.length > 0 ? (
          <div className="space-y-2">
            {pendingActions.map((action, i) => (
              <CoachActionCard
                key={`${action.type}-${i}`}
                action={action}
                demoMode={demoMode}
                onDismiss={() => setPendingActions((prev) => prev.filter((_, j) => j !== i))}
                onSetupComplete={() => setPendingActions([])}
              />
            ))}
          </div>
        ) : null}
        <div ref={listEndRef} />
      </div>

      <div className="mt-4 flex shrink-0 gap-2">
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
          aria-label="Send message"
          className={twMerge(
            "inline-flex shrink-0 items-center justify-center rounded-2xl bg-moss text-moss-fg transition hover:bg-moss/90 disabled:pointer-events-none disabled:opacity-50",
            compactSend ? "h-[56px] w-[56px]" : "gap-1 px-4 py-3 text-sm font-semibold",
          )}
        >
          <Send className="h-4 w-4" aria-hidden="true" />
          {compactSend ? null : "Send"}
        </button>
      </div>

      {!hasTasks ? (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          <Link href="/today" className="underline underline-offset-2 hover:text-foreground">
            Open Today
          </Link>{" "}
          to see your tasks.
        </p>
      ) : null}
    </section>
  );
}
