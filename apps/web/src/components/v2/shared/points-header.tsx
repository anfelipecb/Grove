"use client";

import { useEffect, useState } from "react";
import { Flame } from "lucide-react";
import { formatGlobalLevelLabel, getGlobalLevel, getSeniorityProgress } from "@grove/core";
import { XP_UPDATED_EVENT, type XpUpdateDetail } from "@/lib/xp-client";

type PointsHeaderProps = {
  displayName: string;
  totalPoints: number;
  streak: number;
};

export function PointsHeader({ displayName, totalPoints: initialTotal, streak }: PointsHeaderProps) {
  const [totalPoints, setTotalPoints] = useState(initialTotal);

  useEffect(() => {
    setTotalPoints(initialTotal);
  }, [initialTotal]);

  useEffect(() => {
    const onXpUpdated = (event: Event) => {
      const detail = (event as CustomEvent<XpUpdateDetail>).detail;
      if (detail && typeof detail.totalXp === "number") {
        setTotalPoints(detail.totalXp);
      }
    };
    window.addEventListener(XP_UPDATED_EVENT, onXpUpdated);
    return () => window.removeEventListener(XP_UPDATED_EVENT, onXpUpdated);
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const { nextTier, progressPercent } = getSeniorityProgress(totalPoints);
  const levelLabel = formatGlobalLevelLabel(totalPoints);
  const { xpIntoLevel, xpForLevel } = getGlobalLevel(totalPoints);

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
              {levelLabel}
            </span>
            <span className="text-xs text-muted-foreground">{totalPoints.toLocaleString()} XP</span>
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
            className="h-full rounded-full bg-moss transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {nextTier
            ? `${xpIntoLevel} / ${xpForLevel} XP this level · ${nextTier.label} at ${nextTier.minXp.toLocaleString()} XP`
            : `${xpIntoLevel} / ${xpForLevel} XP this level`}
        </p>
      </div>
    </div>
  );
}
