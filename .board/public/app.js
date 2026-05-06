const summaryElement = document.querySelector("#summary");
const boardElement = document.querySelector("#board");
const agentsElement = document.querySelector("#agents");
const messageElement = document.querySelector("#message");
const lastSyncElement = document.querySelector("#last-sync");
const refreshButton = document.querySelector("#refresh-board");

let state = {
  config: { statuses: [], worktrees: [] },
  tickets: [],
  agents: []
};

let draggingTicketId = "";
let messageTimeoutId = null;

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function bodyPreview(body) {
  const cleaned = body
    .replace(/^##\s+/gm, "")
    .replace(/^- \[[ xX]\]\s*/gm, "- ")
    .trim();

  return cleaned.length > 120 ? `${cleaned.slice(0, 117)}...` : cleaned;
}

function priorityRank(priority) {
  if (priority === "p1") {
    return 0;
  }

  if (priority === "p2") {
    return 1;
  }

  if (priority === "p3") {
    return 2;
  }

  return 3;
}

function sortTickets(tickets) {
  return [...tickets].sort((left, right) => {
    const priorityDelta = priorityRank(left.priority) - priorityRank(right.priority);

    if (priorityDelta !== 0) {
      return priorityDelta;
    }

    return left.id.localeCompare(right.id);
  });
}

function ownerLabel(ticket) {
  if (ticket.owner) {
    return ticket.owner;
  }

  if (ticket.status === "ready") {
    return "open queue";
  }

  if (ticket.status === "backlog") {
    return "unscoped";
  }

  return "unassigned";
}

function branchLabel(branch) {
  if (!branch) {
    return "";
  }

  return branch.length > 34 ? `${branch.slice(0, 31)}...` : branch;
}

function renderSummary() {
  const total = state.tickets.length;

  summaryElement.innerHTML = state.config.statuses
    .map((status) => {
      const count = state.tickets.filter((ticket) => ticket.status === status.id).length;

      return `
        <article class="summary-card" data-status-id="${escapeHtml(status.id)}">
          <div class="summary-copy">
            <span class="summary-label">${escapeHtml(status.label)}</span>
            <strong class="summary-value">${count}</strong>
          </div>
          <span class="summary-pill">${total === 0 ? "0%" : `${Math.round((count / total) * 100)}%`}</span>
        </article>
      `;
    })
    .join("");
}

function showMessage(text, tone = "info") {
  messageElement.textContent = text;
  messageElement.className = `message${tone === "error" ? " error" : ""}`;

  if (messageTimeoutId) {
    window.clearTimeout(messageTimeoutId);
  }

  if (!text) {
    return;
  }

  messageTimeoutId = window.setTimeout(() => {
    messageElement.textContent = "";
    messageElement.className = "message";
    messageTimeoutId = null;
  }, 2800);
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "Request failed.");
  }

  return payload;
}

async function loadState() {
  state = await request("/api/state");
  lastSyncElement.textContent = `Synced ${new Date().toLocaleTimeString()}`;
  render();
}

function renderAgents() {
  agentsElement.innerHTML = state.agents
    .map((agent) => {
      const activeTicket = state.tickets.find((ticket) => ticket.id === agent.activeTicketId);
      const ticketLine = agent.activeTicketId
        ? `<p class="muted">${escapeHtml(agent.activeTicketId)} - ${escapeHtml(agent.activeTicketTitle)}</p>`
        : `<p class="muted">${agent.exists ? "No active ticket" : "Worktree not initialized"}</p>`;
      const branchLabel = agent.exists ? agent.branch || agent.parkingBranch : agent.parkingBranch;
      const prLink = activeTicket?.pr_url
        ? `<a class="meta-link" href="${escapeHtml(activeTicket.pr_url)}" target="_blank" rel="noreferrer">PR</a>`
        : "";

      return `
        <article class="agent-card">
          <div class="agent-header">
            <div>
              <h3>${escapeHtml(agent.label)}</h3>
              <p class="path-label">${escapeHtml(agent.path)}</p>
            </div>
            <span class="status-pill ${agent.clean ? "clean" : "dirty"}">${agent.clean ? "clean" : "dirty"}</span>
          </div>
          <div class="agent-status">
            <span>Branch</span>
            <strong>${escapeHtml(branchLabel)}</strong>
          </div>
          ${ticketLine}
          <div class="ticket-meta">
            <span class="meta-pill">${agent.exists ? "ready" : "missing"}</span>
            ${prLink}
          </div>
        </article>
      `;
    })
    .join("");
}

