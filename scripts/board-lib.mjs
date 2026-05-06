import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const REPO_ROOT = path.resolve(__dirname, "..");
export const BOARD_ROOT = path.join(REPO_ROOT, ".board");
export const TICKETS_DIR = path.join(BOARD_ROOT, "tickets");
export const PUBLIC_DIR = path.join(BOARD_ROOT, "public");
export const CONFIG_PATH = path.join(BOARD_ROOT, "config.json");
export const TEMPLATE_PATH = path.join(BOARD_ROOT, "ticket-template.md");

const FRONTMATTER_ORDER = [
  "id",
  "title",
  "slug",
  "status",
  "priority",
  "owner",
  "branch",
  "worktree",
  "pr_url",
  "labels",
  "depends_on",
  "created_at",
  "updated_at"
];

const DEFAULT_TEMPLATE = `## Context

## Acceptance Criteria

- [ ]

## Notes
`;

function normalizeNewlines(value) {
  return value.replace(/\r\n/g, "\n");
}

export function slugify(input) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function quoteString(value) {
  return JSON.stringify(value ?? "");
}

function parseScalar(rawValue) {
  if (rawValue === "[]") {
    return [];
  }

  if (rawValue === '""' || rawValue === "''") {
    return "";
  }

  if (rawValue === "true") {
    return true;
  }

  if (rawValue === "false") {
    return false;
  }

  if (/^-?\d+$/.test(rawValue)) {
    return Number.parseInt(rawValue, 10);
  }

  if (
    (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
    (rawValue.startsWith("'") && rawValue.endsWith("'"))
  ) {
    return rawValue.slice(1, -1);
  }

  return rawValue;
}

export function parseFrontmatter(source) {
  const normalized = normalizeNewlines(source);

  if (!normalized.startsWith("---\n")) {
    return { data: {}, body: normalized };
  }

  const endIndex = normalized.indexOf("\n---\n", 4);

  if (endIndex === -1) {
    throw new Error("Ticket frontmatter is missing a closing --- line.");
  }

  const rawFrontmatter = normalized.slice(4, endIndex);
  const body = normalized.slice(endIndex + 5);
  const data = {};
  let activeArrayKey = null;

  for (const line of rawFrontmatter.split("\n")) {
    if (!line.trim()) {
      continue;
    }

    const arrayMatch = line.match(/^\s*-\s+(.*)$/);

    if (arrayMatch && activeArrayKey) {
      data[activeArrayKey].push(parseScalar(arrayMatch[1].trim()));
      continue;
    }

    activeArrayKey = null;

    const keyMatch = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);

    if (!keyMatch) {
      continue;
    }

    const [, key, rawValue] = keyMatch;

    if (rawValue === "") {
      data[key] = [];
      activeArrayKey = key;
      continue;
    }

    data[key] = parseScalar(rawValue.trim());
  }

  return { data, body };
}

export function serializeFrontmatter(data) {
  const seen = new Set();
  const orderedKeys = [
    ...FRONTMATTER_ORDER,
    ...Object.keys(data).filter((key) => !FRONTMATTER_ORDER.includes(key))
  ];
  const lines = ["---"];

  for (const key of orderedKeys) {
    if (seen.has(key) || !(key in data)) {
      continue;
    }

    seen.add(key);

    const value = data[key];

    if (Array.isArray(value)) {
      if (value.length === 0) {
        lines.push(`${key}: []`);
      } else {
        lines.push(`${key}:`);
        for (const entry of value) {
          lines.push(`  - ${quoteString(String(entry))}`);
        }
      }

      continue;
    }

    if (typeof value === "number" || typeof value === "boolean") {
      lines.push(`${key}: ${value}`);
      continue;
    }

    lines.push(`${key}: ${quoteString(String(value ?? ""))}`);
  }

  lines.push("---");
  return `${lines.join("\n")}\n`;
}

function padTicketNumber(value) {
  return String(value).padStart(3, "0");
}

export function makeTicketId(sequenceNumber) {
  return `GRO-${padTicketNumber(sequenceNumber)}`;
}

async function readTemplate() {
  if (!existsSync(TEMPLATE_PATH)) {
    return DEFAULT_TEMPLATE;
  }

  return normalizeNewlines(await fs.readFile(TEMPLATE_PATH, "utf8"));
}

