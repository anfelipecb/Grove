# Grove Board

`.board/` is the shared source of truth for parallel ticket work.

- Tickets live in `.board/tickets/*.md`.
- Each ticket is one markdown file with YAML frontmatter.
- Status changes happen either through `pnpm board:dev` or by editing the files directly.
- The two reusable worktrees are defined in `.board/config.json`.

Recommended flow:

1. Create or refine a ticket until it is in `ready`.
2. Start it on `agent-1` or `agent-2`.
3. Move it to `doing` while the worktree is active.
4. Move it to `in_review` when the PR is open.
5. Move it to `done` after merge, then reset the worktree.
