---
phase: 3
status: pending
week: "5–6"
tags: [status/pending, phase/3]
---

# Premium Tier

**Why**: A $5/mo subscription proves willingness to pay and gives a predictable MRR number for the YC application.

## Implementation Plan

- Use Stripe Checkout for payment
- Free tier: 5 AI searches/day
- Premium ($5/mo): unlimited AI searches + priority results
- Store `subscription_status` in `profiles` table
- Enforce limit via `search_count_today` in DB

## Notes

_Add notes here._
