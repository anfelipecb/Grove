import { LandingExperience } from "@/components/landing-experience";
import { getServerUserId } from "@/lib/clerk-auth";
import { shouldShowDemoPublicEntry } from "@/lib/demo-mode";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ demo_error?: string }>;
}) {
  const params = await searchParams;
  const userId = await getServerUserId();
  if (userId) {
    redirect("/today");
  }

  const demoError = typeof params.demo_error === "string" ? decodeURIComponent(params.demo_error) : null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-fern/45 via-stone-50/95 to-white text-foreground dark:from-zinc-950 dark:via-neutral-950 dark:to-black">
      <LandingExperience showDemoLinks={shouldShowDemoPublicEntry()} demoError={demoError} />
    </main>
  );
}
