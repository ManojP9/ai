---
phase: 2
status: pending
week: "3–4"
tags: [status/pending, phase/2]
---

# Dietary Profile

**Why**: A dietary profile is the single clearest niche signal. "AI food recs for vegans" is a defensible position. Generic food recs are not.

## Implementation Plan

- Add `profiles` table to Postgres
- Profile fields: `dietary` (vegan/vegetarian/halal/gluten-free/none), `spice_level` (mild/medium/hot), `allergies` (text)
- Settings page at `/profile`
- Store profile in DB linked to user_id (from [[Google Sign-In]])

## DB Schema

```sql
CREATE TABLE profiles (
  user_id     TEXT PRIMARY KEY,
  dietary     TEXT DEFAULT 'none',
  spice_level TEXT DEFAULT 'medium',
  allergies   TEXT,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
```

## Notes

_Add notes here._
