# Security Clearance — AI Baby Companion · Parent Console

> Stage 05 · Security · Threat Model → Dependency Audit → Code Scan → Verdict. Builds on [04-dev-notes](04-dev-notes.md).

### Verdict

**CONDITIONAL**

The console is structurally sound and the consent gate holds, but it carries three deliberately-stubbed items (auth, real crypto, verifiable consent) that **must** be closed before any real child's data touches it. Cleared to proceed to Marketing for the document set; **blocked from production** until the conditions below are met.

## Threat model

### Actors & trust boundaries
- **Parent (authenticated owner)** — trusted within their own children only. *Boundary:* must never read another parent's data.
- **Child (device user)** — interacts via the toy, never the console; cannot be a console actor.
- **The device (ESP32)** — semi-trusted; talks to the backend over TLS and pulls OTA. *Boundary:* a compromised device must not exfiltrate other children's data or push firmware.
- **Background jobs** — retention cron, OTA manifest. *Boundary:* must not be triggerable by unauthenticated callers in prod.
- **AI providers (Claude/Deepgram/ElevenLabs)** — external; child audio/text crosses to them. *Boundary:* data minimization + provider DPAs.

### Highest-risk assets
1. **A child's voice/text and optional images** — the most sensitive PII class here.
2. **`COMPANION_ENC_KEY`** — compromise = all stored content readable.
3. **The OTA path** — compromise = arbitrary code on a device in a child's room.

## Dependency audit

Manifest (`requirements.txt`): `fastapi==0.115.6`, `uvicorn[standard]==0.34.0`, `jinja2==3.1.5`, `python-multipart==0.0.20`.

| Package | Note |
|---|---|
| fastapi 0.115.6 | Current, actively maintained. OK. |
| uvicorn 0.34.0 | Current. OK. |
| jinja2 3.1.5 | OK; autoescaping is **on** by default (XSS-safe for the HTML we render). Keep ≥3.1.4 (prior CVEs fixed). |
| python-multipart 0.0.20 | OK; the version that resolved the earlier ReDoS advisory. |

Supply-chain surface is small and pinned — a strength of the golden stack (no React/npm tree). **Action:** add a `pip-audit`/Dependabot check in CI to catch future CVEs.

## Code scan

**Positive findings (the gate works):**
- Consent enforced server-side: `/say` and `/controls` raise `403` without a consent record (and `/say` also requires mic on). Verified by test, not just asserted.
- Withdrawing consent cascades sensors off — no stale-permission window.
- Conversation content never stored in plaintext (`_enc`/`_dec`); decrypt only on owner read.
- Jinja2 autoescaping on → rendered child names / message text are XSS-safe.
- Toast header is ASCII-sanitized (`_toast`) → no header-injection / 500 vector.

**Findings to fix before production:**

| Sev | Finding | Fix |
|---|---|---|
| 🔴 High | **No authentication / no ownership check.** Any caller can read/erase any child by ID (`/children/{id}`). | Add real auth; scope every route to the authenticated parent's children. |
| 🔴 High | **At-rest cipher is a stdlib XOR stand-in**, not AES-256-GCM, and the default key is `dev-insecure-key-change-me`. | Replace with AES-256-GCM (`lib/companion/crypto.ts` parity); load key from a secrets manager; fail closed if unset in prod. |
| 🟠 Med | **`/api/retention` and `/api/firmware` are unauthenticated.** | Require a cron secret / signed request; the manifest endpoint is read-only but should still rate-limit. |
| 🟠 Med | **Verifiable consent is recorded, not verified** (no payment-card/email-plus proof). | Implement a COPPA-grade consent flow before launch. |
| 🟡 Low | **In-memory store loses data on restart** and isn't multi-instance safe. | Swap for Neon Postgres (schema already exists in the real backend). |
| 🟡 Low | **OTA manifest `sha256` is of the URL, not the binary**, and prod firmware uses `client.setInsecure()`. | Hash the image; pin TLS cert/CA; add Secure Boot + signed partitions. |

## Conditions to clear for production

1. Real auth + per-parent row-level authorization on every route.
2. AES-256-GCM at rest with a managed, rotated key; fail closed if missing.
3. Verifiable parental consent meeting the COPPA bar.
4. Auth/secret on cron + OTA endpoints; image-level `sha256` + pinned TLS + Secure Boot.
5. Persistence on Postgres; `pip-audit`/Dependabot in CI.

This is a security review of the generated scaffold, not legal advice. A children's product also needs counsel sign-off (see readiness + braindoc open questions).
