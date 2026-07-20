# TerraFusion Suite Program — Ratified Federated Topology, Register, Policy & Gates

> Operator artifact under `OWNER-DECISION-TOPOLOGY-RATIFIED.md` §10 (no owner approval required).
> Supersedes the extract-to-new-OS framing of `RECOVERY-TOPOLOGY-MATRIX.md`. Decision/evidence-layer;
> repo creation gated only by an **EXECUTION_CREDENTIAL_BOUNDARY** (see `SUITE-REPO-CREATION-MANIFEST.json`).

**Date:** 2026-06-25 · **Base:** `bsvalues/terrafusion_os_1.0` (sovereign) · **Owner engineering required:** NONE

## 1. Ratified federated topology matrix
| Repo | Tier | Role | Owns | Consumes | Source-of-truth |
|---|---|---|---|---|---|
| **`terrafusion_os_1.0`** | **Sovereign OS/platform** | base + integration + governance | OS core, shell, **Workbench (Tier-0)**, Brain (One), Pilot, Trace, identity/RBAC/county/audit, **shared contracts**, gateway/MCP, Sync/PACS, CI/release | all 5 suites (via versioned contracts) | canonical for contracts + OS integration always; canonical for suite impl **until each suite's gate passes** |
| `terrafusion-forge` | Tier-1 suite | valuation | cost/income/sales/AVM/ratio | forge contracts | suite-canonical **after** Forge gate |
| `terrafusion-atlas` | Tier-1 suite | GIS/spatial | layers/geometry/symbology | atlas contracts | after Atlas gate (maps first) |
| `terrafusion-dais` | Tier-1 suite | assessor workflow | permits/exemptions/appeals/notices/cert/levy | dais contracts | after Dais gate |
| `terrafusion-dossier` | Tier-1 suite | evidence/records | documents/packets/case files | dossier contracts | after Dossier gate |
| `terrafusion-gpt` | Tier-1 suite | governed AI/RAG | GPT/RAG config (no sovereign write lane) | via TerraPilot tools | after GPT gate |
| `terrafusion-os` | — | **SUPERSEDED predecessor** (mine only) | — | — | archive |

**Invariants (from the owner decision):** One Brain (base only) · Workbench = Tier-0 OS surface ·
single-host Gen2 runtime (separate repos ≠ separate shells/auth/county/audit/deploy) · contract-first ·
gate-transfer source-of-truth · no big-bang · historical repos are mines not masters.

## 2. Program register
| WO | Purpose | Layer | Status | Blocked by |
|---|---|---|---|---|
| WO-SR-001 | Ratify names/boundaries/extraction blueprint | decision | ✅ done (Loop 48) | — |
| — Authority reconciliation (§8) | reconcile controlling sources | decision | ✅ done (Loop 49) | — |
| — Owner topology decision | base identity + federation | owner | ✅ RATIFIED (Loop 50) | — |
| **WO-SR-002** | **Shared-contract freeze** (contract-first) | decision/in-repo | ▶ next (in-session capable) | — |
| **WO-SR-003** | **Create 5 suite repos** (manifest) | execution | ⏸ **EXECUTION_CREDENTIAL_BOUNDARY** | repo-create scope |
| WO-SR-004 | Install governance/evidence scaffold in each repo | execution | ⏸ after SR-003 | repos exist |
| WO-SR-005 | Cross-repo contract-compat validation | execution | ⏸ after SR-004 | repos exist |
| WO-SR-006 | Register suites in Brain/portfolio state | in-repo | ⏸ after SR-003 | repo names live |
| **WO-FORGE-X-001** | Forge inventory + disposition (source-side) | decision | ✅ done (Loop 54) — CostForge=theater/REJECT; real Forge distributed | — |
| WO-FORGE-X-002..007 | disposition→bootstrap→extract→services→rebind→parity+retire | execution | ⏸ after Forge repo | SR-003 + SR-002 |
| WO-{ATLAS,DAIS,DOSSIER,GPT}-X-001..007 | per-suite extraction | execution | ⏸ sequenced | Forge pattern proven |

**One-Brain dispatch model:** the base Brain issues each suite a **domain pack + dispatch packet +
reservations + WO + evidence obligations**; suites report to **central integration gates**. No suite
brain/queue/constitution; no unilateral contract redefinition.

