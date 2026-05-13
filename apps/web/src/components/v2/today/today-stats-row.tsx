"use client";

import { CheckCircle2, Zap, Flame } from "lucide-react";

type TodayStatsRowProps = {
  doneTodayCount: number;
  pointsToday: number;
  streak: number;
};

export function TodayStatsRow({ doneTodayCount, pointsToday, streak }: TodayStatsRowProps) {
  const stats = [
    { icon: CheckCircle2, value: doneTodayCount, label: "Done today", color: "text-moss" },
    { icon: Zap, value: pointsToday, label: "Points today", color: "text-marigold" },
    { icon: Flame, value: streak, label: "Day streak", color: "text-clay" },
  ] as const;

  return (
    <div className="grid grid-cols-3 gap-3 rounded-xl border border-border bg-card p-4">
      {stats.map(({ icon: Icon, value, label, color }) => (
        <div key={label} className="flex flex-col items-center gap-1">
          <Icon className={`h-5 w-5 ${color}`} />
          <span className="text-xl font-bold text-foreground">{value}</span>
          <span className="text-center text-[11px] text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  );
}
