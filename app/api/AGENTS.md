# app/api — Route Handlers

## Purpose

Server-side API endpoints (Next.js Route Handlers). Each subfolder is one endpoint backing
an app feature.

## Ownership

- `auth/[...nextauth]` — NextAuth handler (Google sign-in, callback, session, sign-out)
- `recommend` — Claude call; returns exactly 3 food recommendations as JSON. Enforces the
  free daily search limit (10/day) for non-premium users; respects profile diet/allergy/spice + city
- `favorites` (+ `[id]`) — saved recommendations CRUD
- `lists` (+ `[id]`, `[id]/items`) — user lists and their items
- `searches` — search-history record/retrieve
- `profile` — read/update the signed-in user's profile
- `checkout` — Stripe Checkout session for Premium
- `webhook` — Stripe webhook (subscription/payment events)
- `referral` / `claim` — referral attribution and reward claims
- `leaderboard` — ranked standings
- `metrics` — YC-style product metrics
- `digest` — recap emails via Resend
- `version1` (+ `[id]`) — roadmap/build tasks

## Local Contracts

- Validate input; return JSON with appropriate HTTP status (400 bad input, 401/403 auth, 429 limit)
- Resolve identity from the server session (`auth()`), not request body
- All DB access goes through `lib/db.ts` helpers — no inline SQL in routes

## Work Guidance

- See root `rules.md` for coding behavior rules

## Verification

- `npm run build`

## Child DOX Index

- None. Endpoints are small and documented inline above; do not add per-endpoint docs unless
  one grows its own durable contract.
