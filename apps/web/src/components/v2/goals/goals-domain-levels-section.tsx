"use client";

import { DomainLevels } from "@/components/v2/coach/domain-levels";

export function GoalsDomainLevelsSection() {
  return (
    <section
      id="domain-levels"
      className="scroll-mt-6 rounded-[28px] border border-border bg-card/95 p-5 shadow-panel dark:shadow-panel-dark"
    >
      <DomainLevels variant="goals" />
    </section>
  );
}
