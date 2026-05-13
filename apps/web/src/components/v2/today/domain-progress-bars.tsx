"use client";

import { LIFE_DOMAINS } from "@grove/core";

type DomainProgressBarsProps = {
  domainPoints: Record<string, number>;
};

const DOMAIN_BAR_COLORS: Record<string, string> = {
  wellbeing: "bg-emerald-500",
  learning: "bg-blue-500",
  work_build: "bg-orange-500",
  relationships: "bg-pink-500",
  community: "bg-violet-500",
  life_admin: "bg-slate-500",
  rest_play: "bg-amber-500",
};

const DOMAIN_TEXT_COLORS: Record<string, string> = {
  wellbeing: "text-emerald-600 dark:text-emerald-400",
  learning: "text-blue-600 dark:text-blue-400",
  work_build: "text-orange-600 dark:text-orange-400",
  relationships: "text-pink-600 dark:text-pink-400",
  community: "text-violet-600 dark:text-violet-400",
  life_admin: "text-slate-600 dark:text-slate-400",
  rest_play: "text-amber-600 dark:text-amber-400",
};

export function DomainProgressBars({ domainPoints }: DomainProgressBarsProps) {
  return (
    <div className="space-y-2.5 rounded-xl border border-border bg-card p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Domain Progress</p>
      {LIFE_DOMAINS.map((domain) => {
        const pts = domainPoints[domain.id] ?? 0;
        const level = Math.floor(pts / 100) + 1;
        const progressInLevel = pts % 100;
        const progressPercent = progressInLevel;
        const barColor = DOMAIN_BAR_COLORS[domain.id] ?? "bg-moss";
        const textColor = DOMAIN_TEXT_COLORS[domain.id] ?? "text-foreground";

        return (
          <div key={domain.id}>
            <div className="mb-1 flex items-center justify-between">
              <span className={`text-xs font-medium ${textColor}`}>{domain.label}</span>
              <span className="text-[11px] text-muted-foreground">
                Lvl {level} · {pts} pts
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all ${barColor}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
