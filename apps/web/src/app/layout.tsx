import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { getClerkPublishableKeyEffective } from "@/lib/clerk-publishable";
import "./globals.css";

export const metadata: Metadata = {
  title: "Grove — grow together",
  description: "ADHD-aware accountability and community coordination.",
  applicationName: "Grove (grove-growth-together)",
};

const clerkPublishableKeyEffective = getClerkPublishableKeyEffective();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {clerkPublishableKeyEffective ? (
          <ClerkProvider publishableKey={clerkPublishableKeyEffective}>{children}</ClerkProvider>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
