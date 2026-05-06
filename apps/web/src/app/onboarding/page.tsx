import Link from "next/link";
import { OnboardingFlow } from "@/components/onboarding-flow";
import { hasClerkPublishableKey } from "@/lib/clerk-auth";

export default function OnboardingPage({
  searchParams,
}: {
  searchParams?: { mode?: string };
}) {
  if (!hasClerkPublishableKey()) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center text-ink">
        <p className="text-sm text-stone-700">Set Clerk publishable key to use onboarding.</p>
        <Link href="/" className="text-sm font-semibold text-moss hover:underline">
          Back to home
        </Link>
      </main>
    );
  }
  return <OnboardingFlow assessmentMode={searchParams?.mode === "assess"} />;
}
