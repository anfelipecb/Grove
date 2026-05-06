"use client";

import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState, useCallback } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { twMerge } from "tailwind-merge";

export type CalendarEntryKind = "solo_goal" | "community_goal" | "community_session";

export type CalendarEntry = {
  id: string;
  kind: CalendarEntryKind;
  title: string;
  at: string | null;
  communityName?: string | null;
};

const inputBase =
  "rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground outline-none ring-moss/20 focus:border-moss focus:ring-2 dark:bg-muted";

function localDateKeyFromIso(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function padDateKey(y: number, monthIndex: number, day: number): string {
  const m = String(monthIndex + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isoToDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day}T${hh}:${mm}`;
}

function labelForKind(kind: CalendarEntryKind): string {
  switch (kind) {
    case "solo_goal":
      return "Solo";
    case "community_goal":
      return "Community goal";
    case "community_session":
      return "Session";
    default:
      return "";
  }
}

function entryBorderClass(kind: CalendarEntryKind): string {
  return kind === "solo_goal"
    ? "border-l-4 border-l-[hsl(215_20%_46%)]"
    : "border-l-4 border-l-[hsl(187_28%_42%)]";
}

function buildMonthCells(visible: Date): ({ key: string; date: Date } | null)[] {
  const y = visible.getFullYear();
  const m = visible.getMonth();
  const first = new Date(y, m, 1);
  const leading = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const cells: ({ key: string; date: Date } | null)[] = [];
  for (let i = 0; i < leading; i++) {
    cells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(y, m, d);
    cells.push({ key: padDateKey(y, m, d), date });
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  while (cells.length < 42) {
    cells.push(null);
  }
  return cells;
}

type CalendarViewProps = {
  initialEntries: CalendarEntry[];
  demoMode: boolean;
  profileId: string;
};

export function CalendarView({ initialEntries, demoMode, profileId: _profileId }: CalendarViewProps) {
  const auth = useAuth();
  const supabase = useMemo(
    () => (demoMode ? null : createBrowserSupabaseClient(() => auth.getToken?.() ?? Promise.resolve(null))),
    [demoMode, auth],
  );

  const [entries, setEntries] = useState<CalendarEntry[]>(initialEntries);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const [schedulingFor, setSchedulingFor] = useState<string | null>(null);
  const [scheduleDraft, setScheduleDraft] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const y = visibleMonth.getFullYear();
  const mo = visibleMonth.getMonth();

  const entriesByDay = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>();
    for (const e of entries) {
      if (!e.at) continue;
      const key = localDateKeyFromIso(e.at);
      const prev = map.get(key) ?? [];
      prev.push(e);
      map.set(key, prev);
    }
    return map;
  }, [entries]);

  const monthScheduledEntries = useMemo(() => {
    return entries.filter((e) => {
      if (!e.at) return false;
      const d = new Date(e.at);
      return d.getFullYear() === y && d.getMonth() === mo;
    });
  }, [entries, y, mo]);

  const agendaKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const e of monthScheduledEntries) {
      if (e.at) keys.add(localDateKeyFromIso(e.at));
    }
    return Array.from(keys).sort();
  }, [monthScheduledEntries]);

  const unscheduledGoals = useMemo(
    () => entries.filter((e) => (e.kind === "solo_goal" || e.kind === "community_goal") && !e.at),
    [entries],
  );

  const unscheduledSessions = useMemo(
    () => entries.filter((e) => e.kind === "community_session" && !e.at),
    [entries],
  );

  const monthCells = useMemo(() => buildMonthCells(visibleMonth), [visibleMonth]);

  const persistDueAt = useCallback(
    async (goalId: string, iso: string | null) => {
      setError(null);
      setBusyId(goalId);
      try {
        if (demoMode) {
          const res = await fetch(`/api/demo/goals/${goalId}/schedule`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ due_at: iso }),
          });
          if (!res.ok) {
            const j = (await res.json().catch(() => ({}))) as { error?: string };
            throw new Error(j.error ?? `Request failed (${res.status})`);
          }
          const json = (await res.json()) as { due_at?: string | null };
          setEntries((prev) =>
            prev.map((e) =>
              e.id === goalId && (e.kind === "solo_goal" || e.kind === "community_goal")
                ? { ...e, at: json.due_at ?? null }
                : e,
            ),
          );
          return;
        }
        if (!supabase) {
          throw new Error("Supabase is not configured");
        }
        const { error: uErr } = await supabase.from("goals").update({ due_at: iso }).eq("id", goalId);
        if (uErr) {
          throw new Error(uErr.message);
        }
        setEntries((prev) =>
          prev.map((e) =>
            e.id === goalId && (e.kind === "solo_goal" || e.kind === "community_goal") ? { ...e, at: iso } : e,
          ),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save");
      } finally {
        setBusyId(null);
      }
    },
    [demoMode, supabase],
  );

  const openScheduler = useCallback((e: CalendarEntry) => {
    if (e.kind === "community_session") return;
    setSchedulingFor(e.id);
    setScheduleDraft(isoToDatetimeLocal(e.at));
  }, []);

  const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const today = new Date();
  const isToday = (d: Date) =>
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();

  return (
    <div className="flex flex-col gap-8">
      {error ? (
        <p className="rounded-md border border-red-400/70 bg-card px-3 py-2 text-sm text-red-900 dark:border-red-500/45 dark:text-red-200">
          {error}
        </p>
      ) : null}

      <section className="rounded-xl border border-border bg-card p-4 shadow-panel dark:shadow-panel-dark">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Legend</h2>
        <ul className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <li className="flex items-center gap-2">
            <span className="h-3 w-1 rounded-full bg-[hsl(215_20%_46%)]" aria-hidden />
            Solo goal (your time — set from “Unscheduled goals” below)
          </li>
          <li className="flex items-center gap-2">
            <span className="h-3 w-1 rounded-full bg-[hsl(187_28%_42%)]" aria-hidden />
            Community goal
          </li>
          <li className="flex items-center gap-2">
            <span className="h-3 w-1 rounded-sm bg-[hsl(187_28%_42%)]" aria-hidden />
            Community session
          </li>
        </ul>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-md border border-border bg-accent p-1.5 text-foreground hover:bg-muted"
            aria-label="Previous month"
            onClick={() => setVisibleMonth(new Date(y, mo - 1, 1))}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="min-w-[10rem] text-center text-sm font-semibold text-foreground">
            {visibleMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </span>
          <button
            type="button"
            className="rounded-md border border-border bg-accent p-1.5 text-foreground hover:bg-muted"
            aria-label="Next month"
            onClick={() => setVisibleMonth(new Date(y, mo + 1, 1))}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="ml-1 text-xs font-medium text-moss underline-offset-4 hover:underline"
            onClick={() => setVisibleMonth(new Date())}
          >
            Today
          </button>
        </div>
      </div>

      <section className="hidden lg:block">
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-panel dark:shadow-panel-dark">
          <div className="grid grid-cols-7 border-b border-border text-center text-xs font-semibold text-muted-foreground">
            {weekdayLabels.map((d) => (
              <div key={d} className="border-r border-border py-2 last:border-r-0">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {monthCells.map((cell, idx) =>
              cell ? (
                <div
                  key={cell.key}
                  className="min-h-[6.5rem] border-b border-r border-border p-1.5 [&:nth-child(7n)]:border-r-0"
                >
                  <div className="text-xs font-medium">
                    <span className={twMerge(isToday(cell.date) ? "font-bold text-moss" : "text-foreground")}>
                      {cell.date.getDate()}
                    </span>
                  </div>
                  <ul className="mt-1 space-y-0.5">
                    {(entriesByDay.get(cell.key) ?? []).slice(0, 3).map((e) => (
                      <li key={`${e.kind}-${e.id}`}>
                        <button
                          type="button"
                          className={twMerge(
                            "w-full truncate rounded-sm border border-border bg-muted/40 px-1 py-0.5 text-left text-[11px] text-foreground",
                            entryBorderClass(e.kind),
                            e.kind !== "community_session" && "cursor-pointer hover:bg-accent",
                          )}
                          onClick={() => e.kind !== "community_session" && openScheduler(e)}
                          title={e.title}
                        >
                          <span className="sr-only">{labelForKind(e.kind)}: </span>
                          {e.title}
                        </button>
                      </li>
                    ))}
                    {(entriesByDay.get(cell.key) ?? []).length > 3 ? (
                      <li className="text-[10px] text-muted-foreground">
                        +{(entriesByDay.get(cell.key) ?? []).length - 3} more
                      </li>
                    ) : null}
                  </ul>
                </div>
              ) : (
                <div
                  key={`pad-${idx}`}
                  className="min-h-[6.5rem] border-b border-r border-border bg-muted/15 [&:nth-child(7n)]:border-r-0"
                />
              ),
            )}
          </div>
        </div>
      </section>

      <section className="lg:hidden">
        <h2 className="mb-3 text-sm font-semibold text-foreground">This month</h2>
        {agendaKeys.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing scheduled this month. Add times to goals below.</p>
        ) : (
          <ul className="space-y-4">
            {agendaKeys.map((key) => (
              <li key={key}>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {new Date(key + "T12:00:00").toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                <ul className="mt-2 space-y-2">
                  {(entriesByDay.get(key) ?? []).map((e) => (
                    <li key={`${e.kind}-${e.id}`}>
                      <button
                        type="button"
                        className={twMerge(
                          "w-full rounded-md border border-border bg-card px-3 py-2 text-left text-sm shadow-sm",
                          entryBorderClass(e.kind),
                          e.kind !== "community_session" && "active:scale-[0.99]",
                        )}
                        onClick={() => e.kind !== "community_session" && openScheduler(e)}
                      >
                        <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                          {labelForKind(e.kind)}
                        </span>
                        <div className="font-medium text-foreground">{e.title}</div>
                        {e.communityName ? (
                          <div className="text-xs text-muted-foreground">{e.communityName}</div>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>

      {(unscheduledGoals.length > 0 || unscheduledSessions.length > 0) && (
        <section className="rounded-xl border border-dashed border-border bg-muted/25 p-4">
          <h2 className="text-sm font-semibold text-foreground">Unscheduled</h2>
          {unscheduledGoals.length > 0 ? (
            <div className="mt-4">
              <h3 className="text-xs font-semibold uppercase text-muted-foreground">Goals — add a time</h3>
              <ul className="mt-2 space-y-3">
                {unscheduledGoals.map((e) => (
                  <li
                    key={e.id}
                    className={twMerge(
                      "flex flex-col gap-2 rounded-md border border-border bg-card p-3 sm:flex-row sm:items-end sm:justify-between",
                      entryBorderClass(e.kind),
                    )}
                  >
                    <div>
                      <div className="text-[10px] font-semibold uppercase text-muted-foreground">
                        {labelForKind(e.kind)}
                      </div>
                      <div className="font-medium text-foreground">{e.title}</div>
                      {e.communityName ? (
                        <div className="text-xs text-muted-foreground">{e.communityName}</div>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <input type="datetime-local" aria-label={`Schedule ${e.title}`} className={inputBase} />
                      <button
                        type="button"
                        disabled={busyId === e.id}
                        className="rounded-md bg-moss px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                        onClick={(ev) => {
                          const row = ev.currentTarget.closest("li");
                          const input = row?.querySelector('input[type="datetime-local"]') as HTMLInputElement | null;
                          const v = input?.value ?? "";
                          if (!v) {
                            setError("Pick a date and time first.");
                            return;
                          }
                          const iso = new Date(v).toISOString();
                          void persistDueAt(e.id, iso);
                        }}
                      >
                        Save
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {unscheduledSessions.length > 0 ? (
            <div className="mt-4">
              <h3 className="text-xs font-semibold uppercase text-muted-foreground">Sessions (no start time yet)</h3>
              <ul className="mt-2 space-y-2">
                {unscheduledSessions.map((e) => (
                  <li
                    key={e.id}
                    className={twMerge(
                      "rounded-md border border-border bg-card px-3 py-2 text-sm",
                      entryBorderClass(e.kind),
                    )}
                  >
                    <div className="font-medium">{e.title}</div>
                    {e.communityName ? <div className="text-xs text-muted-foreground">{e.communityName}</div> : null}
                    <p className="mt-1 text-xs text-muted-foreground">
                      Coordinators set session times elsewhere for now — external calendar sync can wire this layer
                      later.
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      )}

      {schedulingFor && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="schedule-dialog-title"
        >
          <div className="w-full max-w-md rounded-xl border border-border bg-background p-4 shadow-panel dark:shadow-panel-dark">
            <h3 id="schedule-dialog-title" className="font-semibold text-foreground">
              Schedule goal
            </h3>
            {(() => {
              const eg = entries.find((x) => x.id === schedulingFor);
              return eg ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {eg.title}
                  {eg.communityName ? ` · ${eg.communityName}` : ""}
                </p>
              ) : null;
            })()}
            <input
              type="datetime-local"
              value={scheduleDraft}
              onChange={(ev) => setScheduleDraft(ev.target.value)}
              className={twMerge(inputBase, "mt-4 w-full")}
            />
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busyId === schedulingFor}
                className="rounded-md bg-moss px-3 py-2 text-sm font-semibold text-white"
                onClick={() => {
                  if (!scheduleDraft) return;
                  const iso = new Date(scheduleDraft).toISOString();
                  void persistDueAt(schedulingFor, iso).then(() => setSchedulingFor(null));
                }}
              >
                Save
              </button>
              <button
                type="button"
                disabled={busyId === schedulingFor}
                className="rounded-md border border-border bg-card px-3 py-2 text-sm"
                onClick={() => void persistDueAt(schedulingFor, null).then(() => setSchedulingFor(null))}
              >
                Clear
              </button>
              <button
                type="button"
                className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
                onClick={() => setSchedulingFor(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Calendar uses goal <code className="rounded bg-muted px-1">due_at</code> for your planned focus time and session{" "}
        <code className="rounded bg-muted px-1">starts_at</code> for community events.{" "}
        <Link href="/dashboard" className="text-moss hover:underline">
          Dashboard
        </Link>{" "}
        for completing goals and XP.
      </p>
    </div>
  );
}