function renderBoard() {
  boardElement.innerHTML = state.config.statuses
    .map((status) => {
      const tickets = sortTickets(state.tickets.filter((ticket) => ticket.status === status.id));
      const cards = tickets.length
        ? tickets
            .map((ticket) => {
              const preview = bodyPreview(ticket.body || "");
              const prLink = ticket.pr_url
                ? `<a class="meta-link" href="${escapeHtml(ticket.pr_url)}" target="_blank" rel="noreferrer">PR</a>`
                : "";
              const branch = ticket.branch
                ? `<span class="meta-pill" title="${escapeHtml(ticket.branch)}">${escapeHtml(branchLabel(ticket.branch))}</span>`
                : "";

              return `
                <article class="ticket-card" draggable="true" data-ticket-id="${escapeHtml(ticket.id)}">
                  <div class="ticket-header">
                    <div>
                      <p class="ticket-id">${escapeHtml(ticket.id)}</p>
                      <h3 class="ticket-title">${escapeHtml(ticket.title)}</h3>
                    </div>
                    <span class="priority-pill">${escapeHtml(ticket.priority.toUpperCase())}</span>
                  </div>
                  <p class="ticket-preview">${escapeHtml(preview || "No ticket notes yet.")}</p>
                  <div class="ticket-meta">
                    <span class="meta-pill">${escapeHtml(ownerLabel(ticket))}</span>
                    ${branch}
                    ${prLink}
                  </div>
                </article>
              `;
            })
            .join("")
        : `<p class="empty-state">No tickets here.</p>`;

      return `
        <section class="state-section" data-status-id="${escapeHtml(status.id)}">
          <div class="section-header">
            <div class="section-copy">
              <div class="section-title">
                <h2>${escapeHtml(status.label)}</h2>
                <span class="summary-pill section-pill">${tickets.length}</span>
              </div>
              <p class="column-description">${escapeHtml(status.description)}</p>
            </div>
          </div>
          <div class="ticket-list">${cards}</div>
        </section>
      `;
    })
    .join("");
}

function render() {
  renderSummary();
  renderAgents();
  renderBoard();
}

refreshButton.addEventListener("click", async () => {
  try {
    await loadState();
    showMessage("Board refreshed.");
  } catch (error) {
    showMessage(error.message, "error");
  }
});

document.addEventListener("dragstart", (event) => {
  const target = event.target;

  if (!(target instanceof HTMLElement)) {
    return;
  }

  const card = target.closest("[data-ticket-id]");

  if (!(card instanceof HTMLElement) || !event.dataTransfer) {
    return;
  }

  draggingTicketId = card.dataset.ticketId || "";
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", draggingTicketId);
});

document.addEventListener("dragend", () => {
  draggingTicketId = "";
  for (const column of document.querySelectorAll(".state-section")) {
    column.classList.remove("drop-target");
  }
});

document.addEventListener("dragover", (event) => {
  const column = event.target instanceof HTMLElement ? event.target.closest(".state-section") : null;

  if (!(column instanceof HTMLElement)) {
    return;
  }

  event.preventDefault();
  column.classList.add("drop-target");
});

document.addEventListener("dragleave", (event) => {
  const column = event.target instanceof HTMLElement ? event.target.closest(".state-section") : null;

  if (column instanceof HTMLElement) {
    column.classList.remove("drop-target");
  }
});

document.addEventListener("drop", async (event) => {
  const column = event.target instanceof HTMLElement ? event.target.closest(".state-section") : null;

  if (!(column instanceof HTMLElement)) {
    return;
  }

  event.preventDefault();
  column.classList.remove("drop-target");

  const status = column.dataset.statusId;
  const ticketId = draggingTicketId || event.dataTransfer?.getData("text/plain") || "";

  if (!status || !ticketId) {
    return;
  }

  try {
    await request(`/api/tickets/${encodeURIComponent(ticketId)}`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    });
    showMessage(`${ticketId} moved to ${status}.`);
    await loadState();
  } catch (error) {
    showMessage(error.message, "error");
  }
});

await loadState();
window.setInterval(async () => {
  if (draggingTicketId || document.hidden) {
    return;
  }

  try {
    await loadState();
  } catch (_error) {
    // Keep the board stable during transient refresh failures.
  }
}, 4000);
