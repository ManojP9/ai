---
phase: 3
status: pending
week: "5–6"
tags: [status/pending, phase/3]
---

# Delivery App Deep Links

**Why**: Affiliate links to DoorDash/Uber Eats generate revenue per click-through with zero merchant infrastructure needed.

## Implementation Plan

- Add "Order on DoorDash" and "Order on Uber Eats" buttons to FoodCard
- Use affiliate link format: `https://www.doordash.com/search/store/?query=FOOD_NAME`
- Track `order_click` event in PostHog with provider + food_name
- Apply for DoorDash and Uber Eats affiliate programs

## Notes

_Add notes here._
