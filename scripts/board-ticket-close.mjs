import { closeTicket } from "./board-lib.mjs";

const [ticketId] = process.argv.slice(2);

if (!ticketId) {
  console.error("Usage: pnpm board:ticket:close GRO-001");
  process.exit(1);
}

try {
  const result = await closeTicket(ticketId);
  console.log(`${result.ticket.id} moved to done`);
  if (result.removedWorktreePath) {
    console.log(`Removed worktree: ${result.removedWorktreePath}`);
  }
  if (result.deletedBranch) {
    console.log(`Deleted branch: ${result.deletedBranch}`);
  }
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
