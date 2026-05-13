const summaryElement = document.querySelector("#summary");
const boardElement = document.querySelector("#board");
const claimsElement = document.querySelector("#claims");
const messageElement = document.querySelector("#message");
const lastSyncElement = document.querySelector("#last-sync");
const refreshButton = document.querySelector("#refresh-board");

let state = {
  config: { statuses: [] },
  tickets: [],
  claims: []
};

let draggingTicketId = "";
let messageTimeoutId = null;

function escapeHtml(value) {
  return String(value)
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

  return cleaned.length > 150 ? `${cleaned.slice(0, 147)}...` : cleaned;
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

  if (ticket.status === "doing" || ticket.status === "in_review") {
    return "claimed";
  }

  return "unassigned";
}

function branchLabel(branch) {
  if (!branch) {
    return "";
  }

  return branch.length > 34 ? `${branch.slice(0, 31)}...` : branch;
}

function worktreeLabel(worktreePath) {
  if (!worktreePath) {
    return "No worktree recorded";
  }

  const parts = worktreePath.split("/");
  return parts.slice(-2).join("/");
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

function renderClaims() {
  if (state.claims.length === 0) {
    claimsElement.innerHTML = `<p class="empty-state">No active claims.</p>`;
    return;
  }

  claimsElement.innerHTML = state.claims
    .map((claim) => {
      const healthLabel = !claim.exists ? "missing" : claim.clean ? "clean" : "dirty";
      const prLink = claim.pr_url
        ? `<a class="meta-link" href="${escapeHtml(claim.pr_url)}" target="_blank" rel="noreferrer">PR</a>`
        : "";

      return `
        <article class="claim-card">
          <div class="claim-header">
            <div>
              <p class="ticket-id">${escapeHtml(claim.id)}</p>
              <h3 class="ticket-title">${escapeHtml(claim.title)}</h3>
            </div>
            <span class="status-pill ${healthLabel}">${escapeHtml(healthLabel)}</span>
          </div>
          <p class="claim-path">${escapeHtml(worktreeLabel(claim.path))}</p>
          <div class="ticket-meta">
            <span class="meta-pill">${escapeHtml(claim.status)}</span>
            <span class="meta-pill">${escapeHtml(claim.owner || "claimed")}</span>
            ${claim.branch ? `<span class="meta-pill" title="${escapeHtml(claim.branch)}">${escapeHtml(branchLabel(claim.branch))}</span>` : ""}
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
              const showExecutionMeta = ticket.status !== "done";
              const branch = showExecutionMeta && ticket.branch
                ? `<span class="meta-pill" title="${escapeHtml(ticket.branch)}">${escapeHtml(branchLabel(ticket.branch))}</span>`
                : "";
              const worktree = showExecutionMeta && ticket.worktree
                ? `<span class="meta-pill" title="${escapeHtml(ticket.worktree)}">${escapeHtml(worktreeLabel(ticket.worktree))}</span>`
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
                    ${worktree}
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
  renderClaims();
  renderBoard();
}

async function loadState() {
  state = await request("/api/state");
  lastSyncElement.textContent = `Synced ${new Date().toLocaleTimeString()}`;
  render();
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
  document.querySelectorAll(".state-section.drop-target").forEach((section) => {
    section.classList.remove("drop-target");
  });
});

document.addEventListener("dragover", (event) => {
  const target = event.target;

  if (!(target instanceof HTMLElement)) {
    return;
  }

  const section = target.closest(".state-section");

  if (!section) {
    return;
  }

  event.preventDefault();
  section.classList.add("drop-target");
});

document.addEventListener("dragleave", (event) => {
  const target = event.target;

  if (!(target instanceof HTMLElement)) {
    return;
  }

  const section = target.closest(".state-section");

  if (!section) {
    return;
  }

  const nextTarget = event.relatedTarget;

  if (nextTarget instanceof Node && section.contains(nextTarget)) {
    return;
  }

  section.classList.remove("drop-target");
});

document.addEventListener("drop", async (event) => {
  const target = event.target;

  if (!(target instanceof HTMLElement)) {
    return;
  }

  const section = target.closest(".state-section");

  if (!(section instanceof HTMLElement)) {
    return;
  }

  event.preventDefault();
  section.classList.remove("drop-target");

  const statusId = section.dataset.statusId || "";
  const ticketId = draggingTicketId || event.dataTransfer?.getData("text/plain") || "";

  if (!statusId || !ticketId) {
    return;
  }

  try {
    await request(`/api/tickets/${encodeURIComponent(ticketId)}`, {
      method: "PATCH",
      body: JSON.stringify({ status: statusId })
    });
    await loadState();
    showMessage(`${ticketId} moved to ${statusId}.`);
  } catch (error) {
    showMessage(error.message, "error");
  }
});

loadState().catch((error) => {
  showMessage(error.message, "error");
});
