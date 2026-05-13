"use client";

import { twMerge } from "tailwind-merge";

export type CommunityMember = {
  profileId: string;
  displayName: string;
  communityPoints: number;
  weeklyTasksDone: number;
  weeklyPoints: number;
};

type Props = {
  members: CommunityMember[];
  currentProfileId: string;
};

export function MemberActivity({ members, currentProfileId }: Props) {
  return (
    <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border/50">
        <h3 className="text-sm font-semibold text-foreground">Member Activity This Week</h3>
      </div>
      {members.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-muted-foreground">No activity yet this week.</p>
      ) : (
        <ul className="divide-y divide-border/50">
          {members.map((m, i) => (
            <li
              key={m.profileId}
              className={twMerge(
                "flex items-center gap-3 px-4 py-3",
                m.profileId === currentProfileId && "bg-moss/5",
              )}
            >
              <span className="w-5 shrink-0 text-xs font-bold tabular-nums text-muted-foreground">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className={twMerge(
                  "text-sm font-medium truncate",
                  m.profileId === currentProfileId ? "text-moss" : "text-foreground",
                )}>
                  {m.displayName}
                  {m.profileId === currentProfileId && (
                    <span className="ml-1.5 text-xs font-normal text-muted-foreground">(you)</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">{m.weeklyTasksDone} task{m.weeklyTasksDone !== 1 ? "s" : ""} done</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-bold tabular-nums text-moss">{m.communityPoints.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">pts total</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
