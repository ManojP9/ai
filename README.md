# 3C Foods

AI-powered food recommendation app, built toward a YC application.

**Live:** https://ai-kohl-nine-89.vercel.app

## What it does

Search for what you're craving and get AI-generated food recommendations powered by Claude. Save favorites, build lists, track your search history, and share picks with friends. Built as a full product across five development phases — from a real product foundation through personalization, monetization, growth loops, and YC-readiness metrics.

## Features

- 🔍 **AI search** — natural-language food recommendations via Claude (`@anthropic-ai/sdk`)
- ❤️ **Favorites & lists** — save and organize recommendations
- 👤 **Profiles & personalization** — Google sign-in, per-user search history
- 🏆 **Leaderboard & referrals** — growth loops and social sharing
- 💳 **Premium tier** — Stripe checkout with search limits for free users
- 📊 **Progress tracker** — interactive Recharts dashboard at `/progress`
- 📈 **Metrics** — YC-style metrics page at `/metrics`
- 📱 **PWA** — installable with offline manifest

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15.3.9 (App Router, TypeScript) |
| AI | Claude via `@anthropic-ai/sdk` |
| Database | Neon Postgres via `@vercel/postgres` |
| Auth | NextAuth v5 (Google sign-in) |
| Payments | Stripe |
| Email | Resend (digest emails) |
| Analytics | PostHog |
| Styling | Tailwind CSS v3 |
| Charts | Recharts |
| Hosting | Vercel |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment

Create a `.env.local` with the required keys (Anthropic, Postgres, NextAuth/Google, Stripe, Resend, PostHog). See `.env.local` for the full list of variables.

## Scripts

```bash
npm run dev     # start dev server
npm run build   # production build
npm run start   # serve production build
```

## Project Structure

```
app/
  page.tsx          # home — food search + favorites
  api/recommend/    # Claude AI search endpoint
  api/favorites/    # favorites CRUD
  api/searches/     # search history
  api/lists/        # user lists
  api/checkout/     # Stripe checkout
  api/webhook/      # Stripe webhooks
  api/referral/     # referral tracking
  api/digest/       # email digests
  profile/ lists/ leaderboard/ premium/ metrics/ progress/
lib/db.ts           # Postgres helpers
wiki/               # project knowledge base (index, log)
Phase 1–5 …/        # per-phase task notes
```

## Roadmap

| Phase | Goal | Status |
|---|---|---|
| Phase 1 — Real Product | Foundation | ✅ |
| Phase 2 — Personalization | Retention | ✅ |
| Phase 3 — Monetization | Revenue | ✅ |
| Phase 4 — Growth Loops | Acquisition | ✅ |
| Phase 5 — YC Ready | Metrics | ✅ |

See `/progress` in the app for the live build tracker.
