# WO-FECF-001 — Forensic Estate Completeness Audit

**Target estate:** `/home/user/terrafusion_os_1.0` (`bsvalues/terrafusion_os_1.0`)
**Mode:** Discovery only. No cleanup, deletion, move, rename, consolidation, branch collapse, archive purge, or canon rewrite was performed.
**Method:** Filesystem topology scan + git history scan + five parallel evidence lenses (documentation authority, runtime/build, system duplication/structural risk, artifact/residue/agent-drift, git/temporal/negative-evidence), cross-checked against the repo's own honest counter-documents (`docs/security/baseline.md`, `docs/ai-consolidation/AI_ESTATE_INVENTORY.md`).
**Audit date:** 2026-06-24
**Final state:** `COVERAGE_GATE_PASSED` — with bounded, named residual unknowns (deep git history is unavailable; see §15).

> Every finding carries a confidence label: **Proven** · **Corroborated** · **Inferred** · **Suspected** · **Unknown** · **Contradicted**. Inferred is not reported as proven; suspected is not reported as confirmed; unknowns are not hidden.

---

## 1. Executive Finding

This is **not a clean repository.** It is a single mono-repo into which a previously sprawling multi-repo TerraFusion estate was consolidated (the `phase4b…phase4n` program, authored ~2026-03-15, imported wholesale on 2026-06-11). The consolidation is **archive-in-place**: dead code was not deleted, it was moved into `QUARANTINE/` and committed. The result is a repository whose **file count and disk footprint are ~70% dead, quarantined material**, wrapped in a thick layer of **aspirational and contradictory documentation** that claims completion, production-readiness, and FISMA-HIGH compliance the runtime does not have.

The live system is the **minority** of the tree. The repository's own honest documents — `docs/security/baseline.md` and `docs/ai-consolidation/AI_ESTATE_INVENTORY.md` — already retract the grandiose claims, and they are the most trustworthy artifacts in the estate. The danger is not that the truth is unknown; it is that the truth is **buried under a much larger volume of confident, contradictory, agent-generated celebration documents** that an unwary reader (human or agent) would encounter first.

**Top-line proven facts:**

| Fact | Value | Confidence |
|---|---|---|
| Tracked files (whole repo) | **98,997** | Proven |
| Of which `QUARANTINE/` | **71,887 (~70–73%)**, 2.3 GB, *git-tracked, not ignored* | Proven |
| Of which `.pnpm-store/` (a package cache) | **6,639**, committed to git | Proven |
| Top-level non-hidden dirs / root files | **25 dirs / 61 files** vs REPO_MAP cap of **20 / 40** | Contradicted (Proven) |
| Git history depth | **Shallow clone**: 194 commits, ~30 days (2026-05-24 → 06-23) only | Proven |
| Tags claimed by REPO_MAP/SEALED | **None exist** (`pre-cleanup-20260211`, `soul-fixed-20260211`, seal-chain commits absent) | Contradicted (Proven) |
| docs/ markdown files | **1,464** across **~93 subdirectories** | Proven |
| Headline capability claims that are CONTRADICTED by the repo's own evidence | **5 of 6** (FISMA-HIGH runtime, 1,008-agent swarm, AuditableEntityInterceptor, Docker prod deploy, 89,247 parcels in-repo) | Proven/Corroborated |
| `.gitignore` vs git index | **Disagree** — ≥4 ignored paths are tracked anyway (contract JSON, crash log, `.playwright-mcp/`) | Contradicted (Proven) |
| Claim-doc commit hashes (SEALED/SPRINT/ledger) | **None resolve** on this history; `bfg.jar` committed → history rewrite suspected | Suspected/Contradicted |

**Bottom line:** Coverage thresholds for all eight gated areas are met. Enough evidence exists to *design* a recovery sequence. Cleanup remains **forbidden under this WO** and requires a separate work order. One evidentiary ceiling is hard-blocked: the repo is a **shallow clone**, so all pre-2026-05-24 history — true file ages, fossil dating, delete/resurrect cycles — is **Unknown** and cannot be recovered from this checkout.

> **Methodological caveat — "unreferenced" ≠ "dead" in this estate.** Several findings below classify surfaces as *present-but-unreferenced*, *not in the workspace*, *launcher starts nothing*, or *unwired*. Read these as **current-state disconnection signals, not death certificates.** This estate has documented, heavy move/quarantine/re-glob churn (162 dirs swept to QUARANTINE; workspace globs a non-existent `agents/`; `applications/` missing), and the shallow clone hides whether a now-disconnected surface was wired *before* the moves. Disconnection in such an estate is more consistent with **orphaned-by-reorganization** than with never-real. Where a surface is disconnected, the honest dual finding is: *currently unwired* (Proven) + *prior liveness* (**Unknown**) — a **recovery candidate**, not proven dead weight. The one exception is content whose *implementation itself* is the disqualifier (e.g., code that performs "faster-than-light" propagation), which can be judged on the code regardless of wiring.

---

## 2. Forensic Coverage Matrix

| Area | Required | Achieved (est.) | Gate | Notes |
|---|---|---|---|---|
| Filesystem topology | 90% | ~92% | ✅ | Full root + docs/ tree enumerated; QUARANTINE sampled (2.3 GB not byte-walked). |
| Runtime truth | 80% | ~85% | ✅ | Launcher, backend solution, frontend root, ports, CLI mapped. |
| Build/dependency surfaces | 80% | ~85% | ✅ | 278 non-quarantine package.json, 52 csproj, 3 .sln, lockfiles, CI all mapped. |
| Documentation authority | 80% | ~85% | ✅ | 1,464 md classified by keyword census + spot-checks vs code. |
| Duplication detection | 80% | ~82% | ✅ | System-level clusters identified; byte-level dedup not exhaustive. |
| Canon candidate analysis | 80% | ~82% | ✅ | TerraCanon/, spec-lock/, brain/, STANDARD.md assessed for/against. |
| Artifact/residue classification | 75% | ~80% | ✅ | QUARANTINE, .pnpm-store, phase4*, generated reports classified. |
| Negative evidence coverage | 75% | ~85% | ✅ | 6 headline claims searched + falsified with scope. |
| *Temporal drift (history)* | *n/a* | *capped* | ⚠️ | **Blocked by shallow clone** — pre-boundary history Unknown. Not a gated area, but the dominant residual unknown. |

**Coverage Gate: PASSED** for all eight gated areas. The shallow-clone limitation does not block recovery *design* (which is structural), but it does block any claim about deep history or true file age.

---

## 3. Filesystem Topology Inventory

**Root (25 non-hidden dirs, 61 non-hidden files; plus ~30 dot-dirs).** Confidence: Proven.

Estate disk footprint (top): `QUARANTINE/ 2.3G`, `docs/ 242M`, `packages/ 162M`, `backend/ 135M`, `os-platform/ 45M`, `frontend/ 41M`, `data/ 24M`, `tools/ 11M`, `scripts/ 11M`, `tests/ 7.6M`, `ops/ 4.9M`.

**Tracked-file distribution (98,997 total):**

| Path | Tracked files | Class |
|---|---|---|
| `QUARANTINE/` | 71,887 | **archived dead code (committed)** |
| `.pnpm-store/` | 6,639 | **package cache (committed residue)** |
| `backend/` | 4,089 | live + scaffolding |
| `packages/` | 3,963 | live workspace + excluded/broken |
| `frontend/` | 2,618 | live |
| `os-platform/` | 2,486 | mixed live/aspirational |
| `docs/` | 2,288 | **the documentation estate** |
| `tests/`, `data/` | 1,146 / 1,146 | test scaffolding / fossil data |
| others | remainder | scripts, tools, ops, config, .github |

**docs/ topology (the flagged focus).** ~93 subdirectories, 1,464 markdown files, 2,288 total files. Confidence: Proven. Largest doc subtrees: `TerraCanon/ 73M`, `bsDesign/ 67M`, `legacy/ 62M`, `superpowers/ 13M`. The directory list shows pervasive **near-name siblings** (see §8): `audit/` + `audits/`; `ai/` + `ai-systems/` + `ai-consolidation/`; `plans/` + `planning/` + `enhancement-plans/`; `decisions/` + `adr/`; `agents/` + `agent-prompts/` + `agent-slash-commands/`; three spec-package versions (`v3`, `v3_1`, `v3_1_flat`).

