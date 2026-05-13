"use client";

import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { DailyCard } from "@/components/v2/today/daily-card";
import type { TaskRowData } from "@/components/v2/today/task-row";

type TodayTabsProps = {
  tasks: TaskRowData[];
};

const TABS = ["Daily Card", "Calendar"] as const;
type Tab = (typeof TABS)[number];

export function TodayTabs({ tasks }: TodayTabsProps) {
  const [active, setActive] = useState<Tab>("Daily Card");

  return (
    <div>
      <div className="flex border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className={twMerge(
              "flex-1 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
              active === tab
                ? "border-moss text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {active === "Daily Card" && <DailyCard initialTasks={tasks} />}
      {active === "Calendar" && (
        <div className="flex min-h-[40vh] items-center justify-center p-8 text-center">
          <p className="text-sm text-muted-foreground">Calendar view coming in GRO-018.</p>
        </div>
      )}
    </div>
  );
}
