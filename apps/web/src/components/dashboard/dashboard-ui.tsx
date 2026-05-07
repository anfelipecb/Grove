import type { ReactNode } from "react";

export const dashboardInputClassName =
  "w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none ring-moss/20 transition focus:border-moss focus:ring-4 dark:ring-moss/40";

export function DashboardPanel({
  title,
  icon,
  children,
  className = "",
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-border bg-card/90 p-4 shadow-panel dark:shadow-panel-dark ${className}`}
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="text-moss">{icon}</span>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export function DashboardInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}
