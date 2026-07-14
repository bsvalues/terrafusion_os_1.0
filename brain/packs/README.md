# TerraFusion Brain — Domain Knowledge Packs

> **Work Order:** WO-BRAIN-0013 — Domain Knowledge Pack Scaffold
> **Type:** Documentation / governance scaffold. No production behavior changes.
> **Status:** Extraction of existing canon into agent-readable packs. Not a new architecture.

## What this is

This directory turns **existing TerraFusion canon** into **agent-readable knowledge packs** so
Claude Code and future agents can route work by domain, path, and work-order scope **without asking
the human owner** for boundaries that are already written down.

These packs **extract and normalize** existing canon. They **do not invent** new rules, new suites,
or new commands. Where this scaffold and the canon disagree, **the canon wins** — open an issue, do
not silently fork the rule here.

## Doctrine — One Brain, Many Packs

```
One TerraFusion Brain.
Many suite/domain packs.
No competing brains.
No distributed queue authority.
No suite-local autonomous governance.
```

There is exactly **one** TerraFusion Brain / Cortex. It is the single OS-level authority for:

- queue
- sequencing
- work orders
- risk classification
- proof
- review-diff
- commit-plan

Suites and domains **do not** get their own brains. They get **domain knowledge packs** (the files in
this directory) that provide **local knowledge only**: what the domain owns, what it must never touch,
where work routes, what proof is required, and when a human must approve.

## Authority hierarchy

The single active hierarchy is canonical in
[`ADR-EXEC-001`](../../docs/adr/ADR-EXEC-001-governance-authority-hierarchy.md) and is grounded in the
persisted [`WO-MAO-000` source audit](../../docs/brain/evidence/WO-MAO-000-proof.md). Packs are domain
knowledge inside canonical Brain/root governance; they do not form a separate authority tier. A pack
or directory-local `AGENTS.md` may narrow writes within its subtree, but may never broaden a recorded
grant, contradict the Constitution or active root governance, or create a suite-local queue.

Mechanical enforcement remains an execution interlock. If a pack or doctrine disagrees with an
enforced gate, do not bypass the gate; report and reconcile the drift through a governed change.

One Brain is one governance and sequencing authority, not one worker process. Multiple workers may
execute dependency-cleared Work Orders concurrently when each has an isolated worktree and their path,
contract, and environment reservations do not conflict.

## The packs

Each pack answers five questions: **What does this domain own? What must it never touch? Where should
work route? What proof is required? When must the human approve?**

| Pack | Domain | Canon identity |
|------|--------|----------------|
| [`shell/`](shell/README.md) | OS shell chrome, window manager, routing | Property Workbench + OS Core (OS surface, not a suite) |
| [`dais/`](dais/README.md) | Assessor administration & workflow state | **TerraDais** (`terradais`) |
| [`forge/`](forge/README.md) | Valuation engineering | **TerraForge** (`terraforge`) |
| [`atlas/`](atlas/README.md) | GIS / spatial | **TerraAtlas** (`terraatlas`) |
| [`dossier/`](dossier/README.md) | Records, evidence, documents, packets | **TerraDossier** (`terradossier`) |
| [`gpt/`](gpt/README.md) | AI / GPT assistance patterns | **TerraGPT** (`terragpt`) |
| [`trace/`](trace/README.md) | Append-only activity / evidence trail | **TerraTrace** (OS feature, not a suite) |
| [`localops/`](localops/README.md) | LocalOps AI operator doctrine | **TerraPilot** inside the shell (OS feature) |

### Pack template

Every pack uses this structure:

1. Mission
2. Owns
3. Does Not Own
4. Allowed Writes
5. Forbidden Writes
6. Routing Rules
7. Required Proof
8. Common Failure Patterns
9. Escalation Triggers
10. Non-Goals
11. Canon Sources

## Repository path map (real, verified)

The original work order assumed paths like `apps/terrafusion-shell/`, `suites/terradias/`, and
`services/terrapilot/`. **Those directories do not exist in this repo.** Per the work order's
"do not invent paths" rule, here are the **real** canonical locations discovered during scaffolding:

| Domain | Canonical repo location(s) | Notes |
|--------|----------------------------|-------|
| **Shell** | `frontend/apps/os-shell/` | z-index authority: `src/shell/desktop/zIndex.ts`; suite registry: `src/config/suiteRegistry.ts` |
| **Suite homes (all)** | `frontend/apps/os-shell/src/pages/suites/` | `ForgeSuiteHome.tsx`, `AtlasSuiteHome.tsx`, `DaisSuiteHome.tsx`, `DossierSuiteHome.tsx`, `GptSuiteHome.tsx` |
| **Forge** | `packages/terrabuild`, `frontend/apps/os-shell/src/pages/suites/ForgeSuiteHome.tsx` | Valuation engineering |
| **Atlas** | `packages/gis-pro`, `frontend/apps/os-shell/src/pages/suites/AtlasSuiteHome.tsx` | GIS / spatial |
| **Dais** | `packages/terra-levy`, `packages/terra-pilt`, `packages/terra-permit`, `frontend/apps/os-shell/src/pages/suites/DaisSuiteHome.tsx` | Assessor admin modules (`terra-*`) |
| **Dossier** | `frontend/apps/os-shell/src/pages/suites/DossierSuiteHome.tsx` | Records / evidence (package home TBD) |
| **GPT** | `frontend/apps/os-shell/src/pages/suites/GptSuiteHome.tsx` | AI/LLM suite (ADR-005) |
| **TerraPilot / TerraTrace** | OS features routed through OS Core, not standalone suite dirs | TerraPilot spec: `docs/architecture/specs/terrafusion/02_TERRAPILOT_SPEC_v3.1.md` |
| **LocalOps** | `os-platform/core/pilot/local-agent/` | CLI: `cli.ts`; governance-controlled local agent |
| **Brain / work-order orchestration** | `os-platform/core/pilot/june10-*.mjs` | Work-order pack, wave planner, control plane, command queue |

