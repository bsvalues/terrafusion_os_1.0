# OWNER DECISION — TerraFusion Repository Topology & Base Identity (RATIFIED)

> **Status: RATIFIED — effective immediately.** This is the authoritative resolution of the
> `AUTHORITY-RECONCILIATION-LEDGER.md` **Layer B** boundary. It settles physical source-repository
> topology beneath TF-052. It **reverses** the Loop 45 premise (`terrafusion-os` as sovereign
> vessel). Recorded by the operator under the owner's §10 authorization; no owner approval pending.

**Date:** 2026-06-25 · **Decider:** William (owner) · **Authority:** owner decision (supersedes rank-8 architecture docs; consistent with `CAPABILITY_PLACEMENT_MAP.md`) · **Governs:** all topology/base-repo planning

## 1. Sovereign base repository
**`bsvalues/terrafusion_os_1.0` is the canonical platform, runtime-integration, governance, and
portfolio base.** It remains the authoritative home for: TerraFusion OS Core · native shell & OS
shell · **Property Workbench (Tier-0 composition surface)** · TerraPilot · TerraTrace · Brain / Work
Order Engine · identity/RBAC/security/county-context/audit · shared data & API contracts · gateway &
MCP integration · **Sync/PACS shared infrastructure** · CI/CD, release, deployment, integration
evidence · portfolio-level canon & governance.

## 2. Superseded repository
**`bsvalues/terrafusion-os` is a superseded predecessor/reference repository** — **not** the
go-forward base. It must not receive new platform/runtime/suite/governance/product work unless a
later explicit owner decision reactivates it. **Mine, not master:** contents may be mined through
governed provenance only. *(This aligns `CAPABILITY_PLACEMENT_MAP.md`, which already classified
`terrafusion-os` as a superseded predecessor — the contradiction is resolved, not overridden.)*

## 3. Go-forward topology — federated (one sovereign OS + five Tier-1 suite repos)
```text
bsvalues/terrafusion_os_1.0   (sovereign OS/platform/integration/governance base)
├── OS / platform / Workbench / shared contracts / governance
├── consumes bsvalues/terrafusion-forge
├── consumes bsvalues/terrafusion-atlas
├── consumes bsvalues/terrafusion-dais
├── consumes bsvalues/terrafusion-dossier
└── consumes bsvalues/terrafusion-gpt
```
**Federated source-control topology** — NOT five independent products, NOT five operating systems.

## 4. Constitutional relationship
TF-052 continues to govern the five-suite decomposition, identity, ownership, and write-lanes. This
decision **adds physical source-repository topology beneath TF-052**; it does not alter the suite
constitution.

## 5. One Brain rule
Exactly **one** TerraFusion Brain / portfolio operator (in the sovereign base). Suite repos do **not**
get: separate brains · independent queues · separate constitutional authority · autonomous governance
· authority to redefine shared contracts. Each suite repo receives a **bounded domain pack, dispatch
packet, reservations, Work Orders, evidence obligations, and central integration gates.**

## 6. Runtime composition (single-host Gen2 remains valid)
Property Workbench remains an **OS-owned Tier-0 composition surface** in `terrafusion_os_1.0`. Suite
capabilities may be developed in separate repos and consumed by the OS via **governed, versioned
packages/contracts**. Separate source repos do **NOT** imply iframe composition, separate shells,
separate auth, separate county context, separate audit spines, or separate deployment control planes.

## 7. Source-of-truth ownership (gate-transfer, no big-bang)
After a suite passes its **extraction/promotion gate**: the suite repo becomes canonical for
suite-owned implementation; `terrafusion_os_1.0` remains canonical for shared contracts & OS
integration; duplicate mutable suite implementations must not persist in both. **Before** the gate,
the current implementation in `terrafusion_os_1.0` remains authoritative. **No big-bang split authorized.**

## 8. Shared-contract rule (contract-first sequence)
Shared contracts are defined & versioned from the **sovereign platform boundary** before dependent
suite work proceeds:
```text
shared contract → contract validation & merge → suite implementation (owning repo)
→ versioned package/contract publication → OS/Workbench integration → ecosystem integration + evidence
```
No suite may unilaterally redefine a shared contract.

## 9. Migration posture
Repo creation does **not** authorize blind copying / wholesale extraction. Every migration requires:
exact source & destination paths · provenance · ownership classification · dependency inventory ·
history/import decision · contract compatibility · tests & evidence · rollback · duplicate
retirement/demotion. **Historical repositories are mines, not masters.**

## 10. Operator authority
This topology decision is **settled**. Operators (Codex/Claude) are authorized to create the missing
canon, topology matrix, program register, extraction policy, repository-creation Work Orders,
validation gates, and evidence artifacts **without further owner approval**, and must not return the
documentation work to the owner. **Only genuinely new protected boundaries may be escalated.**

---

## Operator reconciliation (what this changes in the corpus)
| Prior artifact | Prior premise | Reconciled to |
|---|---|---|
| `AUTHORITY-RECONCILIATION-LEDGER.md` Layer B | open TRUE_OWNER_BOUNDARY | **RESOLVED** — base = `terrafusion_os_1.0`; federated + 5 suite repos |
| `WO-SR-001` §1 host row | `terrafusion-os` host (CONTESTED) | **base = `terrafusion_os_1.0`** (sovereign); `terrafusion-os` superseded |
| `FULL-AGENT-HANDOFF.md` §5A, `MASTER-PLAYBOOK-HANDOFF.md` | `terrafusion-os` = sovereign receiving vessel | **superseded** — sovereign = `terrafusion_os_1.0` |
| `MIGRATE-CORE-WO-1.md`, `terrafusionos-vessel/` | stand up NEW OS repo from main | **moot for OS** (OS stays here); scaffold pattern **reused for the 5 suite repos** |
| Two-lock model (Loops 42–48) | Lock B = provision `terrafusion-os` | **reframed** — repo creation applies to the **5 suite repos** (owner-only, integration `403`); OS needs no creation |
| `CAPABILITY_PLACEMENT_MAP.md` | `terrafusion_os_1.0` canonical; `terrafusion-os` superseded | **now CONSISTENT** with this decision — no change needed |

## Asserted-elsewhere (owner-cited, not on disk here)
MAO doctrine / `WO-MAO-006` (independent suite repo subordinate to central governance) and the
Claude/Codex suite-lane assignment are **owner-cited** and treated as authoritative by this decision,
though their artifacts are not in `terrafusion_os_1.0` (see `PROGRESS-RECONSTRUCTION-LEDGER.md`).

## Next authorized artifacts (no approval required, per §10)
1. **Ratified federated topology matrix** (supersedes the extract-to-new-OS framing of `RECOVERY-TOPOLOGY-MATRIX.md`).
2. **Program register** (WO-SR + per-suite WO-*-X chains, statuses).
3. **WO-SR-002** shared-contract freeze (in-session capable; contract-first, §8).
4. **WO-SR-003** suite repo-creation WOs (owner-only execution; integration `403`).
5. **Extraction/provenance policy** + validation gates (§7–§9).
