import type { LifeDomainId, MyceliumCalibrationPlan } from "@grove/core";
import {
  containsCrisisSignal,
  CRISIS_SUPPORT_MESSAGE,
  LIFE_DOMAINS,
  type IntakeDraft,
  myceliumCalibrationPlanSchema,
  requestJsonCompletion,
  resolveGroqOnboardingModel,
} from "@grove/core";
import { getServerUserId } from "@/lib/clerk-auth";

type Body = { intake: IntakeDraft; xpDomainWeights?: Partial<Record<LifeDomainId, number>> };

function joinedSignals(intake: IntakeDraft): string {
  return [intake.goals, intake.friction, intake.communityInterest, intake.focusDisclosure].join("\n");
}

function weightSummary(weights: Partial<Record<LifeDomainId, number>> | undefined): string {
  if (!weights) return "No weights provided.";
  return LIFE_DOMAINS.map((d) => `${d.label}: ${weights[d.id] ?? "—"}`).join("; ");
}

function calibrationFallback(intake: IntakeDraft, weightsNote: string): MyceliumCalibrationPlan {
  const bullets = intake.goals
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);
  const primary = bullets[0] ?? "Pick one outcome you can demonstrate in seven days.";
  return {
    summary:
      `${intake.name?.trim() ?? "Member"}, Grove will keep calibration practical: shrink the horizon, clarify one cue to start, and protect against shame spirals — no clinical framing. `,
    balancedGoals: [
      { title: `${primary}`, domain: "learning", rationale: "Anchored to what you typed as an intention." },
      {
        title: "One 25-minute block on the smallest visible step",
        domain: "work_build",
      },
      { title: "One community touchpoint — reply, RSVP, or share progress", domain: "community" },
    ],
    suggestedRewards: [{ title: "Low-stakes delight after focused work", cost: 8, visibility: "private" }],
    planOutline: [
      "Monday: rewrite the outcomes into verbs you can observe.",
      "Mid-week: ship one artefact worth showing (draft counts).",
      "Weekend: reflect for five minutes — what resisted you, what helped.",
    ].join("\n"),
    whatChangedBullets: [
      `Friction signals surfaced: ${(intake.friction || "unspecified").slice(0, 120)}`,
      weightsNote.slice(0, 280),
    ],
  };
}

export async function POST(request: Request) {
  const userId = await getServerUserId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as Body;
  if (!body?.intake?.goals?.trim()) {
    return Response.json({ error: "Missing intake goals" }, { status: 400 });
  }

  const joinedText = joinedSignals(body.intake);
  if (containsCrisisSignal(joinedText)) {
    return Response.json({ safety: true, message: CRISIS_SUPPORT_MESSAGE }, { status: 200 });
  }

  const ws = weightSummary(body.xpDomainWeights);

  if (!process.env.GROQ_API_KEY) {
    return Response.json({ plan: calibrationFallback(body.intake, ws), source: "local-fallback" });
  }

  try {
    const parsedJson = await requestJsonCompletion<unknown>({
      apiKey: process.env.GROQ_API_KEY,
      model: resolveGroqOnboardingModel(),
      messages: [
        {
          role: "system",
          content: [
            "You are Mycelium — Grove's ADHD-aware coach/coordinator during reassessment calibration.",
            "Return JSON only matching this structure exactly:",
            '{"summary":"<string>","balancedGoals":[{"title":"<string>","domain":"<life_domain_optional>","rationale":"<optional>"}],"suggestedRewards":[{"title":"<string>","cost":<positive int>,"visibility":"private"|"community" optional}],',
            `"planOutline":"<multi-sentence outline for the next stretch>",`,
            `"whatChangedBullets":["<optional bullets about what calibration shifted>"]}`,
            "",
            `Allowed domains (ids only): ${LIFE_DOMAINS.map((d) => d.id).join(", ")}.`,
            "Rules: no diagnoses; no promises of cures; actionable; kind; short bullets; realistic reward costs (points) 3-60.",
          ].join("\n"),
        },
        {
          role: "user",
          content: JSON.stringify({
            memberName: body.intake.name,
            intake: body.intake,
            domainWeightsNarrative: ws,
          }),
        },
      ],
      temperature: 0.35,
    });

    const parsed = myceliumCalibrationPlanSchema.safeParse(parsedJson);
    if (!parsed.success) {
      throw new Error("Calibration JSON did not match schema");
    }
    return Response.json({ plan: parsed.data, source: "groq" });
  } catch {
    return Response.json({ plan: calibrationFallback(body.intake, ws), source: "schema-fallback" });
  }
}