export async function ensureBoardStructure() {
  await fs.mkdir(TICKETS_DIR, { recursive: true });
  await fs.mkdir(PUBLIC_DIR, { recursive: true });
}

export async function readConfig() {
  const raw = await fs.readFile(CONFIG_PATH, "utf8");
  return JSON.parse(raw);
}

function ticketFileName(ticket) {
  return `${ticket.id}-${ticket.slug}.md`;
}

function ticketSortValue(ticket) {
  const match = ticket.id.match(/(\d+)$/);
  return match ? Number.parseInt(match[1], 10) : Number.MAX_SAFE_INTEGER;
}

export async function listTickets() {
  await ensureBoardStructure();
  const entries = await fs.readdir(TICKETS_DIR, { withFileTypes: true });
  const tickets = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) {
      continue;
    }

    const filePath = path.join(TICKETS_DIR, entry.name);
    const source = await fs.readFile(filePath, "utf8");
    const { data, body } = parseFrontmatter(source);
    const ticket = {
      id: data.id,
      title: data.title,
      slug: data.slug,
      status: data.status || "backlog",
      priority: data.priority || "p2",
      owner: data.owner || "",
      branch: data.branch || "",
      worktree: data.worktree || "",
      pr_url: data.pr_url || "",
      labels: Array.isArray(data.labels) ? data.labels : [],
      depends_on: Array.isArray(data.depends_on) ? data.depends_on : [],
      created_at: data.created_at || "",
      updated_at: data.updated_at || "",
      body: body.replace(/^\n+/, "").trimEnd(),
      filePath,
      fileName: entry.name
    };

    if (!ticket.id || !ticket.title || !ticket.slug) {
      throw new Error(`Ticket file ${entry.name} is missing required frontmatter.`);
    }

    tickets.push(ticket);
  }

  tickets.sort((left, right) => ticketSortValue(left) - ticketSortValue(right));
  return tickets;
}

export async function getTicket(ticketId) {
  const tickets = await listTickets();
  const ticket = tickets.find((entry) => entry.id === ticketId);

  if (!ticket) {
    throw new Error(`Ticket ${ticketId} was not found.`);
  }

  return ticket;
}

async function nextTicketSequence() {
  const tickets = await listTickets();
  const lastValue = tickets.reduce((current, ticket) => {
    const match = ticket.id.match(/(\d+)$/);

    if (!match) {
      return current;
    }

    return Math.max(current, Number.parseInt(match[1], 10));
  }, 0);

  return lastValue + 1;
}

async function writeTicket(ticket) {
  const frontmatter = serializeFrontmatter({
    id: ticket.id,
    title: ticket.title,
    slug: ticket.slug,
    status: ticket.status,
    priority: ticket.priority,
    owner: ticket.owner,
    branch: ticket.branch,
    worktree: ticket.worktree,
    pr_url: ticket.pr_url,
    labels: ticket.labels,
    depends_on: ticket.depends_on,
    created_at: ticket.created_at,
    updated_at: ticket.updated_at
  });
  const body = ticket.body.replace(/^\n+/, "").trimEnd();
  const targetPath = ticket.filePath || path.join(TICKETS_DIR, ticketFileName(ticket));
  const output = `${frontmatter}\n${body}\n`;

  await fs.writeFile(targetPath, output, "utf8");
  return { ...ticket, filePath: targetPath, fileName: path.basename(targetPath) };
}

export async function createTicket(title, overrides = {}) {
  const trimmedTitle = title.trim();

  if (!trimmedTitle) {
    throw new Error("Ticket title is required.");
  }

  const sequence = await nextTicketSequence();
  const now = new Date().toISOString();
  const ticket = {
    id: makeTicketId(sequence),
    title: trimmedTitle,
    slug: slugify(trimmedTitle),
    status: overrides.status || "backlog",
    priority: overrides.priority || "p2",
    owner: overrides.owner || "",
    branch: overrides.branch || "",
    worktree: overrides.worktree || "",
    pr_url: overrides.pr_url || "",
    labels: overrides.labels || [],
    depends_on: overrides.depends_on || [],
    created_at: now,
    updated_at: now,
    body: (await readTemplate()).trimEnd()
  };

  return writeTicket(ticket);
}

