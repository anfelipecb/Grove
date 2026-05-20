"use client";

import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { LIFE_DOMAINS } from "@grove/core";
import type { TaskRowData } from "@/components/v2/today/task-row";

const DOMAIN_COLORS: Record<string, string> = {
  wellbeing: "border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
  learning: "border-blue-400 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  work_build: "border-orange-400 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
  relationships: "border-pink-400 bg-pink-50 text-pink-700 dark:bg-pink-900/20 dark:text-pink-400",
  community: "border-violet-400 bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400",
  life_admin: "border-slate-400 bg-slate-50 text-slate-700 dark:bg-slate-900/20 dark:text-slate-400",
  rest_play: "border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
};

type ParsedTask = {
  title: string;
  domain: string;
  duration_minutes: number;
  suggested_time: string;
};

type QuickAddPrefill = { title: string; domain?: string };

type TaskChatOverlayProps = {
  onClose: () => void;
  onAdd: (task: TaskRowData) => void;
  onQuickAdd: (prefill?: QuickAddPrefill) => void;
};

function todayDateKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function TaskChatOverlay({ onClose, onAdd, onQuickAdd }: TaskChatOverlayProps) {
  const [input, setInput] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<ParsedTask | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const dismiss = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") dismiss();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dismiss]);

  async function handleParse() {
    const message = input.trim();
    if (!message || parsing) return;
    setParsing(true);
    setError(null);
    setParsed(null);
    try {
      const res = await fetch("/api/ai/task-from-chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message }),
      });
      if (!res.ok) {
        setError("Couldn't place on calendar — adding directly.");
        onQuickAdd({ title: message });
        return;
      }
      const body = (await res.json()) as ParsedTask;
      setParsed(body);
    } catch {
      setError("Couldn't reach AI — adding directly.");
      onQuickAdd({ title: message });
    } finally {
      setParsing(false);
    }
  }

  async function handleAdd() {
    if (!parsed || saving) return;
    setSaving(true);
    setError(null);
    try {
      const taskRes = await fetch("/api/v2/tasks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: parsed.title,
          domain: parsed.domain,
          frequency: "once",
          preferred_time: "flexible",
        }),
      });
      if (!taskRes.ok) {
        const body = (await taskRes.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? "Could not create task.");
        return;
      }
      const { task } = (await taskRes.json()) as { task: TaskRowData };

      const scheduleRes = await fetch("/api/v2/calendar/schedule", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          task_id: task.id,
          date: todayDateKey(),
          start_time: parsed.suggested_time,
          duration_minutes: parsed.duration_minutes,
        }),
      });
      if (!scheduleRes.ok) {
        const body = (await scheduleRes.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? "Task created but calendar placement failed.");
        onAdd({ ...task, completed: false });
        dismiss();
        return;
      }

      onAdd({ ...task, completed: false });
      dismiss();
    } finally {
      setSaving(false);
    }
  }

  const domainLabel = parsed
    ? LIFE_DOMAINS.find((d) => d.id === parsed.domain)?.label ?? parsed.domain
    : "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={dismiss}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-t-2xl border border-border bg-card p-5 shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="task-chat-title"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="task-chat-title" className="text-base font-semibold text-foreground">
            Add task in your words
          </h2>
          <button type="button" onClick={dismiss} className="rounded-lg p-1 text-muted-foreground hover:bg-muted">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {!parsed ? (
          <>
            <input
              type="text"
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-moss"
              placeholder="e.g. Review thesis section tonight for 45 minutes"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleParse();
                }
              }}
              autoFocus
            />
            <button
              type="button"
              onClick={() => void handleParse()}
              disabled={parsing || input.trim().length === 0}
              className="mt-3 w-full rounded-xl bg-moss py-2.5 text-sm font-semibold text-moss-fg disabled:opacity-50"
            >
              {parsing ? "Parsing…" : "Continue"}
            </button>
          </>
        ) : (
          <div className="space-y-3 rounded-xl border border-border bg-background/80 p-4">
            <p className="text-sm font-medium text-foreground">{parsed.title}</p>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                  DOMAIN_COLORS[parsed.domain] ?? "border-border text-muted-foreground"
                }`}
              >
                {domainLabel}
              </span>
              <span className="text-xs text-muted-foreground">{parsed.duration_minutes} min</span>
              <span className="text-xs text-muted-foreground">at {parsed.suggested_time}</span>
            </div>
            <p className="text-[11px] text-muted-foreground">Placed on today&apos;s calendar at the suggested time.</p>
            <button
              type="button"
              onClick={() => void handleAdd()}
              disabled={saving}
              className="w-full rounded-xl bg-moss py-2.5 text-sm font-semibold text-moss-fg disabled:opacity-50"
            >
              {saving ? "Adding…" : "Add it"}
            </button>
          </div>
        )}

        {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}

        <button
          type="button"
          onClick={() => onQuickAdd()}
          className="mt-4 w-full text-center text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          Quick add (structured)
        </button>
      </div>
    </div>
  );
}
