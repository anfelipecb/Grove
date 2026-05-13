import { LandingExperience } from "@/components/landing-experience";
import { getServerUserId } from "@/lib/clerk-auth";
import { shouldShowDemoPublicEntry } from "@/lib/demo-mode";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const userId = await getServerUserId();
  if (userId) {
    redirect("/today");
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-fern/45 via-stone-50/95 to-white text-foreground dark:from-zinc-950 dark:via-neutral-950 dark:to-black">
      <LandingExperience showDemoLinks={shouldShowDemoPublicEntry()} />
    </main>
  );
}
