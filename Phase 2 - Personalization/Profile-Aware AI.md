---
phase: 2
status: pending
week: "3–4"
tags: [status/pending, phase/2]
---

# Profile-Aware AI Recommendations

**Why**: Generic "top 3 Italian" recommendations are a demo. "Top 3 vegan Italian dishes for someone who avoids gluten" is a product.

## Implementation Plan

- Fetch user profile from DB in `/api/recommend`
- Inject profile into Claude system prompt
- Only active when user is signed in (falls back to generic otherwise)

## Updated System Prompt

```
You are a food recommendation expert. The user has these preferences:
- Dietary: {{dietary}}
- Spice level: {{spice_level}}
- Allergies/avoid: {{allergies}}

Strictly respect these preferences. Recommend 3 dishes as JSON...
```

## Notes

_Add notes here._
