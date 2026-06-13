# DOX framework

- DOX is a highly performant AGENTS.md hierarchy installed here
- Agent must follow DOX instructions across any edits

## Core Contract

- AGENTS.md files are binding work contracts for their subtrees
- Work products, source materials, instructions, records, assets, and durable docs must stay understandable from the nearest applicable AGENTS.md plus every parent AGENTS.md above it

## Read Before Editing

1. Read the root AGENTS.md
2. Identify every file or folder you expect to touch
3. Walk from the repository root to each target path
4. Read every AGENTS.md found along each route
5. If a parent AGENTS.md lists a child AGENTS.md whose scope contains the path, read that child and continue from there
6. Use the nearest AGENTS.md as the local contract and parent docs for repo-wide rules
7. If docs conflict, the closer doc controls local work details, but no child doc may weaken DOX

Do not rely on memory. Re-read the applicable DOX chain in the current session before editing.

## Update After Editing

Every meaningful change requires a DOX pass before the task is done.

Update the closest owning AGENTS.md when a change affects:

- purpose, scope, ownership, or responsibilities
- durable structure, contracts, workflows, or operating rules
- required inputs, outputs, permissions, constraints, side effects, or artifacts
- user preferences about behavior, communication, process, organization, or quality
- AGENTS.md creation, deletion, move, rename, or index contents

Update parent docs when parent-level structure, ownership, workflow, or child index changes. Update child docs when parent changes alter local rules. Remove stale or contradictory text immediately. Small edits that do not change behavior or contracts may leave docs unchanged, but the DOX pass still must happen.

## Hierarchy

- Root AGENTS.md is the DOX rail: project-wide instructions, global preferences, durable workflow rules, and the top-level Child DOX Index
- Child AGENTS.md files own domain-specific instructions and their own Child DOX Index
- Each parent explains what its direct children cover and what stays owned by the parent
- The closer a doc is to the work, the more specific and practical it must be

## Child Doc Shape

- Create a child AGENTS.md when a folder becomes a durable boundary with its own purpose, rules, responsibilities, workflow, materials, or quality standards
- Work Guidance must reflect the current standards of the project or user instructions; if there are no specific standards or instructions yet, leave it empty
- Verification must reflect an existing check; if no verification framework exists yet, leave it empty and update it when one exists

Default section order: Purpose, Ownership, Local Contracts, Work Guidance, Verification, Child DOX Index

## Style

- Keep docs concise, current, and operational
- Document stable contracts, not diary entries
- Put broad rules in parent docs and concrete details in child docs
- Prefer direct bullets with explicit names
- Do not duplicate rules across many files unless each scope needs a local version
- Delete stale notes instead of explaining history

## Closeout

1. Re-check changed paths against the DOX chain
2. Update nearest owning docs and any affected parents or children
3. Refresh every affected Child DOX Index
4. Remove stale or contradictory text
5. Run existing verification when relevant
6. Report any docs intentionally left unchanged and why

## Project Overview

**3C Foods** — AI-powered food recommendation app, built toward a YC application.
Stack: Next.js 15 App Router (TypeScript) · Claude via `@anthropic-ai/sdk` · Neon Postgres
(`@vercel/postgres`) · NextAuth v5 (Google) · Stripe · Resend · PostHog · Recharts · Vercel.
The repo doubles as an Obsidian "LLM Wiki" vault — see `CLAUDE.md` for the vault schema and
`README.md` for the product overview.

## Coding Guidelines

Behavioral coding rules (Think Before Coding, Simplicity First, Surgical Changes,
Goal-Driven Execution) live in the root `rules.md` and a `rules.md` in each directory. DOX
owns **structure and contracts**; `rules.md` owns **coding behavior**. Do not duplicate one
into the other.

## Verification

- `npm run build` — production build must pass before shipping
- `npm run dev` — local smoke test at http://localhost:3000

## User Preferences

- The user pushes for stress-testing of plans/designs ("grill me" style) when reviewing direction.
- Record further durable behavior requests here or in the relevant child AGENTS.md.

## Child DOX Index

- `app/AGENTS.md` — Next.js App Router: pages, layout, routing, and the API subtree
- `lib/AGENTS.md` — shared server utilities (Postgres helpers)
- `wiki/AGENTS.md` — synthesized vault knowledge (index + log)
- `raw/AGENTS.md` — immutable source documents

Not separately indexed (owned by root + `CLAUDE.md`): `public/` (static assets, PWA manifest)
and the `Phase 1–5` vault folders (per-phase task notes; schema defined in `CLAUDE.md`).
