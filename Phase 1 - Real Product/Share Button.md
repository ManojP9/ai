---
phase: 1
status: pending
week: "1–2"
tags: [status/pending, phase/1]
---

# Share Button

**Why**: Every share is free distribution. A user sharing "Top 3 Italian dishes" on WhatsApp or Twitter is a zero-cost acquisition channel.

## Implementation Plan

- Add share button to `FoodCard` component
- Use Web Share API (`navigator.share`) on mobile
- Fallback: copy link to clipboard on desktop
- Share URL: `/search?q=italian` (pre-filled search)
- Track `share` event in PostHog

## Share Content Format

```
🍕 Top 3 Italian picks from 3C Foods:
1. Margherita Pizza
2. Spaghetti Carbonara
3. Risotto

Find yours → https://ai-kohl-nine-89.vercel.app
```

## Notes

_Add notes here._
