# Braindoc — AI Baby Companion

> Stage 01 · Braindoc · synthesized from the existing AI Baby Companion codebase (firmware, companion app, Next.js backend, privacy posture) used as the PRD/AIR brief.

## Summary

AI Baby Companion is a screen-free, voice-first plush toy for young children, paired with a parent phone/web app. The toy (an ESP32-S3 device with mic, speaker, RGB "eyes", servos, and an optional camera) holds short, kid-safe conversations powered by Claude, with Deepgram speech-to-text in and ElevenLabs text-to-speech out. Parents own a dashboard that controls consent, personality, and data — because the product records a child's voice and face, COPPA/GDPR-K compliance is the load-bearing feature, not an afterthought.

## The problem

Parents of 3–7 year olds want an alternative to tablets and YouTube: something that engages a child's imagination through conversation and play rather than a glowing screen. The workarounds today are passive (audio storybooks, "smart speakers" not designed for children) or screen-based (tablet apps), and none give the parent real, enforceable control over what is captured, stored, or said. Generic voice assistants are not built to a child-safety bar, retain data opaquely, and have no per-child personality or memory. The cost is parental guilt over screen time plus a genuine privacy exposure when a microphone in a child's room has no consent gate or retention limit.

## Users

**Primary — the parent (account owner & safety authority).**
- *JTBD:* Give my kid a fun, safe talking companion while keeping firm control of privacy, content, and screen-free time.
- *Context:* Sets up the device once (pairs over Bluetooth, hands it Wi-Fi), then manages it from a phone or web dashboard a few times a week — checking in, adjusting personality, reviewing/erasing history.
- *Success signal:* The child plays with the toy daily; the parent feels in control and recommends it to other parents.

**Secondary — the child (end user of the device).**
- *JTBD:* Talk, play, and be entertained by a friendly character that remembers me.
- *Context:* At home, hands-free, ages ~3–7, cannot read; the entire interface is voice + lights + motion.
- *Success signal:* Asks to play with it; laughs; comes back.

**Anti-personas.**
- *General-purpose smart-home buyers* — they want Alexa/Google features (timers, music, shopping). Building for them turns a curated child-safe toy into an unbounded assistant and breaks the safety model.
- *Older kids / tweens (10+)* — want open internet, messaging, app installs; serving them dissolves the kid-safe content guarantees and the COPPA framing.
- *Schools / institutional buyers (V1)* — multi-tenant admin, rostering, and procurement are a different product; chasing them now distorts the consumer flow.

## V1 scope

**In:**
- Device bring-up & pairing: parent pairs the toy over BLE and provisions Wi-Fi from the app.
- Voice loop: hold/ambient capture → Deepgram STT → kid-safe Claude brain → ElevenLabs TTS, with per-session memory.
- Per-child personality presets + traits, persisted, and a long-term memory per child.
- Emotion → expression mapping that drives the toy's eyes/servos (expressions contract shared firmware↔backend).
- Parent dashboard: manage children, view/clear conversation history, set personality, see device status (online, battery).
- Consent & parental controls: per-child mic/camera switches, enforced server-side; consent required before any capture.
- Data rights: export and full erasure per child; daily retention expiry of conversation turns.
- Encryption at rest (AES-256-GCM) + audit log of every sensitive action.
- OTA firmware update path with a signed version manifest.

**Out (deliberate V1 omissions):**
- Always-on camera / vision features beyond an opt-in still-capture — highest privacy and cost risk; gate behind explicit consent, keep minimal.
- Multi-parent / family-sharing accounts — V2 once single-owner flow is solid.
- Third-party "skills"/content marketplace — unbounded surface, breaks curation.
- Offline/on-device LLM — latency and model quality not there for V1; cloud loop ships first.
- Multi-language — English-only V1; localization is a V2 growth lever.

## Economics

- **Build:** ~8–12 engineer-weeks for the V1 software set already reflected in the codebase phases (firmware bring-up, voice loop, app, intelligence, safety) — **fits CONDITIONAL**: software fits, but hardware (BOM, certification, tooling) is a separate capital line not covered here. Biggest cost driver: the real-time voice loop quality + the child-safety/consent plumbing.
- **Monthly infra (per active device, rough):** hosting/compute (Vercel Functions) low; the variable cost is the AI pipeline — STT (Deepgram) + LLM (Claude) + TTS (ElevenLabs) — call it **~$1–4/active child/mo** at light use, dominated by TTS and LLM tokens. Postgres (Neon) + cron + blob are minor. Set per-org budgets.
- **Value:** screen-free engagement parents will pay a hardware premium + subscription for; the defensible asset is the safety/consent posture and per-child memory, not the LLM itself.

## Risks & dependencies

