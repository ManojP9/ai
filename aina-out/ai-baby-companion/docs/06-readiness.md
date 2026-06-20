# Readiness Report — AI Baby Companion · Parent Console

> Stage 06 · Readiness · Deploy → Onboarding → Cost → DR. Builds on [05-security](05-security.md).

## Deploy assessment

| Artifact | Present? | Note |
|---|---|---|
| `Dockerfile` | ✅ | From the golden starter; builds the FastAPI app on a port. |
| `requirements.txt` | ✅ | Pinned. |
| Health check | ✅ | `GET /healthz` → `ok` (wire to the platform's liveness probe). |
| `.env.example` | ✅ | Documents `COMPANION_ENC_KEY`, `COMPANION_RETENTION_DAYS`, `COMPANION_FW_VERSION`. |
| CI config | ❌ | **Add** a GitHub Actions workflow: build, `pip-audit`, smoke-test `/healthz`. |
| Persistence | ⚠️ | In-memory only — **provision Neon Postgres** before deploy. |
| Migrations | ❌ | None yet; add once Postgres is wired. |

**Verdict:** deployable as a demo today; **production needs** Postgres, CI, and the security conditions closed.

## Onboarding review

A new operator opening the package finds: a stage-by-stage `docs/` set, a top-level `README.md`, and `app/README.md` from the starter. Running it requires `python3-venv` (this build environment lacked `ensurepip`, so note that explicitly), `pip install -r requirements.txt`, then `uvicorn app.main:app`. The consent gate and at-rest cipher are documented in `docs/04-dev-notes.md`.

**Gaps to close:** the `app/README.md` still describes the generic starter — replace it with companion-specific run/test/deploy steps and a one-line pointer to `docs/`. State the `python3-venv` prerequisite up front.

## Cost model (production, grounded)

Fixed monthly (early beta, hundreds of devices):
- **Console hosting** (FastAPI on a small Hetzner VPS or Fly machine): ~$5–15/mo.
- **Neon Postgres** (small): ~$0–20/mo.
- **Logging/Sentry** (free→team tier): ~$0–26/mo.

Variable (the real driver) — **per active child / month**, dominated by the AI loop:
- **LLM (Claude):** swap to `claude-haiku` for realtime to control token cost.
- **STT (Deepgram) + TTS (ElevenLabs):** TTS is usually the largest line; cache stock phrases.
- Blended estimate **~$1–4/active child/mo** at light use, scaling with talk-minutes.

**Cost triggers:** talk-minutes per child (set a soft cap), TTS on long replies (truncate), and vision (opt-in, off by default). Put **per-org/per-child budgets** on every provider before opening signups; alert at 80%.

## Disaster recovery

- **Backups:** Neon point-in-time recovery / daily branch snapshots once data is on Postgres. The in-memory store has **no durability** — do not run it in prod.
- **Key management:** `COMPANION_ENC_KEY` in a secrets manager with rotation; losing it = permanent loss of all encrypted content (by design). Keep an escrowed copy under strict control.
- **Recovery procedure:** redeploy the container (stateless) + restore Postgres from PITR; rotate provider keys if a leak is suspected.
- **Rollback:** platform instant-rollback for the console; OTA manifest can re-pin a known-good firmware version.
- **RTO/RPO target (beta):** RTO < 1 hr (stateless app + managed DB restore), RPO < 24 hr (daily snapshot) — tighten to PITR (RPO minutes) before GA.

## Readiness verdict

🟡 **Conditional-ready.** Ship the document set and a demo deploy now. Before real children: Postgres + CI + DR (this doc) and the five security conditions ([05-security](05-security.md)) are the gate.
