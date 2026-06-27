---
tags: [course/aiefs, dashboard]
---

# AI Engineering From Scratch · Tracker

Source: [rohitg00/ai-engineering-from-scratch](https://github.com/rohitg00/ai-engineering-from-scratch) · 20 phases · 503 lessons · ~320h
Live web dashboard: `/learn` · Catalog generated 2026-06-27

## Phases

| Phase | Topic | Lessons | Status |
|---|---|---|---|
| [[phases/00-setup-and-tooling\|Phase 00]] | Setup And Tooling | 12 | `pending` |
| [[phases/01-math-foundations\|Phase 01]] | Math Foundations | 22 | `pending` |
| [[phases/02-ml-fundamentals\|Phase 02]] | ML Fundamentals | 18 | `pending` |
| [[phases/03-deep-learning-core\|Phase 03]] | Deep Learning Core | 13 | `pending` |
| [[phases/04-computer-vision\|Phase 04]] | Computer Vision | 28 | `pending` |
| [[phases/05-nlp-foundations-to-advanced\|Phase 05]] | NLP Foundations To Advanced | 29 | `pending` |
| [[phases/06-speech-and-audio\|Phase 06]] | Speech And Audio | 17 | `pending` |
| [[phases/07-transformers-deep-dive\|Phase 07]] | Transformers Deep Dive | 16 | `pending` |
| [[phases/08-generative-ai\|Phase 08]] | Generative AI | 15 | `pending` |
| [[phases/09-reinforcement-learning\|Phase 09]] | Reinforcement Learning | 12 | `pending` |
| [[phases/10-llms-from-scratch\|Phase 10]] | LLMS From Scratch | 24 | `pending` |
| [[phases/11-llm-engineering\|Phase 11]] | LLM Engineering | 17 | `pending` |
| [[phases/12-multimodal-ai\|Phase 12]] | Multimodal AI | 25 | `pending` |
| [[phases/13-tools-and-protocols\|Phase 13]] | Tools And Protocols | 23 | `pending` |
| [[phases/14-agent-engineering\|Phase 14]] | Agent Engineering | 42 | `pending` |
| [[phases/15-autonomous-systems\|Phase 15]] | Autonomous Systems | 22 | `pending` |
| [[phases/16-multi-agent-and-swarms\|Phase 16]] | Multi Agent And Swarms | 25 | `pending` |
| [[phases/17-infrastructure-and-production\|Phase 17]] | Infrastructure And Production | 28 | `pending` |
| [[phases/18-ethics-safety-alignment\|Phase 18]] | Ethics Safety Alignment | 30 | `pending` |
| [[phases/19-capstone-projects\|Phase 19]] | Capstone Projects | 85 | `pending` |

## Next up (incomplete lessons)

```dataview
TASK FROM "aiefs/phases"
WHERE !completed
GROUP BY file.link
LIMIT 30
```

## Progress rollup

```dataview
TABLE
  length(filter(file.tasks, (t) => t.completed)) AS Done,
  length(file.tasks) AS Total
FROM "aiefs/phases"
SORT file.name ASC
```

## How this works

- Each phase note holds a checkbox per lesson — tick them as you finish.
- The **web tracker** at `/learn` mirrors this list (Postgres-backed) with charts and a coach that tells you the next lesson and your finish date.
- Re-run `node scripts/sync-curriculum.mjs && node scripts/gen-vault.mjs` to refresh the catalog; existing checkmarks are preserved.
