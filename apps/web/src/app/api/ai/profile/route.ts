import {
  containsCrisisSignal,
  CRISIS_SUPPORT_MESSAGE,
  generateProfileCardFromIntake,
  memberProfileCardSchema,
  requestJsonCompletion,
  type IntakeDraft,
} from "@grove/core";

export async function POST(request: Request) {
  const intake = (await request.json()) as IntakeDraft;
  const joinedText = [intake.goals, intake.friction, intake.communityInterest, intake.focusDisclosure].join("\n");

  if (containsCrisisSignal(joinedText)) {
    return Response.json({ safety: true, message: CRISIS_SUPPORT_MESSAGE }, { status: 200 });
  }

  if (!process.env.GROQ_API_KEY) {
    return Response.json({ profile: generateProfileCardFromIntake(intake), source: "local" });
  }

  const profile = await requestJsonCompletion<unknown>({
    apiKey: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are Grove's ADHD-aware coach/coordinator. Return JSON only. Do not diagnose. Create a concise profile card that supports personal follow-through and community participation.",
      },
      {
        role: "user",
        content: JSON.stringify(intake),
      },
    ],
  });

  return Response.json({ profile: memberProfileCardSchema.parse(profile), source: "groq" });
}

