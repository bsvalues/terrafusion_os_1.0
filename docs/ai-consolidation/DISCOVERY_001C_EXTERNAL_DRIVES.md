# WO-AI-DISCOVERY-001c — External Drive AI Estate Sweep (D:/ and E:/)

> **Work order:** WO-AI-DISCOVERY-001c · **Date:** 2026-06-11 · **Mode:** READ-ONLY
> Nothing written, moved, or modified on either drive; no git operations performed there.
> Inventory voice only — verdicts describe what exists; nothing here authorizes recovery,
> resurrection, mounting, or deletion. This sweep ran locally on the operator workstation
> (it was impossible from the cloud container that executed 001a/001b's predecessors).
> **Authorization (governance trail):** per repo `AGENTS.md`, work outside the Core Governance
> Surface requires explicit authorization. These `docs/ai-consolidation/**` discovery artifacts are
> explicitly authorized by the **TF-AI-OPS-001** goal directive (which mandates discovery across
> repo quarantine, GitHub, and external drives D:/E:) — the same linkage recorded in the merged
> [`DISCOVERY_001A_REPO_QUARANTINE.md`](DISCOVERY_001A_REPO_QUARANTINE.md) §Authorization and
> carried by the merged 001b (#955) and 002 (#957) deliverables on this exact path.
> **Drives:** D: 932 GB (712 GB used, 77%) · E: 4.6 TB (4.4 TB used, 97% full)

## Per-drive structure summary

### D:/ — Office working drive + migration-kit graveyard
Primarily live Benton County assessor office data (sales sheets, BLAs, PILT, REET exports, DOR pubs, forms) plus database archives and a ring of small "kit" folders from the Apr 2025 PACS-migration push. AI-relevant material is thin: small TS/config stubs, no runtimes. Office data files are actively modified (through Jun 2026); the kit folders are frozen at Apr–Aug 2025.

### E:/ — TerraFusion workspace archaeology + data corpus
Five-plus generations of TerraFusion workspaces, mostly overlapping copies: `TF_File_8_25` (Aug 2025 dump of ~30 precursor repos), `ARCHIVE_2025_08_09`, `TerraFusion_Archive_2025_08_10`, `TF_Archive_From_C_Drive`, `8-24-25/TerraFusion_OS_1.0` (Aug 2025 OS-repo snapshot), `terrafusion_os_1.0_three_pillars_phase0` (22 GB Oct 2025 OS-repo snapshot), and **`TerraFusion_Master`** — a hash-manifested consolidation run dated **2026-04-27** (265,939 files, ~204 GiB, 212 archived repos, 7 active repos; manifests at `C:\TerraFusion_Recovery_Manifests\run_20260427_002431\`). Plus PACS/ProVal data corpus and a 375 GB `TerraFusion.vhd`.

## Local-model findings (headline)

- **No local LLM weights exist on either drive.** Scans for `.gguf`, `.safetensors`, `.onnx`, `.ggml`, `.pt`, `.pth` to depth 7 (excluding node_modules/recycle) returned **zero hits** on both D: and E:.
- **No Ollama or LM Studio model store** on either drive (no `*ollama*`, `*lmstudio*`, `*llama*` directories).
- Only trained-model artifact found: `E:\TerraFusion_Master\02_ARCHIVED_REPOS_READONLY\TerraLevy\ml\models\levy_impact_model.pkl` — **969 bytes** (toy sklearn model, Jun 2025, with metrics/training-history files and a drift-detection/retraining harness around it).
- Every directory named `ai-models` (three_pillars, 8-24-25 snapshot, backend/, data/) contains **markdown plans and demo scripts, not weights**. The three_pillars `ai-models/README.md` says outright: "AI models will be migrated from the existing Rust backend during Phase 2" — all checkboxes unchecked.
- All "1,008-agent swarm" material on these drives resolves to JSON persona configs (~1.7 KB each), shell scripts, and playbook markdown. `SupremeCommanderClaude.ts` despite the name calls the **OpenAI cloud API** (`OPENAI_API_KEY`), not Anthropic and not local.

## AI-relevant inventory

| Path | What it is | Size | Recency | Verdict | Unique value |
|---|---|---|---|---|---|
| `E:\backend\` | **Flask RAG server: Ollama (`llama2` + `nomic-embed-text` @ localhost:11434) + ChromaDB**, OAuth-stub, `benton_county_knowledge` collection; 3 variants (`simple_rag{,_lite,_production}.py`) + Rust Cargo + TS api-server mixed in | ~few MB code | Jul–Aug 2025 | **usable / needs-work** | The only real local-AI implementation on either drive. Chroma store empty — never populated. Direct architecture precedent for LocalOps |
| `E:\TerraFusion_Master\03_PROMPTS_AND_CONTEXT\` | Curated AI prompt/context corpus: 1,468 entries (4,086 docs per manifest) — agent prompts, handoff contexts, ICSF_GAMA Replit contexts, AIPromptTemplates.json; bulk is 4 duplicate `SystemPrompts_AI_Tools_PRODUCTION` zips (public system-prompt collections, >100 MB each) | 24 GB | curated Apr 2026 | **data-corpus** | Unique record of 1.5 yrs of TF prompting doctrine; ICSF/GAMA contexts |
| `E:\TerraFusion_Master\` (whole) | Hash-manifested D/E consolidation: 01_ACTIVE_REPOS (7), 02_ARCHIVED_REPOS_READONLY (212 repos incl. TerraAgent, TerraLevy, terragroq, BCBS*, TerraFlow×7 dupes), 09_UNKNOWN_QUARANTINE | ~204 GiB / 266k files | Apr 27 2026 | **island (curated)** | The already-done consolidation pass; manifests on C: prove provenance. Supersedes raw archives |
| `E:\TerraFusion_Master_Workspace\ai-training\` | Python "AI Training Pipeline" orchestrator + data_pipeline/model_training agents; config targets v1/v2/v3 with "quantum" features | small | Aug 2025 | **vapor-demo / needs-work** | Real Python scaffolding, ran at least once (`__pycache__`), produced no models |
| `E:\terrafusion_os_1.0_three_pillars_phase0\` | Full OS-repo snapshot mid-"Operation Three Pillars"; ai-swarm-supreme-commander (OpenAI API), AI_AGENT_DEVELOPMENT_ENVIRONMENT (README only), RAGPanel module (empty), requirements.txt declaring torch/langchain/chromadb/anthropic (never materialized) | 22 GB | Oct 2025 | **duplicate-of-repo** | None beyond history; live repo is ahead |
| `E:\8-24-25\TerraFusion_OS_1.0\` | Earlier OS-repo snapshot (CLAUDE-*.md family, ai-swarm dirs) | unmeasured (large) | Aug 2025 | **duplicate-of-repo** | None |
| `E:\TF_File_8_25\` | Dump of ~30 precursor repos (TerraAgent, PropertyTaxAI, BCBSCOSTApp, DemonEngine/pacs-query-agent, terrabuild_devkit_v3_full_swarm…) + `benton-county-ai-swarm` (empty `models/`, 16 KB sqlite, 1.7 KB knowledge.json) | unmeasured (very large) | Aug 2025 | **island / superseded** | Mostly re-captured inside TerraFusion_Master archive |
| `E:\TerraLevy` (in 02_ARCHIVED) | Levy ML with drift detection, auto-retraining scheduler, the one .pkl | small | Jun 2025 | **needs-work** | Only end-to-end train→persist→retrain loop in the estate |
| `E:\v1_foundation / v2_project_reflex / v3_cosmic_governance` | Three "versions" (FastAPI BI / AI copilot / governance); v1 requirements are plain FastAPI, no AI deps | small | Aug 2025 | **vapor-demo** | Named as training targets by ai-training config |
| `E:\codex\` | `transcendent_ai_agent.py` (3 KB), agent prompt JSON, time-capsule tarball | 2 MB | Jul 2025 | **vapor-demo** | — |
| `E:\BENTON_COUNTY_AI_CHAMPIONSHIP / _DEMO / _PLAYBOOK` | Markdown playbooks + node demo-server with static Benton JSON | 2 MB | Aug 2025 | **vapor-demo** | Demo JSON of properties/levies only |
| `E:\TerraFusion Nexus\` | Market-domination launch scripts, 2 tiny SQLite dbs (16–24 KB) | small | Jun–Aug 2025 | **vapor-demo** | — |
| `E:\benton-venv\` | WSL-created Python 3.12 venv, **no site-packages** (hollow shell) | small | Aug 2025 | **vapor** | — |
| `D:\src-tauri\` (1.4 GB zip + dir) | TerraFusion_Hybrid_Championship (playbooks, swarm-config), swarm_framework_core (4 TS files), quality-assurance sub-agents, quantum-optimization | dir unmeasured / zip 1.4 GB | Aug 2025 | **vapor-demo / island** | swarm_framework_core.ts + claude_code_integration.ts are design docs in TS form |
| `D:\MCPS_AgentMesh_*` + `D:\terrafusion_pack_bundle\services\mcps-agentmesh` | Agent-mesh deploy stubs: Dockerfile + agent registry YAML + k8s yaml (3 files) | KBs | Apr 2025 | **vapor-demo** | — |
| `D:\PACS_Live_API_DevTest_Kit`, `PACS_ETL_Sync_Service_Kit`, `PACS_Migration_DevOps_Kit` | Python stubs + Postman collection + **PACS full schema PDF/XLSX/DDL/stored-proc dumps** | KBs–MBs | Apr 2025 | **needs-work (schema docs) / vapor (stubs)** | `PACS_Reconstructed_DDL.sql`, stored-procedures dump = PACS schema reference corpus |
| `D:\TerraFusion_NextGen_Elite_Execution\` | subagent-swarms (ai-integration/design/execution/infrastructure) deploy scripts + md | small | Aug 2025 | **vapor-demo** | — |
| `D:\ExportDataPath\AUTO AGENT\AutoAgent05.11.26.txt` | **Not an agent** — 49 MB fixed-width county tax-roll export | 49 MB | May 2026 | **data-corpus (misnamed)** | Current tax-roll extract |
| `E:\TerraFusion.vhd` | 375 GB virtual hard disk named TerraFusion | **375 GB** | **Apr 24 2026 (recent)** | **gap — uninspected** | Unknown; potentially an entire environment |

## Benton training-data corpus (relevant to a local AI path)

| Asset | Location | Size | Notes |
|---|---|---|---|
| PACS full DB archive | `D:\PACS.zip` | **51 GB** | Apr 2025 |
| PACS replication data | `D:\BentonReplData.rar` | 1.06 GB | May 2026 — recent |
| PACS live MDFs | `E:\pacs-databases\` (`pacs_oltp_Benton_TAX.mdf`, `pacs_spatial.mdf`, lists) | multi-GB | Mar 2026 |
| PACS backups | `E:\pacs_benton_122915.bak`, `E:\pacs_spatial_backup_2026_01_15.bak` (167 MB), `E:\MSSQL.rar` (5.3 GB), `D:\MSDE.zip` (3.1 GB) | — | spatial backup Jan 2026 |
| ProVal corpus | `D:\PV_Plus\` + `D:\PV_Plus.zip` (**32 GB**) — ProValPlus 7.6.1/7.11.4 installers, CAMA tables, Marshall&Swift, schema SQL | 32 GB+ | Feb–Apr 2026 |
| Ascend (historical tax) | `D:\Ascend30\` (+Copy) — Access DBs (WA_BEN30.mdb, BentonCustomized30.accdb) + `D:\ascprod_backup_2017_02_14.bak` (**14.4 GB**) | ~15 GB | frozen 2017/2023 |
| Appraisal education corpus | `D:\Library\` + `D:\Library.zip` (**11.5 GB**) / mirrored `E:\Library\` — USPAP 2014–2024, IAAO courses, ratio studies, valuation PDFs/videos | 11.5 GB | Apr 2026 |
| Office ops corpus | `E:\Files of Appraisal\` (BOE/BTA appeals, REVAL models), `E:\Files of Devops\` (GIS shapefiles, Spatialest-adjacent), `D:\Benton Assewssor Files\`, `D:\wsaca\` | large | active |
| Tabular extracts | `E:\Main_Property_Tables.xlsx` (233 MB), `E:\Completed Comps.zip` (4.2 GB), `E:\Benton County Dashboard 2024full test.xlsx` (78 MB), `D:\2026 all sales list.xlsx` | ~4.5 GB | Jan–Apr 2026 |
| Curated legacy data | `E:\TerraFusion_Master\06_LEGACY_DATA_AND_IMPORTS\` (CAMA, PACS, GIS_AND_PARCELS, DATABASE_BACKUPS — 11,731 files manifested) | within 204 GiB | Apr 2026 |

## Other inventory facts

- **Plaintext credentials observed on disk** (inventory note only; nothing touched): `E:\Gemini AIzaSy….txt` (API key in the filename), `E:\Rapid API.env.txt`, `D:\PACS.env.txt`, `D:\bspass.env.txt`, `E:\TerraFusion.txt` (Azure tenant/subscription IDs). Flagged for operator action (rotate/relocate); out of scope for a read-only discovery slice.
- Root-level AI prompt files on both drives (`THIS IS A PROMPT I GIVE TO ALL AIS.txt` — the "TF:" persona protocol, Rust-default; agent persona .txt files dated Jun 2025).
- `.vscode/extensions` snapshots on E: carry Copilot/CodeGPT/Blackbox extension copies — tooling artifacts, not assets.

## Explicit gaps (not assessed)

1. **`E:\TerraFusion.vhd` (375 GB, modified Apr 2026)** — would require mounting; contents unknown. Largest single unknown in the estate.
2. **Large archives not opened:** `D:\PACS.zip` (51 GB), `D:\PV_Plus.zip` (32 GB), `D:\Library.zip` (11.5 GB), `D:\src-tauri.zip` (1.4 GB), `E:\MSSQL.rar`, `E:\Completed Comps.zip` (4.2 GB) — classified from names/sibling dirs only.
3. **Depth limit:** model-weight scans went 7 levels deep; deeper nests (e.g., inside `Users\`, `Seagate\`, `CloudStorage\`) not exhaustively walked. `E:\CloudStorage\OneDrive\Desktop\TF_AI` is empty.
4. **`E:\TerraFusion_Master\09_UNKNOWN_QUARANTINE_DO_NOT_RUN`** — honored its label; not opened.
5. **Exact sizes** for `TF_File_8_25`, `TerraFusion_Master`, `8-24-25` not measured (drive too slow); TerraFusion_Master totals taken from its own 2026-04-27 hash manifest.

## Bottom line for consolidation

The external drives hold **zero locally runnable model assets** — the AI estate there is (a) one genuinely relevant Ollama+ChromaDB RAG codebase (`E:\backend`), (b) a 24 GB prompt/context doctrine corpus, (c) one toy ML loop (TerraLevy), (d) a very large, mostly-duplicated archive of aspirational swarm/agent scaffolding already consolidated once under `E:\TerraFusion_Master` with hash manifests, and (e) the real prize: a multi-source Benton data corpus (PACS/ProVal/Ascend/Library/appraisal files) suited to feeding a governed local-AI path. The 375 GB VHD is the one unexamined wildcard.
