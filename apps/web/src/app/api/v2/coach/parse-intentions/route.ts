import {
  containsCrisisSignal,
  CRISIS_SUPPORT_MESSAGE,
  LIFE_DOMAINS,
  requestJsonCompletion,
  type AiMessage,
  type LifeDomainId,
} from "@grove/core";
import { getServerUserId } from "@/lib/clerk-auth";
import { z } from "zod";

const INTENTION_PARSE_MODEL = "llama-3.1-8b-instant";

const lifeDomainIds = LIFE_DOMAINS.map((domain) => domain.id) as [LifeDomainId, ...LifeDomainId[]];
const domainSchema = z.enum(lifeDomainIds);

const intentionSchema = z.object({
  domain: domainSchema,
  rationale: z.string().min(1).max(220),
  sampleGoal: z.string().min(1).max(120),
});

const bodySchema = z.object({
  demoMode: z.boolean().optional(),
  prompt: z.string().min(1).max(400),
});

const responseSchema = z.object({
  intentions: z.array(intentionSchema).min(1).max(4),
});

const DOMAIN_KEYWORDS: Record<LifeDomainId, string[]> = {
  wellbeing: ["sleep", "energy", "exercise", "workout", "health", "medication", "eat", "eating", "routine", "mood"],
  learning: ["study", "learning", "course", "read", "reading", "class", "research", "practice", "skill"],
  work_build: ["work", "project", "build", "ship", "career", "job", "portfolio", "client", "business", "code"],
  relationships: ["family", "friend", "partner", "relationship", "mentor", "parent", "dating", "call", "text"],
  community: ["community", "group", "session", "organize", "organise", "volunteer", "member", "peer", "meetup"],
  life_admin: ["email", "inbox", "budget", "bill", "calendar", "appointment", "paperwork", "tax", "admin", "forms"],
  rest_play: ["rest", "fun", "play", "hobby", "game", "break", "relax", "recovery", "creative", "weekend"],
};

function domainLabel(domainId: LifeDomainId): string {
  return LIFE_DOMAINS.find((domain) => domain.id === domainId)?.label ?? "Selected domain";
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function compactSnippet(value: string, maxLength = 72): string {
  const normalized = normalizeWhitespace(value).replace(/^[-*]\s*/, "").replace(/[.?!]+$/g, "");
  if (!normalized) {
    return "this area";
  }

  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 3).trimEnd()}...` : normalized;
}

function stripLeadingFraming(value: string): string {
  return normalizeWhitespace(
    value
      .replace(/^i\s+(want|need|would like|am trying|keep trying)\s+to\s+/i, "")
      .replace(/^i\s+(want|need|would like|am trying|keep trying)\s+/i, "")
      .replace(/^help me\s+/i, "")
      .replace(/^try to\s+/i, ""),
  );
}

function extractIntentSnippets(prompt: string): string[] {
  const raw = prompt
    .split(/\n+|[;]+/g)
    .map((part) => part.trim())
    .filter(Boolean);

  const withCommas =
    raw.length >= 2
      ? raw
      : prompt
          .split(/,/g)
          .map((part) => part.trim())
          .filter(Boolean);

  const expanded =
    withCommas.length >= 2
      ? withCommas
      : prompt
          .split(/\b(?:and|plus|also)\b/gi)
          .map((part) => part.trim())
          .filter((part) => part.length > 8);

  const snippets = (expanded.length > 0 ? expanded : [prompt]).map((part) => compactSnippet(part, 90));
  return Array.from(new Set(snippets)).slice(0, 4);
}

function scoreDomain(snippet: string, domainId: LifeDomainId): number {
  const haystack = snippet.toLowerCase();
  const keywords = DOMAIN_KEYWORDS[domainId];

  return keywords.reduce((score, keyword) => (haystack.includes(keyword) ? score + 2 : score), 0);
}

function inferDomain(snippet: string, index: number): LifeDomainId {
  let bestDomain: LifeDomainId = "work_build";
  let bestScore = -1;

  for (const domain of LIFE_DOMAINS) {
    const score = scoreDomain(snippet, domain.id);
    if (score > bestScore) {
      bestDomain = domain.id;
      bestScore = score;
    }
  }

  if (bestScore > 0) {
    return bestDomain;
  }

  const fallbackOrder: LifeDomainId[] = ["work_build", "wellbeing", "life_admin", "learning", "relationships"];
  return fallbackOrder[index % fallbackOrder.length];
}

function buildSampleGoal(domainId: LifeDomainId, snippet: string): string {
  const focus = stripLeadingFraming(compactSnippet(snippet, 64)).toLowerCase();

  switch (domainId) {
    case "wellbeing":
      return `Build a steadier routine around ${focus}`;
    case "learning":
      return `Create a repeatable learning block for ${focus}`;
    case "work_build":
      return `Make visible progress on ${focus} each week`;
    case "relationships":
      return `Follow through consistently on ${focus}`;
    case "community":
      return `Show up more consistently around ${focus}`;
    case "life_admin":
      return `Reduce friction around ${focus}`;
    case "rest_play":
      return `Protect real recovery time for ${focus}`;
  }
}

function fallbackIntentions(prompt: string): z.infer<typeof intentionSchema>[] {
  const snippets = extractIntentSnippets(prompt);

  return snippets.map((snippet, index) => {
    const domain = inferDomain(snippet, index);

    return {
      domain,
      rationale: `You mentioned "${compactSnippet(snippet)}" which points to ${domainLabel(domain)}.`,
      sampleGoal: buildSampleGoal(domain, snippet),
    };
  });
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
    return Response.json({ safety: true, message: CRISIS_SUPPORT_MESSAGE, intentions: [] });
  }

  const fallback = fallbackIntentions(body.prompt);

  if (!process.env.GROQ_API_KEY || body.demoMode) {
    return Response.json({ intentions: fallback });
  }

  const system: AiMessage = {
    role: "system",
    content: [
      "You are Grove's ADHD-aware onboarding coach.",
      "Return ONLY valid JSON.",
      'Schema: {"intentions":[{"domain":"wellbeing|learning|work_build|relationships|community|life_admin|rest_play","rationale":"...","sampleGoal":"..."}]}',
      "Map the user's wording into 1 to 4 starter goals.",
      "Each rationale must explicitly ground itself in the user's text by quoting or closely paraphrasing a phrase they used.",
      'Good rationale pattern: You mentioned "getting better sleep" which points to Wellbeing.',
      "sampleGoal should be a concise, concrete starter goal, not a task list.",
      "Keep rationale and sampleGoal short, non-clinical, and without markdown.",
    ].join("\n"),
  };
  const userMessage: AiMessage = {
    role: "user",
    content: JSON.stringify({
      prompt: body.prompt,
      allowedDomains: LIFE_DOMAINS.map((domain) => ({
        id: domain.id,
        label: domain.label,
        examples: domain.examples,
      })),
    }),
  };

  try {
    const parsed = responseSchema.safeParse(
      await requestJsonCompletion({
        apiKey: process.env.GROQ_API_KEY,
        messages: [system, userMessage],
        model: INTENTION_PARSE_MODEL,
        temperature: 0.3,
      }),
    );

    if (!parsed.success) {
      return Response.json({ intentions: fallback });
    }

    return Response.json({ intentions: parsed.data.intentions });
  } catch {
    return Response.json({ intentions: fallback });
  }
}
