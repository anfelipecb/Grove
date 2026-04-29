import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { generateProfileCardFromIntake, summarizeSessionNotesLocally } from "./mycelium";

describe("generateProfileCardFromIntake", () => {
  it("turns goals and friction into a support profile", () => {
    const profile = generateProfileCardFromIntake({
      name: "A",
      goals: "Ship Grove\nExercise",
      friction: "Context switching\nLosing notes",
      supportStyle: "structured",
      communityInterest: "Join build night",
    });

    assert.equal(profile.supportStyle, "structured");
    assert.equal(profile.firstTargets.length, 2);
    assert.ok(profile.likelyFriction.includes("Context switching"));
    assert.equal(profile.communityEntryPoint, "Join build night");
  });
});

describe("summarizeSessionNotesLocally", () => {
  it("extracts decisions and commitments from notes", () => {
    const summary = summarizeSessionNotesLocally({
      title: "Planning",
      notes: "Decided: ship the scaffold.\nAndres: will share the first commit by Friday.",
    });

    assert.match(summary.decisions[0] ?? "", /ship/);
    assert.equal(summary.commitments[0]?.ownerName, "Andres");
    assert.match(summary.commitments[0]?.task ?? "", /first commit/);
  });
});
