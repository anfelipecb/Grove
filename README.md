# Grove

Grove is an ADHD-aware accountability and community coordination platform. It treats personal growth and community participation as one loop: people keep track of goals better when they are supported by a living community, and communities stay healthier when planning, memory, and follow-through are not carried by one organizer.

The community-building agent is **Mycelium**. In v1, Mycelium helps with session memory, commitments, participation nudges, and newcomer context.

## Stack

- `apps/web`: Next.js, Tailwind, Clerk-ready auth, Supabase-ready data access
- `apps/worker`: Railway-ready worker for scheduled nudges and async AI jobs
- `packages/core`: shared scoring logic, domains, AI contracts, and schemas
- `supabase/migrations`: database schema and RLS policies

## Local Setup

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

The committed app runs as a polished local demo without vendor keys. Supabase, Clerk, Groq, and email delivery become active once the environment variables are configured.

## Supabase And Clerk

Use Supabase's native Clerk third-party auth integration. In Clerk, activate the Supabase integration; in Supabase, add Clerk under Authentication > Third-party Auth. The app should pass Clerk's normal session token to Supabase through the `accessToken` option. Do not use the deprecated Clerk JWT template flow.

## Local-Only Material

`docs/` and `research/` are intentionally ignored. Keep class deliverables, proposal iterations, downloaded papers, and private research notes there.

## Scripts

```bash
pnpm dev        # run the web app
pnpm worker     # run the worker locally
pnpm typecheck  # type-check all packages
pnpm build      # build all packages
```