- **Provider dependency (Claude / Deepgram / ElevenLabs)** — any outage kills the voice loop; mitigate with graceful "let's try again" fallbacks, model swap to `claude-haiku` for realtime, and per-provider budgets/alerts.
- **Child-safety law (COPPA / GDPR-K)** — verifiable parental consent must meet the legal bar; current email capture is a placeholder. Mitigate: implement email-plus/payment-card consent + legal review before any real child uses it.
- **Hardware caveats baked into the spec** — (1) camera DVP lines clash with the touch sensors on GPIO1/2/3; (2) ESP32-S3 has no DAC, so real voice playback needs a MAX98357A I2S amp (Phase-1 used a PWM tone). Mitigate: pin remap in `pins.h`, BOM change for audio.
- **OTA supply-chain risk** — a compromised server could push arbitrary firmware. Mitigate: Secure Boot + signed partitions + manifest `sha256` verification + pinned TLS (replace `client.setInsecure()`).
- **Latency / UX** — a slow voice loop feels broken to a 4-year-old. Mitigate: stream, use the fast model, cache TTS for stock phrases.

## DevOps & Deployment

- **Hosting target:** Vercel (Next.js backend + parent web dashboard); the parent app is Expo (React Native) shipped via app stores; firmware flashed via PlatformIO / OTA.
- **Runtime + framework:** Node/Next.js App Router (backend, web); Expo SDK 51 (mobile); Arduino-ESP32 2.0.x (firmware). The factory's seeded dashboard companion is FastAPI + HTMX (see dev stage).
- **Database & persistence:** Neon Postgres (`@vercel/postgres`) — children, profiles, memory, messages, controls, audit, push tokens. Conversation content encrypted at rest; daily retention cron prunes old turns. Back up via Neon branching/PITR.
- **Secrets & config:** `ANTHROPIC_API_KEY`, `DEEPGRAM_API_KEY`, `ELEVENLABS_API_KEY`, `COMPANION_ENC_KEY` (AES-256 key — secrets manager, rotated, never committed), `POSTGRES_URL`, `COMPANION_RETENTION_DAYS`.
- **Observability:** Vercel logs today; **plan to add Sentry** (errors) and wire the existing PostHog into the companion routes; alert on 5xx spikes and consent/crypto failures.
- **CI/CD:** GitHub → Vercel preview deploys on PR, `main` → production. Firmware via PlatformIO build + OTA manifest publish.
- **Rollback story:** Vercel instant rollback for the backend; OTA manifest can pin/republish a known-good firmware version.
- **Scaling envelope:** Comfortable for early beta (hundreds of devices). The voice loop is the ceiling — at scale add a queue/worker for STT/TTS and per-org provider budgets before opening signups.

## Delivery

- **Phase 1 — Device bring-up (Wk 1–2):** firmware self-test of power, I2C, audio, touch/eyes, servos, connectivity. *Parent can:* power on a device that passes self-test.
- **Phase 2–3 — Voice loop + app (Wk 3–5):** STT→Claude→TTS slice + parent Expo app (pair, provision, settings, status). *Parent can:* pair the toy, give it Wi-Fi, and have the child hold a basic conversation.
- **Phase 4–5 — Intelligence + safety (Wk 6–8):** personality/memory/emotion-expression, vision (opt-in), consent + parental controls + export/erasure + retention + encryption + audit + OTA. *Parent can:* customize personality and fully control privacy/data.

**Definition of done (V1):**
- A child can hold a multi-turn, kid-safe conversation with acceptable latency.
- No mic/camera processing occurs without a recorded parental consent; mic/camera switches enforced server-side.
- Parent can export and fully erase a child's data; old turns auto-expire.
- Stored content is encrypted at rest and every sensitive action is audited.
- Firmware can be updated OTA from a signed manifest.

## Open questions

- Q: What is the verifiable-consent mechanism for launch (email-plus, payment-card, signed form)? — Determines legal viability; guessing wrong is a compliance failure on a children's product.
- Q: Is the camera/vision feature in the launch SKU, or opt-in V1.5? — Drives the GPIO remap, BOM, privacy review, and cost.
- Q: Single-owner accounts only, or family sharing at launch? — Changes the auth/data model.
- Q: Which markets at launch (US COPPA vs EU GDPR-K vs UK Age-Appropriate Design)? — Different consent + data-residency obligations.
- Q: Subscription model — per-device flat, or usage-tiered on AI minutes? — Drives budget caps and billing.
- Q: Real auth backend for the app (currently a placeholder token) — owned by whom, by when?

## Assumptions made

- The product is consumer (home), single-owner account, English-only, ages ~3–7 for V1.
- Cloud AI loop (not on-device) is acceptable for latency at launch.
- Hardware BOM, certification, and unit economics are tracked separately from this software braindoc.
- Vision/camera is opt-in and minimal in V1, not always-on.
- The existing codebase phases (1–5) represent the intended V1 software scope.
