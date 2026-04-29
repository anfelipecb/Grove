import { LandingExperience } from "@/components/landing-experience";
import { getServerUserId } from "@/lib/clerk-auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const userId = await getServerUserId();
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-fern/45 via-stone-50/95 to-white text-ink">
      <LandingExperience />
    </main>
  );
}
