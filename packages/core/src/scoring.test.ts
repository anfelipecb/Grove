import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getClosestSurpriseUnlock,
  getNextSeniorityTier,
  getSeniorityProgress,
  getSeniorityTier,
  getSurpriseUnlocks,
  suggestXp,
} from "./scoring";

describe("suggestXp", () => {
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
