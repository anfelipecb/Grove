"use client";

import { useState } from "react";
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
};

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

export function AddTaskSheet({ onClose, onAdd }: AddTaskSheetProps) {
  const [title, setTitle] = useState("");
  const [domain, setDomain] = useState("");
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "once">("daily");
  const [preferredTime, setPreferredTime] = useState<"morning" | "afternoon" | "evening" | "flexible">("flexible");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!title.trim()) { setError("Title is required."); return; }
    if (!domain) { setError("Pick a domain."); return; }
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
          <h2 className="text-base font-semibold text-foreground">Add task</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Title */}
        <input
          autoFocus
          type="text"
          value={title}
          onChange={(e) => { setTitle(e.target.value); setError(null); }}
          placeholder="What do you want to do?"
          maxLength={140}
          className="mb-4 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-moss/30"
          onKeyDown={(e) => { if (e.key === "Enter") void handleSubmit(); }}
        />

        {/* Domain */}
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

        {/* Frequency */}
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

        {/* Preferred time */}
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

        {error && <p className="mb-3 text-xs text-destructive">{error}</p>}

        <button
          onClick={() => void handleSubmit()}
          disabled={saving}
          className="w-full rounded-xl bg-moss py-3 text-sm font-semibold text-white transition-colors hover:bg-moss/90 disabled:opacity-40"
        >
          {saving ? "Adding…" : "Add task"}
        </button>
      </div>
    </div>
  );
}
