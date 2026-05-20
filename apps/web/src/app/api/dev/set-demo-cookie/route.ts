import { NextResponse } from "next/server";
import { DEMO_COOKIE_CLIENT_HINT, DEMO_COOKIE_TRUST, isLocalDemoEligible } from "@/lib/demo-mode";

export async function GET() {
  if (!isLocalDemoEligible()) {
    return NextResponse.json({ error: "Only available in local dev with demo mode enabled." }, { status: 404 });
  }

  const res = NextResponse.redirect(new URL("/today", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"));
  const opts = { path: "/", sameSite: "lax" as const, maxAge: 60 * 60 * 24 };
  res.cookies.set(DEMO_COOKIE_TRUST, "1", { ...opts, httpOnly: true });
  res.cookies.set(DEMO_COOKIE_CLIENT_HINT, "1", { ...opts, httpOnly: false });
  return res;
}
