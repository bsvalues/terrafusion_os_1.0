# TerraFusion Brain

The internal **AI-native governance layer** for shipping TerraFusion OS 1.0: a governed
memory-and-reasoning system that knows TerraFusion's architecture, decisions, release state, risks,
rules, and next actions — and coordinates agents **without letting them violate the Constitution**.

Not a chatbot. Not a docs folder. Not RAG alone. **Rules + graph + retrieval + execution constraints.**

> A RAG system says "Dais handles appeals, so edit this Dais file and update the document packet."
> The Brain says "Dais may update appeal workflow state, but must **not** write documents — Dossier
> owns those. Use a Dossier service call + TerraTrace event." That difference is the whole point.

## It is a working surface, not an authority
The Brain **obeys**, in order: `.github/copilot-instructions.md` → `CLAUDE.md` → `STANDARD.md` →
`docs/architecture/TERRAFUSION_SUITE_CONSTITUTION_v1.md` (TF-052) → `.github/AGENT_ENTRYPOINT.md`.
If the Brain and a canonical source disagree, the canonical source wins and the Brain is the bug.

## Six questions the Brain answers better than you can under stress
1. What is true? → `brain ask`, canon
2. What is allowed? → `brain ask "can X write Y"`, write-lanes
3. What changed? → [[graph/findings]], `brain status`
4. What is risky? → [[memory/drift-ledger]], `brain check`
5. What should happen next? → [[memory/agent-workorders]], `brain classify`
6. What must not be touched? → [[00_TODAY]] forbidden, canon reserved names

## Layout (the seven parts)
```
docs/brain/
  00_TODAY.md               working memory — today's scope fence
  canon/                    LAW (what is true / allowed)
    canon-digest.md         human digest of TF-052 + AGENT_ENTRYPOINT
    suites.json             machine canon: active/reserved suites, ownership
    write-lanes.json        machine canon: write-lane matrix + bridges
    layers.json             machine canon: 5-layer model + workbench routing
    naming-rules.json       machine canon: reserved names, audit↔trace
  memory/                   WHAT HAPPENED / WHY / WHAT MATTERS
    release-gates.md · drift-ledger.md · deferred.md · visible-honesty.md
    decisions-adr.md · agent-workorders.md
  graph/                    SYSTEM VISIBILITY (→ graphify-out/)
    findings.md
  agents/                   REASONING (six bounded roles)
    architect.md · graph.md · builder.md · reviewer.md · qa.md · docs.md
  reports/                  generated briefs (daily-brief, release-readiness)
scripts/brain/              ENFORCEMENT + INTERFACE
  canon.mjs                 loader + deterministic reasoning
  brain.mjs                 the CLI
```

## CLI
```bash
pnpm brain status                          # what is true / what matters now
pnpm brain ask "can dais write documents?" # governed Q&A (NO — bridge via Dossier + TerraTrace)
pnpm brain ask "who owns valuation?"       # TerraForge
pnpm brain classify "add appeal persistence"   # layer / suite / allowed-forbidden / naming flags
pnpm brain workorder "implement notices"   # bounded work-order skeleton
pnpm brain check                           # wraps naming-lint + write-lanes enforcement
pnpm brain drift | release                 # print the ledgers
pnpm brain defer "statewide interop"       # park an idea (anti-expansion valve)
```
The CLI **wraps existing enforcement** (`tools/naming/naming-lint.mjs`,
`scripts/spec-gates/write-lanes.mjs`) — it does not reinvent it. Reasoning is **deterministic lookups
over canon**; when canon can't answer it returns `UNRESOLVED` rather than guessing (ADR-0003).

## Maturity model (where we are)
| Level | Name | State |
|------:|------|-------|
| 0 | Notes Brain | ✅ done (memory/ + 00_TODAY) |
| 1 | Graph Brain | ◐ skeleton (graph/findings + graphify-out; detectors not yet run — D-003) |
| 2 | Governed-RAG Brain | ✅ done (canon JSON + `brain ask`/`classify` reason over it) |
| 3 | Agentic Brain | ◐ agent prompts written; work-order discipline live |
| 4 | Enforcement Brain | ◐ `brain check` wraps 2 gates; not yet a pre-commit/CI hook |
| 5 | Learning Brain | ⬜ next — repeated drift → new rule → new gate |

## What NOT to build yet (post-1.0)
Custom UI · complex agent swarm · autonomous self-healing · DB-backed memory service · marketplace
brain · county-facing brain UI · multi-user collaboration · perfect ontology. The Brain exists to
**ship 1.0**, not to become the product before the product is stable. See [[memory/deferred]].
