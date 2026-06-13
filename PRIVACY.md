# AI Baby Companion — Privacy & Safety Posture (Phase 5)

This product captures a young child's voice and (optionally) camera. That makes
privacy and child-safety law load-bearing, not optional. This document summarizes
what the codebase implements and what remains for production.

## Implemented

### Consent first (COPPA / GDPR-K)
- No microphone or camera processing happens without **verifiable parental consent**.
  `/api/companion/voice` and `/api/companion/vision` return `403` until a consent
  record exists (`lib/companion/privacy.ts` → `recordConsent`).
- Parents grant/withdraw consent and toggle each sensor in the app
  (`companion-app/app/privacy.tsx`).

### Parental controls
- Per-child **microphone** and **camera** switches, enforced server-side on every request.

### Data minimization & retention
- Conversation turns auto-expire via `/api/companion/retention` (Vercel Cron, daily;
  default 30 days, `COMPANION_RETENTION_DAYS`).

### Encryption
- **In transit:** all endpoints are HTTPS (Vercel) and the device uses TLS.
- **At rest:** stored conversation content is encrypted with AES-256-GCM
  (`lib/companion/crypto.ts`, key in `COMPANION_ENC_KEY`).

### Right to access & erasure (GDPR)
- **Export:** `GET /api/companion/privacy?childId=...&export=1`.
- **Erasure:** `DELETE /api/companion/privacy?childId=...` purges messages, memory,
  profile, controls, push tokens, and audit across all tables.

### Transparency
- Every sensitive action is recorded in an **audit log** (`lib/companion/audit.ts`):
  voice interactions, vision captures, consent, controls changes, export, deletion.

### Secure updates
- OTA firmware update with version manifest (`/api/companion/firmware`,
  `firmware/src/ota.cpp`).

## Required before production (NOT done here)

- **Verifiable parental consent** that meets COPPA's bar (email-plus, payment-card,
  or signed form) — the current email capture is a placeholder.
- **ESP32 Secure Boot + signed app partitions**, and manifest `sha256` verification
  in `ota.cpp`, so a compromised server can't push arbitrary firmware. Pin the TLS
  cert/CA (replace `client.setInsecure()`).
- **Real auth** on the companion app (currently a placeholder token).
- **Manage `COMPANION_ENC_KEY`** in a secrets manager with rotation; never commit it.
- **Monitoring:** wire Sentry (errors) and PostHog (the web app already includes it)
  to the companion routes; alert on `vault_credential`-style failures and 5xx spikes.
- **Legal review** of the privacy policy, data-processing agreements, and a documented
  breach-response plan. A children's product needs counsel — this doc is not legal advice.

## Beta / scale hardening
- Add rate limiting to the companion routes and a beta allowlist before opening signups.
- Load-test the voice loop; set per-org budgets on the LLM/STT/TTS providers.
