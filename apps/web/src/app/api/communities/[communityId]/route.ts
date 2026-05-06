import { getServerUserId } from "@/lib/clerk-auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";

type PatchBody = {
  name?: string;
  description?: string | null;
};

export async function PATCH(request: Request, context: { params: { communityId: string } }) {
  const userId = await getServerUserId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return Response.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const { communityId } = context.params;
  if (!communityId || !/^[0-9a-f-]{36}$/i.test(communityId)) {
    return Response.json({ error: "Invalid community id." }, { status: 400 });
  }

  const body = (await request.json()) as PatchBody;

  const updates: { name?: string; description?: string | null } = {};

  if (body.name !== undefined) {
    if (typeof body.name !== "string" || !body.name.trim()) {
      return Response.json({ error: "Name cannot be empty." }, { status: 400 });
    }
    updates.name = body.name.trim().slice(0, 200);
  }

  if (body.description !== undefined) {
    updates.description =
      typeof body.description === "string"
        ? body.description.trim() || null
        : body.description === null
          ? null
          : null;
  }

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "No updates provided." }, { status: 400 });
  }

  const { data, error } = await supabase.from("communities").update(updates).eq("id", communityId).select("id");

  if (error) {
    return Response.json({ error: error.message ?? "Update failed." }, { status: 500 });
  }

  if (!data?.length) {
    return Response.json(
      { error: "Community not found or you do not have permission to edit it." },
      { status: 403 },
    );
  }

  return Response.json({ ok: true });
}
