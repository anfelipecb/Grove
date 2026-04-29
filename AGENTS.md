# Grove Agent Memory

## Product Intent

Grove is an ADHD-aware AI accountability and community coordination platform. The core thesis is that personal follow-through and community participation reinforce each other. The app should not become generic solo productivity software with a community tab; community participation is a first-class part of the growth loop.

## Names

- Product/repo: Grove
- Community-building agent: Mycelium
- Progression language: Seniority tiers, not classic RPG levels

## V1 Priorities

1. Personal loop: onboarding, profile, goals, friction-aware XP, rewards, and nudges.
2. Community loop: communities, sessions, notes, summaries, commitments, feed, and participation XP.
3. Mycelium: session memory, commitment extraction, participation nudges, and newcomer context.

## Privacy And Safety

- ADHD/focus disclosure is optional and private by default.
- Public support preferences must be opt-in.
- AI is a coach/coordinator, not a therapist or clinical provider.
- Do not generate diagnosis claims.
- Add escalation copy for crisis/self-harm content instead of trying to handle it conversationally.

## Scoring

XP should value effort, resistance, importance, urgency, and community contribution. AI can suggest XP, but users confirm or adjust it. Use broad domains with editable subareas:

- Wellbeing
- Learning
- Work/Build
- Relationships
- Community
- Life Admin
- Rest/Play

## Repo Rules

- `docs/` is local-only for class deliverables and proposal iterations.
- `research/` is local-only for downloaded papers and notes.
- Do not commit `.env*`, vendor secrets, downloaded source PDFs, or class documents.
- Commit regularly at meaningful checkpoints.

## Deployment Defaults

- Web: Vercel
- Worker/jobs: Railway
- Database/auth/storage: Supabase + Clerk
- AI: OpenAI-compatible Groq first, with provider abstraction for later swaps.

