import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { DEFAULT_GROQ_MODEL, resolveGroqOnboardingModel } from "./ai-provider";

const KEYS = ["GROQ_ONBOARDING_MODEL", "GROQ_MODEL"] as const;
let backup: Partial<Record<(typeof KEYS)[number], string | undefined>>;

describe("resolveGroqOnboardingModel", () => {
  afterEach(() => {
    for (const k of KEYS) {
      const v = backup[k];
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  });

  it("uses DEFAULT_GROQ_MODEL when unset", () => {
    backup = { GROQ_ONBOARDING_MODEL: process.env.GROQ_ONBOARDING_MODEL, GROQ_MODEL: process.env.GROQ_MODEL };
    delete process.env.GROQ_ONBOARDING_MODEL;
    delete process.env.GROQ_MODEL;
    assert.equal(resolveGroqOnboardingModel(), DEFAULT_GROQ_MODEL);
  });

  it("falls back to GROQ_MODEL when onboarding is unset", () => {
    backup = { GROQ_ONBOARDING_MODEL: process.env.GROQ_ONBOARDING_MODEL, GROQ_MODEL: process.env.GROQ_MODEL };
    delete process.env.GROQ_ONBOARDING_MODEL;
    process.env.GROQ_MODEL = "meta-llama/llama-guard";
    assert.equal(resolveGroqOnboardingModel(), "meta-llama/llama-guard");
  });

  it("prefers GROQ_ONBOARDING_MODEL over GROQ_MODEL", () => {
    backup = { GROQ_ONBOARDING_MODEL: process.env.GROQ_ONBOARDING_MODEL, GROQ_MODEL: process.env.GROQ_MODEL };
    process.env.GROQ_ONBOARDING_MODEL = "onboarding-mini";
    process.env.GROQ_MODEL = "meta-llama/llama-guard";
    assert.equal(resolveGroqOnboardingModel(), "onboarding-mini");
  });

  it("skips whitespace-only onboarding and uses GROQ_MODEL", () => {
    backup = { GROQ_ONBOARDING_MODEL: process.env.GROQ_ONBOARDING_MODEL, GROQ_MODEL: process.env.GROQ_MODEL };
    process.env.GROQ_ONBOARDING_MODEL = "  \t  ";
    process.env.GROQ_MODEL = "from-general";
    assert.equal(resolveGroqOnboardingModel(), "from-general");
  });

  it("skips whitespace-only values and reaches default", () => {
    backup = { GROQ_ONBOARDING_MODEL: process.env.GROQ_ONBOARDING_MODEL, GROQ_MODEL: process.env.GROQ_MODEL };
    process.env.GROQ_ONBOARDING_MODEL = "";
    process.env.GROQ_MODEL = "   ";
    assert.equal(resolveGroqOnboardingModel(), DEFAULT_GROQ_MODEL);
  });
});
