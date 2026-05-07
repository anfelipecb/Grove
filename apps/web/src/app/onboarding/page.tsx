import Link from "next/link";
import { redirect } from "next/navigation";
import { OnboardingFlow } from "@/components/onboarding-flow";
import { demoSessionActiveServer, getServerUserId } from "@/lib/clerk-auth";
import { hasClerkPublishableKey } from "@/lib/clerk-publishable";
import { createDemoAwareServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams?: { mode?: string };
}) {
  const demo = demoSessionActiveServer();

  if (!demo && !hasClerkPublishableKey()) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center text-ink">
        <p className="text-sm text-foreground">Set Clerk publishable key to use onboarding.</p>
        <Link href="/" className="text-sm font-semibold text-moss hover:underline">
          Back to home
        </Link>
      </main>
    );
  }

  const userId = await getServerUserId();
  if (!userId) {
    redirect("/sign-in?redirect_url=/onboarding");
  }

  const { client: supabase } = await createDemoAwareServerClient();
  let onboardingStep: number | null = null;
  if (supabase) {
    const { data } = await supabase
      .from("profiles")
      .select("onboarding_step")
      .eq("clerk_user_id", userId)
      .maybeSingle();
    onboardingStep = (data?.onboarding_step as number | undefined) ?? null;
  }

  return (
    <OnboardingFlow
      demoMode={demo}
      assessmentMode={searchParams?.mode === "assess" || (onboardingStep ?? 0) >= 5}
    />
  );
}
