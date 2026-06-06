---
phase: 1
status: pending
week: "1–2"
tags: [status/pending, phase/1]
---

# Google Sign-In

**Why**: Without auth there are no users — only sessions. Auth unlocks favorites per-user, cross-device search history, personalization, and real retention metrics.

## Implementation Plan

- Install `next-auth` + Google OAuth provider
- Wrap app in `SessionProvider`
- Add sign-in button to header
- Store `user_id` in `searches` and `favorites` tables
- Gate personalization features behind auth

## DB Changes

```sql
ALTER TABLE searches  ADD COLUMN user_id TEXT;
ALTER TABLE favorites ADD COLUMN user_id TEXT;
```

## Notes

_Add notes here._
