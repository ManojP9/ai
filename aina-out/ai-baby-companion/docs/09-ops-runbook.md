# Ops Runbook — AI Baby Companion · Parent Console

> Stage 09 · Ops · Deployment → Monitoring → Runbooks → Go-live. Builds on [06-readiness](06-readiness.md).

## Deployment

**Target:** Docker image on a small VPS (Hetzner) or Fly machine; managed Postgres (Neon).

```bash
cd app
docker build -t companion-console .
docker run -d --name companion -p 8000:8000 \
  -e COMPANION_ENC_KEY="$(cat /run/secrets/enc_key)" \
  -e COMPANION_RETENTION_DAYS=30 \
  -e DATABASE_URL="$NEON_URL" \
  companion-console
```

- Put it behind a TLS-terminating reverse proxy (Caddy/Traefik) — HTTPS only.
- **Never** bake `COMPANION_ENC_KEY` into the image; inject from a secrets manager.
- Schedule the retention cron daily: `curl -fsS -H "X-Cron: $CRON_SECRET" https://<host>/api/retention` (add the cron-secret check when wiring auth).

## Monitoring

### Health & SLOs
- **Liveness/readiness:** `GET /healthz` → `ok` (probe every 15s).
- **SLOs:** console availability ≥ 99.5%; p95 page render < 400ms; **consent-gate correctness = 100%** (a single false-allow is a sev-1).

### Logging
- Structured JSON logs; **never log child message content** (PII) — log child IDs + action types only. The audit log is the record of sensitive actions.

### Alerts
| Alert | Condition | Severity |
|---|---|---|
| 5xx spike | >2% of requests 5m | high |
| Consent/crypto failure | any `403`-gate bypass or decrypt error | **sev-1** |
| AI provider budget | >80% of per-org cap | high |
| Retention cron missed | no run in 26h | medium |
| Health check failing | `/healthz` ≠ ok for 1m | high |

Wire Sentry (errors) + the existing PostHog (product) into the companion routes.

## Runbooks

**App won't start:** check `docker logs companion`; usual cause = missing `COMPANION_ENC_KEY` or `DATABASE_URL`. The app should **fail closed** if the enc key is unset in prod — that's intended, supply the secret.

**Consent gate suspected bypassed (sev-1):** treat as an incident. Take the route offline (scale to 0 / maintenance page), review the audit log for the affected child, confirm `/say` + `/controls` still return 403 without consent (the smoke tests), patch, and notify per the breach plan before restoring.

**AI loop failing / slow:** check provider status (Claude/Deepgram/ElevenLabs); flip the LLM to `claude-haiku`; serve the cached "let's try again" fallback; verify per-org budgets aren't exhausted.

**Bad deploy:** platform instant-rollback to the previous image. For firmware, re-point the OTA manifest to the last known-good `version`.

**Data restore:** redeploy the stateless container; restore Postgres from PITR; rotate provider + enc keys if compromise is suspected.

## Go-live checklist

- [ ] Real auth + per-parent authorization on every route ([05-security](05-security.md) cond. 1)
- [ ] AES-256-GCM at rest; key in secrets manager; app fails closed if unset (cond. 2)
- [ ] Verifiable parental consent flow live (cond. 3)
- [ ] Cron + OTA endpoints authenticated; image-level `sha256`; pinned TLS; Secure Boot (cond. 4)
- [ ] Postgres provisioned + migrations + PITR backups (readiness)
- [ ] CI: build + `pip-audit` + `/healthz` smoke test
- [ ] Sentry + PostHog wired; alerts above configured
- [ ] Per-provider budgets + rate limiting on companion routes
- [ ] Legal sign-off on privacy policy, DPAs, and breach-response plan
- [ ] Beta allowlist before opening signups
