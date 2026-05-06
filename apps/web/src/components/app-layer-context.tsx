"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export type AppLayer = "personal" | "community";

const STORAGE_KEY = "grove-app-layer";

export function layerFromPathname(pathname: string): AppLayer | null {
  if (pathname === "/communities" || pathname.startsWith("/communities/")) return "community";
  if (pathname === "/mycelium" || pathname.startsWith("/mycelium/")) return "community";
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) return "personal";
  if (pathname === "/onboarding" || pathname.startsWith("/onboarding/")) return "personal";
  return null;
}

type AppLayerContextValue = {
  layer: AppLayer;
  goPersonal: () => void;
  goCommunity: () => void;
};

const AppLayerContext = createContext<AppLayerContextValue | null>(null);

export function AppLayerProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [layer, setLayer] = useState<AppLayer>("personal");

  useEffect(() => {
    const inferred = layerFromPathname(pathname);
    if (inferred) {
      setLayer(inferred);
      return;
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "personal" || stored === "community") {
        setLayer(stored);
      }
    } catch {
      /* ignore */
    }
  }, [pathname]);

  useEffect(() => {
    document.documentElement.dataset.appLayer = layer;
    try {
      localStorage.setItem(STORAGE_KEY, layer);
    } catch {
      /* ignore */
    }
  }, [layer]);

  const goPersonal = useCallback(() => {
    router.push("/dashboard");
  }, [router]);

  const goCommunity = useCallback(() => {
    router.push("/communities");
  }, [router]);

  return (
    <AppLayerContext.Provider value={{ layer, goPersonal, goCommunity }}>{children}</AppLayerContext.Provider>
  );
}

export function useAppLayer(): AppLayerContextValue {
  const ctx = useContext(AppLayerContext);
  if (!ctx) {
    throw new Error("useAppLayer must be used within AppLayerProvider");
  }
  return ctx;
}
