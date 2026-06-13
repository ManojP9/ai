# app — Next.js App Router

## Purpose

Route segments (pages), the shared layout, global styles, and the `api/` route handlers.
Each folder maps to a URL path.

## Ownership

- Owns: all user-facing pages and the API endpoints under `api/`
- Pages present here: `claim`, `embed`, `leaderboard`, `lists` (+ `[id]`), `metrics`,
  `premium`, `profile`, `progress`, and the root `page.tsx` (food search + favorites)

## Local Contracts

- Server components by default; mark client components with `"use client"`
- Auth via NextAuth v5 (`@/auth`); read the session, never trust client-supplied identity
- UI calls its own `api/*` routes; never query Postgres directly from a page

## Work Guidance

- See root `rules.md` for coding behavior rules

## Verification

- `npm run build`

## Child DOX Index

- `api/AGENTS.md` — server-side route handlers (all backend endpoints)
