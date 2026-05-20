import {
  assertProfileOwnedByUser,
  coachCrisisScanParts,
  loadCoachDashboardContext,
  staticCoachBriefing,
} from "@/lib/coach-dashboard-context";
import { sanitizeAiBriefing } from "@/lib/coach-briefing-copy";
import { COACH_QUICK_ACTIONS } from "@/lib/coach-quick-actions";
import { demoCoachGreeting } from "@/lib/demo-data";
import { getServerUserId, demoSessionActiveServer } from "@/lib/clerk-auth";
import { compressPromptBodyForTier, routedCompletion } from "@/lib/llm-router";
import { createServerSupabaseClient, createServiceSupabaseClient } from "@/lib/supabase-server";
import { containsCrisisSignal, CRISIS_SUPPORT_MESSAGE, type AiMessage } from "@grove/core";
import { z } from "zod";

const bodySchema = z.object({
  profileId: z.string().uuid(),
  demoMode: z.boolean().optional(),
  debriefPlannedCount: z.number().int().min(0).optional(),
});

const briefingSchema = z.object({
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

  const { profileId, demoMode, debriefPlannedCount = 0 } = parsedBody;
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
    return Response.json({
      greeting: demoCoachGreeting.greeting,
      insight: demoCoachGreeting.insight,
      snapshot: {
        activeGoals: [],
        todayTasks: [],
        yesterdayPlanned: 0,
        yesterdayCompleted: 0,
        todayScheduled: 0,
        streakDays: 0,
      },
      quickActions: COACH_QUICK_ACTIONS,
    });
  }

  const ctx = await loadCoachDashboardContext(supabase, profileId);
  if (!ctx) {
    return Response.json({
      greeting: "Welcome back.",
      insight: "",
      snapshot: {},
      quickActions: COACH_QUICK_ACTIONS,
    });
  }

  if (coachCrisisScanParts(ctx).some((p) => containsCrisisSignal(p))) {
    return Response.json({
      greeting: CRISIS_SUPPORT_MESSAGE,
      insight: "",
      snapshot: ctx.briefing,
      quickActions: COACH_QUICK_ACTIONS,
    });
  }

  const fallback = staticCoachBriefing(ctx, debriefPlannedCount);

  if (!process.env.GROQ_API_KEY) {
    return Response.json({
      greeting: fallback.greeting,
      insight: fallback.insight,
      snapshot: ctx.briefing,
      quickActions: COACH_QUICK_ACTIONS,
    });
  }

  const contextJson = JSON.stringify(
    compressPromptBodyForTier(
      {
        displayName: ctx.displayName,
        activeGoals: ctx.activeGoals,
        briefing: ctx.briefing,
        consistencySummary: ctx.consistencySummary,
        debriefPlannedCount,
      },
      "fast",
    ),
  );

  const system: AiMessage = {
    role: "system",
    content: [
      "You are Grove's brief ADHD-aware coach (not a clinician).",
      'Output ONLY valid JSON: {"greeting":"...","insight":"..."}.',
      "greeting: max 12 words. Warm briefing only — name the member once, mention at most one goal in plain language.",
      "Never ask a question. Never use: smallest next step, 25-minute, define the next action, focus on (as a command).",
      "insight: max 20 words. Celebrate yesterday completions, streak, or today's progress; encouraging tone only.",
      "No diagnosis, no clinical claims, no markdown.",
    ].join("\n"),
  };
  const userMsg: AiMessage = { role: "user", content: contextJson };

  try {
    const raw = await routedCompletion([system, userMsg], "fast", {
      temperature: 0.38,
      cacheKey: `briefing:${userId}`,
      cacheTtlSeconds: 600,
    });
    if (!raw) {
      return Response.json({
        greeting: fallback.greeting,
        insight: fallback.insight,
        snapshot: ctx.briefing,
        quickActions: COACH_QUICK_ACTIONS,
      });
    }
    const parsed = briefingSchema.safeParse(parseJsonObject(raw));
    if (!parsed.success) {
      return Response.json({
        greeting: fallback.greeting,
        insight: fallback.insight,
        snapshot: ctx.briefing,
        quickActions: COACH_QUICK_ACTIONS,
      });
    }
    const cleaned = sanitizeAiBriefing(
      parsed.data.greeting.trim() || fallback.greeting,
      parsed.data.insight?.trim() ?? "",
      fallback,
    );
    return Response.json({
      greeting: cleaned.greeting,
      insight: cleaned.insight || fallback.insight,
      snapshot: ctx.briefing,
      quickActions: COACH_QUICK_ACTIONS,
    });
  } catch {
    return Response.json({
      greeting: fallback.greeting,
      insight: fallback.insight,
      snapshot: ctx.briefing,
      quickActions: COACH_QUICK_ACTIONS,
    });
  }
}
