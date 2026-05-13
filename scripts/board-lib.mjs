import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCRIPT_REPO_ROOT = path.resolve(__dirname, "..");

function resolveRepoRoot() {
  const candidates = [process.cwd(), SCRIPT_REPO_ROOT];

  for (const candidate of candidates) {
    const result = spawnSync("git", ["rev-parse", "--git-common-dir"], {
      cwd: candidate,
      encoding: "utf8"
    });

    if (result.status !== 0) {
      continue;
    }

    const commonDir = (result.stdout || "").trim();

    if (!commonDir) {
      continue;
    }

    const absoluteCommonDir = path.resolve(candidate, commonDir);

    if (path.basename(absoluteCommonDir) === ".git") {
      return path.dirname(absoluteCommonDir);
    }
  }

  return SCRIPT_REPO_ROOT;
}

export const REPO_ROOT = resolveRepoRoot();
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

## Agent Workflow

- Read \`AGENTS.md\` before claiming the ticket.
- Claim from the repo root with \`pnpm board:ticket:start <ticket-id>\`.
- Work inside the generated \`.worktrees/<ticket-id>-<slug>\` checkout.
- After opening the PR, run \`pnpm board:ticket:review <ticket-id> <pr-url>\`.

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

export function resolveRepoPath(relativePath) {
  return path.resolve(REPO_ROOT, relativePath);
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

function getAllWorktreeRegistrations() {
  return parseWorktreeList(runGit(["worktree", "list", "--porcelain"]));
}

function getWorktreeRegistration(targetPath) {
  return (
    getAllWorktreeRegistrations().find(
      (entry) => path.resolve(entry.path) === path.resolve(targetPath)
    ) || null
  );
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

/** True when GitHub reports the PR merged (covers squash merges where the feature branch is not a git ancestor of base). */
function githubPrMerged(prUrl) {
  const trimmed = (prUrl || "").trim();
  if (!trimmed || !trimmed.includes("github.com")) {
    return false;
  }

  const result = spawnSync("gh", ["pr", "view", trimmed, "--json", "state"], {
    cwd: REPO_ROOT,
    encoding: "utf8"
  });

  if (result.status !== 0) {
    return false;
  }

  try {
    const parsed = JSON.parse(result.stdout || "{}");
    return parsed.state === "MERGED";
  } catch {
    return false;
  }
}

function defaultOwner() {
  return process.env.BOARD_OWNER || "";
}

function ticketBranchName(ticket) {
  return `ticket/${ticket.id.toLowerCase()}-${ticket.slug}`;
}

function ticketWorktreeSlug(ticket) {
  return `${ticket.id.toLowerCase()}-${ticket.slug}`;
}

async function managedWorktreeRoot(config) {
  const relativeRoot = config.worktreeRoot || ".worktrees";
  const absoluteRoot = resolveRepoPath(relativeRoot);
  await fs.mkdir(absoluteRoot, { recursive: true });
  return { relativeRoot, absoluteRoot };
}

async function resolveTicketWorktreePath(ticket, config) {
  if (ticket.worktree) {
    return resolveRepoPath(ticket.worktree);
  }

  const { absoluteRoot } = await managedWorktreeRoot(config);
  return path.join(absoluteRoot, ticketWorktreeSlug(ticket));
}

function ensureStatus(ticket, allowed, action) {
  if (!allowed.includes(ticket.status)) {
    throw new Error(`${ticket.id} must be ${allowed.join(" or ")} before ${action}. Current status: ${ticket.status}.`);
  }
}

function branchClaimedByOtherWorktree(branchName, currentWorktreePath = "") {
  return getAllWorktreeRegistrations().some((entry) => {
    const samePath =
      currentWorktreePath &&
      path.resolve(entry.path) === path.resolve(currentWorktreePath);
    return !samePath && entry.branch === branchName;
  });
}

export async function startTicket(ticketId, owner = "") {
  const config = await readConfig();
  const ticket = await getTicket(ticketId);
  ensureStatus(ticket, ["ready"], "claiming");
  ensureBaseBranch(config.baseBranch);

  const branchName = ticketBranchName(ticket);
  const targetPath = await resolveTicketWorktreePath(ticket, config);

  if (ticket.branch || ticket.worktree) {
    throw new Error(`${ticket.id} already has branch/worktree metadata. Clear it before reclaiming.`);
  }

  if (branchClaimedByOtherWorktree(branchName, targetPath)) {
    throw new Error(`Branch ${branchName} is already checked out in another worktree.`);
  }

  const registration = getWorktreeRegistration(targetPath);

  if (registration) {
    throw new Error(`Worktree ${relativeToRepo(targetPath)} already exists. Close or clean it before reclaiming.`);
  }

  if (existsSync(targetPath)) {
    throw new Error(`Path ${relativeToRepo(targetPath)} already exists and is not a registered git worktree.`);
  }

  if (localBranchExists(branchName)) {
    runGit(["worktree", "add", targetPath, branchName]);
  } else {
    runGit(["worktree", "add", "-b", branchName, targetPath, config.baseBranch]);
  }

  const updatedTicket = await updateTicket(ticketId, {
    status: "doing",
    owner: owner.trim() || defaultOwner() || ticket.owner || "",
    branch: branchName,
    worktree: relativeToRepo(targetPath)
  });

  return {
    ticket: updatedTicket,
    branch: branchName,
    worktreePath: targetPath
  };
}

export async function markTicketInReview(ticketId, prUrl, owner = "") {
  const ticket = await getTicket(ticketId);
  ensureStatus(ticket, ["doing", "in_review"], "marking the PR as in review");

  if (!ticket.branch || !ticket.worktree) {
    throw new Error(`${ticket.id} is missing branch/worktree metadata. Claim it first.`);
  }

  const trimmedPrUrl = prUrl.trim();

  if (!trimmedPrUrl) {
    throw new Error("PR URL is required.");
  }

  const updatedTicket = await updateTicket(ticketId, {
    status: "in_review",
    pr_url: trimmedPrUrl,
    owner: owner.trim() || ticket.owner || defaultOwner()
  });

  return { ticket: updatedTicket };
}

export async function closeTicket(ticketId) {
  const config = await readConfig();
  const ticket = await getTicket(ticketId);

  if (!ticket.branch) {
    throw new Error(`${ticket.id} has no branch recorded. Nothing to close.`);
  }

  ensureBaseBranch(config.baseBranch);

  const mergedIntoBase = currentBranchMergedInto(config.baseBranch, ticket.branch);
  const prSquashMerged = githubPrMerged(ticket.pr_url);

  if (!mergedIntoBase && !prSquashMerged) {
    throw new Error(
      `${ticket.branch} is not merged into ${config.baseBranch} (and no merged GitHub PR on record). Sync the main checkout, merge the PR, and ensure the ticket has pr_url before closing.`
    );
  }

  let removedWorktreePath = "";
  const targetPath = ticket.worktree ? resolveRepoPath(ticket.worktree) : null;

  if (targetPath) {
    const registration = getWorktreeRegistration(targetPath);

    if (registration) {
      if (!isWorktreeClean(targetPath)) {
        throw new Error(`${ticket.id} worktree has uncommitted changes. Commit, stash, or discard them before closing.`);
      }

      runGit(["worktree", "remove", targetPath]);
      removedWorktreePath = targetPath;
    }
  }

  let deletedBranch = "";

  if (localBranchExists(ticket.branch)) {
    const softDelete = tryGit(["branch", "-d", ticket.branch]);
    if (!softDelete.ok) {
      if (prSquashMerged) {
        runGit(["branch", "-D", ticket.branch]);
      } else {
        throw new Error(
          (softDelete.stderr || softDelete.stdout || "git branch -d failed").trim() ||
            "Could not delete local branch."
        );
      }
    }
    deletedBranch = ticket.branch;
  }

  const updatedTicket = await updateTicket(ticketId, {
    status: "done",
    branch: "",
    worktree: ""
  });

  return {
    ticket: updatedTicket,
    removedWorktreePath,
    deletedBranch
  };
}

export async function getActiveClaims() {
  const tickets = await listTickets();
  const claims = [];

  for (const ticket of tickets) {
    if (!["doing", "in_review"].includes(ticket.status)) {
      continue;
    }

    const absolutePath = ticket.worktree ? resolveRepoPath(ticket.worktree) : "";
    const registration = absolutePath ? getWorktreeRegistration(absolutePath) : null;
    const exists = Boolean(registration);

    claims.push({
      id: ticket.id,
      title: ticket.title,
      status: ticket.status,
      owner: ticket.owner,
      branch: ticket.branch,
      pr_url: ticket.pr_url,
      path: ticket.worktree,
      absolutePath,
      exists,
      clean: exists ? isWorktreeClean(absolutePath) : null
    });
  }

  return claims;
}

export async function getBoardState() {
  const [config, tickets, claims] = await Promise.all([
    readConfig(),
    listTickets(),
    getActiveClaims()
  ]);

  return { config, tickets, claims };
}
