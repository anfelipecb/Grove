"use client";

import { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";

function localDateKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isEveningLocal(): boolean {
  return new Date().getHours() >= 18;
}

type JournalPromptCardProps = {
  onSaved: (confirmation: string) => void;
};

export function JournalPromptCard({ onSaved }: JournalPromptCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasEntry, setHasEntry] = useState(false);
  const today = localDateKey();

  useEffect(() => {
    if (!isEveningLocal()) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/v2/journal?date=${encodeURIComponent(today)}`);
        const payload = (await res.json()) as { entry?: { content: string } | null };
        if (!cancelled && res.ok && payload.entry?.content) {
          setHasEntry(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [today]);

  if (!isEveningLocal() || loading || hasEntry) {
    return null;
  }

  async function submit() {
    const text = content.trim();
    if (!text || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/v2/journal", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: text, entry_date: today }),
      });
      if (!res.ok) return;
      setHasEntry(true);
      setExpanded(false);
      onSaved("Logged for today. I will use this when we plan tomorrow.");
    } finally {
      setSaving(false);
    }
  }

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="mb-3 flex w-full items-center gap-2 rounded-2xl border border-dashed border-border bg-background/80 px-4 py-3 text-left text-sm text-muted-foreground transition hover:border-moss/40 hover:text-foreground"
      >
        <BookOpen className="h-4 w-4 shrink-0 text-moss" aria-hidden="true" />
        How did today go? (tap to log)
      </button>
    );
  }

  return (
    <div className="mb-3 rounded-2xl border border-border bg-background/80 p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Today&apos;s reflection</p>
      <textarea
        className="min-h-[88px] w-full resize-none rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-moss"
        placeholder="What worked, what stalled, what to carry forward..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() => void submit()}
          disabled={saving || content.trim().length === 0}
          className="rounded-xl bg-moss px-3 py-2 text-xs font-semibold text-moss-fg disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save reflection"}
        </button>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
