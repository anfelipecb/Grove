import { twMerge } from "tailwind-merge";
import { DomainInfoTooltip } from "@/components/v2/shared/domain-info-tooltip";
import type { LifeDomainId } from "@grove/core";

const DOMAIN_COLORS: Record<string, string> = {
  wellbeing:
    "bg-emerald-500/15 text-emerald-700 border-emerald-500/20 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-700/40",
  learning:
    "bg-blue-500/15 text-blue-700 border-blue-500/20 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-700/40",
  work_build:
    "bg-orange-500/15 text-orange-700 border-orange-500/20 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-700/40",
  relationships:
    "bg-pink-500/15 text-pink-700 border-pink-500/20 dark:bg-pink-950/40 dark:text-pink-400 dark:border-pink-700/40",
  community:
    "bg-violet-500/15 text-violet-700 border-violet-500/20 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-700/40",
  life_admin:
    "bg-slate-500/15 text-slate-700 border-slate-500/20 dark:bg-slate-950/40 dark:text-slate-400 dark:border-slate-700/40",
  rest_play:
    "bg-amber-500/15 text-amber-700 border-amber-500/20 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-700/40",
};

export function DomainTag({
  domain,
  className,
  showInfo,
}: {
  domain: string;
  className?: string;
  showInfo?: boolean;
}) {
  const colors = DOMAIN_COLORS[domain] ?? "bg-muted text-muted-foreground border-border";
  const domainId = domain as LifeDomainId;

  return (
    <span className={twMerge("inline-flex items-center", className)}>
      <span
        className={twMerge(
          "inline-flex items-center rounded border px-1.5 py-0.5 text-xs font-medium",
          colors,
        )}
      >
        #{domain.replace("_", "/")}
      </span>
      {showInfo ? <DomainInfoTooltip domainId={domainId} /> : null}
    </span>
  );
}
