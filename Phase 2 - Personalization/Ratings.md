---
phase: 2
status: pending
week: "3–4"
tags: [status/pending, phase/2]
---

# Tried It / Ratings

**Why**: Ratings are an engagement signal (return visit) and a data source for better recommendations. They also make the favorites section feel like a personal food journal.

## Implementation Plan

- Add `rating` (1–5) and `tried_at` columns to `favorites` table
- Show star rating UI on saved favorites
- Use ratings to re-rank future Claude prompts ("user rated Indian 5★, rate sushi lower")

## DB Change

```sql
ALTER TABLE favorites ADD COLUMN rating INTEGER CHECK (rating BETWEEN 1 AND 5);
ALTER TABLE favorites ADD COLUMN tried_at TIMESTAMPTZ;
```

## Notes

_Add notes here._
