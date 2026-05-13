import { twMerge } from "tailwind-merge";

const DOMAIN_COLORS: Record<string, string> = {
  wellbeing: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  learning: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  work_build: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  relationships: "bg-pink-500/15 text-pink-600 dark:text-pink-400",
  community: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  life_admin: "bg-slate-500/15 text-slate-600 dark:text-slate-400",
  rest_play: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
};

export function DomainTag({ domain, className }: { domain: string; className?: string }) {
  const colors = DOMAIN_COLORS[domain] ?? "bg-muted text-muted-foreground";
  return (
    <span className={twMerge("inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium", colors, className)}>
      #{domain.replace("_", "/")}
    </span>
  );
}
