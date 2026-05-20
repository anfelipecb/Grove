"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDailyDebrief } from "@/hooks/use-daily-debrief";

type Props = {
  yesterdayPlannedCount: number;
};

export function TodayDebriefRedirect({ yesterdayPlannedCount }: Props) {
  const router = useRouter();
  const { isNewDay, ready, markVisited } = useDailyDebrief();

  useEffect(() => {
    if (!ready || !isNewDay) {
      return;
    }

    markVisited();
    const planned = Math.max(0, yesterdayPlannedCount);
    router.replace(`/coach?debrief=1&planned=${planned}`);
  }, [isNewDay, markVisited, ready, router, yesterdayPlannedCount]);

  return null;
}
