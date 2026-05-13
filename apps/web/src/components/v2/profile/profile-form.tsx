"use client";

import { useState } from "react";

type ProfileFormProps = {
  initialName: string;
};

export function ProfileForm({ initialName }: ProfileFormProps) {
  const [name, setName] = useState(initialName);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (name.trim() === initialName) return;
    setStatus("saving");
    setError(null);

    const res = await fetch("/api/v2/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ display_name: name.trim() }),
    });

    if (res.ok) {
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } else {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? "Could not save.");
      setStatus("error");
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Display Name
      </p>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setStatus("idle"); }}
          maxLength={80}
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-moss/40"
          placeholder="Your name"
        />
        <button
          onClick={handleSave}
          disabled={status === "saving" || name.trim() === initialName}
          className="rounded-lg bg-moss px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-moss/90 disabled:opacity-40"
        >
          {status === "saving" ? "Saving…" : status === "saved" ? "Saved ✓" : "Save"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}
