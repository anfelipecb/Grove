import "dotenv/config";
import { requestJsonCompletion, sessionSummarySchema } from "@grove/core";

type WorkerJobResult = {
  job: string;
  status: "ready" | "skipped";
  detail: string;
};

async function runMyceliumReadinessCheck(): Promise<WorkerJobResult> {
  if (!process.env.GROQ_API_KEY) {
    return {
      job: "mycelium-readiness",
      status: "skipped",
      detail: "GROQ_API_KEY is not configured; worker is scaffolded and ready for Railway env vars.",
    };
  }

  const draft = await requestJsonCompletion<unknown>({
    apiKey: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are Mycelium, Grove's community coordination agent. Return only valid JSON matching the requested shape.",
      },
      {
        role: "user",
        content:
          'Summarize this session note as JSON with title, shortSummary, decisions, commitments, newcomerContext: "We agreed to scaffold Grove, protect docs and research, test the dashboard, and share the first repo commit with AgentsForGood."',
      },
    ],
  });

  sessionSummarySchema.parse(draft);

  return {
    job: "mycelium-readiness",
    status: "ready",
    detail: "AI provider returned a valid session summary shape.",
  };
}

runMyceliumReadinessCheck()
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });

