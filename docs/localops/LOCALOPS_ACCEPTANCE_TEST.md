# LocalOps Acceptance Test (v1)

> **Status:** PLANNING. Defines the invariants every LocalOps work order must satisfy and the scenarios
> the **WO-LOCALOPS-008 proof harness** must automate. No tests are implemented by WO-LOCALOPS-000.
> **Rule:** these are pass/fail invariants, not aspirations. If a scenario cannot be proven, v1 is not
> done — and no doc may claim it is.

## v1 invariants (must all hold)

| # | Invariant | How it is proven |
|---|-----------|------------------|
| I1 | **No silent cloud fallback** | With a `local-only` profile and no local model, the gateway returns "local AI unavailable" and makes **zero** external network calls (offline test asserts no egress). |
| I2 | **Read-only diagnostics don't mutate** | Each diagnostic performs no writes/restarts/shell; a write attempt is rejected by design (test asserts no state change). |
| I3 | **Trace emitted, append-only** | Every action emits exactly one append-only TerraTrace event with a correlationId; no event is mutated/deleted. |
| I4 | **PII-safe trace** | SSN/phone/email never appear in trace payloads (redaction test over known PII inputs). |
| I5 | **Human-approval gate** | Any tool above `read_only` requires confirmation + reason before executing (v1 ships none above read_only; the gate is still enforced in code). |
| I6 | **Source grounding** | Operational answers/findings cite a grounding source; ungrounded operational output fails. |
| I7 | **County boundary respected** | No county data leaves the boundary; county-scoped reads filter by `CountyId`; no unapproved source is indexed. |
| I8 | **In-shell only** | LocalOps renders inside the TerraFusion shell — no standalone window, no route escape, no hardcoded z-index. |

## Scenario suite (for the WO-LOCALOPS-008 harness)

### S1 — Local unavailable, cloud prohibited
Given a `local-only` profile and no reachable local model, when LocalOps is asked for help, then it
reports unavailability, emits a trace event, and makes no external call. **Asserts I1, I3.**

### S2 — Diagnostic is read-only
Given a simulated "API down" state, when the API diagnostic runs, then it returns a grounded finding
and a proposed (not executed) runbook step, changing nothing. **Asserts I2, I6.**

### S3 — PII never hits the trail
Given an input containing an SSN/phone/email, when an action emits a trace event, then the payload
contains none of them (stored by reference if needed). **Asserts I4.**

### S4 — Approval gate enforced
Given a hypothetical write tool, when invoked without confirmation+reason, then it does not execute.
**Asserts I5.**

### S5 — Indexing approval gate
Given a KB index request for a non-approved/county source, when indexing runs, then it refuses and
records the refusal. **Asserts I7.**

### S6 — In-shell rendering
Given the LocalOps UI, when opened, then it mounts inside the shell (not a new window) and introduces
no hardcoded z-index. **Asserts I8** (Tier-1 UI Harness + shell-contract).

## Proof commands (real surface only)

| Purpose | Command |
|---------|---------|
| Type safety | `pnpm run type-check` |
| AI profile contract (WO-001) | `node --test os-platform/core/tests/local-agent-ai-profile.test.mjs` |
| Provider abstraction (WO-002) | `node --test os-platform/core/tests/local-agent-localops-provider.test.mjs` |
| Trace event adapter (WO-003) | `node --test os-platform/core/tests/local-agent-localops-trace.test.mjs` |
| Local KB/RAG interface (WO-004) | `node --test os-platform/core/tests/local-agent-localops-kb.test.mjs` |
| Read-only diagnostics (WO-005) | `node --test os-platform/core/tests/local-agent-localops-diagnostics.test.mjs` |
| **Runtime proof harness (WO-008)** | `node --test os-platform/core/tests/local-agent-localops-proof.test.mjs` |
| In-shell LocalOps UI (WO-006) | `pnpm --filter terrafusion-frontend vitest run apps/os-shell/src/__tests__/localops/LocalOpsPanel.test.tsx` |
| Core tool tests | `node --test os-platform/core/tests/phase83-tools.test.mjs` |
| Governance gate | `pnpm canon:gatefast` |
| Canon health | `pnpm canon:ping` |
| Trace lookups | `pnpm run trace:query --correlation <id>` |
| Docs formatting | `pnpm exec prettier --check docs/localops/**` |
| UI (WO-006) | Tier-1 UI Harness Validation |

> There is **no** `pnpm brain` / `pnpm localops` command. If a future WO wants one, it must add it
> explicitly and have it separately approved — see `brain/packs/README.md` Verification Notes.

## Runtime proof status (WO-008)

`os-platform/core/tests/local-agent-localops-proof.test.mjs` runs **offline** against the shipped
WO-001…006.1 modules and asserts each scenario, failing loudly on any violation:

| Scenario | Invariants | How WO-008 proves it |
|----------|-----------|----------------------|
| S1 | I1, I3 | In-process: external/unavailable providers return a structured problem (never a success), a `fetch` spy confirms **zero egress**, and the action emits one append-only trace event with a `correlationId`. |
| S2 | I2, I6 | In-process: every diagnostic result is `readonly`; a mutating request is refused; `AI_REQUIRE_SOURCES` blocks an ungrounded answer (`canAnswer:false`). |
| S3 | I4 | In-process: SSN **+ phone + email** are absent from emitted trace payloads. Phone coverage depends on **WO-SEC-LOCALOPS-001** (landed); before it, I4 was only partially satisfiable and was not claimed. |
| S4 | I5 | In-process: write/exec/restart requests are refused (`UNSAFE_DIAGNOSTIC`) and emit `policy.refused`, never a `diagnostic.started/completed` pair — nothing above read-only executes. |
| S5 | I7 | In-process: KB roots outside the `docs/` allowlist are excluded; a county-shaped query can only surface `docs/` material. |
| S6 | I8 | **Static** here (no `route`/`homeMeta` on the `localops` OS feature, z-index authority, panel is fixed `complementary` chrome mounted in `Desktop.tsx`). The live **render** proof is the CI vitest shell-contract suite (`shellAntiDrift`/`shellChrome`/`shellRoutedContent`) + the Tier-1 UI Harness — this Node harness cannot run vitest and does not claim to. |

## Honesty clause

The harness proves only what it actually exercises. No LocalOps document, commit message, or PR may
claim runtime readiness, FISMA compliance, or accreditation beyond what these scenarios demonstrate at
the time of the claim.
