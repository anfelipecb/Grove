import { startTicketOnAgent } from "./board-lib.mjs";

const [ticketId, agentId] = process.argv.slice(2);

if (!ticketId || !agentId) {
  console.error("Usage: pnpm board:ticket:start GRO-001 agent-1");
  process.exit(1);
}

try {
  const result = await startTicketOnAgent(ticketId, agentId);
  console.log(`${result.ticket.id} is active on ${agentId}`);
  console.log(`Branch: ${result.branch}`);
  console.log(`Worktree: ${result.worktreePath}`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
