import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { containsCrisisSignal } from "./safety";

describe("containsCrisisSignal", () => {
  it("detects crisis language", () => {
    assert.equal(containsCrisisSignal("I might hurt myself"), true);
  });

  it("does not flag normal planning language", () => {
    assert.equal(containsCrisisSignal("I need help planning a hard week"), false);
  });
});
