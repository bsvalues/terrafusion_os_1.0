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
| **Sci-fi scaffold modules** | `os-platform/specialized/` holds **20 module dirs**: `biofield-integration`, `dimensional-folding`, `morphic-resonance`, `precrime-prevention`, `paradigm-transcendence-engine`, `singularity-preparation-framework`, `citizen-avatars`, etc. `MorphicResonancePlugin.js` (582 lines) declares `propagationSpeed:'instantaneous' // Faster than light`, Schumann-resonance frequencies, header *"Government. Transcended."* package.json + stub tests, **unwired to runtime**. | **Severe** | Proven |
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

---

*Produced under WO-FECF-001 in discovery mode. No files were deleted, moved, renamed, merged, consolidated, archived, or rewritten. Confidence labels are not promoted to truth. Unknowns are reported, not hidden.*
