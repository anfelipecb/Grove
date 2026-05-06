import { ensureAllWorktrees } from "./board-lib.mjs";

try {
  const worktrees = await ensureAllWorktrees();

  for (const worktree of worktrees) {
    console.log(`${worktree.label}: ${worktree.path} (${worktree.branch})`);
  }
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
