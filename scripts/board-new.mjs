import { createTicket } from "./board-lib.mjs";

const title = process.argv.slice(2).join(" ").trim();

if (!title) {
  console.error("Usage: pnpm board:new \"Ticket title\"");
  process.exit(1);
}

try {
  const ticket = await createTicket(title);
  console.log(`${ticket.id} created at .board/tickets/${ticket.fileName}`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
