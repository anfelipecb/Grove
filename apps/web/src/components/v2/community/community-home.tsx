"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { SharedGoalsList, type SharedGoal } from "@/components/v2/community/shared-goals-list";
import { MemberActivity, type CommunityMember } from "@/components/v2/community/member-activity";
import { SessionsPanel, type UpcomingSession } from "@/components/v2/community/sessions-panel";
import { AlignmentModal } from "@/components/v2/community/alignment-modal";
import {
  BuddyCoordinationPanel,
  type CommunityInviteView,
  type CommunityPlanView,
} from "@/components/v2/community/buddy-coordination-panel";

type CommunityData = {
  id: string;
  name: string;
  memberCount: number;
};

type Props = {
  community: CommunityData;
  goals: SharedGoal[];
  members: CommunityMember[];
  upcomingSessions: UpcomingSession[];
  isOrganizer: boolean;
  currentProfileId: string;
  communityPoints: number;
  communityId: string;
  showAlignmentPrompt: boolean;
  invites: CommunityInviteView[];
  plans: CommunityPlanView[];
};

export function CommunityHome({
  community,
  goals,
  members,
  upcomingSessions,
  isOrganizer,
  currentProfileId,
  communityPoints,
  communityId,
  showAlignmentPrompt,
  invites,
  plans,
}: Props) {
  const [sessions, setSessions] = useState(upcomingSessions);
  const [alignmentOpen, setAlignmentOpen] = useState(showAlignmentPrompt);

  useEffect(() => {
    setAlignmentOpen(showAlignmentPrompt);
  }, [showAlignmentPrompt]);

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-4">
      <AlignmentModal
        communityId={communityId}
        goals={goals}
        open={alignmentOpen}
        onDismissLocal={() => setAlignmentOpen(false)}
      />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">{community.name}</h1>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span>{community.memberCount} member{community.memberCount !== 1 ? "s" : ""}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold tabular-nums text-moss">{communityPoints.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">community pts</p>
        </div>
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-foreground">Shared Goals</h2>
        <SharedGoalsList goals={goals} memberCount={community.memberCount} />
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-foreground">Member Activity</h2>
        <MemberActivity members={members} currentProfileId={currentProfileId} />
      </section>

      <section className="space-y-2">
        <SessionsPanel
          sessions={sessions}
          isOrganizer={isOrganizer}
          onSessionCreated={(s) => setSessions((cur) => [...cur, s].sort((a, b) => a.startsAt.localeCompare(b.startsAt)).slice(0, 3))}
        />
      </section>

      <section className="space-y-2">
        <BuddyCoordinationPanel
          communityId={communityId}
          communityName={community.name}
          invites={invites}
          plans={plans}
          canCreate
        />
      </section>
    </div>
  );
}
