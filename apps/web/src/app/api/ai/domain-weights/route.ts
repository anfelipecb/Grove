import {
  containsCrisisSignal,
  CRISIS_SUPPORT_MESSAGE,
  LIFE_DOMAINS,
  requestJsonCompletion,
  resolveGroqOnboardingModel,
  type LifeDomainId,
} from "@grove/core";
import { z } from "zod";

type DomainWeightsRequest = {
  goals: string;
  friction: string;
  supportStyle: string;
};

const weightsResponseSchema = z.record(z.coerce.number());

function equalWeights(): Record<LifeDomainId, number> {
  const n = LIFE_DOMAINS.length;
  const base = Math.floor(100 / n);
  const weights = {} as Record<LifeDomainId, number>;
  let rem = 100 - base * n;
  LIFE_DOMAINS.forEach((d, i) => {
    weights[d.id] = base + (i < rem ? 1 : 0);
  });
  return weights;
}

function normalizeWeights(raw: Record<string, number>): Record<LifeDomainId, number> {
  const out = {} as Record<LifeDomainId, number>;
  for (const d of LIFE_DOMAINS) {
    const v = raw[d.id];
    out[d.id] = typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.min(100, Math.round(v))) : 10;
  }
  const sum = LIFE_DOMAINS.reduce((s, d) => s + out[d.id], 0) || 1;
  for (const d of LIFE_DOMAINS) {
    out[d.id] = Math.max(1, Math.round((out[d.id] / sum) * 100));
  }
  const drift = 100 - LIFE_DOMAINS.reduce((s, d) => s + out[d.id], 0);
  if (drift !== 0) {
    out[LIFE_DOMAINS[0].id] += drift;
  }
  return out;
}

export async function POST(request: Request) {
  const payload = (await request.json()) as DomainWeightsRequest;
  const joined = `${payload.goals}\n${payload.friction}`;
  if (containsCrisisSignal(joined)) {
    return Response.json({ safety: true, message: CRISIS_SUPPORT_MESSAGE }, { status: 200 });
  }

  if (!process.env.GROQ_API_KEY) {
    return Response.json({ weights: equalWeights(), source: "local" });
  }

  const domainKeys = LIFE_DOMAINS.map((d) => d.id).join(", ");
  try {
    const completion = await requestJsonCompletion<unknown>({
      apiKey: process.env.GROQ_API_KEY,
      model: resolveGroqOnboardingModel(),
      messages: [
        {
          role: "system",
          content: `You are Mycelium. Return JSON only: an object with keys exactly: ${domainKeys}. Each value is an integer 1-100 representing how much of the member's next-month attention should go to that life domain (relative weights; they will be normalized). Do not diagnose.`,
        },
        {
          role: "user",
          content: JSON.stringify({
            goals: payload.goals,
            friction: payload.friction,
            supportStyle: payload.supportStyle,
          }),
        },
      ],
    });

    const parsed = weightsResponseSchema.safeParse(completion);
    if (!parsed.success) {
      return Response.json({ weights: equalWeights(), source: "fallback" });
    }

    return Response.json({ weights: normalizeWeights(parsed.data), source: "groq" });
  } catch {
    return Response.json({ weights: equalWeights(), source: "fallback" });
  }
}
