"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { surfaceSecondary } from "@/components/v2/today/surface-classes";

type EndOfDayCardProps = {
  doneTodayCount: number;
  incompleteCount: number;
  today: string;
  onMoveIncompleteToTomorrow?: () => Promise<void>;
};

function isEveningLocal(): boolean {
  return new Date().getHours() >= 18;
}

export function EndOfDayCard({
  doneTodayCount,
  incompleteCount,
  today,
  onMoveIncompleteToTomorrow,
}: EndOfDayCardProps) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [moving, setMoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isEveningLocal()) {
    return null;
  }

  async function handleSave() {
    const text = content.trim();
    if (!text || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/v2/journal", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          content: text,
          entry_date: today,
          mood: mood.trim() || null,
        }),
      });
      if (!res.ok) {
        const p = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(p.error ?? "Could not save.");
      }
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={twMerge(surfaceSecondary, "p-3")}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">End of day</span>
        <ChevronDown
          className={twMerge("h-4 w-4 text-muted-foreground transition", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div className="mt-3 space-y-3">
          <p className="text-sm text-foreground">
            {doneTodayCount > 0
              ? `You finished ${doneTodayCount} task${doneTodayCount === 1 ? "" : "s"} today.`
              : "No completions logged yet today."}
          </p>

          {incompleteCount > 0 && onMoveIncompleteToTomorrow ? (
            <button
              type="button"
              disabled={moving}
              onClick={() => {
                setMoving(true);
                void onMoveIncompleteToTomorrow().finally(() => setMoving(false));
              }}
              className="text-xs font-semibold text-moss underline underline-offset-2 hover:text-moss/80 disabled:opacity-50"
            >
              {moving
                ? "Moving…"
                : `Move ${incompleteCount} incomplete to tomorrow's plan`}
            </button>
          ) : null}

          {saved ? (
            <p className="text-sm text-muted-foreground">Day logged. +8 XP.</p>
          ) : (
            <>
              <textarea
                className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-moss"
                rows={3}
                placeholder="One line on how today went…"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              <input
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-moss"
                placeholder="Mood (optional)"
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                maxLength={64}
              />
              {error ? <p className="text-xs text-destructive">{error}</p> : null}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={saving || !content.trim()}
                  onClick={() => void handleSave()}
                  className="rounded-full bg-moss px-4 py-2 text-sm font-semibold text-moss-fg transition hover:bg-moss/90 disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Log day"}
                </button>
                <Link
                  href="/coach"
                  className="text-xs font-medium text-muted-foreground underline underline-offset-2 hover:text-foreground"
                >
                  Reflect with coach →
                </Link>
              </div>
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}
