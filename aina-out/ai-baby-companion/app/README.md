# AI Baby Companion — Parent Console

The parent-facing control plane for the AI Baby Companion toy. A server-rendered
FastAPI + HTMX app (no client build, no CDN) where a parent manages children,
reviews consent-gated conversation history, edits personality, and exercises the
privacy rights COPPA / GDPR-K require: consent, per-sensor switches, data export,
and erasure.

This is the governance surface generated and verified by the App Factory. The
device voice loop (Deepgram STT → Claude → ElevenLabs TTS), Claude-vision, and
production AES-256-GCM crypto live in the companion's separate Next.js service;
here the data layer is in-memory and the at-rest cipher is a stdlib stand-in, so
the console runs with **zero external services** for review. See `../docs/` for
the full document set (`04-dev-notes.md` for architecture, `05-security.md` for
the security conditions before production).

## Layout
```
app/main.py              FastAPI app — routes, in-memory data layer, at-rest cipher (_enc/_dec)
templates/base.html      Sidebar + topbar + toast shell (every page extends it)
templates/pages/         dashboard (children) · child (detail) · privacy · roadmap
templates/partials/      HTMX response fragments (child_row, message_row)
static/css/app.css       Self-contained design system (light + dark)
static/js/htmx.min.js    Vendored HTMX (pinned, no CDN)
marketing.html           Self-contained landing page (open in a browser)
Dockerfile               Portable deploy unit (VPS / Fly)
.env.example             Required config (see below)
```

## Run locally
```bash
python3 -m venv .venv && source .venv/bin/activate   # requires the python3-venv package
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000            # http://127.0.0.1:8000
```

The console loads pre-seeded with two demo children (Mia — consented; Noah — no
consent) so every screen is populated on first load.

## Configuration

Copy `.env.example` to `.env` and set:

| Var | Purpose | Default |
|-----|---------|---------|
| `APP_NAME` / `APP_TAGLINE` | Branding in the shell | Companion Console |
| `COMPANION_ENC_KEY` | At-rest encryption key (AES-256-GCM in prod; never commit) | dev-insecure key |
| `COMPANION_RETENTION_DAYS` | Days before conversation turns auto-expire | 30 |
| `COMPANION_FW_VERSION` | Version advertised by the OTA manifest | 1.2.0 |

## Key endpoints

| Route | What it does |
|-------|--------------|
| `GET /` | Dashboard — children list, stats, add-child form |
| `GET /children/{id}` | Per-child: history, consent, sensors, personality, audit, erasure |
| `POST /children/{id}/say` | Simulate a device turn — **403 unless consent + mic are on** |
| `POST /children/{id}/consent` · `/controls` · `/personality` | Governance actions (audited) |
| `GET /children/{id}/export` | GDPR access — full JSON export (decrypted on read) |
| `DELETE /children/{id}` | GDPR erasure — purge the child across all tables |
| `POST /api/retention` | Daily cron — drop turns older than the retention window |
| `GET /api/firmware` | OTA manifest (version + url + sha256) |
| `GET /healthz` | Liveness probe → `ok` |

## Deploy
```bash
docker build -t companion-console .
docker run -d -p 8000:8000 \
  -e COMPANION_ENC_KEY="$(cat /run/secrets/enc_key)" \
  -e DATABASE_URL="$NEON_URL" \
  companion-console
```
Run it behind a TLS-terminating reverse proxy (HTTPS only). Full deployment,
monitoring, and the go-live checklist are in `../docs/09-ops-runbook.md`.

## Before production (deliberately stubbed)

- **No auth / no ownership check** — wire real auth; scope every route to the parent's own children.
- **At-rest cipher is a stdlib stand-in** — replace with AES-256-GCM; load the key from a secrets manager; fail closed if unset.
- **Verifiable consent is recorded, not verified** — implement a COPPA-grade consent flow.
- **In-memory store** — swap for Neon Postgres (schema exists in the real backend).

See `../docs/05-security.md` for the full clearance conditions. A children's
product also needs legal sign-off — the docs are not legal advice.