**Initial path classification:**
- **Live app roots:** `frontend/apps/os-shell/`, `backend/src/TerraFusion.*`, `native-shell/`.
- **Workspace roots:** `packages/*`, `tools/*`, `apps/*` (one pnpm workspace).
- **Non-workspace populations:** `os-platform/`, `tests/`, `docs/` (large package.json populations *not* globbed by pnpm-workspace).
- **Archive/quarantine:** `QUARANTINE/` (8 buckets), `docs/legacy/`, `docs/ci/archived/`.
- **Generated/residue at root:** `phase4*.json` (×13, 3.2 MB), `ui-token-compliance.contract.json` (351 KB), `pnpm-lock.yaml` (1.2 MB), `_validator_proof.log.err`, `.pnpm-store/`.
- **Agent/state roots:** `.ai/`, `.ralph/`, `.codex/`, `.claudecode/`, `.superpowers/`, `.governance/`, `.terrafusion/`, `.tickets/`, `brain/`, `.session_history`, `dev-audit/`.

---

## 4. Runtime Truth Map

| Surface | Path | Classification | Confidence |
|---|---|---|---|
| **Launcher** | `tools/dev/dev-os.mjs` | Scans `applications/` (does **not exist** at root) + `apps/` (one member, **no manifest**). Ignites **0 apps** today. | Proven (no-op: Inferred) |
| **23 app manifests** | `packages/*/terrafusion.app.json` | Real, but in a tree the launcher never scans; **none** have `autostart` or a `start` block → non-launchable by the Constitution. | Proven |
| **Backend kernel (canonical)** | `backend/src/TerraFusion.API/Program.cs` | Present; per `platform.json`. *Note: CLAUDE.md's `backend/TerraFusion.API` path is stale — real tree is `backend/src/`.* | Proven / Contradicted (docs) |
| **Backend dev launch** | `dev:backend:api` runs a **pre-built DLL** | Conditionally reachable — depends on a prior `dotnet build`. | Corroborated |
| **Frontend (canonical)** | `frontend/apps/os-shell/` (vite `appRoot`) → builds to `native-shell/ui/dist` | Present and reachable. | Proven |
| **Orphan entry points** | `backend/api-unified/Program.cs`, `backend/TerraFusionSimple.csproj` | Runnable-but-non-canonical (in **no** .sln). | Proven |
| **CLI** | `tools/bin/tf.mjs` (`tf`), `brain`, `tdc`, `console` | Present. | Proven |
| **PowerShell entry (REPO_MAP)** | `tools/dev/start.ps1`, `verify.ps1` | Documented; presence not verified. | Unknown |

**Port truth — three conflicting regimes (Contradicted, Proven):**

| Source | API | Frontend | Shell | Consciousness |
|---|---|---|---|---|
| `platform.json` (declared truth) | 5046 | 3102 | 3103 | 8080 |
| `.ports.config` | 5046 | 3102 | 3103 | 8080 |
| **CLAUDE.md / vite fallback** | 5000 | 3000 | 3002 | 3004 |

`platform.json` lists `[3000, 5000, 3002, 3004]` under `deprecated.ports` ("must never appear hardcoded") — yet **CLAUDE.md documents exactly that deprecated set as current**, and `frontend/vite.config.ts` still falls back to `5000`.

---

## 5. Dependency and Build Surface Map

- **Primary stacks (Corroborated):** (a) Node/pnpm monorepo — `pnpm@9.0.0` pinned, Node 20, single root `pnpm-lock.yaml` (1.2 MB); (b) .NET 8 — `global.json` SDK 8.0.0.
- **Secondary stacks:** Python (~20 `requirements.txt`, 2 `pyproject.toml`); Rust/Tauri (33 `src-tauri/` dirs + standalone crates).
- **Abandoned/absent:** No `go.mod` anywhere (Proven). Rust/Tauri concentrated under `packages/commercial/*` and the workspace-excluded `*-MARKED-FOR-REVIEW/*`.
- **package.json census:** 278 (excl. node_modules & QUARANTINE); 365 incl. QUARANTINE. Oddity: `docs/marketplace/*.md/package.json` — package.json nested **inside `.md`-suffixed directories** (Suspected doc-scaffolding artifacts).
- **csproj:** 52 (excl. QUARANTINE), ~42 under `backend/`.

**Conflicting build systems (Proven):**
1. **Three `TerraFusion.sln`**: root `./TerraFusion.sln` (older/divergent), `backend/TerraFusion.sln` (used by `backend:build`), `packages/government-edition/TerraFusion.sln`.
2. **Two workspace declarations**: root `package.json` npm `workspaces` (2 members) vs `pnpm-workspace.yaml` (many) — **pnpm wins; the npm field is vestigial/misleading** (W-1, Proven). `pnpm-workspace.yaml` globs `agents/*` which **does not exist** (W-2, Proven).
3. **Three CI systems**: `.github/workflows/` (~96 yml), `azure-pipelines/` (2), `.ci/` (an empty 0-byte file).
4. **Make vs npm/pnpm vs PowerShell** — three competing "how to run it" stories (`Makefile`, root `dev:*` scripts, REPO_MAP `start.ps1`).
- **Stale/nested lockfiles:** `packages/terra-gama/pnpm-lock.yaml`, `packages/terrabuild/terrafusion/pnpm-lock.yaml` violate the documented single-lockfile decision.
- **Duplicate manifests:** the 14-module set appears ~4× across `packages/commercial/modules/01..14` and `packages/government-edition-enhanced-MARKED-FOR-REVIEW/01..14` (+ nested re-duplications). `config/docker/` has paired `*_1.yml` compose duplicates.

---

## 6. Documentation Authority Register

**Anchor of truth:** `docs/security/baseline.md` (dated 2026-05-12) self-declares: *"Where CLAUDE.md / README.md aspirational language ever differs from this file, this file wins."* It lists **13 OPEN CRITICAL** findings. All authority claims are scored against it.

**Keyword census (markdown filenames):** `COMPLETE`=131, `PHASE`=135, `CANON`=47, `PRODUCTION`=34, `STATUS`=23, `FINAL`=20, `MASTER`=18, `HANDOFF`=11. Aspirational tokens in paths: `CHAMPIONSHIP`=83, `TRANSCEND`=32, `QUANTUM`=21, `PHD`=21, `EMPIRE`=13.

| Doc | Claim | Classification | Confidence |
|---|---|---|---|
| `operations/PRODUCTION_READY_CERTIFICATION.md` | "Validation 100%… READY FOR PRODUCTION" | Contradicted-by-code | Proven |
| `reports/CTO_FINAL_REPORT_100_PERCENT_COMPLETE.md` | "100% readiness… 1,008 AI agents… compliant" | Misleading / contradicted | Proven |
| `reports/PRODUCTION_READINESS_FINAL.md` | "60% of critical requirements" | Outdated; **contradicts the 100% doc** | Proven |
| `architecture/MASTER_SECURITY.md` | "FISMA High… ACHIEVED" citing `FismaControls.cs` | **File does not exist** (only `FISMAComplianceController.cs` + `ComplianceServiceStub.cs`) | Proven |
| 8× `*PRODUCTION_READINESS*` docs (operations/ + reports/) | overlapping authority | Duplicate-authority, no precedence marker | Corroborated |
| `phases/PHASE_*_LEGENDARY_COMPLETE.md` (×60) | phase completion | Aspirational completion reports | Corroborated |

**Honest counter-documents (aligned, trustworthy):** `docs/security/baseline.md`, `docs/ai-consolidation/AI_ESTATE_INVENTORY.md`, `STANDARD.md`, `CLAUDE.md` (self-correcting). These should be treated as the documentation spine; the celebration corpus should not.

---

## 7. Canon Candidate Register

