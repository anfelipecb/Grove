import { Flame } from "lucide-react";
import { getSeniorityProgress } from "@grove/core";

type PointsHeaderProps = {
  displayName: string;
  totalPoints: number;
  streak: number;
};

export function PointsHeader({ displayName, totalPoints, streak }: PointsHeaderProps) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const { currentTier, nextTier, progressPercent } = getSeniorityProgress(totalPoints);

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {greeting},{" "}
            <span className="font-semibold text-foreground">{displayName.split(" ")[0]}</span>
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-moss/15 px-2 py-0.5 text-xs font-semibold text-moss">
              {currentTier.label}
            </span>
            <span className="text-xs text-muted-foreground">
              {totalPoints.toLocaleString()} XP
            </span>
          </div>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-1 text-sm font-medium text-orange-500">
            <Flame className="h-4 w-4" />
            {streak}
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-moss transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {nextTier
            ? `${nextTier.label} at ${nextTier.minXp.toLocaleString()} XP`
            : "Max tier reached — Elder 🌳"}
        </p>
      </div>
    </div>
  );
}
