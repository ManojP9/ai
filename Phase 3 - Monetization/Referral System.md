---
phase: 3
status: pending
week: "5–6"
tags: [status/pending, phase/3]
---

# Referral System

**Why**: Referral growth is the metric YC loves most — it proves users find enough value to recommend. It's also the cheapest acquisition channel.

## Implementation Plan

- Generate unique referral code per user on sign-up
- Share link: `https://ai-kohl-nine-89.vercel.app?ref=CODE`
- Reward: referrer gets 1 week free Premium per successful sign-up
- Track in `referrals` table: `referrer_id`, `referred_id`, `created_at`

## Notes

_Add notes here._