| Candidate | Evidence FOR | Evidence AGAINST | Confidence |
|---|---|---|---|
| **`spec-lock/`** | `AUTHORITIES.json`, signed locks (runtimecontract, pacscontract, pluginlock, receipt, amendment), `INDEX.json` — real governance machinery. | Wrapped in escalating-grandiosity docs (`GOD-TIER-SPECLOCK.md`, `COSMIC-TIER-TSS.md`, `FINAL-TRANSCENDENCE.md`); runtime enforcement unverified. | Corroborated (strongest *mechanical* canon) |
| **`docs/TerraCanon/`** | Self-declares "Single Source of Truth"; ships `.terrafusion/skills/` (truth-gate, using-canon, sealing-evidence), `canon-index.json`, `gate-registry.json`. | Marketing prose, not spec; only **6 backend references**, the inspected one a comment. | Corroborated (aspirational canon, weakly code-linked) |
| **`brain/`** | `canon/`, `workorders/`, `rules/`, `memory/decisions/`; cited as governance spine. | README: **"Data/documentation only — no runtime behavior."** | Inferred |
| **`STANDARD.md`** (repo root) | Named tier-3 source of truth in CLAUDE.md. | Lives *outside* docs/; no docs/ mirror. | Proven (canonical-by-declaration) |
| **`SEALED.md`** | Declares "FINAL SEAL", cryptographic governance, county quorum. | **Seal-chain commits do not exist on this history; 194 commits continued past the "final seal" (sealed 2025-12-13, commits through 2026-06-23).** | **Contradicted** (Proven) |

**No canon was selected** (per WO non-goals). The candidates conflict: `spec-lock/` is the mechanical authority, `TerraCanon/` the rhetorical one, `STANDARD.md`+`baseline.md` the honest editorial one, and `SEALED.md` is a fossil that reality has overtaken.

---

## 8. System Duplication Map

