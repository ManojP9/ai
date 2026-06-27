# Operation Log

Append-only. Format: `## [YYYY-MM-DD] phase:N | task | action`

---

## [2026-06-06] phase:all | database | connected Neon Postgres, all tables live
## [2026-06-06] phase:all | version1 | seeded 5 phases + 25 tasks to DB
## [2026-06-06] phase:all | progress | /progress page built with Recharts (donut, stacked bar, radial)
## [2026-06-06] phase:all | favorites | heart button + saved favorites section live
## [2026-06-06] phase:all | searches | recent search history chips live
## [2026-06-06] phase:all | AI search | Claude claude-opus-4-8 integration live
## [2026-06-06] phase:all | deploy | live at https://ai-kohl-nine-89.vercel.app
## [2026-06-06] phase:all | vault | Obsidian wiki initialized with Karpathy LLM pattern
## [2026-06-06] phase:1 | google-sign-in | NextAuth v5 + Google provider, user_id on searches+favorites
## [2026-06-06] phase:1 | analytics | PostHog client + PostHogProvider, tracking search/favorite/share events
## [2026-06-06] phase:1 | pwa | manifest.json + SVG icon + Apple meta tags, installable on phone
## [2026-06-06] phase:1 | share-button | Web Share API + clipboard fallback + toast, PostHog share event
## [2026-06-06] phase:1 | error-handling | error.tsx boundary + loading.tsx skeleton, Toaster for UX errors
## [2026-06-06] phase:1 | COMPLETE | all 5 tasks shipped, deployed to https://ai-kohl-nine-89.vercel.app
## [2026-06-27] phase:all | learn-tracker | added AI Engineering From Scratch course tracker — lib/curriculum.json (20 phases/503 lessons), course_lessons DB + /api/course, /learn coach dashboard, aiefs/ vault notes + Dataview
