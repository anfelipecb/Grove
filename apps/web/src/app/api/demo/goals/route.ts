import type { LifeDomainId } from "@grove/core";
import { getDemoProfileIdForApi } from "@/lib/demo-seed";
import { rejectUnlessTrustedDemoRoute } from "@/lib/demo-api-request";
import { createServiceSupabaseClient } from "@/lib/supabase-server";

type Body = {
  title?: string;
  domain?: string;
  subarea?: string | null;
  xp_value?: number;
};

export async function POST(request: Request) {
  const denied = rejectUnlessTrustedDemoRoute();
  if (denied) return denied;

  const profileId = await getDemoProfileIdForApi();
  if (!profileId) {
    return Response.json({ error: "Demo profile missing. Visit /demo/start first." }, { status: 400 });
  }

  const body = (await request.json()) as Body;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const domain = body.domain as LifeDomainId | undefined;
  const xp = typeof body.xp_value === "number" ? body.xp_value : 0;

  if (!title) {
    return Response.json({ error: "Title required" }, { status: 400 });
  }
  if (!domain) {
    return Response.json({ error: "Domain required" }, { status: 400 });
  }

  const supabase = createServiceSupabaseClient();
  if (!supabase) {
    return Response.json({ error: "Service role not configured" }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("goals")
    .insert({
      profile_id: profileId,
      title,
      domain,
      subarea: typeof body.subarea === "string" ? body.subarea : null,
      xp_value: xp,
      status: "active",
    })
    .select("id, title, domain, subarea, xp_value, status")
    .single();

  if (error || !data) {
    return Response.json({ error: error?.message ?? "Insert failed" }, { status: 500 });
  }

  return Response.json({ goal: data });
}
