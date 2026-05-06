import {
  assertProfileOwnedByUser,
  coachCrisisScanParts,
  loadCoachDashboardContext,
  staticCoachGreeting,
} from "@/lib/coach-dashboard-context";
import { demoCoachGreeting } from "@/lib/demo-data";
import { getServerUserId, demoSessionActiveServer } from "@/lib/clerk-auth";
import { groqText } from "@/lib/groq";
import { createServerSupabaseClient, createServiceSupabaseClient } from "@/lib/supabase-server";
import {
  containsCrisisSignal,
  CRISIS_SUPPORT_MESSAGE,
  type AiMessage,
} from "@grove/core";
import { z } from "zod";

const bodySchema = z.object({
  profileId: z.string().uuid(),
  demoMode: z.boolean().optional(),
});

const greetingSchema = z.object({
  greeting: z.string(),
  insight: z.string().optional(),
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

  let parsedBody: z.infer<typeof bodySchema>;
  try {
    parsedBody = bodySchema.parse(await request.json());
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const { profileId, demoMode } = parsedBody;
  const useDemo = Boolean(demoMode) || demoSessionActiveServer();

  const supabase = (await createServerSupabaseClient()) ?? createServiceSupabaseClient();
  if (!supabase) {
    return Response.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const owned = await assertProfileOwnedByUser(supabase, profileId, userId);
  if (!owned) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  if (useDemo) {
    return Response.json({ ...demoCoachGreeting });
  }

  const ctx = await loadCoachDashboardContext(supabase, profileId);
  if (!ctx) {
    return Response.json({ greeting: "Welcome back.", insight: undefined });
  }

  if (coachCrisisScanParts(ctx).some((p) => containsCrisisSignal(p))) {
    return Response.json({ greeting: CRISIS_SUPPORT_MESSAGE });
  }

  const fallback = staticCoachGreeting(ctx);

  if (!process.env.GROQ_API_KEY) {
    return Response.json(fallback);
  }

  const contextJson = JSON.stringify({
    displayName: ctx.displayName,
    activeGoals: ctx.activeGoals,
    lastCompletedGoalTitle: ctx.lastCompletedGoalTitle,
    commitments: ctx.commitments,
    consistencySummary: ctx.consistencySummary,
    recentXp: ctx.xpEvents.slice(0, 8).map((e) => ({ at: e.created_at, reason: e.reason })),
  });

  const system: AiMessage = {
    role: "system",
    content: [
      "You are Grove's brief ADHD-aware coach (not a clinician).",
      "Output ONLY valid JSON: {\"greeting\":\"...\",\"insight\":\"...\"}.",
      "greeting: one short friendly sentence; consider time of day implicitly from server (do not mention UTC).",
      "insight: one short sentence about progress/consistency trend from the data, or \"\" if thin.",
      "No diagnosis, no clinical claims, no markdown.",
    ].join("\n"),
  };
  const userMsg: AiMessage = {
    role: "user",
    content: contextJson,
  };

  try {
    const raw = await groqText([system, userMsg], { temperature: 0.38 });
    if (!raw) {
      return Response.json(fallback);
    }
    const parsed = greetingSchema.safeParse(parseJsonObject(raw));
    if (!parsed.success) {
      return Response.json(fallback);
    }
    return Response.json({
      greeting: parsed.data.greeting.trim() || fallback.greeting,
      insight:
        parsed.data.insight && parsed.data.insight.trim().length > 0
          ? parsed.data.insight.trim()
          : fallback.insight,
    });
  } catch {
    return Response.json(fallback);
  }
}
