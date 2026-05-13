"use client";

import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { CalendarDays, Plus, Loader2 } from "lucide-react";

export type UpcomingSession = {
  id: string;
  title: string;
  startsAt: string;
  rsvp: "yes" | "no" | "maybe" | null;
};

type Props = {
  sessions: UpcomingSession[];
  isOrganizer: boolean;
  onSessionCreated: (session: UpcomingSession) => void;
};

type RsvpValue = "yes" | "no" | "maybe";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SessionsPanel({ sessions: initialSessions, isOrganizer, onSessionCreated }: Props) {
  const [sessions, setSessions] = useState(initialSessions);
  const [rsvpLoading, setRsvpLoading] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formState, setFormState] = useState({ title: "", starts_at: "", ends_at: "", description: "" });
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleRsvp(sessionId: string, rsvp: RsvpValue) {
    setRsvpLoading(sessionId);
    const prev = sessions.find((s) => s.id === sessionId)?.rsvp ?? null;
    setSessions((cur) => cur.map((s) => s.id === sessionId ? { ...s, rsvp } : s));
    try {
      const res = await fetch(`/api/v2/community/sessions/${sessionId}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rsvp }),
      });
      if (!res.ok) throw new Error("RSVP failed");
    } catch {
      setSessions((cur) => cur.map((s) => s.id === sessionId ? { ...s, rsvp: prev } : s));
    } finally {
      setRsvpLoading(null);
    }
  }

  async function handleCreate() {
    if (!formState.title || !formState.starts_at) {
      setFormError("Title and start time are required.");
      return;
    }
    setCreating(true);
    setFormError(null);
    try {
      const res = await fetch("/api/v2/community/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formState),
      });
      if (!res.ok) {
        const json = await res.json() as { error?: string };
        throw new Error(json.error ?? "Failed to create session");
      }
      const { session } = await res.json() as { session: { id: string; title: string; starts_at: string } };
      const newSession: UpcomingSession = { id: session.id, title: session.title, startsAt: session.starts_at, rsvp: null };
      setSessions((cur) => [...cur, newSession].sort((a, b) => a.startsAt.localeCompare(b.startsAt)).slice(0, 3));
      onSessionCreated(newSession);
      setShowForm(false);
      setFormState({ title: "", starts_at: "", ends_at: "", description: "" });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          Upcoming Sessions
        </h3>
        {isOrganizer && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1 text-xs font-medium text-moss hover:text-moss/80 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Create
          </button>
        )}
      </div>

      {showForm && (
        <div className="border-b border-border/50 p-4 space-y-3 bg-muted/30">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Title *</label>
            <input
              type="text"
              value={formState.title}
              onChange={(e) => setFormState((s) => ({ ...s, title: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-moss/40"
              placeholder="Session title"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Start *</label>
              <input
                type="datetime-local"
                value={formState.starts_at}
                onChange={(e) => setFormState((s) => ({ ...s, starts_at: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-moss/40"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">End</label>
              <input
                type="datetime-local"
                value={formState.ends_at}
                onChange={(e) => setFormState((s) => ({ ...s, ends_at: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-moss/40"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Description</label>
            <textarea
              value={formState.description}
              onChange={(e) => setFormState((s) => ({ ...s, description: e.target.value }))}
              rows={2}
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-moss/40"
              placeholder="Optional description"
            />
          </div>
          {formError && <p className="text-xs text-red-500">{formError}</p>}
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={creating}
              className="flex items-center gap-1.5 rounded-lg bg-moss px-3 py-1.5 text-xs font-medium text-white hover:bg-moss/90 disabled:opacity-50 transition-colors"
            >
              {creating && <Loader2 className="h-3 w-3 animate-spin" />}
              Create session
            </button>
          </div>
        </div>
      )}

      {sessions.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-muted-foreground">No upcoming sessions.</p>
      ) : (
        <ul className="divide-y divide-border/50">
          {sessions.map((s) => (
            <li key={s.id} className="px-4 py-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-foreground">{s.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatDate(s.startsAt)}</p>
                </div>
                {s.rsvp && (
                  <span className={twMerge(
                    "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                    s.rsvp === "yes" && "bg-moss/15 text-moss",
                    s.rsvp === "no" && "bg-red-500/10 text-red-500",
                    s.rsvp === "maybe" && "bg-amber-500/10 text-amber-500",
                  )}>
                    {s.rsvp}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {(["yes", "maybe", "no"] as RsvpValue[]).map((v) => (
                  <button
                    key={v}
                    disabled={rsvpLoading === s.id}
                    onClick={() => handleRsvp(s.id, v)}
                    className={twMerge(
                      "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                      s.rsvp === v
                        ? v === "yes"
                          ? "bg-moss text-white"
                          : v === "no"
                          ? "bg-red-500 text-white"
                          : "bg-amber-500 text-white"
                        : "bg-muted text-muted-foreground hover:text-foreground",
                      rsvpLoading === s.id && "opacity-50 cursor-wait",
                    )}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
