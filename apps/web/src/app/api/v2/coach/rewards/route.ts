import { LIFE_DOMAINS, type LifeDomainId } from "@grove/core";
import { getServerUserId } from "@/lib/clerk-auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { z } from "zod";

const lifeDomainIds = LIFE_DOMAINS.map((d) => d.id) as [LifeDomainId, ...LifeDomainId[]];
const domainSchema = z.enum(lifeDomainIds);

const createBodySchema = z.object({
  title: z.string().min(1).max(160),
  domain: domainSchema,
  unlock_level: z.number().int().min(1).max(99),
  cost: z.number().int().min(1).max(50_000).optional(),
});

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getServerUserId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createServerSupabaseClient();
  if (!supabase) return Response.json({ error: "Supabase not configured." }, { status: 500 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("clerk_user_id", userId)
    .maybeSingle();
  if (!profile) return Response.json({ error: "Profile not found." }, { status: 404 });

  const { data: rows, error } = await supabase
    .from("rewards")
    .select("id, title, cost, domain, unlock_level, visibility")
    .eq("profile_id", profile.id as string)
    .eq("visibility", "private")
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ rewards: rows ?? [] });
}

export async function POST(req: Request) {
  const userId = await getServerUserId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createServerSupabaseClient();
  if (!supabase) return Response.json({ error: "Supabase not configured." }, { status: 500 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("clerk_user_id", userId)
    .maybeSingle();
  if (!profile) return Response.json({ error: "Profile not found." }, { status: 404 });

  let body: z.infer<typeof createBodySchema>;
  try {
    body = createBodySchema.parse(await req.json());
  } catch {
    return Response.json({ error: "Invalid body." }, { status: 400 });
  }

  const cost = body.cost ?? 10;

  const { data: row, error } = await supabase
    .from("rewards")
    .insert({
      profile_id: profile.id as string,
      title: body.title.trim(),
      cost,
      domain: body.domain,
      unlock_level: body.unlock_level,
      visibility: "private",
    })
    .select("id, title, domain, unlock_level, cost")
    .maybeSingle();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ reward: row });
}
