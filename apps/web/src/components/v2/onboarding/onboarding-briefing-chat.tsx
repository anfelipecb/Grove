"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowRight, Check, Loader2, MessageSquareText, Send, Sparkles } from "lucide-react";
import { twMerge } from "tailwind-merge";
import type { CoachGoalDraft } from "@/components/v2/coach/types";
import { DomainTag } from "@/components/v2/shared/domain-tag";
import {
  buildBriefingGoalDrafts,
  coerceBriefingDomain,
  firstStarterTask,
} from "@/lib/onboarding-briefing-goals";

type Phase =
  | "plan"
  | "ask_more"
  | "building"
  | "tasks_ready"
  | "error";

const BUILD_STEPS = [
  "Reading your goals",
  "Breaking them into small tasks",
  "Setting your first move for Today",
] as const;

type Props = {
  displayName: string;
  goals: string[];
  primaryDomain: string;
  profileId: string | null;
  devPreview?: boolean;
  onReadyChange: (ready: boolean) => void;
};

export function OnboardingBriefingChat({
  displayName,
  goals,
  primaryDomain,
  profileId,
  devPreview = false,
  onReadyChange,
}: Props) {
  const domainId = coerceBriefingDomain(primaryDomain);
  const [phase, setPhase] = useState<Phase>("plan");
  const [extraNote, setExtraNote] = useState("");
  const [input, setInput] = useState("");
  const [buildStep, setBuildStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listEndRef = useRef<HTMLDivElement | null>(null);

  const goalDrafts = useMemo(
    () => buildBriefingGoalDrafts(goals.length > 0 ? goals : ["Your first focus"], domainId),
    [goals, domainId],
  );

  const nextTaskTitle = firstStarterTask(goalDrafts);

  useEffect(() => {
    onReadyChange(phase === "tasks_ready");
  }, [phase, onReadyChange]);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [phase, buildStep, extraNote, saving]);

  useEffect(() => {
    if (phase !== "plan") return;
    const t = setTimeout(() => setPhase("ask_more"), 900);
    return () => clearTimeout(t);
  }, [phase]);

  const persistTasks = useCallback(async () => {
    setSaving(true);
    setError(null);

    if (devPreview || !profileId) {
      setSaving(false);
      setPhase("tasks_ready");
      return;
    }

    try {
      const payload = {
        goals: goalDrafts.map((goal) => ({
          title: goal.title,
          domain: goal.domain,
          tasks: goal.tasks
            .filter((t) => t.enabled)
            .map((t) => ({
              title: t.title,
              frequency: t.frequency,
              isRequired: t.isRequired,
              pointValue: t.pointValue,
            })),
        })),
      };

      const res = await fetch("/api/onboarding/briefing-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !body.ok) {
        setError(body.error ?? "Could not save your starter tasks.");
        setPhase("error");
        return;
      }

      setPhase("tasks_ready");
    } catch {
      setError("Could not save your starter tasks.");
      setPhase("error");
    } finally {
      setSaving(false);
    }
  }, [devPreview, goalDrafts, profileId]);

  useEffect(() => {
    if (phase !== "building") return;

    setBuildStep(0);
    const timers: ReturnType<typeof setTimeout>[] = [];

    BUILD_STEPS.forEach((_, index) => {
      timers.push(
        setTimeout(() => {
          setBuildStep(index);
        }, index * 700),
      );
    });

    timers.push(
      setTimeout(() => {
        void persistTasks();
      }, BUILD_STEPS.length * 700 + 400),
    );

    return () => timers.forEach(clearTimeout);
  }, [phase, persistTasks]);

  function startBuilding(note?: string) {
    if (note?.trim()) {
      setExtraNote(note.trim());
    }
    setPhase("building");
  }

  function submitInput() {
    const text = input.trim();
    setInput("");
    if (text) {
      startBuilding(text);
    } else {
      startBuilding();
    }
  }

  return (
    <section className="flex h-full min-h-[520px] flex-col rounded-[28px] border border-border bg-card/95 p-5 shadow-panel dark:shadow-panel-dark">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquareText className="h-4 w-4 text-moss" aria-hidden="true" />
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Coach</p>
          </div>
          <h2 className="mt-2 text-xl font-semibold text-foreground sm:text-2xl">Your plan from here</h2>
        </div>
        {devPreview ? (
          <span className="rounded-full border border-border bg-background px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Preview
          </span>
        ) : null}
      </div>

      {error ? (
        <p className="mb-3 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex-1 space-y-3 overflow-y-auto rounded-[24px] border border-border bg-background/70 p-4">
        <CoachBubble>
          {displayName}, based on what you shared, here&apos;s your plan. I&apos;ll turn these into starter tasks for
          Today next.
        </CoachBubble>

        <GoalCards drafts={goalDrafts} />

        {phase === "ask_more" || phase === "building" || phase === "tasks_ready" || phase === "error" ? (
          <CoachBubble>
            Anything else to add before I break these down?
            {extraNote ? (
              <span className="mt-2 block rounded-xl border border-border bg-background/80 px-3 py-2 text-xs text-muted-foreground">
                Noted: {extraNote}
              </span>
            ) : null}
          </CoachBubble>
        ) : null}

        {phase === "building" || saving ? (
          <div className="rounded-2xl border border-border bg-card px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-moss">Building your system</p>
            <ul className="mt-3 space-y-2">
              {BUILD_STEPS.map((label, index) => {
                const done = index < buildStep || phase === "tasks_ready";
                const active = index === buildStep && phase === "building";
                return (
                  <li key={label} className="flex items-center gap-2 text-sm text-foreground">
                    <span
                      className={twMerge(
                        "flex h-6 w-6 items-center justify-center rounded-full border",
                        done ? "border-moss bg-moss text-moss-fg" : "border-border bg-background text-muted-foreground",
                      )}
                    >
                      {active && saving ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                      ) : done ? (
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : (
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
                      )}
                    </span>
                    <span className={done ? "text-foreground" : "text-muted-foreground"}>{label}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        {phase === "tasks_ready" ? (
          <>
            <CoachBubble>Here are your starter tasks. Your first move on Today is highlighted below.</CoachBubble>
            <TaskPreview drafts={goalDrafts} />
            {nextTaskTitle ? (
              <div className="rounded-2xl border border-moss/30 bg-moss/10 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-moss">Start with</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{nextTaskTitle}</p>
                <p className="mt-2 flex items-center gap-1 text-xs font-medium text-moss">
                  Ready for Today
                  <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </p>
              </div>
            ) : null}
          </>
        ) : null}

        <div ref={listEndRef} />
      </div>

      {phase === "error" ? (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => {
              setError(null);
              setPhase("building");
            }}
            className="rounded-2xl bg-moss px-4 py-2.5 text-sm font-semibold text-moss-fg hover:bg-moss/90"
          >
            Try again
          </button>
        </div>
      ) : null}

      {phase === "ask_more" ? (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
          <textarea
            className="min-h-[52px] min-w-0 flex-1 resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-moss"
            placeholder="Optional — add one more thing…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submitInput();
              }
            }}
          />
          <div className="flex gap-2 sm:flex-col-reverse">
            <button
              type="button"
              onClick={() => startBuilding()}
              className="rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-accent"
            >
              Looks good
            </button>
            <button
              type="button"
              onClick={submitInput}
              disabled={input.trim().length === 0}
              aria-label="Send"
              className="inline-flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-moss text-moss-fg transition hover:bg-moss/90 disabled:pointer-events-none disabled:opacity-40"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : null}

      {phase === "tasks_ready" ? (
        <p className="mt-3 text-center text-xs text-muted-foreground">Tap Let&apos;s go below when you&apos;re ready.</p>
      ) : null}
    </section>
  );
}

function CoachBubble({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-2 motion-safe:animate-fadeIn">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-moss/12">
        <Sparkles className="h-3.5 w-3.5 text-moss" aria-hidden="true" />
      </div>
      <p className="max-w-[92%] rounded-2xl border border-border bg-card px-4 py-3 text-sm leading-6 text-foreground">
        {children}
      </p>
    </div>
  );
}

function GoalCards({ drafts }: { drafts: CoachGoalDraft[] }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 motion-safe:animate-fadeIn">
      {drafts.map((goal) => (
        <article
          key={goal.key}
          className="rounded-2xl border border-moss/25 bg-gradient-to-br from-moss/8 to-card px-4 py-3 shadow-sm"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-foreground">{goal.title}</p>
            <DomainTag domain={goal.domain} showInfo={false} />
          </div>
        </article>
      ))}
    </div>
  );
}

function TaskPreview({ drafts }: { drafts: CoachGoalDraft[] }) {
  return (
    <div className="space-y-3 motion-safe:animate-fadeIn">
      {drafts.map((goal) => (
        <article key={goal.key} className="rounded-2xl border border-border bg-card px-3 py-2.5">
          <p className="text-xs font-semibold text-muted-foreground">{goal.title}</p>
          <ul className="mt-2 space-y-1.5">
            {goal.tasks
              .filter((t) => t.enabled)
              .map((task) => (
                <li
                  key={task.id}
                  className="flex items-center gap-2 rounded-xl border border-border/80 bg-background/80 px-2.5 py-2 text-xs text-foreground"
                >
                  <Check className="h-3 w-3 shrink-0 text-moss" aria-hidden="true" />
                  {task.title}
                </li>
              ))}
          </ul>
        </article>
      ))}
    </div>
  );
}
