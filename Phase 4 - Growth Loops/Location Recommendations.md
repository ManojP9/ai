---
phase: 4
status: pending
week: "7–8"
tags: [status/pending, phase/4]
---

# Location-Aware Recommendations

**Why**: "Best biryani near me" is a completely different search than "biryani". Adding location turns 3C Foods into a local discovery tool — a far more defensible niche.

## Implementation Plan

- Request `navigator.geolocation` on first search
- Pass lat/lng to Claude prompt: "User is in San Francisco, CA"
- Claude includes location-relevant dishes and regional variations
- Fallback: ask city in a text input if geolocation denied

## Notes

_Add notes here._
