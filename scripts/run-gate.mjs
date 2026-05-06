import { spawnSync } from "node:child_process";

const gate = process.argv[2];

const commandSets = {
  precommit: [
    ["pnpm", ["test"]],
    ["pnpm", ["typecheck"]]
  ],
  ci: [
    ["pnpm", ["test"]],
    ["pnpm", ["typecheck"]],
    ["pnpm", ["build"]]
  ]
};

if (!commandSets[gate]) {
  console.error("Usage: node scripts/run-gate.mjs <precommit|ci>");
  process.exit(1);
}

for (const [command, args] of commandSets[gate]) {
  const executable = process.platform === "win32" ? `${command}.cmd` : command;
  const result = spawnSync(executable, args, {
    stdio: "inherit"
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
