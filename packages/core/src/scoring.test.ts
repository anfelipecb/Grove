import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getNextSeniorityTier, getSeniorityTier, suggestXp } from "./scoring";

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
});
