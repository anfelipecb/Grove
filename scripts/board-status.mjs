import { getBoardState } from "./board-lib.mjs";

try {
  const state = await getBoardState();

  console.log("Agents");
  for (const agent of state.agents) {
    const ticket = agent.activeTicketId ? ` -> ${agent.activeTicketId}` : "";
    const branch = agent.exists ? agent.branch || agent.parkingBranch : "not initialized";
    const cleanFlag = agent.clean ? "clean" : "dirty";
    console.log(`- ${agent.label}: ${branch} (${cleanFlag})${ticket}`);
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
