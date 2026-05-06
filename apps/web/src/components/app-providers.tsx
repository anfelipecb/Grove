"use client";

import { ThemeProvider } from "next-themes";
import { AppLayerProvider } from "@/components/app-layer-context";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="grove-theme">
      <AppLayerProvider>{children}</AppLayerProvider>
    </ThemeProvider>
  );
}
