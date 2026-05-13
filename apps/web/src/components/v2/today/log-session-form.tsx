"use client";

import { useState } from "react";
import { LIFE_DOMAINS } from "@grove/core";
import { Plus, X } from "lucide-react";

type LogSessionFormProps = {
  onLog: (title: string, domain: string, notes: string) => Promise<void>;
};

export function LogSessionForm({ onLog }: LogSessionFormProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [domain, setDomain] = useState<string>(LIFE_DOMAINS[0].id);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      await onLog(title.trim(), domain, notes.trim());
      setTitle("");
      setNotes("");
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-moss/40 py-2.5 text-sm text-moss transition hover:border-moss hover:bg-moss/5"
      >
        <Plus className="h-4 w-4" />
        Log a session or activity
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 rounded-lg border border-border bg-card/50 p-3 space-y-2">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Log activity</p>
        <button type="button" onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
      <input
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-moss"
        placeholder="What did you do?"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <select
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-moss"
        value={domain}
        onChange={(e) => setDomain(e.target.value)}
      >
        {LIFE_DOMAINS.map((d) => (
          <option key={d.id} value={d.id}>{d.label}</option>
        ))}
      </select>
      <textarea
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-moss resize-none"
        placeholder="Notes (optional)"
        rows={2}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <button
        type="submit"
        disabled={loading || !title.trim()}
        className="w-full rounded-md bg-moss py-2 text-sm font-medium text-white transition hover:bg-moss/90 disabled:opacity-50"
      >
        {loading ? "Logging…" : "Log it"}
      </button>
    </form>
  );
}
