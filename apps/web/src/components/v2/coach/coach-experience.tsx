"use client";

import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { CoachCheckin } from "@/components/v2/coach/coach-checkin";
import { CoachWizard } from "@/components/v2/coach/coach-wizard";
import { CoachChatPanel, type CoachChatContext } from "@/components/v2/coach/coach-chat-panel";
import type { ExistingCoachGoal } from "@/components/v2/coach/types";

type CoachExperienceProps = {
  activeGoals: ExistingCoachGoal[];
  chatContext: CoachChatContext;
  demoMode: boolean;
  displayName: string;
  profileId: string;
  spendablePoints: number;
  hasTasks: boolean;
};

const MOBILE_TABS = ["Coach", "Chat"] as const;
type MobileTab = (typeof MOBILE_TABS)[number];

export function CoachExperience({
  activeGoals,
  chatContext,
  demoMode,
  displayName,
  profileId,
  spendablePoints,
  hasTasks,
}: CoachExperienceProps) {
  const [mobileTab, setMobileTab] = useState<MobileTab>("Coach");

  const coachPane = hasTasks ? (
    <CoachCheckin
      activeGoals={activeGoals}
      demoMode={demoMode}
      displayName={displayName}
      profileId={profileId}
      spendablePoints={spendablePoints}
    />
  ) : (
    <CoachWizard demoMode={demoMode} initialDisplayName={displayName} profileId={profileId} />
  );

  return (
    <div className="space-y-6">
      <div className="hidden gap-6 md:grid md:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div>{coachPane}</div>
        <CoachChatPanel demoMode={demoMode} displayName={displayName} profileId={profileId} context={chatContext} />
      </div>

      <div className="md:hidden">
        <div className="mb-4 flex rounded-full border border-border bg-card p-1">
          {MOBILE_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setMobileTab(tab)}
              className={twMerge(
                "flex-1 rounded-full px-4 py-2 text-sm font-semibold transition",
                mobileTab === tab ? "bg-moss text-moss-fg" : "text-muted-foreground",
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className={mobileTab === "Coach" ? "block" : "hidden"}>
          {coachPane}
        </div>
        <div className={mobileTab === "Chat" ? "block" : "hidden"}>
          <CoachChatPanel demoMode={demoMode} displayName={displayName} profileId={profileId} context={chatContext} />
        </div>
      </div>
    </div>
  );
}
