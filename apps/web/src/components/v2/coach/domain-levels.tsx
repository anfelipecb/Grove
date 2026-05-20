"use client";

import { useEffect, useState } from "react";
import { POINTS_PER_DOMAIN_LEVEL, type LifeDomainId } from "@grove/core";
import { DomainTag } from "@/components/v2/shared/domain-tag";

type DomainRow = {
  id: LifeDomainId;
  label: string;
  points: number;
  level: number;
  pointsToNextLevel: number;
  progressToNextLevel: number;
  pointsPerLevel: number;
};

export function DomainLevels() {
  const [rows, setRows] = useState<DomainRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/v2/coach/domain-points");
        if (!res.ok) {
          const payload = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(payload.error ?? `Failed (${res.status})`);
        }
        const data = (await res.json()) as { domains: DomainRow[] };
        if (!cancelled) {
          setRows(data.domains);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not load domain levels.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Profile</p>
        <h2 className="mt-2 text-2xl font-semibold text-foreground">Domain levels</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Levels follow{" "}
          <span className="font-medium text-foreground">
            floor(points ÷ {POINTS_PER_DOMAIN_LEVEL})
          </span>{" "}
          from task completions in each domain.
        </p>
      </div>

      {error ? (
        <p className="rounded-2xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {!rows ? (
        <p className="text-sm text-muted-foreground">Loading domain progress…</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex flex-col gap-3 rounded-3xl border border-border bg-background/80 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-foreground">{row.label}</span>
                  <DomainTag domain={row.id} showInfo />
                </div>
                <span className="text-sm text-muted-foreground">
                  Level <span className="font-semibold text-foreground">{row.level}</span>
                </span>
              </div>
              <div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{row.points} pts in domain</span>
                  <span>
                    {row.pointsToNextLevel > 0
                      ? `${row.pointsToNextLevel} pts to next level`
                      : "At level threshold"}
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-moss transition-[width] duration-300"
                    style={{ width: `${Math.round(row.progressToNextLevel * 100)}%` }}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
