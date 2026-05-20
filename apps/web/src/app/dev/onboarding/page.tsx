import { notFound } from "next/navigation";
import { OnboardingWizard } from "@/components/v2/onboarding/onboarding-wizard";

export default function DevOnboardingPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return <OnboardingWizard />;
}