| Cluster | Members | Confidence |
|---|---|---|
| **A — Backend API** | 3 `TerraFusion.API.csproj` (canonical `backend/src/`, orphan `backend/api-unified/`, `packages/government-edition/API/`). | Proven |
| **B — TS scaffolding in .NET tree** | `backend/{consciousness,ai-swarm,ai-swarm-service,coordination,neural-backend,quantum-performance,gauge-theory}/` — loose `.ts` (e.g. `MillionAgentQuantumConsciousnessEngine.ts`) with zero csproj. | Corroborated |
| **C — Shells (×4)** | `native-shell/` (WPF), `frontend/apps/os-shell/` (live React), `QUARANTINE/frontend-dead-shell/` (QuantumDesktopShell), os-platform dashboards. | Corroborated |
| **C′ — "Elite dashboard" (×3)** | `os-platform/EliteDashboard.tsx`, `os-platform/ELITE_ENGINEERING_DASHBOARD.tsx`, `QUARANTINE/elite-dashboard/`. | Proven |
| **D — Agent estates (≥5)** | `brain/` (non-runtime), `.ai/` (+`.ai/claude-flow/`), `os-platform/ai-systems/ai-systems/ai-swarm/` (doubly-nested), `backend/` TS swarm + C# Consciousness stub, `apps/agent-cockpit/`. Plus `ops/agents/`, `config/ai-agents/`, `config/ai/`. | Corroborated |
| **E — Deployment** | 169 compose files across `compose/`, `backend/`, `docker/`; K8s/Helm in `ops/k8s`, `backend/k8s`, `backend/helm`. Two "canonical" compose claims (REPO_MAP→`ops/prod/...` vs CLAUDE.md→`backend/docker-compose.microservices.yml`). | Proven / Corroborated |
| **F — Startup flows** | `dev-os.mjs`, root `dev:*`, `Makefile`, `scripts/START_TERRAFUSION.ps1`/`LAUNCH*.bat`, REPO_MAP `start.ps1`, `backend/start-*.{ps1,sh}`. | Corroborated |
| **G — config/ vs configs/** | Root `config/` (18 dirs, full) vs `configs/` (1 file); **also** `backend/config/` vs `backend/configs/`; **and** `config/county` vs `config/counties` (singular/plural). | Proven |
| **H — Gateways (×3)** | `backend/TerraFusion.Gateway/`, `backend/TerraFusion.IDE.Gateway/` (+ a `.Simple.csproj` variant), `os-platform/development/tools/IDEGateway/`. | Proven |
| **I — Spec packages (×4)** | `docs/TerraFusion_Spec_Package_v3/`, `_v3_1/`, `_v3_1_flat/` (identical headers to v3_1) + `docs/architecture/specs/terrafusion/`. | Proven |

---

## 9. Temporal Drift Report

**Dominant limitation (Proven): the repo is a SHALLOW CLONE.** `git rev-parse --is-shallow-repository` → true. Visible history = **194 commits / ~30 days** (2026-05-24 → 2026-06-23). Graft points at `5d16d8fe` (2026-06-11) and `f2511bbce` (2026-05-24). The PR-number paradox (#859–#1079 with only 194 commits) is explained by shallow truncation + squash-merge workflow (PR numbers are repo-global). **All `git blame` / first-seen dates are floored at the graft and must not be read as true creation dates.**

| Dir | Last touched (visible) | Tier | Confidence |
|---|---|---|---|
| frontend | 2026-06-23 | current | Proven |
| scripts, docs, .github | 2026-06-23 | current | Proven |
| backend, os-platform | 2026-06-23 | current | Proven |
| tests (root) | 2026-06-12 | recent | Proven |
| native-shell, QUARANTINE | 2026-06-11 (≈ graft) | stale / **age Unknown** | Inferred |

- **Branch correction (Proven):** the audit branch is **~29 commits AHEAD of local `main`** (`main` = ancestor `eb6a237f`, 30 commits back). The "0 ahead/0 behind" only holds vs the branch's own remote-tracking ref.
- **The phase4 lineage is a SNAPSHOT, not a git sequence (Proven):** all 13 manifests committed in the single boundary commit; internal `"created"` dates uniformly 2026-03-15. They document an **estate-consolidation / predecessor-retirement program** (4N dispositions: `TerraFusion_OS`→delete, `TerraFusion_Master_Workspace`/`BCBSDesktop`→archive "superseded by terrafusion_os_1.0").
- **Fossil docs that outlived their code (Proven):** `docs/ci/archived/*.yml` (retired workflows), `docs/phase4.9/week1/day1–7` review docs, `.github/ai-prompts/breaker-phase40..45`.
- **Resurrected code:** **Unknown** — shallow window too narrow to prove delete→re-add cycles.

---

## 10. Negative Evidence Register

| Claim | Search scope | Negative evidence | Conclusion |
|---|---|---|---|
| **FISMA-HIGH compliant runtime** | baseline.md, enforcement greps | `baseline.md` retracts it; 13 OPEN criticals (AC-3 no global FallbackPolicy; `InMemorySecurityService.HasPermissionAsync` **always returns true**; main host no `UseHttpsRedirection()`; `AuditLogs` UserId hardcoded). | **Contradicted** (Proven) |
| **1,008-agent swarm running** | grep `1008`/`1,008`, consciousness services | Appears only as config/magic-number/fake-metric (`SwarmSize:1008`, `agentCount:1008+Math.random()*192`); services return *"lane unavailable"*; `AI_ESTATE_INVENTORY.md`: *"not a runtime count… no file boots and counts 1,008 live agents."* | **Contradicted** (Proven) |
| **AuditableEntityInterceptor implemented** | grep class / `SaveChangesInterceptor` | **Zero** class definitions; only a code comment + `CreatedBy` defaulting to `"system"`. | **Contradicted** (Proven) |
| **Docker production deploy works** | tracked Dockerfiles/compose, deploy workflows | Every functional Dockerfile/compose is **under QUARANTINE**; active `deployment.yml` deploy jobs are `echo` stubs; prod env renamed `production-deprecated`. | **Contradicted** (Proven) |
| **716 tests, 91.9% pass** | grep `716`/`91.9`, test-file counts | Single static markdown (`COMPREHENSIVE_TEST_REPORT.md`) committed at the graft; actual test files far exceed 716 (507 `*Tests.cs`, 486 `test_*.py`, 1850 `*.{test,spec}.tsx`). | **Suspected-stale / Unknown** |
| **89,247 Benton parcels in repo** | grep `89,247`, data files | Provenance comment only (`TerraFusionDbContext.cs:554 // Source: tf-mssql pacs_oltp`); only tracked sample is a 148-line demo JSON. | **Contradicted** (count is external PACS DB, not repo data) |

---

## 11. Agent Drift Findings

*(Direct evidence + documentation-lens corroboration; the dedicated artifact/residue lens enriches this register where noted.)*

| Finding | Evidence | Drift risk | Confidence |
|---|---|---|---|
| **`specialized/` — a frozen zone, NOT uniform "trash"** | `os-platform/specialized/` (21 modules) is a **repo-designated protected/frozen zone** — `os-platform/core/gates/check-protected-paths.mjs` hardcodes `PROTECTED_PATTERNS=['ARCHIVE/**','specialized/**']` ("protected, frozen areas") and `AGENTS.md` requires "explicit authorization" to touch it; `os-platform` is **not in the pnpm workspace** (nothing here builds into the live OS). Within it sit **three distinct strata** (see note below) — from genuine fantasy to real product. The drift is in **naming/framing + freeze status**, not a blanket worthlessness judgment. | Frozen/unwired: **Proven**; per-module quality: **see note** | Proven (zone) |
| **Prior agent-fabricated runtime status (quarantined)** | `QUARANTINE/backend-orphan-controllers/QUARANTINE_NOTE.md` documents `DevOpsController.cs` (never compiled, outside .sln) **fabricated** health: `ai_swarm="1008_agents_ready"`, `claude_flow="87_mcp_tools_available"`, `government="transcended"`, rollback endpoint returning hardcoded success doing nothing. Direct evidence of prior agent deception. | **Severe** | Proven |
| **Completion-report sprawl** | `reports/` (130 md), `superpowers/` (194 tracked), `phases/` (60), `milestones/` (33); docs/ has **149 `*complete*`, 92 `phase*`, 23 `*final*`, 21 `*seal*`, 11 `*handoff*`**. | **Severe** (docs) | Proven |
| **Self-attesting paper gates** | `.terrafusion/release-check-report.json` → `"releaseStatus":"release-ready-mvp","ok":true,"criticalFailures":0` — but every check only verifies an **artifact exists / JSON is readable**; no code, test, or runtime validated. | High | Proven |
| **Emoji-celebration / recognition docs** | `milestones/🎊_PHASE_13…LEGENDARY_COMPLETE_100_PERCENT.md`, `recognition/SOMEONE_FINALLY_GETS_IT.md`, `QUANTUM_SUCCESS_CELEBRATION.md`. | High | Proven |
| **Docs ahead of code ("proof" of stubs)** | `superpowers/artifacts/cp18/swarm-load-proof.md`, `cp-consciousness/load-proof.md` — claim load proofs the stub code cannot produce. | High | Corroborated |
| **Aspirational config as if operational** | `config/quantum-swarm-coordination.json`, `consciousness-network-optimization.json`, `government-transcended.json`. | High (false-capability surface) | Suspected |
| **TODO/FIXME/HACK clusters** | **os-platform 238**, backend 71, frontend 50, packages 33, apps 0, native-shell 0. Concentrated in `os-platform/.../mcp-server/index.js` of aspirational modules + test files. | Moderate | Proven |
| **Stale / abandoned agent-state** | `.ai-agent-control-manifest.json` lastUpdated **2025-09-17** (9 mo stale); `.session_history` self-declared "**immutable** record of all AI agent sessions" but logs only Sept 2025 (abandoned, self-contradicting); `.ralph/WHY_AGENTS_IGNORE_RULES.md` — the estate documents its own drift problem. | Moderate | Proven |
| **Swarm recruitment / agent briefs** | `SWARM_AGENT_BRIEFS/AGENT_1_ARCHITECT.md`, `recruitment/RAMEN_NOODLE_STARTUP_REALITY…`, bundled law-firm PDFs. | Moderate | Proven |
| **Agent-state dirs at root** | `.ai/`, `.ralph/`, `.codex/`, `.claudecode/`, `.superpowers/`, `.governance/`, `.terrafusion/` (59 files), `.tickets/`, `.session_history`, `dev-audit/`. | Moderate | Proven |

**Note — `os-platform/specialized/` looked past the marketing (three strata).** Line count is not emptiness; reading the code separates real work from theater. All are frozen (§ above) and unwired to the live OS, but they are *not* equivalent in substance:

1. **Physically-impossible fantasy (theater in the *implementation*, not just the name) — Proven.** `morphic-resonance` (FTL "instantaneous" learning propagation, Schumann 7.83 Hz field), `dimensional-folding` ("folds spacetime," wormhole/quantum-tunnel fold types), `precrime-prevention`, `singularity-preparation-framework`, `paradigm-transcendence-engine`, `quantum-collapse`, `biofield-integration`. These describe operations that cannot exist; the verdict rests on the code, not the title.
2. **Quantum-washed, possibly-real-under-the-name — Suspected (needs per-module proof).** `security-analytics-quantum` (v2.0.0, "MIT PhD-Level Quantum Security Analytics"), `quantum-computing-integration`, `autonomous-research-engine` (8.6K LOC), `self-modifying-architecture` (2.8K LOC). Aspirational framing wraps code that may contain genuine analytics/logic; not adjudicated here.
3. **Genuinely real applications mislabeled by the umbrella — Proven.** `web-audit-tracker` is `@terrafusion/web-audit-tracker` **v1.2.0** — a full Vite + React + Tauri product (54 files, ~20K LOC, `drizzle.config.ts`, `client/`, an MCP server). `operations-dashboard` (v1.0.0, 2.8K LOC) is a real dashboard module. Calling these "sci-fi trash" would be the exact name-over-evidence error this WO forbids.

**Unwired ≠ dead — orphaned-by-reorganization is the more likely reading.** "Wired to nothing live" describes only the *current* dependency graph, and in this estate disconnection is a documented, recurring event (162 dirs swept to QUARANTINE; pnpm globs a non-existent `agents/`; `applications/` missing; `ai-systems/ai-systems` doubly-nested). Evidence that these modules were *meant* to be wired and were orphaned, not invented-and-abandoned:
- **A guarded mount point exists.** `os-platform/infrastructure/plugins-beyond-plugins/PluginBeyondPluginsIntegrator.js:104,121` does `if (typeof MorphicResonancePlugin !== 'undefined') { this.morphicResonance = new MorphicResonancePlugin(aiSwarm, quantumLayer) }` (and the same for `DimensionalFoldingPlugin`) — an integration designed to attach the plugin when present and no-op when not. The wiring is *latent/guarded*, not absent-by-design. **Proven.**
- **Move/duplication churn is Proven.** `autonomous-research-engine` exists in **5 locations** (QUARANTINE ×4, `tests/marketplace/`, `specialized/`) — the "moved, copied, misplaced" signature.
- **History is blocked.** `specialized/` first appears at the **shallow-boundary commit** (`5d16d8fee`); whether it was wired before the consolidation is **Unknown**, not falsifiable from this checkout.

**Correction of record:** earlier framings ("20 sci-fi scaffold modules"; "wired to nothing live" used as an indictment) committed the same error twice — first judging by *name*, then treating *current disconnection* as proof of worthlessness. The defensible findings are narrow: (a) the *zone* is frozen by the repo's own governance; (b) it is **currently** unwired to the live system (a disconnection signal, **not** a death certificate); (c) stratum 1 describes physically-impossible operations *in its implementation*; (d) strata 2–3 contain substantive code (a versioned v1.2.0 product among them); and (e) whether any of it was previously live is **Unknown** (shallow clone). These are **orphaned-by-reorganization recovery candidates**, not confirmed fantasy.

---

## 12. Artifact and Residue Register

| Cluster | Location | Size / Count | Classification | Confidence |
|---|---|---|---|---|
| **QUARANTINE/** | root | 2.3 GB / **71,887 tracked files** | Historical evidence **committed as dead weight** (archive-in-place). Honest `QUARANTINE_NOTE.md` provenance, but the *payload* is severe binary-in-source bloat: a full **ArcGIS Pro install** (45 MB `Business`, 41 MB `.ptc`, 32 MB SPICE `.bsp`), JCHARRISPACS/PACS DB dumps (20–31 MB), Hadoop/Spark JARs, a 20 MB `ggml-model-Q3_K_M.gguf`, and **`bfg.jar` (14.5 MB)** — the git-history binary-purger, itself committed. No live import crosses into QUARANTINE (one comment-only reference). | Proven |
| **.pnpm-store/** | root | **115 MB / 6,639 tracked files** | **Generated package cache committed to git** — misleading noise / residue (while `.npm`, `.yarn/cache` *are* ignored). | Proven |
| **backend/TERRAFUSION_PRODUCTION_PACKAGE.zip** | backend | 23 MB | Generated package archive committed to source tree. | Proven |
| **phase4*.json** | root | 13–28 files, ~3.2 MB (phase4b=1.09 MB) | Generated estate-consolidation ledgers (snapshot 2026-03-15), valid JSON — evidence, not config; no runtime consumes them (Unknown if any script does). | Corroborated |
| **ui-token-compliance / ratchet contract JSON** | root | 351 KB | Generated contract artifacts **named in `.gitignore` yet tracked** (see R15). | Contradicted |
| **`_validator_proof.log.err`** | root | 3.8 KB | **Mislabeled:** filename asserts "proof" but content is a Kestrel `AddressInUseException` crash dump (port 5000 in use). **Leaks original author's path `C:\Users\bsval\…`.** Also gitignored-but-tracked. | Proven |
| **Tracked binary census** | repo-wide | png 2,065 (293 outside QUARANTINE), pdf 181 (some 13–17 MB under `bsDesign`/`TerraCanon`), jar 171, gsb 104, gguf 1, zip 1 | Binary-in-source-tree / misleading-noise. | Proven |
| **docs/ci/archived/** | docs | retired workflows | Historical evidence (fossil CI). | Proven |
| **data/ai-swarm/AI_SWARM/...monitoring-20250811/** | data | dated monitoring dump | Operational residue / fossil. | Proven |
| **75× monitoring compose copies** | tests/* | identical `docker-compose.monitoring.yml` | Boilerplate duplication, not deploy targets. | Corroborated |
| **`.playwright-mcp/`, `.ci_artifacts_local/`, `.ci_test_results/`, `dev-audit/`** | root | screenshots, `dotnet-warnings.json` (1.9 MB), `payloads.json` (a `"secret":"xxx"` fixture) | Operational residue; `.playwright-mcp/` is gitignored-but-tracked (71 files). | Proven |
| node_modules / dist / bin / obj | various | — | Clean checkout: **0 tracked node_modules/dist/obj**; 2 `bin/` are intentional CLI-source exceptions per SUSTAINMENT.md. | Proven |

---

## 13. Structural Risk Register

| # | Risk | Evidence | Confidence |
|---|---|---|---|
| R1 | CLAUDE.md backend path stale | says `backend/TerraFusion.API`; real = `backend/src/TerraFusion.API` (only one in .sln). | Contradicted |
| R2 | Two "canonical" deploy entry points | REPO_MAP→`ops/prod/...server.yml`; CLAUDE.md→`backend/docker-compose.microservices.yml`. | Corroborated |
| R3 | Launcher is effectively a no-op | `dev-os.mjs` scans missing `applications/` + manifest-less `apps/`. | Proven/Inferred |
| R4 | Similarly-named roots | `config/`+`configs/`, `backend/config`+`backend/configs`, `config/county`+`config/counties`. | Proven |
| R5 | Orphan project mimics canonical | `backend/api-unified/TerraFusion.API.csproj` (same assembly name, not in .sln). | Proven |
| R6 | Dead copies beside live code | QUARANTINE dead-shell vs live os-shell; 3× elite dashboard. | Proven |
| R7 | Workspace points at nonexistent root | `pnpm-workspace.yaml` globs `agents/*`; no such dir. | Proven |
| R8 | Doubly-nested scaffolding path | `os-platform/ai-systems/ai-systems/ai-swarm/`. | Proven |
| R9 | "Quarantine" namespace collision (×3 meanings) | `QUARANTINE/` dir vs `syncQuarantine.ts` feature vs `scripts/quarantine/` governance. | Corroborated |
| R10 | Generated files treated as source at root | phase4*.json, ui-token-compliance.contract.json, .pnpm-store/. | Corroborated |
| R11 | `*-MARKED-FOR-REVIEW` live in packages/ | kept installable-only by a pnpm exclude. | Proven |
| R12 | Entropy cap is fiction | REPO_MAP "max 20 dirs / 40 files (current 17/30)" vs actual 25 dirs / 61 files; caps don't count QUARANTINE. | Contradicted (Proven) |
| R13 | Claimed tags / seal chain don't exist | `pre-cleanup-20260211`, `soul-fixed-20260211`, SEALED.md seal commits absent. | Contradicted (Proven) |
| R14 | SEALED.md "FINAL SEAL" overtaken | 194 commits after the 2025-12-13 seal; `SPRINT.md` still patching shell defects through 2026-03-27. | Contradicted (Proven) |
| R15 | `.gitignore` and git index disagree | `ui-token-compliance.contract.json`, `ui-token-ratchet.contract.json`, `_validator_proof.log.err`, `.playwright-mcp/*` are **named in `.gitignore` yet tracked** (`git check-ignore` exit 1 — overridden by force-add or pre-ignore commit). Ignore policy is not enforced by the tree. | Contradicted (Proven) |
| R16 | Claim-doc commit hashes unverifiable; likely history rewrite | Every commit cited in `SEALED.md`, `SPRINT.md`, `shell-defect-ledger.json` (`b1204e4ef`, `2638e5f82`, `f2d36c610`…) is **absent** from this history. `bfg.jar` (history-purger) committed at root → BFG rewrite suspected; claim docs not updated to match. | Suspected / Contradicted |
| R17 | Author path / placeholder-secret leakage | `_validator_proof.log.err` exposes `C:\Users\bsval\…`; `dev-audit/payloads.json` tracks a `"secret"` key (placeholder `xxx`). | Proven |
| R18 | **Classification drift (headline risk)** | Production, experimental, frozen, historical, governance, agent-generated, and research systems share the same physical roots (`os-platform/`, `packages/`, `docs/`). Treating them as one category is how real software gets archived by accident and fantasy code gets promoted by accident. See Appendix A (FECF v1.1). | Corroborated |

---

## 14. Unknowns Register

| Unknown | Why | Label |
|---|---|---|
| Deep git history (pre-2026-05-24) — true file ages, fossil dating, resurrection cycles | Shallow clone graft | **Unknown (hard-blocked)** |
| Whether any script/CI consumes `phase4*.json` at runtime | Not exhaustively grepped | Unknown |
| Which of the 8 production-readiness docs is "current" | No precedence marker | Unknown |
| Live/dead status of 6 Python MCP servers + 33 Tauri crates | Out of scope for run-lens | Unknown |
| Byte-level dedup extent (`packages/terra-*` vs QUARANTINE vs os-platform suites) | Not byte-compared | Suspected/Unknown |
| Whether the 23 `packages/*` app URLs (`localhost:5177`…) are launched by some other orchestrator | Mechanism not located | Suspected |
| Presence of REPO_MAP's `tools/dev/start.ps1`/`verify.ps1` | Not verified | Unknown |
| Whether `spec-lock/` AUTHORITIES locks are enforced by a running gate | Runtime not observed | Suspected (aspirational) |
| `716/91.9%` test figure vs current HEAD | Single static boundary-commit report | Unknown |
| Whether ~14 `AuditableEntityInterceptor` / Tyler-Vision doc refs are present-tense vs exclusionary | Tense not individually verified | Unknown |
| Whether the unverifiable SEALED/SPRINT/ledger commit hashes exist on another remote/branch | Not in this (shallow) checkout; `bfg.jar` suggests a rewrite | Suspected (history rewritten) |
| Whether any `os-platform/specialized` sci-fi module is wired into a running service | Sampled files show no import refs; full call-graph not traced | Suspected (unwired) |

---

## 15. Coverage Gate Result

**`COVERAGE_GATE_PASSED`** for all eight gated areas (filesystem 92%, runtime 85%, build 85%, doc authority 85%, duplication 82%, canon 82%, artifact 80%, negative evidence 85% — all ≥ threshold).

**What is proven:** the live system is a minority of the tree; QUARANTINE is ~70% committed dead code; five of six headline capability claims are contradicted by the repo's own evidence; documentation authority is fragmented and largely aspirational; build/runtime have multiple conflicting canonical surfaces.

**What is contradicted:** REPO_MAP entropy caps & tags, SEALED.md seal chain & "final seal", CLAUDE.md backend path & ports, and the FISMA / swarm / interceptor / deploy / parcel claims.

**What remains materially unknown:** deep git history (hard-blocked by shallow clone) and the bounded items in §14. None of these block *designing* a recovery sequence; they do block claims about history and require a non-shallow fetch to resolve.

**This WO does not authorize cleanup.** Coverage is sufficient to *plan* recovery; execution belongs to a separate WO.

---

## 16. Recommended Next Audit Pass

1. **Un-shallow the history** — `git fetch --unshallow` (or a full clone) and re-run the Temporal Drift + Negative Evidence lenses against true file ages, delete/resurrect cycles, and the real provenance of QUARANTINE and phase4 imports. This is the single highest-value next step; it converts the largest Unknown into evidence.
2. **Canon adjudication pass** — with history available, score `spec-lock/` vs `TerraCanon/` vs `STANDARD.md`+`baseline.md` for *enforced* vs *declared* canon; resolve the 8-way production-readiness doc conflict by date + content; mark one precedence index.
3. **Byte-level duplication pass** — content-hash `packages/terra-*` against `QUARANTINE/top-level-dirs/*` and `os-platform/*` suites to quantify true duplication vs divergence before any consolidation WO.
4. **Runtime reachability proof** — actually boot the canonical surfaces (`backend/src/TerraFusion.API`, `frontend/apps/os-shell`) and the launcher to confirm the no-op launcher finding and the conditional-DLL backend launch; locate (or refute) the orchestrator behind the 23 `packages/*` app URLs.
5. **Documentation honesty sweep (separate WO, cleanup-class)** — reconcile the celebration corpus against `baseline.md`/`AI_ESTATE_INVENTORY.md`; do **not** delete under discovery.
6. **Topology-aware recovery classification (Phase A)** — extend Appendix B's matrix into a per-branch census carrying the **future-home** column (TerraFusionOS / Sync / Dais / Atlas / Forge / Dossier / Pilot / legacy-only / undecided). Best done **after** step 1 (un-shallow), since lineage drives target-home assignment. Keep salvage and migration separate; decide homes before extracting anything.

---

## Appendix A — FECF v1.1: Classification Before Evaluation

This appendix is added in response to the `specialized/` correction. The original error was not a bad quality judgment; it was a **missing classification layer** — the audit ran `name → opinion → disposition` instead of the disciplined order. FECF v1.1 makes the order mandatory and adds three required outputs (A1–A3).

**Doctrine — Classification Before Evaluation.** Before judging quality, classify the object. Evaluate only after classification, in this order:

> **1. Classify** (what *kind* of thing is it?) → **2. Liveness** (is it wired now?) → **3. Authority** (does it govern anything?) → **4. Quality** (is the implementation real?) → **5. Disposition** (what should happen — *out of scope for this WO*).

**Why it matters:** `Frozen + Fantasy` (harmless historical residue) and `Runtime-Critical + Fantasy` (catastrophic — false capability in the live path) look identical if you skip step 1. The bucket changes the risk by orders of magnitude.

**Estate headline risk, revised:** TerraFusion's dominant risk is **not branch chaos — it is classification drift.** Production, experimental, frozen, historical, governance, agent-generated, and research systems occupy the *same physical space*. The danger is not that they coexist; it is treating them as one category — which is how real software gets archived by accident and how fantasy code gets promoted by accident. (Confidence: Corroborated — this very audit demonstrated the failure mode live.)

### A1 — Surface Classification Register

Buckets: Runtime-Critical · Build-Critical · Governance-Critical · Experimental · Frozen · Archive · Generated · Residue · Unknown. (Classification step only — liveness/authority/quality are recorded in the body registers.)

| Surface | Classification | Confidence |
|---|---|---|
| `frontend/apps/os-shell/` | Runtime-Critical | Proven |
| `backend/src/TerraFusion.API/` | Runtime-Critical (build present; runtime reachability conditional) | Corroborated |
| `backend/src/TerraFusion.{Core,Data,Consciousness,Operations,Sync,Levy,…}` | Build-Critical (in `backend/TerraFusion.sln`) | Proven |
| `backend/api-unified/`, `backend/TerraFusionSimple.csproj` | Unknown (orphan entry point, in no .sln) | Suspected |
| `backend/TerraFusion.sln` | Build-Critical (the one `backend:build` uses) | Proven |
| root `./TerraFusion.sln`, `packages/government-edition/TerraFusion.sln` | Build (superseded/secondary) | Proven |
| `pnpm-workspace.yaml` + globbed `packages/*`, `tools/*`, `apps/*` | Build-Critical | Proven |
| `packages/*-MARKED-FOR-REVIEW`, `legislative-pulse`, `gis-pro`, `terra-permit`, `property-tax-ai` | Frozen (workspace-excluded, broken deps) | Proven |
| `spec-lock/` | Governance-Critical | Corroborated |
| `brain/` | Governance-Critical (docs/data only, non-runtime) | Proven |
| `os-platform/core/` (gates, ToolRegistry, canon, tests) | Governance-Critical | Corroborated |
| `os-platform/development/testing-suite/` | Experimental (active tests, non-production) | Corroborated |
| `os-platform/specialized/**` | Frozen (repo-declared `PROTECTED_PATTERNS`) | Proven |
| `os-platform/ai-systems/ai-systems/ai-swarm/` | Experimental→Scaffolding (unwired) | Corroborated |
| `QUARANTINE/` | Archive | Proven |
| `phase4*.json` (root) | Generated (consolidation ledgers) | Corroborated |
| `.pnpm-store/` | Residue (committed package cache) | Proven |
| `_validator_proof.log.err`, `.ci_artifacts_local/`, `.playwright-mcp/` | Residue | Proven |
| `SEALED.md` | Governance (fossil — contradicted by history) | Contradicted |
| `docs/security/baseline.md`, `docs/ai-consolidation/AI_ESTATE_INVENTORY.md` | Governance-Critical (honest authority) | Proven |
| `docs/{reports,phases,milestones,superpowers,recognition}/` | Residue (agent-generated completion corpus) | Corroborated |
| `docs/legacy/`, `docs/ci/archived/` | Archive | Proven |

### A2 — Strata Map (worked example: `os-platform/`)

A single physical root spans five strata; each must be scored independently, not as one category.

| Path | Layer | Role | Confidence |
|---|---|---|---|
| `os-platform/core/` | Governance-Critical | Gates (`check-protected-paths.mjs`), ToolRegistry, canon, leak-guard tests — active control plane | Corroborated |
| `os-platform/development/testing-suite/` | Experimental | The "716-test" corpus; active, non-production | Corroborated |
| `os-platform/specialized/` → `web-audit-tracker`, `operations-dashboard` | Frozen ∩ **Real product** | Versioned apps (`@terrafusion/web-audit-tracker` v1.2.0, ~20K LOC) sitting inside a frozen zone | Proven |
| `os-platform/specialized/` → `security-analytics-quantum`, `quantum-computing-integration`, `autonomous-research-engine` | Frozen ∩ Experimental | Quantum-washed naming over possibly-real logic; quality unadjudicated | Suspected |
| `os-platform/specialized/` → `morphic-resonance`, `dimensional-folding`, `precrime-prevention`, `singularity-…`, `paradigm-…`, `quantum-collapse`, `biofield-…` | Frozen ∩ **Fantasy** | Implementation describes physically-impossible operations (FTL, spacetime folding) | Proven |
| `os-platform/ai-systems/ai-systems/ai-swarm/` | Scaffolding | Doubly-nested, unwired swarm stubs | Corroborated |
| `os-platform/*.ps1` ("championship/quantum"), `EliteDashboard.tsx` | Residue | Aspirational/marketing scripts at root | Suspected |

The point: a **real product** sits inside an **experimental band** inside a **frozen zone** inside a **non-workspace root**. A flat audit (the first pass) collapses all of that to "junk." Strata mapping is what prevents the collapse.

### A3 — Promotion Risk Matrix

Promotion/demotion is **disposition (step 5) — out of scope for this WO.** This matrix only records *what evidence a future, separate WO would need* before moving a surface between layers. Direction matters: promoting fantasy into runtime, or demoting a real product into archive, are the two failure modes the classifier exists to prevent.

| Surface | Current layer | Eligible for | Evidence required before any move |
|---|---|---|---|
| `web-audit-tracker` | Frozen ∩ Real | Experimental → Runtime | Clean build, resolvable deps, named owner, workspace-inclusion decision, security review |
| `operations-dashboard` | Frozen ∩ Real | Experimental | Build proof, integration target, owner |
| `security-analytics-quantum`, `quantum-computing-integration`, `autonomous-research-engine` | Frozen ∩ Experimental | Experimental (only after audit) | **Implementation audit to separate real logic from theater** before any promotion is even considered |
| `morphic-resonance`, `dimensional-folding`, et al. | Frozen ∩ Fantasy | **Not eligible** | Implementation is physically impossible; disposition = archive/quarantine candidate (separate WO) |
| `backend/api-unified/` | Unknown orphan | Runtime *or* Archive | **Un-shallow git history** to determine newer-rewrite vs abandoned-copy; .sln membership decision |
| `config/*quantum/consciousness/transcended*.json` | Residue ∩ false-capability | Demote/relabel | Confirm nothing in the live path reads them as real capability (catastrophic-class check) |
| `SEALED.md` | Governance (fossil) | Relabel as historical | Reconcile seal-chain commits against real history (BFG-rewrite annotation) |

**Net effect:** had A1–A3 been applied first, the `specialized/` directory would have been split into Real / Experimental / Fantasy *before* any quality verdict, and "specialized = trash" could not have been written.

---

## Appendix B — FECF v1.2: Recovery-to-Repo Topology Matrix

This appendix responds to a topology decision: the estate is not destined to remain one forever-repo. It is splitting into **TerraFusionOS core**, **TerraFusion-Sync** (platform), and **suite repos** (Dais, Atlas, Forge, Dossier; AI/Pilot later). That changes what recovery *is*: not "fix the old repo into one clean repo," but **recover the right assets into the right future homes.** "Valuable" is no longer sufficient — an asset must also be **correctly placed.**

**Discovery-stage scope (unchanged):** this appendix performs **Phase A only — classify-for-topology.** It assigns *candidate* future homes and records the evidence a later WO would need. It does **not** salvage, extract, port, split, or migrate anything. Disposition remains a separate work order.

**Doctrine extension (FECF v1.2).** The classification order gains a target field:

> classify → liveness → authority → quality → **target home** → disposition

**Two operations, never conflated:**
- **Salvage** = find and preserve *real value* from the old repo/branches (the FECF body + Appendix A already do this).
- **Migration** = place that value into the *correct new repo*. Migration is gated on the target-home decision below and is out of scope here.

### B1 — Future topology (input) and its estate grounding

The target homes are **user-declared architecture**, but they are **corroborated by the estate's own decomposition** — so this is not an invented taxonomy:

| Future home | Estate evidence it already exists as a domain | Confidence (that the domain exists) |
|---|---|---|
| **TerraFusionOS** (core: shell, workbench host, Pilot/Trace/Canon shell surfaces, contracts, registry) | `frontend/apps/os-shell/`, `os-platform/core/`, `phase4d.wave1b.os-admin/os-shared`, `brain/packs/{shell,trace}` | Corroborated |
| **TerraFusion-Sync** (platform: county ingestion, PACS ETL, normalization) | `backend/src/TerraFusion.Sync`, `packages/terra-sync`, `phase4d.wave1b.canon-sync`, `terra-fusion-sync` (CLAUDE.md) | Corroborated |
| **TerraFusion-Dais** (workflow suite; Levy candidate) | `phase4d.wave1d.dais-workflow`, `brain/packs/dais` | Corroborated (domain); Levy↔Dais binding **Suspected** |
| **TerraFusion-Atlas** (GIS) | `phase4d.wave1c.atlas-gis`, `brain/packs/atlas`, `packages/gis-pro` (excluded) | Corroborated |
| **TerraFusion-Forge** (valuation/CostForge) | `backend/src/TerraFusion.CostForge`, `phase4d.wave1a.forge-{valuation,regression,statistics,calibration}`, `phase4d.wave1d.forge-ui`, `brain/packs/forge` | Corroborated |
| **TerraFusion-Dossier** (documents) | `phase4d.wave1d.dossier-documents`, `brain/packs/dossier` | Corroborated |
| **TerraFusion-Pilot** (AI, later) | `packages/terra-pilt`, `brain/packs/{localops,gpt}`, `backend/src/TerraFusion.AI` | Inferred |
| **legacy-only / undecided** | `QUARANTINE/`, residue, generated ledgers, fantasy modules | Proven (legacy) |

### B2 — Recovery-to-Repo Topology Matrix (Phase A classification)

Columns: *what · real? · lineage · recoverability · future home · confidence.* Target homes are predominantly **Inferred/Suspected** — they depend on architecture decisions and (for lineage) an un-shallowed history. "Undecided" is used deliberately to avoid premature split.

| Asset (needle) | What / real? | Lineage | Recoverability | **Future home** | Conf. |
|---|---|---|---|---|---|
| **N1 — LocalOps / Muse / Pilot** (`brain/packs/localops`, `docs/localops`, `packages/terra-pilt`, `backend/src/TerraFusion.AI`) | LocalOps is runtime-proven (per CLAUDE.md); shell-facing AI surfaces real | mixed | shell integration: high; deep AI internals: medium | **shell-facing → TerraFusionOS core; deep AI internals → TerraFusion-Pilot (later)** | Suspected |
| **N2 — canon / governance tooling** (`spec-lock/`, `brain/canon`, `os-platform/core` gates) | Real governance machinery (Governance-Critical, A1) | core | high | **TerraFusionOS core** | Corroborated |
| **N3 — Atlas / ArcGIS** (`brain/packs/atlas`, `phase4d.atlas-gis`, `packages/gis-pro`) | GIS domain real; the QUARANTINE ArcGIS *binary install* is external tooling, **not** recoverable source | suite | source: medium; binaries: not recovered | **TerraFusion-Atlas** (binaries → external, not migrated) | Corroborated |
| **Sync deep engines** (`backend/src/TerraFusion.Sync`, `packages/terra-sync`, `terra-fusion-sync`) | Real ETL/ingestion; upstream of everything | platform | high | **TerraFusion-Sync** (PACS remains the *source*, not a destination) | Corroborated |
| **Levy** (`backend/src/TerraFusion.Levy`, `packages/terra-levy`, `docs/levy`) | Real, but **fragmented across 3 locations** (classification-drift instance) | suite | medium (must consolidate first) | **TerraFusion-Dais** *(architecture decision, not current fact)* | Suspected |
| **Forge / CostForge** (`backend/src/TerraFusion.CostForge`, `phase4d.forge-*`) | Real valuation domain | suite | high | **TerraFusion-Forge** | Corroborated |
| **Dossier** (`phase4d.dossier-documents`, `brain/packs/dossier`) | Document domain | suite | medium | **TerraFusion-Dossier** | Inferred |
| **Shell / workbench host** (`frontend/apps/os-shell/`) | Live shell (Runtime-Critical, A1) | core | high | **TerraFusionOS core** (recovery spine) | Proven |
| **web-audit-tracker** (`os-platform/specialized/`) | Real product v1.2.0, but home unclear (core? suite? standalone?) | frozen∩real | high (builds independently) | **Undecided** — needs owner + product decision | Suspected |
| **Backend orphans** (`backend/api-unified`, `TerraFusionSimple.csproj`) | Unknown (in no .sln) | unknown | unknown | **Undecided** — un-shallow history first | Unknown |
| **QUARANTINE/**, `.pnpm-store/`, `phase4*.json`, fantasy modules | Archive / residue / generated / impossible | n/a | not recovered | **legacy-only** | Proven |

### B3 — Recovery sequencing (topology-ordered)

Recover in the order of the *future* system, not the old one. Topology-aware, **phased** — decide homes now, extract later, never split prematurely (the "higher risk" the topology decision introduces).

- **Phase A — Classify for future topology** *(this appendix; the only phase in scope for this WO)*: for every meaningful asset record what / real? / lineage / recoverability / future home.
- **Phase B — Recover the core spine** → TerraFusionOS: shell, workbench host, Pilot/Trace/Canon shell surfaces, contracts, runtime composition, registry.
- **Phase C — Recover platform ingress** → TerraFusion-Sync: county ingestion, PACS ETL, hub feed, shared normalization (upstream of all suites).
- **Phase D — Recover suite domains** → Dais (incl. Levy), Atlas, Forge, Dossier — starting with the most stable / least fractured.

### B4 — Anti-patterns: stop recovering wrapper noise

The old monorepo blurred boundaries; a cleaner topology must not pull the blur forward. **Do not migrate:** ghost workspace layers (e.g. the vestigial npm `workspaces` field, the non-existent `agents/*` glob), fake/empty platform wrappers, misleading shell fluff, floating Levy/platform confusion (the 3-location Levy split), or suite logic disguised as core. These are artifacts of the old structure, not assets — recovering them re-creates the exact classification drift (R18) the split is meant to end.

**Net:** recovery is now constrained by *"what do we save, **and where should it live**?"* — which makes it more precise and far less likely to rebuild the old mess in new repos. The next concrete artifact a recovery WO needs is a per-branch extension of B2 (a branch census carrying the **future-home** column) — best produced *after* the history is un-shallowed (§16 step 1).

---

## Appendix C — FECF v1.3: Topology Confidence Ladder & Hypothesis Register

Appendix B assigns candidate future homes. Left there, a "future home" column can quietly harden into a migration plan — the reader stops seeing *guess* and starts seeing *destination*. Appendix C prevents that by (1) giving target-home assignments their **own** confidence ladder, distinct from the body's "is-it-real" labels, and (2) recasting the placements as a **Topology Hypothesis Register** (evidence-for / evidence-against / blocking-unknowns), not a move list.

**Why a separate ladder:** the body's confidence labels answer *"is this asset real / live / authoritative?"*. A future-home label answers a different question — *"how sure are we this belongs in repo X?"* — and must not borrow the body's certainty. An asset can be **Proven-real** yet **Suspected-placement**.

### C0 — The three recovery phases (explicit)

Most efforts jump A→C and silently convert discovery into implementation. FECF separates them:

| Phase | Question | In scope here? |
|---|---|---|
| **A — Forensic Recovery** | What survives? What is worth preserving? What *kind* of thing is it? | ✅ (FECF body + App. A) |
| **B — Architectural Recovery** | *If* preserved, where should it live? | ✅ **classification only** (App. B + C) — no moves |
| **C — Physical Recovery** | What actually gets moved, when, how? | ❌ separate WO |

The full maturity order: **classify → liveness → authority → quality → target home → disposition.** Target home is meaningful only *after* the first four — quality alone is not enough (a high-quality, non-live, non-authoritative surface can still be a fossil; a messy, high-authority, runtime-critical one can be core).

### C1 — Topology Confidence Ladder

Confidence semantics for **future-home assignment specifically** (not asset reality):

| Label | Meaning (for placement) |
|---|---|
| **Proven** | The asset *already* lives in something that maps directly to that home (or is demonstrably external). |
| **Corroborated** | Multiple independent signals agree (domain project + package + phase4 wave + brain pack). |
| **Inferred** | Strong architectural evidence, but no direct ownership link yet. |
| **Suspected** | Naming/topology hints only. |
| **Unknown** | Insufficient evidence; record as undecided. |

### C2 — Topology Hypothesis Register

*This is architecture archaeology, not a move list.* Each row is a hypothesis to be tested by a later (post-un-shallow) WO, never executed here.

| Asset | Future-home hypothesis | Evidence FOR | Evidence AGAINST | Blocking unknowns | Placement conf. |
|---|---|---|---|---|---|
| Shell / workbench host (`frontend/apps/os-shell/`) | **TerraFusionOS core** | It *is* the live OS shell (Runtime-Critical) | — | none material | **Proven** |
| canon / governance (`spec-lock/`, `brain/canon`, `os-platform/core`) | **TerraFusionOS core** | Governance machinery already in core control plane | spread across 3 roots | which root is canonical post-split | **Corroborated** |
| Sync engines (`backend/src/TerraFusion.Sync`, `packages/terra-sync`) | **TerraFusion-Sync** | domain project + package + `phase4d.canon-sync` + `terra-fusion-sync` (CLAUDE.md) | sync logic also bleeds into canon/* | exact ETL/PACS boundary | **Corroborated** |
| Atlas / GIS (`brain/packs/atlas`, `phase4d.atlas-gis`, `packages/gis-pro`) | **TerraFusion-Atlas** | pack + wave + package all agree | `gis-pro` is workspace-excluded (broken deps) | does excluded pkg resolve? | **Corroborated** |
| Forge / CostForge (`backend/src/TerraFusion.CostForge`, `phase4d.forge-*`) | **TerraFusion-Forge** | backend project + 5 forge waves + `forge-ui` + pack | — | UI vs engine repo boundary | **Corroborated** |
| Dossier (`phase4d.dossier-documents`, `brain/packs/dossier`) | **TerraFusion-Dossier** | wave + pack | no dedicated backend project yet | is there real code or only a domain label? | **Inferred** |
| **Levy** (`backend/src/TerraFusion.Levy`, `packages/terra-levy`, `docs/levy`) | **TerraFusion-Dais** | `phase4d.dais-workflow` exists; Levy is a workflow domain | **no `dais` backend peer; Levy is its own backend project + package + docs** | does Dais subsume Levy, or are they siblings? | **Inferred** *(roadmap, not fact)* |
| Pilot AI internals (`packages/terra-pilt`, `backend/src/TerraFusion.AI`, `brain/packs/{localops,gpt}`) | **TerraFusion-Pilot** (later) | naming + pack hints; LocalOps runtime-proven | shell-facing parts belong in core, not Pilot | core/Pilot split line undefined | **Suspected** |
| web-audit-tracker (`os-platform/specialized/`) | **Undecided** | real v1.2.0 product | umbrella gives no home signal | core? suite? standalone product? | **Unknown** |
| backend orphans (`api-unified`, `TerraFusionSimple.csproj`) | **Undecided** | — | in no `.sln` | newer rewrite or abandoned? (needs history) | **Unknown** |
| ArcGIS binaries (`QUARANTINE/.../ARCGIS/...`) | **External dependency** (not TF-owned) | demonstrably an ESRI install (`.bsp`, `.ptc`, `.stylx`) | — | none | **Proven** (external) |
| Fantasy modules (`morphic-resonance`, `dimensional-folding`, …) | **legacy-only** | implementation is physically impossible | — | none | **Proven** (not migrated) |

**Note the `Contradicted` column is empty by design** — no current evidence *contradicts* these homes (e.g., "Dais already owns the Levy backend" is **false**: there is no `TerraFusion.Dais` backend project). If such evidence appeared, it would override the hypothesis. None has.

**Net:** Appendix C keeps B honest. A future-home assignment now carries its own confidence, its counter-evidence, and the specific unknown that blocks it — so the register reads as a set of **testable topology hypotheses**, not a stealth migration plan. The framework can now discuss future structure without performing recovery, which is the whole point.

---

*Produced under WO-FECF-001 in discovery mode (FECF v1.3: Classification Before Evaluation · Recovery-to-Repo Topology · Topology Confidence Ladder). Recovery is separated into Forensic (A) / Architectural (B, classification only) / Physical (C, out of scope). No files were deleted, moved, renamed, merged, consolidated, archived, migrated, salvaged, or rewritten. Target homes are confidence-laddered hypotheses, not decisions. Confidence labels are not promoted to truth. Unknowns are reported, not hidden.*
