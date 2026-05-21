import { getServerUserId } from "@/lib/clerk-auth";
import { loadCoachDashboardContext } from "@/lib/coach-dashboard-context";
import {
  computeLoadCheck,
  fallbackProposeFromMessage,
  parseCoachActionsFromJson,
  shouldForceLoadCheck,
  type CoachAction,
} from "@/lib/coach-actions";
import { routedCompletion } from "@/lib/llm-router";
import { createServerSupabaseClient, createServiceSupabaseClient } from "@/lib/supabase-server";
import { containsCrisisSignal, CRISIS_SUPPORT_MESSAGE, type AiMessage } from "@grove/core";
import { z } from "zod";

const bodySchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
    .min(1)
    .max(30),
  profileId: z.string().uuid(),
  context: z
    .object({
      today: z.string(),
      activeGoals: z.array(z.object({ title: z.string(), domain: z.string() })).default([]),
      todayTasks: z.array(z.object({ title: z.string(), domain: z.string() })).default([]),
    })
    .optional(),
});

function parseJsonObject(raw: string): unknown {
  const t = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(t.slice(start, end + 1));
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const userId = await getServerUserId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const lastUser = [...body.messages].reverse().find((m) => m.role === "user");
  if (!lastUser?.content.trim()) {
    return Response.json({ error: "Missing message" }, { status: 400 });
  }

  if (containsCrisisSignal(lastUser.content)) {
    return Response.json({ safety: true, message: CRISIS_SUPPORT_MESSAGE, reply: CRISIS_SUPPORT_MESSAGE, actions: [] });
  }

  const supabase = (await createServerSupabaseClient()) ?? createServiceSupabaseClient();
  if (!supabase) return Response.json({ error: "Server misconfigured" }, { status: 500 });

  const { data: owned } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", body.profileId)
    .eq("clerk_user_id", userId)
    .maybeSingle();
  if (!owned) return Response.json({ error: "Forbidden" }, { status: 403 });

  const ctx = await loadCoachDashboardContext(supabase, body.profileId);
  const activeGoalCount = ctx?.activeGoals.length ?? body.context?.activeGoals.length ?? 0;
  const openTaskCount = body.context?.todayTasks.length ?? ctx?.briefing.todayTasks.filter((t) => !t.completed).length ?? 0;

  const actions: CoachAction[] = [];
  if (shouldForceLoadCheck(activeGoalCount, openTaskCount)) {
    actions.push(computeLoadCheck({ activeGoalCount, openTaskCount }));
  }

  const contextJson = JSON.stringify({
    displayName: ctx?.displayName,
    activeGoals: ctx?.activeGoals ?? body.context?.activeGoals,
    todayTasks: body.context?.todayTasks ?? ctx?.briefing.todayTasks,
    consistency: ctx?.consistencySummary,
  });

  const system: AiMessage = {
    role: "system",
    content: [
      "You are Mycelium, Grove's ADHD-aware coach (not a clinician).",
      'Output ONLY valid JSON: {"reply":"...","actions":[...]}.',
      "reply: max 3 short sentences. Warm, no questions unless essential.",
      "actions: optional array. Types:",
      '- propose_setup: {type, goals:[{title, domain, tasks:[{title, frequency, isRequired}]}]} — max 1 goal, 2-3 small tasks when user wants something new.',
      '- load_check: include when plate is full.',
      '- suggest_find_time: {type} when user needs scheduling.',
      "Use plain goal titles, not 'Define the next 25-minute action'.",
      "Domains: wellbeing, learning, work_build, relationships, community, life_admin, rest_play.",
    ].join("\n"),
  };

  const history = body.messages.slice(-8).map((m) => ({ role: m.role, content: m.content } as AiMessage));
  const userMsg: AiMessage = { role: "user", content: `Context:\n${contextJson}\n\nUser:\n${lastUser.content}` };

  let reply = "I'm here with you. Tell me one thing you want to move forward today.";
  let parsedActions: CoachAction[] = [];

  if (process.env.GROQ_API_KEY) {
    try {
      const raw = await routedCompletion([system, ...history.slice(0, -1), userMsg], "fast", {
        temperature: 0.35,
        max_tokens: 900,
      });
      if (raw) {
        const parsed = parseJsonObject(raw) as { reply?: string; actions?: unknown } | null;
        if (parsed?.reply?.trim()) reply = parsed.reply.trim().slice(0, 600);
        parsedActions = parseCoachActionsFromJson(parsed);
      }
    } catch {
      // fall through
    }
  }

  if (parsedActions.length === 0) {
    const fallback = fallbackProposeFromMessage(lastUser.content);
    if (fallback) parsedActions = [fallback];
  }

  const merged = [...actions];
  for (const a of parsedActions) {
    if (!merged.some((m) => m.type === a.type)) merged.push(a);
  }

  return Response.json({ reply, actions: merged.slice(0, 3) });
}
