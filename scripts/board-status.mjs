import { getBoardState } from "./board-lib.mjs";

try {
  const state = await getBoardState();

  console.log("Active Claims");
  for (const claim of state.claims) {
    const cleanFlag = claim.exists ? (claim.clean ? "clean" : "dirty") : "missing";
    const owner = claim.owner ? ` @ ${claim.owner}` : "";
    console.log(`- ${claim.id} [${claim.status}] ${claim.branch} (${cleanFlag})${owner}`);
  }

  console.log("");
  console.log("Tickets");
  for (const ticket of state.tickets) {
    const owner = ticket.owner ? ` @ ${ticket.owner}` : "";
    console.log(`- ${ticket.id} [${ticket.status}] ${ticket.title}${owner}`);
  }
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
