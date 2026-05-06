import { cookies } from "next/headers";
import { DEMO_COOKIE_TRUST, isLocalDemoEligible } from "@/lib/demo-mode";

/** Returns Response 404 when demo API must not proceed. */
export function rejectUnlessTrustedDemoRoute(): Response | null {
  if (!isLocalDemoEligible() || cookies().get(DEMO_COOKIE_TRUST)?.value !== "1") {
    return new Response(null, { status: 404 });
  }
  return null;
}
