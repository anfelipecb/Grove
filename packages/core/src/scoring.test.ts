import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  COMMUNITY_UNLOCK_GLOBAL_LEVEL,
  getClosestSurpriseUnlock,
  getGlobalLevel,
  getNextSeniorityTier,
  getSeniorityProgress,
  getSeniorityTier,
  getSurpriseUnlocks,
  hasCommunityAccess,
  HYPERFIXATION_BONUS_XP,
  PLANNING_BONUS_XP,
  suggestXp,
} from "./scoring";

describe("suggestXp", () => {
  const baseInput = {
    effort: "small" as const,
    resistance: "low" as const,
    value: "important" as const,
  };

  it("rewards higher resistance and community contribution", () => {
    const baseline = suggestXp({
      effort: "small",
      resistance: "low",
      value: "important",
    });
    const community = suggestXp({
      effort: "small",
      resistance: "high",
      value: "important",
      communityContribution: true,
    });

    assert.ok(community.xp > baseline.xp);
    assert.ok(community.spendablePoints > baseline.spendablePoints);
  });

  it("adds planning bonus when planning flag is set", () => {
    const baseline = suggestXp(baseInput);
    const withPlanning = suggestXp({ ...baseInput, planning: true });
    assert.equal(withPlanning.xp - baseline.xp, PLANNING_BONUS_XP);
  });

  it("adds hyperfixation bonus when flag is set", () => {
    const baseline = suggestXp(baseInput);
    const withHyper = suggestXp({ ...baseInput, isHyperfixationGoal: true });
    assert.equal(withHyper.xp - baseline.xp, HYPERFIXATION_BONUS_XP);
  });

  it("stacks planning and hyperfixation bonuses", () => {
    const baseline = suggestXp(baseInput);
    const stacked = suggestXp({
      ...baseInput,
      planning: true,
      isHyperfixationGoal: true,
    });
    assert.equal(stacked.xp - baseline.xp, PLANNING_BONUS_XP + HYPERFIXATION_BONUS_XP);
  });

  it("does not add bonuses when flags are absent", () => {
    const once = suggestXp(baseInput);
    const again = suggestXp(baseInput);
    assert.equal(once.xp, again.xp);
  });
});

describe("seniority tiers", () => {
  it("finds current and next tiers", () => {
    assert.equal(getSeniorityTier(0).label, "Seed");
    assert.equal(getSeniorityTier(800).label, "Rooted");
    assert.equal(getNextSeniorityTier(800)?.label, "Steward");
  });

  it("computes tier progress details", () => {
    const progress = getSeniorityProgress(800);
    assert.equal(progress.currentTier.label, "Rooted");
    assert.equal(progress.nextTier?.label, "Steward");
    assert.equal(progress.xpToNext, 800);
    assert.equal(progress.progressPercent, 6);
  });
});

describe("global levels", () => {
  it("maps XP to tier sub-levels and global level", () => {
    assert.equal(COMMUNITY_UNLOCK_GLOBAL_LEVEL, 11);

    const seedStart = getGlobalLevel(0);
    assert.equal(seedStart.tier.label, "Seed");
    assert.equal(seedStart.tierLevel, 1);
    assert.equal(seedStart.globalLevel, 1);

    const seedEnd = getGlobalLevel(249);
    assert.equal(seedEnd.tier.label, "Seed");
    assert.equal(seedEnd.tierLevel, 10);
    assert.equal(seedEnd.globalLevel, 10);
    assert.equal(hasCommunityAccess(249), false);

    const sproutStart = getGlobalLevel(250);
    assert.equal(sproutStart.tier.label, "Sprout");
    assert.equal(sproutStart.tierLevel, 1);
    assert.equal(sproutStart.globalLevel, 11);
    assert.equal(hasCommunityAccess(250), true);

    const sproutEnd = getGlobalLevel(749);
    assert.equal(sproutEnd.tier.label, "Sprout");
    assert.equal(sproutEnd.tierLevel, 10);
    assert.equal(sproutEnd.globalLevel, 20);

    const elderStart = getGlobalLevel(3000);
    assert.equal(elderStart.tier.label, "Elder");
    assert.equal(elderStart.tierLevel, 1);
    assert.equal(elderStart.globalLevel, 41);
  });
});

describe("surprise unlocks", () => {
  it("marks milestones unlocked from mixed solo and community progress", () => {
    const unlocks = getSurpriseUnlocks({
      totalXp: 320,
      streakDays: 3,
      activeDaysLast7: 4,
      completedGoals: 2,
      joinedCommunities: 1,
      activeCommitments: 1,
      completedCommitments: 1,
      savedRewards: 0,
    });

    assert.equal(unlocks.find((unlock) => unlock.id === "first-sprout")?.unlocked, true);
    assert.equal(unlocks.find((unlock) => unlock.id === "steady-rhythm")?.unlocked, true);
    assert.equal(unlocks.find((unlock) => unlock.id === "community-pulse")?.unlocked, true);
    assert.equal(unlocks.find((unlock) => unlock.id === "proof-of-work")?.unlocked, false);
  });

  it("finds the closest locked surprise", () => {
    const closest = getClosestSurpriseUnlock({
      totalXp: 220,
      streakDays: 1,
      activeDaysLast7: 2,
      completedGoals: 1,
      joinedCommunities: 0,
      activeCommitments: 0,
      completedCommitments: 0,
      savedRewards: 0,
    });

    assert.equal(closest?.id, "first-sprout");
  });
});
