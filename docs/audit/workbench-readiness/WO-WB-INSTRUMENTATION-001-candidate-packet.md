# WO-WB-INSTRUMENTATION-001 — Candidate Packet: Workbench Honesty Instrumentation

**Type:** candidate packet (a *proposal* for a future program) · **Owner:** — (unassigned; needs explicit authorization) · **Mode:** would be FRONTEND IMPLEMENTATION
**Repo:** `terrafusion_os_1.0` · **Base:** `origin/main` @ `7dc9825e` · **Source:** WO-WB-C1-001 / WO-WB-C1-003.

> **Write-surface authorization.** This packet is a docs-only *proposal*. The program it proposes would modify **component code** (`frontend/apps/os-shell/src/pages/workbench/tabs/**`) — **outside** the AGENTS.md core-governance scope **and** outside a tests-only mandate — so it **requires explicit operator authorization** before any implementation. Nothing is implemented by this packet.

## 1. Why this program exists

The revised tests-only C1 (WO-WB-C1-001/003) proved that honesty-contract coverage **cannot** move past 4/9 without component changes: the 5 uncovered tabs lack an **idle** per-element source badge. Reaching **9/9** requires instrumenting them, then adding the tests.

## 2. Program (proposed)

```
PROGRAM: WORKBENCH-HONESTY-INSTRUMENTATION
GOAL:    add idle WorkbenchSourceBadge/disclosure instrumentation to the 5 uncovered tabs,
         then their Dais-style honesty-contract tests → honesty coverage 4/9 → 9/9
MODE:    FRONTEND IMPLEMENTATION (component + test changes) — NOT tests-only
RISK:    medium (touches production tab components; per-tab, reversible, small diffs)
```

## 3. Targets + per-tab scope

| Tab | Current state | Instrumentation needed |
|-----|---------------|------------------------|
| **Dossier** | has `WorkbenchSourceBadge` (post-invocation, `source='live'`) + root testid | **add an idle-state badge** (`source='unavailable'`) in a disclosure box — the *smallest* change |
| **Pilot** | `property-pilot-tab` / `pilot-muse-scope` testids; no badge | add an idle disclosure badge |
| **Clerk** | no badge, no container testid | add root testid + idle disclosure badge |
| **Treasury** | no badge, no container testid | add root testid + idle disclosure badge |
| **Audit** | no badge, no container testid | add root testid + idle disclosure badge |

The pattern to mirror is the existing instrumented tabs (`PropertyDais.tsx` / `PropertySummary.tsx`): a baseline disclosure box containing a `WorkbenchSourceBadge` whose `data-source` is `unavailable` until real data/tool output arrives.

## 4. Proposed WO sequence (smallest-risk first)

```
WO-WB-INSTR-001 — Dossier idle badge + honesty-contract test        (coverage 4/9 → 5/9)
WO-WB-INSTR-002 — Pilot idle badge + honesty-contract test          (→ 6/9)
WO-WB-INSTR-003 — Clerk idle badge + honesty-contract test          (→ 7/9)
WO-WB-INSTR-004 — Treasury idle badge + honesty-contract test       (→ 8/9)
WO-WB-INSTR-005 — Audit idle badge + honesty-contract test          (→ 9/9)
WO-WB-INSTR-006 — Coverage matrix update + evidence rollup          (docs)
```

Each impl WO: one tab, one small component diff (add the idle disclosure badge, reusing `WorkbenchSourceBadge` from `components/workbench`), plus its honesty-contract test mirroring `PropertyDais.honesty.contract.test.tsx`, verified green by CI (Frontend Gate + Vitest Full Suite).

## 5. Boundaries (for the future program)

```
Allowed:
- frontend/apps/os-shell/src/pages/workbench/tabs/** (add idle badge + testid only)
- frontend/apps/os-shell/src/__tests__/workbench/** (honesty-contract tests)
- docs/audit/workbench-readiness/** (coverage/evidence)
Blocked:
- backend code, tool registry, routes/window aliasing, data hooks/services
- tool integration / live behavior changes
- package/build/CI, deploy, migrations, PACS/county data
- any change beyond adding an idle disclosure badge + testid + test
- Codex Backend OE files
```

## 6. Stop walls (for the future program)

- a tab needs more than an idle badge + testid to satisfy the honesty contract (e.g. a real data-source signal that doesn't exist yet) → stop and report;
- adding the badge would change tool-invocation or data behavior → stop;
- the honesty test can't pass without touching backend/tools → stop;
- route/window aliasing (gap G2) must be resolved first → stop.

## 7. Relationship to other lanes

- **Independent of** the S1 tool-integration lane (G1, backend/Codex) — this is UI honesty instrumentation, not tool promotion.
- **Complements** the readiness audits (WO-WB-001→008) and closes gap **G3** properly.
- Does **not** touch Codex's Backend OE surface.

## 8. Decision required

This packet does nothing until the operator authorizes the program. Options: authorize the full `WORKBENCH-HONESTY-INSTRUMENTATION` sequence; authorize only `WO-WB-INSTR-001` (Dossier, smallest) as a proof-of-pattern first; or defer.

**STOP_TYPE:** `WB_INSTRUMENTATION_CANDIDATE_PACKET_READY`
