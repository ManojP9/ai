---
phase: 1
status: pending
week: "1–2"
tags: [status/pending, phase/1]
---

# Analytics

**Why**: Without metrics there is no proof. PostHog tracks DAU, MAU, search events, click-throughs, and retention curves — all of which appear on the YC application.

## Implementation Plan

- Install PostHog (`posthog-js` + `posthog-node`)
- Add `PostHogProvider` to `layout.tsx`
- Track events: `search`, `favorite_add`, `favorite_remove`, `share`, `order_click`
- Set up retention cohort dashboard in PostHog UI

## Key Events to Track

| Event | Properties |
|---|---|
| `search` | query, result_count, ai_powered |
| `favorite_add` | food_name, food_tag |
| `order_click` | food_name, provider (ubereats/doordash) |
| `share` | food_name, method |

## Notes

_Add notes here._