## 3. Shared-contract freeze policy (WO-SR-002 — contract-first)
Sequence (owner decision §8): `shared contract → validation & merge → suite impl → versioned
publication → OS/Workbench integration → ecosystem + evidence`.
- **Freeze set = the existing `Abstractions` seam** (Loops 24–39): the DTOs/interfaces already promoted
  (GisTf, Kernel, CanonicalTf, Workbench DTOs, NegativeCacheStatistics; IGisDataService,
  IForgeStatisticsService, IPacsReachabilityProbeService, IWorkbenchSyncReadiness*, ICacheStatisticsService).
- **Freeze action:** assign each a **semver contract version** + compatibility note; publish as the
  suite-consumable package boundary; no suite may redefine. **Deferred (Core-side, DTO-first before
  freeze):** `ITerraFusionSyncService` (PACS fence), `IModuleCatalog`, `IValuationService`.
- WO-SR-002 is **in-session capable** (writes contract-version metadata in this repo); it does not need the suite repos.

## 4. Extraction / provenance policy (owner decision §7, §9)
Every candidate path gets a disposition (`RETAIN_IN_OS · EXTRACT_EXACT · REWRITE_FOR_SUITE ·
SHARE_AS_CONTRACT · MINE_PATTERN · DEFER · REJECT`) and a matrix row:
`Source path | Capability | Target | Action | Shared dep | Feeder-provenance | Tests | Provenance(SHA/WO) | Cutover gate`.
Rules: no blind copy/wholesale extraction · **historical + feeder repos are mines** · duplicate mutable
impl must not persist post-gate · `terrafusion_os_1.0` authoritative pre-gate · COPY-THEN-DELETE (never delete-first).

## 5. Validation / cutover gates (per suite, before source-of-truth transfers)
1. Suite builds green standalone (warnaserror) + migrations apply.
2. Suite tests pass in-repo.
3. **Parity proof** vs monorepo behavior (golden/contract).
4. Workbench renders the suite tab **through the versioned contract** (single-host; no hard import).
5. Contract-compat check green (WO-SR-005).
6. Provenance recorded (source SHA + WO + feeder lineage).
7. Only then: retire/demote the duplicated monorepo ownership; suite repo becomes canonical for its domain.

## 6. Repository bootstrap file inventory (per suite — applied post-creation)
`README.md` (federated-suite header, One-Brain note) · `AGENTS.md` (subordinate governance, write-lane,
stop conditions) · `LICENSE` · `.gitignore` · `canon/{INTAKE_RULES,SUITE_DOMAIN_PACK,CONTRACT_DEPENDENCY}.md`
· `operations/{work-orders,evidence/MIGRATION_PROVENANCE_LEDGER.md}` · `docs/decisions/` ·
`EXTRACTED_FROM.md` (points back to `terrafusion_os_1.0` source SHA) · `.github/workflows/suite-ci.yml`
(frozen-lockfile, warnaserror, contract-compat, governance-gate). Reuses the `terrafusionos-vessel/` template.

## 7. Branch-protection & settings spec (per suite) — two-phase (bootstrap-trap safe)
Private · default `main` · squash-only + delete-branch-on-merge · PR required (1 review, dismiss-stale,
conversation-resolution) · no force-push · no deletion · enforce-admins.
- **Phase 1 (at creation):** PR required, **NO required status checks** (checks don't exist yet).
- **Phase 2 (tighten):** after the bootstrap PR merges `.github/workflows/{suite-ci,contract-compat,governance-gate}.yml`
  and each has produced a check run, add required checks `suite-ci`/`contract-compat`/`governance-gate`.
- **Never** require a check that doesn't exist yet → prevents the first bootstrap PR deadlocking.
(Machine form in `SUITE-REPO-CREATION-MANIFEST.json`: `branch_protection_phase1_bootstrap` + `_phase2_tighten`.)

## 8. Execution boundary
Repo creation is **authorized operator work**, blocked only by the credential boundary. See the
`BLOCKED_MISSING_EXECUTION_CREDENTIAL` result once creation is attempted. No strategic decision remains;
no owner engineering remains.
