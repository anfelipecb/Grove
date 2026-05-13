"use client";

import { useEffect, useState } from "react";
import { DomainTag } from "@/components/v2/shared/domain-tag";

type CompletionEntry = {
  id: string;
  task_id: string;
  notes: string | null;
  points_earned: number;
  tasks: { title: string; domain: string } | null;
};

type ScheduledEntry = {
  id: string;
  task_id: string;
  tasks: { title: string; domain: string } | null;
};

type DayData = {
  completions: CompletionEntry[];
  scheduled: ScheduledEntry[];
};

type DayLogProps = {
  date: string;
};

export function DayLog({ date }: DayLogProps) {
  const [data, setData] = useState<DayData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/v2/calendar/${date}`)
      .then((r) => r.json())
      .then((d: DayData) => setData(d))
      .finally(() => setLoading(false));
  }, [date]);

  if (loading) {
    return <div className="py-4 text-center text-xs text-muted-foreground animate-pulse">Loading…</div>;
  }

  const completions = data?.completions ?? [];
  const scheduled = data?.scheduled ?? [];

  if (completions.length === 0 && scheduled.length === 0) {
    return <p className="py-4 text-center text-xs text-muted-foreground">Nothing logged for this day.</p>;
  }

  return (
    <div className="space-y-1 pt-1">
      {completions.map((c) => (
        <div key={c.id} className="flex items-center gap-2 rounded-md border border-moss/30 bg-moss/5 px-3 py-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{c.tasks?.title ?? "—"}</p>
            <div className="mt-0.5 flex items-center gap-1.5">
              {c.tasks?.domain && <DomainTag domain={c.tasks.domain} />}
              {c.notes && <span className="truncate text-xs text-muted-foreground">{c.notes}</span>}
            </div>
          </div>
          <span className="shrink-0 text-xs font-semibold text-moss">+{c.points_earned}</span>
        </div>
      ))}
      {scheduled.map((s) => (
        <div key={s.id} className="flex items-center gap-2 rounded-md border border-dashed border-border px-3 py-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-muted-foreground">{s.tasks?.title ?? "—"}</p>
            {s.tasks?.domain && (
              <div className="mt-0.5">
                <DomainTag domain={s.tasks.domain} />
              </div>
            )}
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">planned</span>
        </div>
      ))}
    </div>
  );
}
