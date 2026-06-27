# Statement of Work — AI Baby Companion

> Stage 02 · Intent · Domain → Scope → Impact → Longevity → Dependencies → Variants. Builds on [01-braindoc](01-braindoc.md).

## Domain

**Connected children's hardware (consumer "smart toy" + parental SaaS).** This sits at the intersection of three regulated, trust-sensitive worlds: consumer electronics, children's media, and AI.

### Dynamics
- The **buyer is not the user**: the parent purchases, sets up, and governs; the child uses. The product must satisfy two completely different UXs (a governance dashboard vs. a no-screen voice toy).
- **Trust is the product.** A microphone (and camera) in a child's bedroom means a single privacy incident is existential. Parents forgive bugs; they do not forgive surveillance.
- **Hardware + AI + app must move in lockstep** — a firmware expression contract, a backend emotion model, and an app personality editor all describe the same character.
- **Latency is felt by a 4-year-old** — a 3-second pause reads as "broken," so the voice loop's responsiveness is a core feature, not polish.
- **Recurring AI cost per child** (STT + LLM + TTS) means unit economics depend on usage caps, not just hardware margin.

### Constraints
- **COPPA (US)**, **GDPR-K / Article 8 (EU)**, and the **UK Age-Appropriate Design Code** all apply because the subject is a child under 13. Verifiable parental consent, data minimization, and erasure are legally mandatory, not features.
- Consumer-electronics certification (FCC/CE, battery safety) gates physical shipping — out of software scope but on the critical path.

## Executive summary

We are building a screen-free, voice-first AI companion toy for ages ~3–7, governed by a parent app/dashboard, where verifiable consent and full data control are first-class. V1 delivers the device bring-up, the cloud voice loop, per-child personality + memory, and the complete child-safety/compliance layer. The deliberate bet: **win on trust and curation, not on raw assistant breadth.**

## In scope (V1)

- Parent can pair a device over BLE and provision its Wi-Fi from the app.
- Child can hold a multi-turn, kid-safe spoken conversation (Deepgram STT → Claude → ElevenLabs TTS) with per-session memory.
- Parent can choose a personality preset and adjust traits per child; the toy's eyes/servos reflect mapped emotions.
- Parent can view and clear conversation history, and see device status (online, battery).
- Parent can grant/withdraw consent and toggle mic and camera per child; the server enforces these on every request (403 without consent).
- Parent can export and fully erase a child's data; conversation turns auto-expire daily.
- All stored conversation content is encrypted at rest (AES-256-GCM); every sensitive action is audited.
- Firmware can be updated OTA from a signed version manifest.

## Out of scope (V1, deliberate)

- **Always-on vision** — opt-in still-capture only; always-on camera is the single biggest privacy/cost liability.
- **Multi-parent / family sharing** — single-owner accounts first; sharing is a V2 data-model change.
- **Third-party skill/content marketplace** — unbounded, un-curatable content surface; breaks the safety guarantee.
- **On-device / offline LLM** — V1 latency and quality require the cloud loop.
- **Non-English languages** — English-only V1; localization is a deliberate growth lever for later.
- **Institutional/school sales** — different procurement, rostering, and admin model.

### Why these boundaries
Every omission protects the two things that make this defensible: the **safety posture** and a **curated, bounded character**. Each excluded item (open vision, marketplaces, multi-language) widens the content/privacy surface faster than V1 can govern it.

## Impact

### Who benefits
- **Parent · less screen-time guilt + real control · notices** the child plays without a tablet and the dashboard shows exactly what was captured and lets them erase it.
- **Child · an engaging, responsive playmate that remembers them · notices** by asking to play again.
- **The business · a trust moat + recurring revenue · notices** via retention and word-of-mouth among parents.

### Magnitude (needs validation)
- Replaces an estimated **30–60 min/day of screen time** with screen-free play (validate with beta diaries).
- Variable AI cost **~$1–4/active child/month**; target a subscription that holds **>70% gross margin** on software after AI COGS.
- Retention is the headline metric — a child companion lives or dies on **week-4 daily-active rate**.

### Measurement plan (post-launch)
- D1/D7/D30 child engagement (sessions/day, turns/session).
- Consent-completion rate and time-to-first-conversation in setup.
- AI COGS per active child vs. subscription price (margin guardrail).

## Longevity (3-year outlook)

- **Defensibility:** not the LLM (commoditized) — it's the **trust/compliance posture, per-child memory, and the integrated hardware character**. A pure-software clone can't replicate the governed device experience cheaply.
- **Market drift risks:**
  - *Fast (<12 mo):* a big-platform child mode (Alexa Kids+, etc.) bundles "good enough" for free — counter with superior privacy guarantees and a physical character.
  - *Fast:* a regulator tightens consent rules mid-flight — already designed for; keep consent modular.
  - *Slow (3 yr):* on-device LLMs mature and reset the cost/latency/privacy equation — plan a migration path.
- **Kill criteria:** pause if week-4 DAU <20% in beta; pause if AI COGS exceeds subscription price at median usage; **hard stop** on any unresolved consent/data-handling defect.
- **Verdict:** 🟡 **Yellow** — ship as scoped *with* verifiable-consent and legal review treated as launch gates, not fast-follows.

## Dependencies

### Data
- Children's voice (and optional images) — **the most sensitive PII class.** Owned by the parent on the child's behalf; access gated by consent records; minimized and expired by retention cron.

### Vendors
- **Anthropic (Claude)** — the brain; outage = no replies; swap to `claude-haiku` for realtime/cost; set budgets.
- **Deepgram (STT)** / **ElevenLabs (TTS)** — speech in/out; degrade gracefully ("let's try again") and cache stock TTS.
- **Neon Postgres / Vercel** — persistence + hosting; standard managed-service risk; PITR backups.
- **Expo / app stores** — distribution of the parent app; review policies for kids' apps apply.

### Regulatory / compliance
- **COPPA, GDPR-K, UK AADC** — verifiable parental consent (email-plus / payment-card / signed form), data minimization, export, erasure, and a documented breach plan. **Legal review is a launch gate.** This SOW is not legal advice.

## Variants considered

- **A — Cloud voice toy + parent dashboard (chosen).** Best latency/quality for V1; recurring AI cost managed via caps.
- **B — On-device/edge AI toy.** Best privacy story, but V1 latency/quality not achievable; revisit in 18–36 months.
- **C — App-only virtual companion (no hardware).** Cheapest, but loses the screen-free promise and the hardware moat — defeats the core value.

**Chosen: Variant A**, with the architecture deliberately keeping the AI providers and consent layer modular so a future shift toward Variant B is an evolution, not a rewrite.
