import {
  containsCrisisSignal,
  CRISIS_SUPPORT_MESSAGE,
  LIFE_DOMAINS,
  requestJsonCompletion,
  resolveGroqOnboardingModel,
  type AiMessage,
  type LifeDomainId,
} from "@grove/core";
import { getServerUserId } from "@/lib/clerk-auth";
import { normalizeGoalTitle } from "@/lib/normalize-goal-title";
import { z } from "zod";

const lifeDomainIds = LIFE_DOMAINS.map((domain) => domain.id) as [LifeDomainId, ...LifeDomainId[]];
const frequencySchema = z.enum(["daily", "weekly", "once"]);
const domainSchema = z.enum(lifeDomainIds);

const taskSchema = z.object({
  title: z.string().min(1).max(140),
  frequency: frequencySchema,
  isRequired: z.boolean(),
  pointValue: z.number().int().min(1).max(200),
});

const goalSuggestionSchema = z.object({
  title: z.string().min(1).max(120),
  domain: domainSchema,
  rationale: z.string().min(1).max(220),
  tasks: z.array(taskSchema).min(2).max(4),
});

const bodySchema = z.object({
  demoMode: z.boolean().optional(),
  domain: domainSchema,
  prompt: z.string().min(1).max(500),
});

const responseSchema = z.object({
  suggestions: z.array(goalSuggestionSchema).min(2).max(3),
});

function domainLabel(domainId: LifeDomainId): string {
  return LIFE_DOMAINS.find((domain) => domain.id === domainId)?.label ?? "Selected domain";
}

function focusFragment(input: string): string {
  const compact = input
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.?!]+$/g, "");

  if (!compact) {
    return "your focus area";
  }

  return compact.length > 72 ? `${compact.slice(0, 69).trimEnd()}...` : compact;
}

function suggestPointValue(frequency: z.infer<typeof frequencySchema>, isRequired: boolean): number {
  if (frequency === "weekly") {
    return isRequired ? 22 : 18;
  }

  if (frequency === "once") {
    return isRequired ? 18 : 14;
  }

  return isRequired ? 12 : 10;
}

function staticSuggestions(domainId: LifeDomainId, prompt: string) {
  const domain = domainLabel(domainId).toLowerCase();
  const focus = focusFragment(prompt);

  return [
    {
      title: `Make ${focus} easier to start`,
      domain: domainId,
      rationale: `Lower startup friction in ${domain} with one repeatable anchor.`,
      tasks: [
        {
          title: `Do one 10-minute ${domain} reset before your main task`,
          frequency: "daily" as const,
          isRequired: true,
          pointValue: suggestPointValue("daily", true),
        },
        {
          title: `Review what made ${focus} easier this week`,
          frequency: "weekly" as const,
          isRequired: false,
          pointValue: suggestPointValue("weekly", false),
        },
      ],
    },
    {
      title: `Build a steady ${domain} rhythm`,
      domain: domainId,
      rationale: `Use a small daily action plus one review loop so progress stays visible.`,
      tasks: [
        {
          title: `Complete one small ${domain} action that feels finishable today`,
          frequency: "daily" as const,
          isRequired: true,
          pointValue: suggestPointValue("daily", true),
        },
        {
          title: `Capture one note about what is helping or blocking ${focus}`,
          frequency: "weekly" as const,
          isRequired: false,
          pointValue: suggestPointValue("weekly", false),
        },
      ],
    },
    {
      title: `Create one visible win around ${focus}`,
      domain: domainId,
      rationale: `Pick a goal that produces a concrete outcome instead of vague pressure.`,
      tasks: [
        {
          title: `Block one focused session that moves ${focus} forward`,
          frequency: "weekly" as const,
          isRequired: false,
          pointValue: suggestPointValue("weekly", false),
        },
        {
          title: `Finish one next action you can point to at the end of the day`,
          frequency: "daily" as const,
          isRequired: false,
          pointValue: suggestPointValue("daily", false),
        },
      ],
    },
  ];
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

  if (containsCrisisSignal(body.prompt)) {
    return Response.json({ safety: true, message: CRISIS_SUPPORT_MESSAGE, suggestions: [] });
  }

  const fallback = staticSuggestions(body.domain, body.prompt);

  if (!process.env.GROQ_API_KEY || body.demoMode) {
    return Response.json({ suggestions: fallback });
  }

  const system: AiMessage = {
    role: "system",
    content: [
      "You are Grove's ADHD-aware onboarding coach.",
      "Return ONLY valid JSON.",
      "Schema: {\"suggestions\":[{\"title\":\"...\",\"domain\":\"...\",\"rationale\":\"...\",\"tasks\":[{\"title\":\"...\",\"frequency\":\"daily|weekly|once\",\"isRequired\":true|false,\"pointValue\":number}]}]}",
      `domain must always be ${body.domain}.`,
      "Return 2 or 3 goal suggestions.",
      "Each suggestion needs 2 to 4 tasks.",
      "At least one task per goal should be required when that helps consistency; required tasks should stay small and repeatable.",
      "Keep titles concrete, short, and non-clinical. No markdown.",
      "Each title must be a 3–7 word human goal statement from the user's perspective (e.g. 'Show up in community', 'Build a reading habit').",
      "Never output task-instruction format such as 'Define the next X-minute action for:' or 'Do Y every day'.",
    ].join("\n"),
  };
  const userMessage: AiMessage = {
    role: "user",
    content: JSON.stringify({
      domain: body.domain,
      domainLabel: domainLabel(body.domain),
      prompt: body.prompt,
      examples: LIFE_DOMAINS.find((domain) => domain.id === body.domain)?.examples ?? [],
    }),
  };

  try {
    const parsed = responseSchema.safeParse(
      await requestJsonCompletion({
        apiKey: process.env.GROQ_API_KEY,
        messages: [system, userMessage],
        model: resolveGroqOnboardingModel(),
        temperature: 0.4,
      }),
    );

    if (!parsed.success) {
      return Response.json({ suggestions: fallback });
    }

    const suggestions = parsed.data.suggestions.map((s) => ({
      ...s,
      title: normalizeGoalTitle(s.title),
    }));
    return Response.json({ suggestions });
  } catch {
    return Response.json({ suggestions: fallback });
  }
}
