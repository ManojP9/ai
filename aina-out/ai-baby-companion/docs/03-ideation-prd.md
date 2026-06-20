# PRD — AI Baby Companion

> Stage 03 · Ideation · Domain Architect → Stack Selector → Data Modeler → API Designer → UX Composer → NFR Specialist → PRD Synthesizer. Builds on [02-intent-sow](02-intent-sow.md).

### Name

AI Baby Companion — Parent Console

### Elevator pitch

A governance dashboard that lets a parent manage their child's AI companion toy — its personality, its memory, and above all its privacy. It is the control plane for a screen-free, voice-first companion for ages 3–7, where consent, data export, and erasure are one click away.

### Chosen variant

`tier_hardened` — a children's product handling voice PII cannot ship at the lean tier. Auth, encryption, audit, and consent enforcement are mandatory.

### Tech stack (one-line)

Python 3.12 + FastAPI · Jinja2 + HTMX (bundled design system) · Postgres (SQLite for local dev) · Docker on Hetzner VPS

### Features

- **Child profiles** [P0]
  - what: Parent creates and manages a profile per child (name, age band, device pairing).
  - acceptance: (1) Parent can create a child with name + age band; (2) the list shows each child with device status; (3) deleting a child triggers full data erasure across all tables.
  - depends on: `child`, `device` · `/api/children`, `/api/children/{id}` · `/`, `/children/{id}`

- **Consent & parental controls** [P0]
  - what: Parent grants/withdraws consent and toggles mic and camera per child; the server refuses any capture without consent.
  - acceptance: (1) With no consent record, a voice/vision request returns 403; (2) toggling mic off blocks mic processing server-side; (3) every consent/control change writes an audit row.
  - depends on: `consent`, `controls`, `audit_log` · `/api/children/{id}/consent`, `/api/children/{id}/controls` · `/children/{id}/privacy`

- **Conversation history + review** [P0]
  - what: Parent views the child's recent conversation turns (decrypted on read) and can clear them.
  - acceptance: (1) Turns render newest-first with timestamp; (2) stored content is encrypted at rest and only decrypts for the owning parent; (3) "Clear history" purges turns and writes an audit row.
  - depends on: `message`, `audit_log` · `/api/children/{id}/messages` · `/children/{id}`

- **Personality editor** [P0]
  - what: Parent picks a personality preset and adjusts traits; the toy's emotion→expression mapping follows.
  - acceptance: (1) Selecting a preset persists it; (2) trait sliders persist and bound to valid ranges; (3) saved personality is returned by `/api/children/{id}/personality`.
  - depends on: `personality`, `child` · `/api/children/{id}/personality` · `/children/{id}/personality`

- **Data export & erasure** [P0]
  - what: Parent exports all of a child's data (JSON) and can fully erase it.
  - acceptance: (1) Export returns messages + memory + profile + controls + audit; (2) erasure removes the child across every table and confirms; (3) both actions are audited.
  - depends on: all entities · `/api/children/{id}/export`, `DELETE /api/children/{id}` · `/children/{id}/privacy`

- **Audit log view** [P0]
  - what: Parent sees a chronological log of every sensitive action on their child.
  - acceptance: (1) Voice, vision, consent, controls, export, deletion each appear; (2) entries are read-only; (3) filterable by child.
  - depends on: `audit_log` · `/api/children/{id}/audit` · `/children/{id}/audit`

- **Device status & retention** [P1]
  - what: Dashboard shows device online state + battery; old turns auto-expire daily.
  - acceptance: (1) Status reflects last device check-in; (2) a retention job deletes turns older than `RETENTION_DAYS`.
  - depends on: `device`, `message` · `/api/children/{id}/device`, `/api/retention` · `/`

- **OTA firmware manifest** [P1]
  - what: Backend serves a signed firmware version manifest the device checks.
  - acceptance: (1) Manifest returns version + URL + sha256; (2) only newer versions advertised.
  - depends on: `firmware_release` · `/api/firmware` · (no page)

- **Voice loop (device-side)** [P2 — out of dashboard build]
  - what: Deepgram STT → Claude → ElevenLabs TTS on the device path.
  - acceptance: documented contract; gated on consent; covered in dev notes, not the dashboard scaffold.
  - depends on: existing Next.js `/api/companion/*` routes (separate service).

### Data model summary

- **child** — a child profile owned by a parent (name, age_band, created_at).
- **device** — the physical toy paired to a child (serial, status, battery, fw_version).
- **consent** — a verifiable-consent record per child (method, granted_at, withdrawn_at).
- **controls** — per-child mic/camera enable switches, enforced server-side.
- **personality** — preset + trait values for a child.
- **memory** — long-term per-child facts the brain threads forward.
- **message** — one conversation turn (role, content [encrypted], emotion, created_at).
- **audit_log** — append-only record of every sensitive action.
- **firmware_release** — OTA manifest entries (version, url, sha256).

### API contract summary

`/api/children` · `/api/children/{id}/consent` · `/api/children/{id}/controls` · `/api/children/{id}/messages` · `/api/children/{id}/personality` · `/api/children/{id}/memory` · `/api/children/{id}/export` · `/api/children/{id}/audit` · `/api/children/{id}/device` · `/api/retention` · `/api/firmware` · `/healthz`

### NFR highlights

- **Auth + access:** authenticated parent accounts; a parent only ever sees their own children (row-level ownership check on every route). Single-owner per child in V1.
- **Security baseline:** consent enforced server-side (403 without it); conversation content encrypted at rest with AES-256-GCM, key from env/secrets manager; HTTPS only; input validation on all writes.
- **Privacy:** collects a child's voice/optional image — the most sensitive PII; minimized, encrypted, retention-expired, exportable, erasable. Data lives in the parent's region's Postgres.
- **Observability:** structured logs; `/healthz`; plan Sentry + PostHog on the companion routes; alert on 5xx and consent/crypto failures.
- **Cost guardrails:** STT+LLM+TTS are the surprise-bill risk — per-child/per-org budgets and a fast-model fallback (`claude-haiku`) cap spend.

### Open questions

- Q: Which verifiable-consent method ships at launch (email-plus / payment-card / signed form)? Default assumption: payment-card via the existing billing path.
- Q: Is vision/camera in the launch SKU or opt-in V1.5? Default: opt-in, off by default.
- Q: Single-owner accounts only, or family sharing? Default: single-owner V1.
- Q: Launch markets (US / EU / UK) — which consent + residency regime? Default: US-first (COPPA).
- Q: Subscription shape — flat per device vs. usage-tiered on AI minutes? Default: flat with a soft usage cap.

### What's NOT in V1 (deliberate)

- Always-on camera/vision (opt-in still-capture only).
- Multi-parent / family sharing.
- Third-party skill/content marketplace.
- On-device/offline LLM.
- Non-English languages.