export async function updateTicket(ticketId, patch) {
  const current = await getTicket(ticketId);
  const updated = {
    ...current,
    ...patch,
    labels: Array.isArray(patch.labels) ? patch.labels : current.labels,
    depends_on: Array.isArray(patch.depends_on) ? patch.depends_on : current.depends_on,
    updated_at: new Date().toISOString()
  };

  return writeTicket(updated);
}

export function relativeToRepo(targetPath) {
  return path.relative(REPO_ROOT, targetPath) || ".";
}

export function resolveWorktreePath(worktreePath) {
  return path.resolve(REPO_ROOT, worktreePath);
}

function runGit(args, options = {}) {
  const result = spawnSync("git", args, {
    cwd: options.cwd || REPO_ROOT,
    encoding: "utf8"
  });

  if (result.status !== 0) {
    const message = (result.stderr || result.stdout || "git command failed").trim();
    throw new Error(message);
  }

  return (result.stdout || "").trim();
}

function tryGit(args, options = {}) {
  const result = spawnSync("git", args, {
    cwd: options.cwd || REPO_ROOT,
    encoding: "utf8"
  });

  return {
    ok: result.status === 0,
    stdout: (result.stdout || "").trim(),
    stderr: (result.stderr || "").trim()
  };
}

function parseWorktreeList(rawOutput) {
  const lines = rawOutput.split("\n");
  const entries = [];
  let current = null;

  for (const line of lines) {
    if (!line.trim()) {
      if (current) {
        entries.push(current);
      }

      current = null;
      continue;
    }

    const [key, ...rest] = line.split(" ");
    const value = rest.join(" ").trim();

    if (key === "worktree") {
      if (current) {
        entries.push(current);
      }

      current = { path: value, branch: "", head: "" };
      continue;
    }

    if (!current) {
      continue;
    }

    if (key === "branch") {
      current.branch = value.replace("refs/heads/", "");
    }

    if (key === "HEAD") {
      current.head = value;
    }
  }

  if (current) {
    entries.push(current);
  }

  return entries;
}

function getWorktreeRegistration(targetPath) {
  const output = runGit(["worktree", "list", "--porcelain"]);
  const registrations = parseWorktreeList(output);
  return registrations.find((entry) => path.resolve(entry.path) === path.resolve(targetPath)) || null;
}

function getCurrentBranch(worktreePath) {
  return runGit(["-C", worktreePath, "rev-parse", "--abbrev-ref", "HEAD"]);
}

function isWorktreeClean(worktreePath) {
  return runGit(["-C", worktreePath, "status", "--porcelain"]) === "";
}

function baseRefExists(baseBranch) {
  return tryGit(["show-ref", "--verify", "--quiet", `refs/heads/${baseBranch}`]).ok;
}

function ensureBaseBranch(baseBranch) {
  if (!baseRefExists(baseBranch)) {
    throw new Error(`Base branch ${baseBranch} does not exist locally.`);
  }
}

function localBranchExists(branchName) {
  return tryGit(["show-ref", "--verify", "--quiet", `refs/heads/${branchName}`]).ok;
}

function currentBranchMergedInto(baseBranch, branchName) {
  if (!branchName || branchName === baseBranch) {
    return false;
  }

  const result = tryGit(["branch", "--merged", baseBranch, "--list", branchName]);
  return result.ok && result.stdout.split("\n").some((line) => line.replace(/^[* ]+/, "") === branchName);
}

export async function ensureAgentWorktree(agentId) {
  const config = await readConfig();
  const agent = config.worktrees.find((entry) => entry.id === agentId);

  if (!agent) {
    throw new Error(`Unknown agent ${agentId}.`);
  }

  ensureBaseBranch(config.baseBranch);

  const targetPath = resolveWorktreePath(agent.path);
  const registration = getWorktreeRegistration(targetPath);

  if (registration) {
    return {
      agentId: agent.id,
      label: agent.label,
      path: targetPath,
      branch: registration.branch || getCurrentBranch(targetPath)
    };
  }

  if (existsSync(targetPath) && !existsSync(path.join(targetPath, ".git"))) {
    throw new Error(`Path ${targetPath} already exists and is not a git worktree.`);
  }

  if (localBranchExists(agent.parkingBranch)) {
    runGit(["worktree", "add", targetPath, agent.parkingBranch]);
  } else {
    runGit(["worktree", "add", "-b", agent.parkingBranch, targetPath, config.baseBranch]);
  }

  return {
    agentId: agent.id,
    label: agent.label,
    path: targetPath,
    branch: getCurrentBranch(targetPath)
  };
}

