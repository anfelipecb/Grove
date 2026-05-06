import {
  containsCrisisSignal,
  CRISIS_SUPPORT_MESSAGE,
  generateProfileCardFromIntake,
  memberProfileCardSchema,
  requestJsonCompletion,
  resolveGroqOnboardingModel,
  type IntakeDraft,
} from "@grove/core";

function normalizeLegacyProfileCard(raw: unknown, intake: IntakeDraft) {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as Record<string, unknown>;
  if ("summary" in candidate) return candidate;

  const legacy = candidate.profileCard as Record<string, unknown> | undefined;
  if (!legacy) return null;

  const supportStyle = String(legacy.section3 && typeof legacy.section3 === "object" ? (legacy.section3 as Record<string, unknown>).description ?? "" : "")
    .toLowerCase()
    .includes("gentle")
    ? "gentle"
    : String(legacy.section3 && typeof legacy.section3 === "object" ? (legacy.section3 as Record<string, unknown>).description ?? "" : "")
        .toLowerCase()
        .includes("direct")
      ? "direct"
      : String(legacy.section3 && typeof legacy.section3 === "object" ? (legacy.section3 as Record<string, unknown>).description ?? "" : "")
          .toLowerCase()
          .includes("brief")
        ? "brief"
        : "structured";

  const section1 = legacy.section1 && typeof legacy.section1 === "object" ? (legacy.section1 as Record<string, unknown>).description : "";
  const section2 = legacy.section2 && typeof legacy.section2 === "object" ? (legacy.section2 as Record<string, unknown>).description : "";
  const section4 = legacy.section4 && typeof legacy.section4 === "object" ? (legacy.section4 as Record<string, unknown>).description : "";
  const section5 = legacy.section5 && typeof legacy.section5 === "object" ? (legacy.section5 as Record<string, unknown>).description : "";

  const firstTargets =
    String(section1 ?? "")
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 3);
  const likelyFriction =
    String(section2 ?? "")
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 5);
  const nudgeGuidelines =
    String(section5 ?? "")
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);

  const summary =
    String(legacy.header ?? "").trim() ||
    `Andres is trying to turn broad intentions into visible next actions. Grove should keep the next step small, concrete, and connected to community participation.`;

  return memberProfileCardSchema.safeParse({
    summary,
    supportStyle,
    likelyFriction: likelyFriction.length ? likelyFriction : ["Context switching", "Trouble starting"],
    firstTargets: firstTargets.length
      ? firstTargets
      : [
          `Define the next 25-minute action for: ${String(intake.goals || "Ship something visible")}`,
        ],
    communityEntryPoint: String(section4 ?? "").trim() || "Small weekly check-ins",
    nudgeGuidelines: nudgeGuidelines.length
      ? nudgeGuidelines
      : [
          "Keep nudges short and non-judgmental.",
          "Ask for the next visible action instead of demanding a full plan.",
          "Tie community commitments to a clear time, place, or session.",
        ],
  });
}

export async function POST(request: Request) {
  const intake = (await request.json()) as IntakeDraft;
  const joinedText = [intake.goals, intake.friction, intake.communityInterest, intake.focusDisclosure].join("\n");

  if (containsCrisisSignal(joinedText)) {
    return Response.json({ safety: true, message: CRISIS_SUPPORT_MESSAGE }, { status: 200 });
  }

  if (!process.env.GROQ_API_KEY) {
    return Response.json({ profile: generateProfileCardFromIntake(intake), source: "local" });
  }

  try {
    const profile = await requestJsonCompletion<unknown>({
      apiKey: process.env.GROQ_API_KEY,
      model: resolveGroqOnboardingModel(),
      messages: [
        {
          role: "system",
          content:
            "You are Grove's ADHD-aware coach/coordinator. Return JSON only and match Grove's profile schema exactly: summary, supportStyle, likelyFriction, firstTargets, communityEntryPoint, nudgeGuidelines. Do not wrap it in another object. Do not diagnose. Keep it concise and practical.",
        },
        {
          role: "user",
          content: JSON.stringify(intake),
        },
      ],
    });

    const parsed = memberProfileCardSchema.safeParse(profile);
    if (parsed.success) {
      return Response.json({ profile: parsed.data, source: "groq" });
    }

    const legacy = normalizeLegacyProfileCard(profile, intake);
    if (legacy?.success) {
      return Response.json({ profile: legacy.data, source: "groq-legacy" });
    }

    throw new Error("Groq profile response did not match Grove schema");
  } catch {
    return Response.json({ profile: generateProfileCardFromIntake(intake), source: "fallback" });
  }
}
