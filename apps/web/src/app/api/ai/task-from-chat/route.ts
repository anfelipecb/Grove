import { getServerUserId } from "@/lib/clerk-auth";
import { routedCompletion } from "@/lib/llm-router";
import { LIFE_DOMAINS, type AiMessage } from "@grove/core";
import { z } from "zod";

const lifeDomainIds = LIFE_DOMAINS.map((d) => d.id) as [
  (typeof LIFE_DOMAINS)[number]["id"],
  ...(typeof LIFE_DOMAINS)[number]["id"][],
];

const bodySchema = z.object({
  message: z.string().min(1).max(600),
});

const taskSchema = z.object({
  title: z.string().min(1).max(120),
  domain: z.enum(lifeDomainIds),
  duration_minutes: z.number().int().min(5).max(480),
  suggested_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
});

function parseJsonObject(raw: string): unknown {
  const t = raw.trim();
  const unfenced = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  return JSON.parse(unfenced);
}

export async function POST(request: Request) {
  const userId = await getServerUserId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!process.env.GROQ_API_KEY) {
    return Response.json({ error: "AI unavailable" }, { status: 503 });
  }

  const domainList = LIFE_DOMAINS.map((d) => `${d.id} (${d.label})`).join(", ");
  const systemContent = [
    "You parse a single natural-language task request into strict JSON only.",
    "Return exactly: { \"title\": string, \"domain\": string, \"duration_minutes\": number, \"suggested_time\": \"HH:MM\" }",
    `Valid domain ids: ${domainList}`,
    "duration_minutes: integer 5-480. suggested_time: 24h HH:MM in the user's local day.",
    "title: short actionable phrase, no quotes inside.",
  ].join("\n");

  const aiMessages: AiMessage[] = [
    { role: "system", content: systemContent },
    { role: "user", content: body.message.trim() },
  ];

  try {
    const raw = await routedCompletion(aiMessages, "balanced", { temperature: 0.2 });
    const parsed = taskSchema.parse(parseJsonObject(raw));
    return Response.json(parsed);
  } catch {
    return Response.json({ error: "Could not parse task" }, { status: 422 });
  }
}