export async function ensureAllWorktrees() {
  const config = await readConfig();
  const results = [];

  for (const agent of config.worktrees) {
    results.push(await ensureAgentWorktree(agent.id));
  }

  return results;
}

function branchClaimedByOtherWorktree(branchName, currentWorktreePath) {
  const output = runGit(["worktree", "list", "--porcelain"]);
  const registrations = parseWorktreeList(output);

  return registrations.some((entry) => {
    const samePath = path.resolve(entry.path) === path.resolve(currentWorktreePath);
    return !samePath && entry.branch === branchName;
  });
}

export async function startTicketOnAgent(ticketId, agentId) {
  const config = await readConfig();
  const agent = config.worktrees.find((entry) => entry.id === agentId);

  if (!agent) {
    throw new Error(`Unknown agent ${agentId}.`);
  }

  const targetPath = resolveWorktreePath(agent.path);
  await ensureAgentWorktree(agentId);

  if (!isWorktreeClean(targetPath)) {
    throw new Error(`${agent.label} has uncommitted changes. Commit or reset that worktree first.`);
  }

  const currentBranch = getCurrentBranch(targetPath);

  if (currentBranch !== agent.parkingBranch) {
    throw new Error(
      `${agent.label} is already on ${currentBranch}. Reset the agent before starting another ticket.`
    );
  }

  const ticket = await getTicket(ticketId);
  const branchName = `ticket/${ticket.id.toLowerCase()}-${ticket.slug}`;

  if (branchClaimedByOtherWorktree(branchName, targetPath)) {
    throw new Error(`Branch ${branchName} is already checked out in another worktree.`);
  }

  if (localBranchExists(branchName)) {
    runGit(["-C", targetPath, "checkout", branchName]);
  } else {
    runGit(["-C", targetPath, "checkout", "-b", branchName, config.baseBranch]);
  }

  const updatedTicket = await updateTicket(ticketId, {
    status: "doing",
    owner: agent.id,
    branch: branchName,
    worktree: relativeToRepo(targetPath)
  });

  return {
    ticket: updatedTicket,
    worktreePath: targetPath,
    branch: branchName
  };
}

export async function resetAgent(agentId) {
  const config = await readConfig();
  const agent = config.worktrees.find((entry) => entry.id === agentId);

  if (!agent) {
    throw new Error(`Unknown agent ${agentId}.`);
  }

  const targetPath = resolveWorktreePath(agent.path);
  await ensureAgentWorktree(agentId);

  if (!isWorktreeClean(targetPath)) {
    throw new Error(`${agent.label} has uncommitted changes. Commit or clean the worktree first.`);
  }

  const currentBranch = getCurrentBranch(targetPath);

  if (currentBranch !== agent.parkingBranch) {
    runGit(["-C", targetPath, "checkout", agent.parkingBranch]);

    if (currentBranchMergedInto(config.baseBranch, currentBranch)) {
      runGit(["branch", "-d", currentBranch]);
    }
  }

  return {
    agentId: agent.id,
    path: targetPath,
    branch: getCurrentBranch(targetPath)
  };
}

export async function getAgentStatuses() {
  const config = await readConfig();
  const tickets = await listTickets();
  const statuses = [];

  for (const agent of config.worktrees) {
    const targetPath = resolveWorktreePath(agent.path);
    const registration = getWorktreeRegistration(targetPath);
    const exists = Boolean(registration);
    const branch = exists ? getCurrentBranch(targetPath) : "";
    const clean = exists ? isWorktreeClean(targetPath) : true;
    const activeTicket =
      tickets.find((ticket) => ticket.owner === agent.id && ticket.branch === branch) || null;

    statuses.push({
      id: agent.id,
      label: agent.label,
      path: relativeToRepo(targetPath),
      absolutePath: targetPath,
      parkingBranch: agent.parkingBranch,
      exists,
      branch,
      clean,
      activeTicketId: activeTicket?.id || "",
      activeTicketTitle: activeTicket?.title || ""
    });
  }

  return statuses;
}

export async function getBoardState() {
  const [config, tickets, agents] = await Promise.all([
    readConfig(),
    listTickets(),
    getAgentStatuses()
  ]);

  return { config, tickets, agents };
}
