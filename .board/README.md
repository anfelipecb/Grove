# Grove Board

`.board/` is the shared source of truth for parallel ticket work.

- Tickets live in `.board/tickets/*.md`.
- Each ticket is one markdown file with YAML frontmatter.
- Status changes happen either through `pnpm board:dev` or by editing the files directly.
- Ticket worktrees are ephemeral and live under `.worktrees/`.

Recommended flow:

1. Create or refine a ticket until it is in `ready`.
2. Open a fresh terminal, read `AGENTS.md` plus the ticket, then run `pnpm board:ticket:start GRO-001`.
3. Work only inside the created `.worktrees/<ticket-id>-<slug>` checkout while the ticket is `doing`.
4. After the PR is open, run `pnpm board:ticket:review GRO-001 https://github.com/<org>/<repo>/pull/<n>`.
5. After merge, update the main checkout to `master`, then run `pnpm board:ticket:close GRO-001` to mark it `done` and delete the worktree.
