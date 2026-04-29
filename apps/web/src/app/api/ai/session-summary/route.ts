import {
  containsCrisisSignal,
  CRISIS_SUPPORT_MESSAGE,
  requestJsonCompletion,
  sessionSummarySchema,
  summarizeSessionNotesLocally,
} from "@grove/core";

type SessionSummaryRequest = {
  title: string;
  notes: string;
};

export async function POST(request: Request) {
  const payload = (await request.json()) as SessionSummaryRequest;

  if (containsCrisisSignal(payload.notes)) {
    return Response.json({ safety: true, message: CRISIS_SUPPORT_MESSAGE }, { status: 200 });
  }

  if (!process.env.GROQ_API_KEY) {
    return Response.json({ summary: summarizeSessionNotesLocally(payload), source: "local" });
  }

  const summary = await requestJsonCompletion<unknown>({
    apiKey: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are Mycelium, Grove's community coordination agent. Return JSON only with title, shortSummary, decisions, commitments, and newcomerContext. Extract commitments carefully.",
      },
      {
        role: "user",
        content: JSON.stringify(payload),
      },
    ],
  });

  return Response.json({ summary: sessionSummarySchema.parse(summary), source: "groq" });
}

