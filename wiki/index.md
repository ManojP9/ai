# 3C Foods · Wiki Index

AI-powered food recommendation app targeting YC application.
Live: https://ai-kohl-nine-89.vercel.app

## Current Status

| Phase | Goal | Status | Progress |
|---|---|---|---|
| [[Phase 1 - Real Product/overview\|Phase 1]] | Foundation | ✅ Done | 5/5 |
| [[Phase 2 - Personalization/overview\|Phase 2]] | Retention | 🟣 Pending | 0/5 |
| [[Phase 3 - Monetization/overview\|Phase 3]] | Revenue | 🟢 Pending | 0/5 |
| [[Phase 4 - Growth Loops/overview\|Phase 4]] | Acquisition | 🔵 Pending | 0/5 |
| [[Phase 5 - YC Ready/overview\|Phase 5]] | Application | 🩷 Pending | 0/5 |

## Tech Stack

- **Framework**: Next.js 15.3.9 (App Router, TypeScript)
- **AI**: Claude `claude-opus-4-8` via `@anthropic-ai/sdk`
- **Database**: Neon Postgres via `@vercel/postgres`
- **Styling**: Tailwind CSS v3 + custom glassmorphism
- **Hosting**: Vercel (`test-s-project2`)
- **Charts**: Recharts.js

## Key Files

- `app/page.tsx` — home page (search, favorites, recent searches)
- `app/progress/page.tsx` — build tracker with charts
- `app/api/recommend/route.ts` — Claude AI search
- `app/api/favorites/` — favorites CRUD
- `app/api/searches/` — search history
- `app/api/version1/` — roadmap tasks
- `lib/db.ts` — all Postgres helpers

## Pages

| URL | Description |
|---|---|
| `/` | Food search + favorites |
| `/progress` | Phase tracker with Recharts |
| `/api/version1` | Roadmap JSON |

## Dataview: Active Tasks

```dataview
TABLE phase, week, status
FROM ""
WHERE status = "active"
SORT phase ASC
```
