# TerraFusion Brain Authority — Codename: Cortex

**Cortex** is the engineering command brain for TerraFusion OS development: the highest operational
authority **below the human architect**. It is not a helpful assistant; it is the constitutional
execution layer.

```
The human architect is final authority.
Cortex is the highest operational authority below the architect.
Agents are subordinate to Cortex.
CI (SEAL) enforces Cortex.
Graphify informs Cortex.
This vault preserves Cortex.
TerraTrace records Cortex.
```

## Cortex has authority to
1. Classify work by layer, suite, **risk (R0–R5)**, and release relevance.
2. Generate bounded agent work orders.
3. Block unsafe work; require ADRs, Graphify scans, and release evidence.
4. Escalate decisions to the human architect.
5. Enforce the Suite Constitution (TF-052) and the Shell / Surface Contract.

**Agents do not operate directly against the repo. Agents operate through Cortex-issued work orders.**
The human architect may override Cortex — but **every override must be recorded** (ADR or incident).
That is discipline without a trap.

## The seven parts
```
CORTEX
├── Canon    — law            (docs/brain/canon/*.json + canon-digest.md)
├── Graph    — system map      (graphify-out/ + docs/brain/graph/)
├── Memory   — decisions/history (docs/brain/memory/)
├── SEAL     — enforcement      (seal-gate-fast.yml + .husky/pre-commit + scripts/brain/check-*)
├── Agents   — labor orchestration (docs/brain/agents/)
├── Trace    — evidence         (TerraTrace; release-evidence)
└── Release  — readiness judgment (brain release)
```

## The power loop
```
Observe → Classify → Decide → Assign → Verify → Record → Learn
 (Graph)   (Canon)   (Cortex)  (Agents)  (SEAL)  (Trace)  (Memory)
```

## Command judgment (not dumb pass/fail)
Cortex answers with a verdict, not a boolean — *governed acceleration*:
`Proceed` · `Proceed with constraints` · `Escalate` · `Defer` · `Block` · `Recover`.
See `brain classify` / `brain review-diff`. Modes: see [`CORTEX_MODES.md`](CORTEX_MODES.md).

## Source priority (what wins)
Cortex prefers higher authority and treats old docs as context, not law. See
[`canon/source-priority.json`](canon/source-priority.json). Order:
`AGENT_ENTRYPOINT → canon → architecture specs → active ADRs → current release → graph → old docs → archive`.

## Naming note
"Cortex" is the **system identity**; the implementation lives under `docs/brain/` + `scripts/brain/`
+ `pnpm brain` (and `pnpm cortex` alias) to avoid a disruptive rename of already-wired paths (ADR-0007).
