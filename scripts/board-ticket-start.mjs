import { startTicket } from "./board-lib.mjs";

const [ticketId, owner] = process.argv.slice(2);

if (!ticketId) {
  console.error("Usage: pnpm board:ticket:start GRO-001 [owner]");
  process.exit(1);
}

try {
  const result = await startTicket(ticketId, owner || "");
  console.log(`${result.ticket.id} is active`);
  console.log(`Branch: ${result.branch}`);
  console.log(`Worktree: ${result.worktreePath}`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
