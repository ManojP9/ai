---
phase: 1
status: pending
week: "1–2"
tags: [status/pending, phase/1]
---

# Error Handling

**Why**: Real users encounter errors. Without graceful handling, one API timeout becomes a broken blank screen and a churned user.

## Implementation Plan

- Add `error.tsx` (Next.js error boundary) to `app/`
- Add `loading.tsx` skeleton screens for slow AI responses
- Handle Postgres connection failures silently (already done in most routes)
- Add toast notifications for user-facing errors
- Monitor errors in PostHog (capture exceptions)

## Error States to Handle

| Scenario | Current | Target |
|---|---|---|
| Claude API timeout | Falls back to local DB | Show "Slow connection" toast |
| Postgres down | Silent empty state | Log error, show cached results |
| Image 404 | `onError` hides img | Show emoji placeholder |
| Search empty | Shows "No results" | ✅ Already handled |

## Notes

_Add notes here._
