"use client";

import { LIFE_DOMAINS, type LifeDomainId } from "@grove/core";

const DOMAIN_ACCENT: Record<LifeDomainId, string> = {
  wellbeing: "bg-emerald-500",
  learning: "bg-blue-500",
  work_build: "bg-orange-500",
  relationships: "bg-pink-500",
  community: "bg-violet-500",
  life_admin: "bg-slate-400",
  rest_play: "bg-amber-500",
};

const DOMAIN_RING: Record<LifeDomainId, string> = {
  wellbeing: "ring-emerald-500/30",
  learning: "ring-blue-500/30",
  work_build: "ring-orange-500/30",
  relationships: "ring-pink-500/30",
  community: "ring-violet-500/30",
  life_admin: "ring-slate-400/30",
  rest_play: "ring-amber-500/30",
};

type Props = {
  weights: Record<LifeDomainId, number>;
};

export function OnboardingDomainWeightsDisplay({ weights }: Props) {
  const sorted = [...LIFE_DOMAINS].sort((a, b) => weights[b.id] - weights[a.id]);
  const topId = sorted[0]?.id;
  const total = LIFE_DOMAINS.reduce((sum, d) => sum + weights[d.id], 0);

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Energy mix</p>
          <p className="text-xs tabular-nums text-muted-foreground">{total}% total</p>
        </div>
        <div
          className="flex h-3.5 w-full overflow-hidden rounded-full bg-muted/50 shadow-inner"
          role="img"
          aria-label={sorted.map((d) => `${d.label} ${weights[d.id]} percent`).join(", ")}
        >
          {sorted.map((d) => {
            const pct = weights[d.id];
            if (pct <= 0) return null;
            return (
              <div
                key={d.id}
                className={`${DOMAIN_ACCENT[d.id]} min-w-[2px] transition-[width] duration-500 ease-out`}
                style={{ width: `${pct}%` }}
                title={`${d.label}: ${pct}%`}
              />
            );
          })}
        </div>
        {topId ? (
          <p className="mt-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{LIFE_DOMAINS.find((d) => d.id === topId)?.label}</span> leads
            for now — you can rebalance in Profile later.
          </p>
        ) : null}
      </div>

      <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-background/60">
        {sorted.map((d, index) => {
          const pct = weights[d.id];
          const isTop = index === 0 && pct > 0;
          return (
            <li
              key={d.id}
              className={`flex items-center gap-3 px-3 py-3 ${isTop ? "bg-moss/[0.06]" : ""}`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-2 ${DOMAIN_RING[d.id]} ${DOMAIN_ACCENT[d.id]}/15`}
                aria-hidden="true"
              >
                <span className={`h-2.5 w-2.5 rounded-full ${DOMAIN_ACCENT[d.id]}`} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-foreground">{d.label}</p>
                  {isTop ? (
                    <span className="shrink-0 rounded-full bg-moss/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-moss">
                      Top
                    </span>
                  ) : null}
                </div>
                <div className="mt-1.5 h-1.5 w-full max-w-[200px] overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${DOMAIN_ACCENT[d.id]} transition-[width] duration-500 ease-out`}
                    style={{ width: `${Math.max(4, pct)}%` }}
                  />
                </div>
              </div>
              <span className="shrink-0 tabular-nums text-sm font-semibold text-foreground">{pct}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function OnboardingDomainWeightsSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-3.5 w-full rounded-full bg-muted" />
      <p className="text-center text-xs text-muted-foreground">Calibrating your domains…</p>
      <div className="overflow-hidden rounded-xl border border-border">
        {LIFE_DOMAINS.map((d) => (
          <div key={d.id} className="flex items-center gap-3 border-t border-border px-3 py-3 first:border-t-0">
            <div className="h-9 w-9 rounded-xl bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-24 rounded bg-muted" />
              <div className="h-1.5 w-full max-w-[160px] rounded-full bg-muted" />
            </div>
            <div className="h-4 w-8 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