### Candidate paths for future directory-local `AGENTS.md`

Suites currently live as **pages inside `os-shell`** plus **scattered `packages/terra-*` modules**,
not as one clean directory per suite. Because of that, per-suite `AGENTS.md` files were **not** created
(no obvious single canonical directory). Candidate locations, should suites later consolidate:

- `frontend/apps/os-shell/src/pages/suites/AGENTS.md` (covers all five suite homes) — *candidate*
- `packages/terrabuild/AGENTS.md` (Forge) — *candidate*
- `packages/gis-pro/AGENTS.md` (Atlas) — *candidate*
- `packages/terra-levy/AGENTS.md`, `packages/terra-pilt/AGENTS.md`, `packages/terra-permit/AGENTS.md` (Dais modules) — *candidate*

`AGENTS.md` files **were** added at the two paths whose ownership is unambiguous:

- `frontend/apps/os-shell/AGENTS.md` → points at `brain/packs/shell/README.md`
- `os-platform/core/pilot/local-agent/AGENTS.md` → points at `brain/packs/localops/README.md`

## How agents should use these packs

1. Before modifying files, **read the pack for the domain you are touching** (use the path map above
   to find the domain), then read any nearer `AGENTS.md`.
2. Preserve **one-Brain governance** — never create a second brain or a suite-local queue.
3. Route work through Brain **work orders, review-diff, proof, and commit-plan**.
4. Respect the domain's **Forbidden Writes** and **Escalation Triggers**. When in doubt, escalate to the
   human — do not guess across a write-lane boundary.
5. Do not allocate a cross-repository worker from a repo name or assumed path. The allocation must cite
   a committed `PATH_CANON_REGISTER.md`; until that register exists on the active base, cross-repo
   allocation is blocked and the verified in-repo path map above is the only usable routing evidence.

## Verification Notes

The work order's suggested verification commands were:

```
pnpm brain review-diff --workorder WO-BRAIN-0013
pnpm brain proof --workorder WO-BRAIN-0013
pnpm brain commit-plan --workorder WO-BRAIN-0013
```

**`pnpm brain` exists in this repository.** Root `package.json` maps it to
`node scripts/brain/brain.mjs`; `corepack pnpm brain --help` is the verified command inventory. The
Brain CLI and the explicit truth/LocalOps commands are complementary surfaces:

| Intended Brain verb | Real command(s) in this repo |
|---------------------|------------------------------|
| Brain reason/enforce/judge/record | `corepack pnpm brain <verb>` -> `scripts/brain/brain.mjs` |
| canon / governance check | `pnpm canon`, `pnpm canon:doctor`, `pnpm canon:gatefast`, `pnpm canon:ping` |
| OS CLI | `pnpm tf` → `tools/bin/tf.mjs` |
| work-order seeding | `pnpm truth:june10-seed-work-order-pack` |
| wave planning / sequencing | `pnpm truth:june10-seed-wave-plan`, `pnpm truth:june10-launch-control` |
| control plane / freshness | `pnpm truth:june10-seed-control-plane`, `pnpm truth:june10-control-plane-freshness` |
| proof / readiness packet | `pnpm truth:june10-readiness-packet`, `pnpm truth:june10-seed-receipts` |
| operator command queue | `pnpm truth:june10-operator-command-queue` |
| trace / evidence lookup | `pnpm run trace:query --correlation <id>` |
| required core gates | `pnpm run type-check`, `node --test os-platform/core/tests/phase83-tools.test.mjs` |

The original pack scaffold did not execute mutating/evidence-writing Brain verbs. This scaffold is
**documentation only** and changes no production code. The relevant verification is:

- **Canon references resolve.** Every file cited in each pack's *Canon Sources* (and every relative
  `AGENTS.md` link) was verified to exist on disk.
- **`prettier --check`** passes on all new/changed markdown.
- **`pnpm canon:ping`** was run as a governance sanity check on 2026-06-10 — result: `PASS Overall: PASS`
  (exit 0). This confirms the canon tool surface is healthy; it does not assert anything about these
  docs beyond "governance plumbing works."

## Path Router (WO-BRAIN-0014)

Given a changed file path or work-order scope, the **Path Router** resolves the owning domain pack,
risk floor, forbidden boundaries, required proof, and escalation triggers — so agents route correctly
without asking the human. It is a **file-backed manifest** (data only, no runtime):

- [`brain/router/path-router.yaml`](../router/path-router.yaml) — the route table (real paths
  authoritative; uncertain/anticipated paths flagged `candidate`).
- [`brain/router/README.md`](../router/README.md) — how to resolve a path, risk-floor taxonomy, and
  why v1 remains manifest-first even though the Brain CLI exists (it has no path-router verb).

The router **points at** these packs; it is a lookup table, **not** a queue and **not** a second
authority. One Brain, many packs.
