import { createClient } from "@supabase/supabase-js";

type GetToken = () => Promise<string | null>;

/**
 * Read onboarding_step for middleware. Prefers service role; falls back to Clerk session + Supabase JWT (RLS).
 */
export async function fetchProfileOnboardingStep(
  clerkUserId: string,
  getToken: GetToken,
): Promise<number | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url) return null;

  if (serviceKey) {
    const supabase = createClient(url, serviceKey);
    const { data } = await supabase
      .from("profiles")
      .select("onboarding_step")
      .eq("clerk_user_id", clerkUserId)
      .maybeSingle();
    if (!data) return null;
    return data.onboarding_step as number;
  }

  if (!publishableKey) return null;

  const supabase = createClient(url, publishableKey, {
    async accessToken() {
      return (await getToken()) ?? null;
    },
  });

  const { data, error } = await supabase
    .from("profiles")
    .select("onboarding_step")
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle();

  if (error || !data) return null;
  return data.onboarding_step as number;
}
