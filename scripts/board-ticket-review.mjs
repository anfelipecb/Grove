import { markTicketInReview } from "./board-lib.mjs";

const [ticketId, prUrl, owner] = process.argv.slice(2);

if (!ticketId || !prUrl) {
  console.error("Usage: pnpm board:ticket:review GRO-001 https://github.com/<org>/<repo>/pull/<n> [owner]");
  process.exit(1);
}

try {
  const result = await markTicketInReview(ticketId, prUrl, owner || "");
  console.log(`${result.ticket.id} moved to in_review`);
  console.log(`PR: ${result.ticket.pr_url}`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
