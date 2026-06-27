# Dev Notes — AI Baby Companion · Parent Console

> Stage 04 · Dev · seeded from the FastAPI + HTMX golden starter, extended into the Parent Console, run and verified. Builds on [03-ideation-prd](03-ideation-prd.md).

## What was built

The buildable V1 surface from the PRD: the **parent governance console** — the control plane where a parent manages children, reviews consent-gated conversation, edits personality, and exercises every privacy right. It is a server-rendered FastAPI + HTMX app (no client build step, no CDN) extending the golden starter's design system.

The **device voice loop** (Deepgram STT → Claude → ElevenLabs TTS), Claude-vision, and the production AES-256-GCM crypto are the companion's existing Next.js service and ESP32 firmware — out of this scaffold's scope but represented here as contracts and a simulated turn endpoint.

## Architecture

```
app/
  app/main.py            # FastAPI app: routes, in-memory data layer, at-rest cipher
  templates/
    base.html            # design-system shell (sidebar/topbar/toasts) — unchanged
    pages/
      dashboard.html     # children list + add-child form + stats
      child.html         # per-child: history, consent, sensors, personality, audit, danger zone
      privacy.html       # rights overview + per-child controls table
      roadmap.html       # what's built vs coming
    partials/
      child_row.html     # HTMX row (append on create, swap on erase)
      message_row.html   # HTMX conversation turn
  static/css/app.css     # bundled design system (unchanged)
  static/js/htmx.min.js  # vendored HTMX (unchanged)
  requirements.txt · Dockerfile · .env.example
```

**Data model (in-memory dict; production = Neon Postgres):** `child` holds nested `device`, `traits`, `consent/mic/camera`, `messages`, `memory`, `audit`. Mirrors the PRD entities.

### Key design decisions

- **Consent enforced server-side, not in the UI.** `/children/{id}/say` and `/children/{id}/controls` raise `403` unless a consent record exists *and* (for `/say`) the mic is enabled. The checkboxes are disabled in the template too, but the server is the source of truth — exactly the posture of the real `/api/companion/voice` route (`lib/companion/privacy.ts`).
- **Withdrawing consent cascades.** It flips mic + camera off, so a later turn is refused again. Verified.
- **Encryption at rest.** Conversation content is stored via `_enc()` and only decrypted on read (`_dec()`). This is a dependency-free stdlib stand-in (HMAC-keystream XOR + base64) so the console runs with zero external services; the **production cipher is AES-256-GCM** (`lib/companion/crypto.ts`, key in `COMPANION_ENC_KEY`). The stand-in is clearly labeled in code — do not ship it.
- **Audit everything.** Every sensitive action (consent, controls, personality, voice, export, erasure, creation) appends an audit row, surfaced on the child page.
- **Retention + OTA as endpoints.** `POST /api/retention` (daily cron) prunes turns older than `COMPANION_RETENTION_DAYS`; `GET /api/firmware` serves a version manifest with a `sha256` for the device to verify.

## How to run

```bash
cd app
python3 -m venv .venv && . .venv/bin/activate   # needs python3-venv
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# open http://127.0.0.1:8000
```

Docker: `docker build -t companion-console . && docker run -p 8000:8000 companion-console`.

Env (`.env.example`): `APP_NAME`, `COMPANION_ENC_KEY`, `COMPANION_RETENTION_DAYS`, `COMPANION_FW_VERSION`.

## Verification (actually run, not assumed)

Ran `uvicorn` on a free port and exercised every route with `curl`:

| Check | Result |
|---|---|
| `GET /healthz` | `200 ok` |
| `GET /` dashboard renders children (Mia/Noah, consent badges) | ✅ |
| `GET /children/1` renders history + all governance cards | ✅ |
| `POST /children/2/say` with **no consent** | **403** ✅ (gate holds) |
| `POST /children/2/controls mic=1` with **no consent** | **403** ✅ |
| Grant consent → enable mic → `POST /say` | `200` ✅ |
| Withdraw consent → `POST /say` | **403** again ✅ (cascade works) |
| `POST /children` (create) | `200`, returns HTMX row ✅ |
| `DELETE /children/{id}` (erase) | `200` ✅ |
| `GET /children/1/export` | JSON, content **decrypted** on read ✅ |
| `GET /api/firmware` | manifest with `sha256` ✅ |
| `POST /api/retention` | `{"removed":0,...}` ✅ |

## What's stubbed / not production

- **In-memory data layer** — swap for Neon Postgres (the real backend already has the schema).
- **At-rest cipher is a stdlib stand-in** — replace with AES-256-GCM before any real data.
- **No auth** — the console assumes a single parent; wire real auth (the app's placeholder token must be replaced) and a row-level ownership check on every route.
- **Verifiable consent is recorded but not verified** — the `payment-card`/`email-plus` flow that meets the COPPA bar is the launch gate (see security + readiness docs).
- **Voice loop is simulated** — `/say` echoes a canned reply; the real loop is the Next.js companion service.
