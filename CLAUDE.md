# 3C Foods · Vault Schema

This vault follows the Karpathy LLM Wiki pattern. Three layers:

1. **raw/** — immutable source documents (never edited)
2. **Phase folders** — living notes per feature/task, updated as work progresses
3. **wiki/** — synthesized knowledge: index, log, cross-references

## Folder Map

| Folder | Color | Purpose |
|---|---|---|
| `Phase 1 - Real Product` | 🟠 Orange | Week 1–2 foundation features |
| `Phase 2 - Personalization` | 🟣 Violet | Week 3–4 retention features |
| `Phase 3 - Monetization` | 🟢 Emerald | Week 5–6 revenue features |
| `Phase 4 - Growth Loops` | 🔵 Blue | Week 7–8 acquisition features |
| `Phase 5 - YC Ready` | 🩷 Pink | Metrics + application targets |
| `wiki/` | 📖 Slate | Index, log, synthesis pages |
| `raw/` | 🗄️ Gray | Immutable references |

## Frontmatter Convention

Every task note must include:
```yaml
---
phase: 1          # 1–5
status: pending   # pending | active | done | blocked
week: "1–2"
tags: [status/pending, phase/1]
---
```

## Status Tags

- `#status/pending` — not started
- `#status/active` — in progress
- `#status/done` — shipped
- `#status/blocked` — waiting on dependency

## Workflows

**Ingest** — when new context arrives (user message, decision, error):
1. Find the relevant task note in the phase folder
2. Update its status and add a `## Notes` entry
3. Append a line to `wiki/log.md`

**Query** — when answering about project state:
1. Read `wiki/index.md` for orientation
2. Read the relevant phase overview
3. Read individual task notes as needed
4. Synthesize — do not guess

**Lint** (weekly) — health check:
1. Scan for tasks marked `active` with no recent log entry
2. Flag `blocked` tasks with no blocker named
3. Update `wiki/index.md` phase summaries

## Log Format

```
## [YYYY-MM-DD] phase:N | task | action
```
