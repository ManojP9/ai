---
source: https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
type: reference
ingested: 2026-06-06
---

# Karpathy LLM Wiki Pattern

Three-layer knowledge system for LLM-maintained wikis.

## Layers

1. **raw/** — immutable input documents. Never modified.
2. **wiki/** — LLM-generated markdown pages. Cross-referenced via `[[wikilinks]]`. Two special files: `index.md` (catalog) and `log.md` (append-only chronological record).
3. **Schema** (`CLAUDE.md`) — defines conventions, workflows, behavioral rules.

## Workflows

- **Ingest**: process one source → update 10–15 related wiki pages
- **Query**: read relevant pages → synthesize → file explorations back as new pages
- **Lint**: check for contradictions, stale claims, orphans, missing cross-references

## Log Format

```
## [YYYY-MM-DD] operation | Description
```

## Tools Mentioned

- Obsidian (frontend IDE)
- Obsidian Web Clipper
- Dataview plugin (frontmatter queries)
- qmd (local hybrid BM25/vector search)
