---
phase: 2
status: pending
week: "3–4"
tags: [status/pending, phase/2]
---

# Per-User Search History

**Why**: Currently search history is anonymous and per-device. Tying it to a user_id makes it cross-device and enables personalization ("you always search for spicy food").

## Implementation Plan

- Add `user_id` column to `searches` table (already planned in [[Google Sign-In]])
- Filter `getRecentSearches()` by `user_id` when logged in
- Show personalised chips: "Your recent searches"

## Notes

_Add notes here._
