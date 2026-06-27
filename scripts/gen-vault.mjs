#!/usr/bin/env node
// Generates the Obsidian vault tracker for the AI Engineering From Scratch
// course from lib/curriculum.json:
//   aiefs/index.md            — dashboard (always regenerated)
//   aiefs/phases/NN-slug.md   — one note per phase with a lesson checklist
//                               (written only if absent, so checked boxes survive)
//
// Usage: node scripts/gen-vault.mjs

import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const AIEFS = join(ROOT, "aiefs");
const PHASES_DIR = join(AIEFS, "phases");

const exists = (p) => access(p, constants.F_OK).then(() => true, () => false);

function phaseNote(phase) {
  const tag = phase.num;
  const lines = phase.lessons.map(
    (l) => `- [ ] **${l.num}** — ${l.title} · [docs](${l.docsUrl}) · [code](${l.codeUrl})`
  );
  return `---
phase: ${parseInt(phase.num, 10)}
status: pending
lessonCount: ${phase.lessons.length}
tags: [course/aiefs, phase/${tag}]
---

# Phase ${phase.num} — ${phase.title}

> Part of [[index|AI Engineering From Scratch]]. Check a box when a lesson is done.

## Lessons (${phase.lessons.length})

${lines.join("\n")}

## Notes

_Capture key takeaways, gotchas, and links to your own code here as you go._
`;
}

function indexNote(catalog) {
  const rows = catalog.phases
    .map((p) => {
      const link = `[[phases/${p.num}-${slug(p)}\\|Phase ${p.num}]]`;
      return `| ${link} | ${p.title} | ${p.lessons.length} | \`pending\` |`;
    })
    .join("\n");

  return `---
tags: [course/aiefs, dashboard]
---

# AI Engineering From Scratch · Tracker

Source: [${catalog.repo}](https://github.com/${catalog.repo}) · ${catalog.totalPhases} phases · ${catalog.totalLessons} lessons · ~${catalog.totalHours}h
Live web dashboard: \`/learn\` · Catalog generated ${catalog.generatedAt.slice(0, 10)}

## Phases

| Phase | Topic | Lessons | Status |
|---|---|---|---|
${rows}

## Next up (incomplete lessons)

\`\`\`dataview
TASK FROM "aiefs/phases"
WHERE !completed
GROUP BY file.link
LIMIT 30
\`\`\`

## Progress rollup

\`\`\`dataview
TABLE
  length(filter(file.tasks, (t) => t.completed)) AS Done,
  length(file.tasks) AS Total
FROM "aiefs/phases"
SORT file.name ASC
\`\`\`

## How this works

- Each phase note holds a checkbox per lesson — tick them as you finish.
- The **web tracker** at \`/learn\` mirrors this list (Postgres-backed) with charts and a coach that tells you the next lesson and your finish date.
- Re-run \`node scripts/sync-curriculum.mjs && node scripts/gen-vault.mjs\` to refresh the catalog; existing checkmarks are preserved.
`;
}

function slug(phase) {
  // phase.slug is like "01-math-foundations"; the file is NN-<rest>.
  return phase.slug.replace(/^\d+-/, "");
}

async function main() {
  const catalog = JSON.parse(await readFile(join(ROOT, "lib", "curriculum.json"), "utf8"));
  await mkdir(PHASES_DIR, { recursive: true });

  let created = 0;
  let skipped = 0;
  for (const phase of catalog.phases) {
    const file = join(PHASES_DIR, `${phase.num}-${slug(phase)}.md`);
    if (await exists(file)) {
      skipped++;
      continue;
    }
    await writeFile(file, phaseNote(phase));
    created++;
  }

  await writeFile(join(AIEFS, "index.md"), indexNote(catalog));

  console.log(`aiefs/index.md regenerated.`);
  console.log(`Phase notes: ${created} created, ${skipped} preserved (kept existing checkmarks).`);
}

main().catch((err) => {
  console.error("gen-vault failed:", err.message);
  process.exit(1);
});
