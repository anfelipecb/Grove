import {
  COMMUNITY_UNLOCK_GLOBAL_LEVEL,
  getGlobalLevel,
  getMinXpForGlobalLevel,
  hasCommunityAccess,
} from "@grove/core";
import { Lock } from "lucide-react";

type Props = {
  totalXp: number;
};

export function CommunityGate({ totalXp }: Props) {
  const { globalLevel, tier, tierLevel, xpIntoLevel, xpForLevel } = getGlobalLevel(totalXp);
  const unlocked = hasCommunityAccess(totalXp);
  const unlockXp = getMinXpForGlobalLevel(COMMUNITY_UNLOCK_GLOBAL_LEVEL);
  const xpToUnlock = Math.max(0, unlockXp - totalXp);
  const progress =
    globalLevel >= COMMUNITY_UNLOCK_GLOBAL_LEVEL
      ? 100
      : Math.min(100, Math.round((totalXp / unlockXp) * 100));

  if (unlocked) {
    return null;
  }

  return (
    <main className="mx-auto flex max-w-md flex-col items-center px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-border bg-muted/40">
        <Lock className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
      </div>
      <h1 className="text-xl font-semibold text-foreground">Community unlocks at level {COMMUNITY_UNLOCK_GLOBAL_LEVEL}</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        You are at level {globalLevel} ({tier.label} · L{tierLevel}). Build your personal loop first, then
        join others at level {COMMUNITY_UNLOCK_GLOBAL_LEVEL}.
      </p>
      <div className="mt-8 w-full rounded-xl border border-border bg-card p-4 text-left">
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>Progress to unlock</span>
          <span>{xpToUnlock > 0 ? `${xpToUnlock} XP to go` : "Unlocked"}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-moss transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          {xpIntoLevel} / {xpForLevel} XP in current level
        </p>
      </div>
    </main>
  );
}
