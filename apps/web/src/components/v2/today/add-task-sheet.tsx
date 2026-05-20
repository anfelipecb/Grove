"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, X } from "lucide-react";
import { LIFE_DOMAINS, type LifeDomainId } from "@grove/core";
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

const VALID_DOMAIN_IDS = new Set<string>(LIFE_DOMAINS.map((d) => d.id));
const LAST_DOMAIN_KEY = "grove_last_domain";

function isLifeDomainId(id: string): id is LifeDomainId {
  return VALID_DOMAIN_IDS.has(id);
}

const FREQUENCIES = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "once", label: "Once" },
] as const;

const TIMES = [
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
  { value: "flexible", label: "Flexible" },
] as const;

type AddTaskSheetProps = {
  onClose: () => void;
  onAdd: (task: TaskRowData) => void;
  initialTitle?: string;
  initialDomain?: string;
  fromChatFallback?: boolean;
};

function resolveInitialDomain(override?: string): LifeDomainId {
  if (override && isLifeDomainId(override)) return override;
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(LAST_DOMAIN_KEY);
    if (stored && isLifeDomainId(stored)) return stored;
  }
  return "work_build";
}

function ChipButton({
  label, selected, onClick, colorClass,
}: { label: string; selected: boolean; onClick: () => void; colorClass?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        selected
          ? colorClass ?? "border-moss bg-moss/10 text-moss"
          : "border-border bg-background text-muted-foreground hover:border-moss/50"
      }`}
    >
      {label}
    </button>
  );
}

export function AddTaskSheet({
  onClose,
  onAdd,
  initialTitle = "",
  initialDomain = "",
  fromChatFallback = false,
}: AddTaskSheetProps) {
  const [title, setTitle] = useState(initialTitle);
  const [domain, setDomain] = useState(() => resolveInitialDomain(initialDomain || undefined));
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "once">("once");
  const [preferredTime, setPreferredTime] = useState<"morning" | "afternoon" | "evening" | "flexible">("flexible");
  const [moreOpen, setMoreOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialDomain) setDomain(resolveInitialDomain(initialDomain));
  }, [initialDomain]);

  const domainLabel = LIFE_DOMAINS.find((d) => d.id === domain)?.label ?? domain;
  const frequencyLabel = FREQUENCIES.find((f) => f.value === frequency)?.label ?? frequency;
  const timeLabel = TIMES.find((t) => t.value === preferredTime)?.label ?? preferredTime;
  const canSubmit = title.trim().length > 0 && !saving;

  async function handleSubmit() {
    if (!title.trim()) { setError("Title is required."); return; }
    setSaving(true);
    setError(null);

    const res = await fetch("/api/v2/tasks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: title.trim(), domain, frequency, preferred_time: preferredTime }),
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? "Could not create task.");
      setSaving(false);
      return;
    }

    try {
      localStorage.setItem(LAST_DOMAIN_KEY, domain);
    } catch {
      /* private mode / quota */
    }

    const body = (await res.json()) as { task: TaskRowData };
    onAdd({ ...body.task, completed: false });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-2xl border border-border bg-card p-5 shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">
            {fromChatFallback && initialTitle ? "Add details" : "Add task"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {fromChatFallback && initialTitle ? (
          <p className="mb-3 text-xs text-muted-foreground">
            Couldn&apos;t auto-place on calendar — pick a domain and time, or submit as-is.
          </p>
        ) : null}

        {/* Title */}
        <input
          autoFocus
          type="text"
          value={title}
          onChange={(e) => { setTitle(e.target.value); setError(null); }}
          placeholder="What do you want to do?"
          maxLength={140}
          className="mb-4 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-moss/30"
          onKeyDown={(e) => { if (e.key === "Enter" && canSubmit) void handleSubmit(); }}
        />

        <button
          type="button"
          onClick={() => setMoreOpen((o) => !o)}
          className="mb-3 flex w-full items-center justify-between rounded-xl border border-border bg-background px-3 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:bg-muted/50"
        >
          <span>
            {domainLabel} · {frequencyLabel} · {timeLabel}
          </span>
          <span className="inline-flex items-center gap-0.5 text-xs font-medium text-moss">
            More options
            {moreOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </span>
        </button>

        {moreOpen && (
          <>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Domain</p>
            <div className="mb-4 flex flex-wrap gap-2">
              {LIFE_DOMAINS.map((d) => (
                <ChipButton
                  key={d.id}
                  label={d.label}
                  selected={domain === d.id}
                  onClick={() => { setDomain(d.id); setError(null); }}
                  colorClass={domain === d.id ? DOMAIN_COLORS[d.id] : undefined}
                />
              ))}
            </div>

            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">How often</p>
            <div className="mb-4 flex gap-2">
              {FREQUENCIES.map((f) => (
                <ChipButton
                  key={f.value}
                  label={f.label}
                  selected={frequency === f.value}
                  onClick={() => setFrequency(f.value)}
                />
              ))}
            </div>

            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Best time of day</p>
            <div className="mb-5 flex flex-wrap gap-2">
              {TIMES.map((t) => (
                <ChipButton
                  key={t.value}
                  label={t.label}
                  selected={preferredTime === t.value}
                  onClick={() => setPreferredTime(t.value)}
                />
              ))}
            </div>
          </>
        )}

        {error && <p className="mb-3 text-xs text-destructive">{error}</p>}

        <button
          onClick={() => void handleSubmit()}
          disabled={!canSubmit}
          className="w-full rounded-xl bg-moss py-3 text-sm font-semibold text-white transition-colors hover:bg-moss/90 disabled:opacity-40"
        >
          {saving ? "Adding…" : "Add task"}
        </button>
      </div>
    </div>
  );
}
