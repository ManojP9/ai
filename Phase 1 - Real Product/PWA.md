---
phase: 1
status: pending
week: "1–2"
tags: [status/pending, phase/1]
---

# PWA (Progressive Web App)

**Why**: Food decisions happen on phones. An installable PWA gives a native-app feel without an App Store submission.

## Implementation Plan

- Add `manifest.json` to `public/`
- Add service worker via `next-pwa` package
- Set `theme_color`, `background_color`, icons (192px, 512px)
- Add `<meta name="viewport">` and Apple-specific meta tags
- Test "Add to Home Screen" prompt on iOS and Android

## manifest.json

```json
{
  "name": "3C Foods",
  "short_name": "3C Foods",
  "theme_color": "#07070f",
  "background_color": "#07070f",
  "display": "standalone",
  "start_url": "/"
}
```

## Notes

_Add notes here._
