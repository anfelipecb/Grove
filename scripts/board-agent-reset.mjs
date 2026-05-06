import { resetAgent } from "./board-lib.mjs";

const [agentId] = process.argv.slice(2);

if (!agentId) {
  console.error("Usage: pnpm board:agent:reset agent-1");
  process.exit(1);
}

try {
  const result = await resetAgent(agentId);
  console.log(`${result.agentId} reset to ${result.branch}`);
  console.log(`Worktree: ${result.path}`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
