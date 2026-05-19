import {
  assertProfileOwnedByUser,
  coachCrisisScanParts,
  loadCoachDashboardContext,
  staticCoachSuggestions,
} from "@/lib/coach-dashboard-context";
import { demoCoachSuggestions } from "@/lib/demo-data";
import { getServerUserId, demoSessionActiveServer } from "@/lib/clerk-auth";
import { routedCompletion } from "@/lib/llm-router";
import { createServerSupabaseClient, createServiceSupabaseClient } from "@/lib/supabase-server";
import { fetchCalendarEvents, getValidToken, busyBlocksFromEvents } from "@/lib/google-calendar";
import { computeFreeWindows, type ScheduleProfileInput, type CalendarEventInput } from "@/lib/free-windows";
import { containsCrisisSignal, LIFE_DOMAINS, type AiMessage } from "@grove/core";
import { z } from "zod";

const bodySchema = z.object({
  profileId: z.string().uuid(),
  demoMode: z.boolean().optional(),
});

const lifeDomainIds = LIFE_DOMAINS.map((d) => d.id) as [
  (typeof LIFE_DOMAINS)[number]["id"],
  ...(typeof LIFE_DOMAINS)[number]["id"][],
];

const lifeDomainSchema = z.enum(lifeDomainIds);

const suggestionItemSchema = z.object({
  title: z.string(),
  domain: lifeDomainSchema,
  rationale: z.string(),
});

const suggestionsWrapperSchema = z.object({
  suggestions: z.array(suggestionItemSchema).min(1).max(3),
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
    return Response.json({ suggestions: demoCoachSuggestions });
  }

  const ctx = await loadCoachDashboardContext(supabase, profileId);
  if (!ctx) {
    return Response.json({ suggestions: [] });
  }

  if (coachCrisisScanParts(ctx).some((p) => containsCrisisSignal(p))) {
    return Response.json({ suggestions: [] });
  }

  const fallback = staticCoachSuggestions(ctx);

  if (!process.env.GROQ_API_KEY) {
    return Response.json({ suggestions: fallback });
  }

  // Compute free windows so the coach knows real availability
  let availabilityContext = "";
  try {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("schedule_profile, google_calendar_token")
      .eq("id", profileId)
      .maybeSingle();

    if (profileData) {
      const today = new Date().toISOString().slice(0, 10);
      const weekDates = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today + "T00:00:00");
        d.setDate(d.getDate() + i);
        return d.toISOString().slice(0, 10);
      });

      let calEvents: CalendarEventInput[] = [];
      if (profileData.google_calendar_token) {
        type T = { access_token: string; refresh_token?: string; expires_at: number; scope: string };
        const token = profileData.google_calendar_token as T;
        const events = await fetchCalendarEvents(
          await getValidToken(token),
          new Date(today + "T00:00:00").toISOString(),
          new Date(weekDates[6] + "T23:59:59").toISOString(),
        );
        calEvents = busyBlocksFromEvents(events);
      }

      const windows = computeFreeWindows(
        weekDates,
        (profileData.schedule_profile ?? {}) as ScheduleProfileInput,
        calEvents,
      );
      const totalFreeHours = Math.round(windows.reduce((s, w) => s + w.minutes, 0) / 60);
      const todayFree = windows.filter((w) => w.date === today);
      const todayFreeMin = todayFree.reduce((s, w) => s + w.minutes, 0);
      const todayWindows = todayFree.map((w) => `${w.start}–${w.end}`).join(", ") || "none";

      availabilityContext = `\nUSER AVAILABILITY: ${totalFreeHours}h free this week. Today: ${todayFreeMin}min free (${todayWindows}). Suggest tasks that fit within available time — prefer short focused tasks when today is tight.`;
    }
  } catch { /* non-fatal — availability context is optional */ }

  const contextJson = JSON.stringify({
    displayName: ctx.displayName,
    activeGoals: ctx.activeGoals,
    lastCompletedGoalTitle: ctx.lastCompletedGoalTitle,
    commitments: ctx.commitments,
    consistencySummary: ctx.consistencySummary,
    recentXp: ctx.xpEvents.slice(0, 8).map((e) => ({ at: e.created_at, reason: e.reason })),
  });

  const domainsHint = LIFE_DOMAINS.map((d) => d.id).join(", ");

  const system: AiMessage = {
    role: "system",
    content: [
      "You suggest concrete next tasks for Grove members (ADHD-aware productivity app).",
      "Output ONLY valid JSON: {\"suggestions\":[{\"title\":\"...\",\"domain\":\"...\",\"rationale\":\"...\"}]}",
      `domain must be one of: ${domainsHint}.`,
      "1 to 3 suggestions; titles are actionable; rationale is one short line (why it helps).",
      "No diagnosis, no clinical claims, no markdown.",
      availabilityContext,
    ].filter(Boolean).join("\n"),
  };
  const userMsg: AiMessage = {
    role: "user",
    content: contextJson,
  };

  try {
    const raw = await routedCompletion([system, userMsg], "balanced", { temperature: 0.38 });
    if (!raw) {
      return Response.json({ suggestions: fallback });
    }
    const parsed = suggestionsWrapperSchema.safeParse(parseJsonObject(raw));
    if (!parsed.success) {
      return Response.json({ suggestions: fallback.length ? fallback : [] });
    }
    return Response.json({ suggestions: parsed.data.suggestions });
  } catch {
    return Response.json({ suggestions: fallback.length ? fallback : [] });
  }
}
