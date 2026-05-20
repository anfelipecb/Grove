import path from "node:path";
import { fileURLToPath } from "node:url";
import nextEnv from "@next/env";

const appDir = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(appDir, "../..");

// Monorepo: `.env.local` at repo root (pnpm dev from root). App-level files override.
if (!process.env.VERCEL) {
  const { loadEnvConfig } = nextEnv;
  loadEnvConfig(monorepoRoot);
  loadEnvConfig(appDir);
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@grove/core"],
};

export default nextConfig;
