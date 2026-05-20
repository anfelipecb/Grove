import { currentUser } from "@clerk/nextjs/server";
import type { IntakeDraft, MemberProfileCard } from "@grove/core";
import type { LifeDomainId } from "@grove/core";
import { demoSessionActiveServer, getServerUserId } from "@/lib/clerk-auth";
import {
  ONBOARDING_SAVE_SETUP_HINT,
  isRlsPolicyError,
  runOnboardingSave,
} from "@/lib/onboarding-save";
import {
  createDemoAwareServerClient,
  createServerSupabaseClient,
  createServiceSupabaseClient,
} from "@/lib/supabase-server";

type SaveBody = {
  intake: IntakeDraft;
  profileCard: MemberProfileCard;
  xpDomainWeights: Record<LifeDomainId, number>;
  mode?: "initial" | "assessment";
};

export async function POST(request: Request) {
  const userId = await getServerUserId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as SaveBody;
  if (!body?.intake || !body?.profileCard || !body?.xpDomainWeights) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const isAssessment = body.mode === "assessment";

  const user = await currentUser();
  const displayName =
    body.intake.name?.trim() ||
    user?.firstName ||
    user?.username ||
    user?.primaryEmailAddress?.emailAddress?.split("@")[0] ||
    "Member";
  const email = user?.primaryEmailAddress?.emailAddress ?? null;

  const saveInput = {
    clerkUserId: userId,
    displayName,
    email,
    intake: body.intake,
    profileCard: body.profileCard,
    xpDomainWeights: body.xpDomainWeights,
    isAssessment,
  };

  let supabase = null as Awaited<ReturnType<typeof createServerSupabaseClient>>;
  let usedServiceRole = false;

  if (demoSessionActiveServer()) {
    const { client } = await createDemoAwareServerClient();
    supabase = client;
    usedServiceRole = true;
  } else {
    supabase = await createServerSupabaseClient();
  }

  if (!supabase) {
    const service = createServiceSupabaseClient();
    if (!service) {
      return Response.json(
        {
          error:
            "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or anon key) in .env.local.",
        },
        { status: 500 },
      );
    }
    supabase = service;
    usedServiceRole = true;
  }

  let result = await runOnboardingSave(supabase, saveInput);

  if (!result.ok && result.rlsBlocked && !usedServiceRole) {
    const service = createServiceSupabaseClient();
    if (service) {
      result = await runOnboardingSave(service, saveInput);
      usedServiceRole = true;
    }
  }

  if (!result.ok) {
    const message =
      result.rlsBlocked && !usedServiceRole ? ONBOARDING_SAVE_SETUP_HINT : result.error;
    return Response.json({ error: message }, { status: 500 });
  }

  return Response.json({ ok: true, profileId: result.profileId });
}
