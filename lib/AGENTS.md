# lib — Shared Server Utilities

## Purpose

Shared server-side utilities used by the API routes.

## Ownership

- `db.ts` — all Neon Postgres query helpers (`@vercel/postgres`): profiles, favorites, lists,
  searches, premium status, daily search counts, metrics, etc.

## Local Contracts

- This is the single home for SQL. API routes import helpers from here; they do not write
  raw queries themselves.
- Keep helpers small and named for what they return; handle their own errors so callers can
  `.catch()` to a safe default.

## Work Guidance

- See root `AGENTS.md` → Coding Guidelines for coding behavior rules

## Verification

- `npm run build`

## Child DOX Index

- None
