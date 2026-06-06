---
phase: 2
status: pending
week: "3–4"
tags: [status/pending, phase/2]
---

# Weekly Email Digest

**Why**: Email is the highest-retention channel. A weekly "Your top picks this week" email brings lapsed users back without ads.

## Implementation Plan

- Use Resend (free tier: 3,000 emails/mo) for transactional email
- Cron job via Vercel Cron: every Monday 9am
- Fetch each user's dietary profile + top-rated food tags
- Generate personalised top-3 via Claude
- Send HTML email with food cards

## Notes

_Add notes here._
