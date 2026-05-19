import { getServerUserId } from "@/lib/clerk-auth";
import { routedCompletion } from "@/lib/llm-router";
import {
  containsCrisisSignal,
  CRISIS_SUPPORT_MESSAGE,
  type AiMessage,
} from "@grove/core";
import { createServerSupabaseClient, createServiceSupabaseClient } from "@/lib/supabase-server";

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(request: Request) {
  const userId = await getServerUserId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { messages: ChatMessage[]; communityId?: string };
  const history = body.messages ?? [];
  const lastUser = [...history].reverse().find((m) => m.role === "user");
  if (!lastUser?.content?.trim()) {
    return Response.json({ error: "Missing message" }, { status: 400 });
  }

  if (containsCrisisSignal(lastUser.content)) {
    return Response.json({ safety: true, message: CRISIS_SUPPORT_MESSAGE }, { status: 200 });
  }

  const supabase = (await createServerSupabaseClient()) ?? createServiceSupabaseClient();
  if (!supabase) {
    return Response.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, private_focus_notes")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  const profileId = profile?.id as string | undefined;

  const goals =
    profileId != null
      ? (
          await supabase
            .from("goals")
            .select("title, status, domain")
            .eq("profile_id", profileId)
            .limit(10)
        ).data
      : [];

  let commitments: { title: string; status: string }[] = [];
  if (body.communityId) {
    const { data } = await supabase
      .from("commitments")
      .select("title, status")
      .eq("community_id", body.communityId)
      .limit(12);
    commitments = (data ?? []) as { title: string; status: string }[];
  }

  const systemContent = [
    "You are Mycelium, Grove's ADHD-aware coach and community coordinator.",
    "Reply in plain language, short paragraphs or bullets. No diagnosis. No clinical claims.",
    "Tie advice to commitments and goals when relevant. Encourage small next actions and community participation.",
    `Member name: ${profile?.display_name ?? "Member"}`,
    `Active goals: ${JSON.stringify(goals ?? [])}`,
    `Community commitments snapshot: ${JSON.stringify(commitments)}`,
  ].join("\n");

  if (!process.env.GROQ_API_KEY) {
    return Response.json({
      reply:
        "Mycelium needs GROQ_API_KEY on the server for live answers. Until then, pick one target from your dashboard, one commitment from the feed, and do the smallest visible step for 10 minutes.",
    });
  }

  const aiMessages: AiMessage[] = [
    { role: "system", content: systemContent },
    ...history.map((m) => ({ role: m.role, content: m.content })),
  ];

  try {
    const reply = await routedCompletion(aiMessages, "deep");
    if (!reply) {
      return Response.json({
        reply:
          "I couldn't produce a reply just now. Try rephrasing, or check your dashboard for the next concrete target.",
      });
    }
    return Response.json({ reply });
  } catch {
    return Response.json({ reply: "Something went wrong talking to the AI provider. Try again in a moment." });
  }
}
