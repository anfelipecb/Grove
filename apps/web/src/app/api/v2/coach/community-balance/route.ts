import { NextResponse } from "next/server";
import { getServerUserId } from "@/lib/clerk-auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { groqText } from "@/lib/groq";
import {
  buildStaticCommunityBalance,
  communityBalanceCrisisBlob,
  loadCommunityBalanceContext,
  sanitizeGroqMicroTasks,
  type CommunityBalancePayload,
} from "@/lib/v2/community-balance-context";
import { containsCrisisSignal, LIFE_DOMAINS, type AiMessage } from "@grove/core";
import { z } from "zod";

const lifeDomainIds = LIFE_DOMAINS.map((d) => d.id) as [
  (typeof LIFE_DOMAINS)[number]["id"],
  ...(typeof LIFE_DOMAINS)[number]["id"][],
];

const lifeDomainSchema = z.enum(lifeDomainIds);

const balancePayloadSchema = z.object({
  headline: z.string(),
  balanceTips: z.array(z.string()).max(4),
  socialNudges: z.array(z.string()).max(4),
  suggestedMicroTasks: z
    .array(
      z.object({
        title: z.string(),
        domain: lifeDomainSchema,
        rationale: z.string(),
        is_community_task: z.boolean().optional(),
      }),
    )
    .max(3),
});

function parseJsonObject(raw: string): unknown {
  const t = raw.trim();
  const unfenced = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  return JSON.parse(unfenced);
}

export async function POST() {
  const userId = await getServerUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createServerSupabaseClient();
  if (!supabase) return NextResponse.json({ error: "Database not configured." }, { status: 503 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (!profile?.id) return NextResponse.json({ error: "Profile not found." }, { status: 404 });

  const ctx = await loadCommunityBalanceContext(supabase, profile.id as string);

  if (containsCrisisSignal(communityBalanceCrisisBlob(ctx))) {
    return NextResponse.json({
      hasCommunity: ctx.hasCommunity,
      headline: "Community pulse",
      balanceTips: [],
      socialNudges: [],
      suggestedMicroTasks: [],
    });
  }

  const fallback = buildStaticCommunityBalance(ctx);

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json(fallback);
  }

  const domainsHint = LIFE_DOMAINS.map((d) => d.id).join(", ");

  const contextJson = JSON.stringify({
    communityName: ctx.communityName,
    memberCount: ctx.memberCount,
    sharedGoalCount: ctx.sharedGoalCount,
    taskTitles: ctx.tasks.map((t) => ({
      title: t.title,
      domain: t.domain,
      frequency: t.frequency,
      is_community_task: t.is_community_task,
    })),
    upcomingSessions: ctx.upcomingSessions,
  });

  const system: AiMessage = {
    role: "system",
    content: [
      "You balance solo workload with community commitments for ADHD-aware Grove users.",
      "Return ONLY JSON with keys headline (short), balanceTips (array of short strings, max 4), socialNudges (max 4), suggestedMicroTasks (max 3 objects with title, domain, rationale, optional is_community_task boolean).",
      `domain must be one of: ${domainsHint}.`,
      "No diagnosis, clinical claims, therapy, or markdown.",
      "Keep strings concise for mobile UI.",
    ].join("\n"),
  };

  const userMsg: AiMessage = {
    role: "user",
    content: contextJson,
  };

  try {
    const raw = await groqText([system, userMsg], { temperature: 0.35 });
    if (!raw) return NextResponse.json(fallback);

    const parsed = balancePayloadSchema.safeParse(parseJsonObject(raw));
    if (!parsed.success) return NextResponse.json(fallback);

    const merged: CommunityBalancePayload = {
      hasCommunity: ctx.hasCommunity,
      headline: parsed.data.headline.trim() || fallback.headline,
      balanceTips:
        parsed.data.balanceTips.length > 0 ? parsed.data.balanceTips : fallback.balanceTips,
      socialNudges:
        parsed.data.socialNudges.length > 0 ? parsed.data.socialNudges : fallback.socialNudges,
      suggestedMicroTasks:
        parsed.data.suggestedMicroTasks.length > 0
          ? sanitizeGroqMicroTasks(parsed.data.suggestedMicroTasks)
          : fallback.suggestedMicroTasks,
    };

    return NextResponse.json(merged);
  } catch {
    return NextResponse.json(fallback);
  }
}
