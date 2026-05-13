"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { SharedGoal } from "@/components/v2/community/shared-goals-list";

type Props = {
  communityId: string;
  goals: SharedGoal[];
  open: boolean;
  onDismissLocal?: () => void;
};

export function AlignmentModal({ communityId, goals, open, onDismissLocal }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!open) return null;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function post(body: Record<string, unknown>) {
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/v2/community/alignment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      onDismissLocal?.();
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function handleSkip() {
    await post({ communityId, skip: true });
  }

  async function handleConfirm() {
    if (goals.length > 0 && selected.size === 0) {
      setError("Pick at least one goal, or tap Skip for now.");
      return;
    }
    if (goals.length === 0) {
      await handleSkip();
      return;
    }
    await post({ communityId, goalIds: Array.from(selected) });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-bark/50 p-4 sm:items-center"
      role="presentation"
      aria-modal="true"
      aria-labelledby="alignment-title"
    >
      <div
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-xl border border-border bg-card shadow-lg"
        role="dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-border/60 px-4 py-3">
          <h2 id="alignment-title" className="text-base font-semibold text-foreground">
            Align with your community
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Pick shared goals you want to contribute to this week—tiny linked tasks land on Today so the group stays visible.
          </p>
        </div>

        <div className="space-y-3 p-4">
          {goals.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              There are no shared goals yet. Organizers can add them anytime—you can skip for now.
            </p>
          ) : (
            <ul className="space-y-2">
              {goals.map((g) => (
                <li key={g.id}>
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/70 bg-muted/20 px-3 py-2 has-[:checked]:border-moss/50 has-[:checked]:bg-moss/5">
                    <input
                      type="checkbox"
                      checked={selected.has(g.id)}
                      onChange={() => toggle(g.id)}
                      disabled={pending}
                      className="mt-1 rounded border-border text-moss focus:ring-moss/40"
                    />
                    <span className="text-sm text-foreground">{g.title}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}

          {error ? <p className="text-xs text-red-600 dark:text-red-400">{error}</p> : null}

          <div className="flex flex-col gap-2 pt-2 sm:flex-row-reverse sm:justify-end">
            <button
              type="button"
              disabled={pending}
              onClick={() => void handleConfirm()}
              className="flex items-center justify-center gap-2 rounded-lg bg-moss px-4 py-2 text-sm font-medium text-white hover:bg-moss/90 disabled:opacity-50"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {goals.length === 0 ? "Got it" : "Save"}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => void handleSkip()}
              className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 disabled:opacity-50"
            >
              Remind me later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
