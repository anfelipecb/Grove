"use client";

import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { CoachSidebar } from "@/components/v2/coach/coach-sidebar";
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
  onboardingComplete: boolean;
  debriefPlannedCount?: number;
};

const MOBILE_TABS = ["Chat", "Profile"] as const;
type MobileTab = (typeof MOBILE_TABS)[number];

export function CoachExperience({
  activeGoals,
  chatContext,
  demoMode,
  displayName,
  profileId,
  spendablePoints,
  hasTasks,
  onboardingComplete,
  debriefPlannedCount = 0,
}: CoachExperienceProps) {
  const [mobileTab, setMobileTab] = useState<MobileTab>("Chat");

  const sidebarPane = onboardingComplete ? (
    <CoachSidebar
      activeGoals={activeGoals}
      demoMode={demoMode}
      displayName={displayName}
      profileId={profileId}
      spendablePoints={spendablePoints}
    />
  ) : (
    <CoachWizard demoMode={demoMode} initialDisplayName={displayName} profileId={profileId} />
  );

  const chatPanel = (
    <CoachChatPanel
      compactSend
      demoMode={demoMode}
      displayName={displayName}
      profileId={profileId}
      context={chatContext}
      debriefPlannedCount={debriefPlannedCount}
      hasTasks={hasTasks}
    />
  );

  return (
    <div className="space-y-6">
      <div className="hidden gap-6 md:grid md:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        {chatPanel}
        <div>{sidebarPane}</div>
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

        <div className={mobileTab === "Chat" ? "block" : "hidden"}>{chatPanel}</div>
        <div className={mobileTab === "Profile" ? "block" : "hidden"}>{sidebarPane}</div>
      </div>
    </div>
  );
}
