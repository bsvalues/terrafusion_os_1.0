# External Drive Scout — Findings

**Scope:** Reusable conference assets for five demo experiences (Atlas Property Dossier, Atlas County Pulse, Academy Codex, Ask Academy, demo navigation) + any NotebookLM / ChatGPT / Claude conversation exports.
**Mode:** READ ONLY. Nothing moved, modified, or deleted.
**Date:** 2026-06-02
**Drives:** D:\ (711 GB), E:\ (4.5 TB) — both mounted.

---

## Drive map (top-level directories)

### D:\ (711 GB)
Library, PACS_Migration_Git_Workspace_v4, PACS_Migration_DevOps_Kit, PACS_Full_Migration_Integration_Archive, MSSQLBckup, MCPS_AgentMesh_Infra_Deployment, PACS_ETL_Sync_Service_Kit, PACS_Live_API_DevTest_Kit, ValuationAPI_AWS_ECS_Deployment_Kit, ValuationAPI_AZURE_AppService_Deployment_Kit, PACS_Database_Full_Package, PACS_Migration_Git_Workspace_v2, PACS_Migration_Strategy_Governance_Kit, planning, terrafusion-advanced, src-tauri, terrafusion_pack_bundle, terrafusion_automation_pack, TerraFusion_NextGen_Elite_Execution, **Benton Assewssor Files**, **DOR Publications**, **FORMS - CU Farm and Ag and OS**, FORMS - MISC, MH Permits Move Certs Title Elimin, **RCWs and WACs**, 2025 Short Plats & Rec Suvreys, 2026 New Construction, 2026 Pending BLAS, 2026 Sales Sheets, ALL SMOO PACKETS, Destory Property, New folder, RAD Queries, Z-Old Folders, PACS Mobile, Commercial, PV_Plus, Ascend30, Ascend30 - Copy, Reports, ExportDataPath, GIS Server, PILT, wsaca

### E:\ (4.5 TB)
terrafusion_os_1.0_three_pillars_phase0, **TerraFusion_Master**, Cost, Dashboard files, Dashboards, Favorites, **Files of Appraisal**, **Files of Devops**, mssql_data, **CloudStorage**, PropAccessData, pacs_benton_122915, Benton_County_Assessor.gdb, Bills stuff, BP_BS Project, Budget, Budget 2024-2026, Desktop Folders, Desktop Notes Docs, Destop Exel Docs, Documents, Dynamo Appraiser, Exports, Library, pacs-databases, .vscode, docker-mssql-data, .github, PACS, DockerData, mssql_image_dl, Files of SQL, New folder (2), documents for checking, Check this folder, TerraFusion_Tauri_Master_Workspace, TF_File_8_25, TerraFusion_Master_Workspace, TF_Archive_From_C_Drive, ARCHIVE_2025_08_09, TerraFusion_Archive_2025_08_10, TerraFusionDevelopment, TerraFusion Nexus, backend, old_builds, v3_cosmic_governance, user-docs, v1_foundation, v2_project_reflex, **BENTON_COUNTY_AI_CHAMPIONSHIP**, **BENTON_COUNTY_CHAMPIONSHIP_DEMO**, TerraFusion_Daily_Work, **BENTON_COUNTY_CHAMPIONSHIP_PLAYBOOK**, benton_county_production, benton-venv, blockchain-infrastructure, **codex**, config-management, county-customization, data, **demo-data**, Deployment, TerraFusion_Web, docs, Documentation, planning, scripts, Users, 8-24-25, config, database, public_html, TERRAFUSION_COUNTY_TEMPLATE_SYSTEM, WASHINGTON_STATE_COUNTIES, TERRAFUSION_SECURE_DATA_SHARING, terrafusion-advanced, TerraFusion_NextGen_Elite_Execution, apps, .cursor, Temp

---

## Top candidates

| Asset | Full path | Type | Story | Reuse | What it is |
|---|---|---|---|---|---|
| demo-scenarios.json | E:\BENTON_COUNTY_CHAMPIONSHIP_DEMO\demo-scenarios.json | json | act / navigation | **High** | 4 scripted demo scenarios (property assessment, tax levy, workflow automation, AI analysis) with audience, duration, steps — directly reusable as demo nav spine |
| Musk Demo Script & Flow | E:\TerraFusion_Master\01_ACTIVE_REPOS\TerraFusionGIS\archive\reference-docs\attached_assets\Pasted--1-Musk-Demo-Script-Flow-...-1747938417691.txt | txt | act / navigation | **High** | Step-by-step "Mission Control for every property in Benton County" demo flow: dashboard → interactive parcel map → AI next-best-action → audit. Mirrors Atlas Dossier + County Pulse narrative |
| terrafusion.brand.json | E:\TerraFusion_Master\01_ACTIVE_REPOS\terrafusion-brand-vault\terrafusion.brand.json | json | navigation | **High** | Canonical brand tokens; reusable for consistent conference UI shell/navigation theming |
| EXECUTIVE_PRESENTATION.md | E:\BENTON_COUNTY_CHAMPIONSHIP_DEMO\EXECUTIVE_PRESENTATION.md | md | act | High | Executive-level pitch deck content for a Benton County demo |
| demo-server.js + demo-config.json + demo-users.json + demo-metrics.json | E:\BENTON_COUNTY_CHAMPIONSHIP_DEMO\ | js/json | act / navigation | High | Self-contained demo harness (server, config, seeded users, live metrics) — runnable demo backbone |
| benton-county-anonymized.js / data-generator.js | E:\demo-data\ | js | property | High | Anonymized Benton parcel demo data + generator — safe demo dataset for Atlas Property Dossier |
| Knowledge library (assessor education) | E:\Files of Appraisal\Knowledge\ | folder (pdf/docx/pptx) | knowledge | **High** | Deep assessor-education corpus: USPAP archives, IAAO Mass Appraisal standard, cost/income approach, cap rate training, Courses (CWIAAO, McKissock, dornfest). Core source for Academy Codex / Ask Academy |
| Knowledge\Courses | E:\Files of Appraisal\Knowledge\Courses\ | folder | knowledge | High | Structured course material incl. "AI Courses", CWIAAO, IAAO Mass Appraisal PDF — Academy curriculum source |
| senior_exemption_calculator.html | E:\TerraFusion Nexus\TERRAFUSION_ECOSYSTEM_COMPLETE\TerraFusionAssistant_PRODUCTION\TerraFusionAssistant\archive\reference_files\terraflow_reference\templates\senior_exemption_calculator.html | html | knowledge / property | Med | Working senior-exemption calculator template — reusable Academy/dossier interactive widget |
| TerraFusionAssistant (Ask-Academy precursor) | E:\TerraFusion Nexus\TERRAFUSION_ECOSYSTEM_COMPLETE\TerraFusionAssistant_PRODUCTION\TerraFusionAssistant\ | python app | knowledge | Med | Streamlit AI assistant (agent_base, auth, components, pages, mcp_core) — architectural precursor for Ask Academy |
| codex viewer | E:\codex\codex-viewer.html, E:\codex\codex-viewer.tsx, E:\codex\TFMP_SCHEMA.md | html/tsx/md | knowledge | Med | A "Codex" viewer (HTML + React) + schema — naming/concept match for Academy Codex experience |
| BENTON_COUNTY_CHAMPIONSHIP_PLAYBOOK (docs) | E:\BENTON_COUNTY_CHAMPIONSHIP_PLAYBOOK\ | md | act | Med | SCOUTING_REPORT_BENTON_COUNTY.md, SYSTEM_ARCHITECTURE.md, API_DOCUMENTATION.md — narrative + architecture talking points |
| CHAMPIONSHIP_DASHBOARD.html / championship_ui.html | E:\BENTON_COUNTY_CHAMPIONSHIP_PLAYBOOK\ | html | navigation | Med | Standalone dashboard UI mockups — County Pulse visual reference |
| demo-packaging-scripts | E:\TerraFusion_Master\01_ACTIVE_REPOS\TerraFusion_Master_Workspace\demo-packaging-scripts\ (build-tauri-demo.ps1, create-demo-package.ps1) | ps1 | navigation | Med | Scripts that package a Tauri demo build — useful to assemble the conference build |
| 03_PROMPTS_AND_CONTEXT | E:\TerraFusion_Master\03_PROMPTS_AND_CONTEXT\ | md/json/yaml | knowledge / act | Med | TerraFusion brand guide, architecture docs, system-prompts.json, terra-agent.yaml — talking points + Ask-Academy prompt seed |
| DOR Publications / RCWs and WACs / FORMS | D:\DOR Publications\, D:\RCWs and WACs\, D:\FORMS - CU Farm and Ag and OS\ | folders (pdf) | knowledge | Med | Authoritative WA statute/regulation + DOR publications + assessor forms — grounding corpus for Ask Academy / Codex |

---

## NotebookLM / ChatGPT / Claude conversation exports

**No bulk conversation exports were found.** Searched both drives (depth 3–5) for `conversations.json`, `*chatgpt*`, `*notebooklm*`, `*claude*export*`, `*gpt*export*`, `*chat*export*`, and export-named `.zip` files. Results were empty except:

- `E:\CloudStorage\OneDrive\Desktop\ChatGPT.lnk` and `ChatGPT (1).lnk` — desktop shortcuts only (0 bytes), not data.
- `E:\CloudStorage\OneDrive\the architect of a revolutionary ChatGPT-powered assistant.docx` (~20 KB) — a single doc, not a conversation archive.
- `E:\Destop Exel Docs\Copy of ChatGPT-for-Excel.xlsx` — an Excel add-in helper, not an export.
- `E:\CloudStorage\OneDrive\Microsoft Copilot Chat Files\` — **empty folder**.
- `E:\CloudStorage\OneDrive\AI Prompts\` — three prompt-idea .docx files (AI Executive Summery prompt, Appraisal Prompt ideas, Model Build Chat) — useful prompt seeds, not exports.
- Several `.docx` in `E:\CloudStorage\OneDrive\` are pasted chat transcripts saved as Word (e.g. "Assistant development chat.docx", "Model Build Chat.docx") — manual saves, not platform exports.

**Conclusion:** No NotebookLM exports and no ChatGPT/Claude `conversations.json` archives exist on the drives. AI conversation history survives only as individually pasted `.docx` files in OneDrive.

---

## Sampled vs. skipped (no silent truncation)

**Sampled (not exhaustively scanned):**
- `E:\Files of Appraisal\Knowledge\` — listed top-level + Courses/USPAP/Library; did NOT recurse every subfolder (large, hundreds of PDFs). Confirmed it is a deep assessor-education corpus.
- `E:\CloudStorage\OneDrive\` — listed root + recursed to depth 5 for export patterns only; did not enumerate every file.
- `E:\TerraFusion_Master\01_ACTIVE_REPOS\TerraInsight` and `terrafusion-brand-vault` — top-level only; noted brand.json, did not walk full source trees.
- `E:\BENTON_COUNTY_CHAMPIONSHIP_DEMO` — listed root; node_modules/data/backups not walked.

**Deliberately skipped (out of scope / huge / not asset-bearing):**
- Full recursive scan of E:\ (4.5 TB) — per constraint.
- D:\ PACS_* migration kits, MSSQLBckup, mssql_data, docker-mssql-data, pacs-databases, *.gdb — database/binary backups, not conference assets.
- node_modules trees (the only `*atlas*` hits on E: were ArcGIS `NoiseTextureAtlas` shader files — noise, not assets).
- E:\Exports, E:\Documents (E), E:\Desktop Notes Docs — checked for export patterns (empty/blank); not deeply walked.

**Note on naming:** No folder or file is literally named "Atlas Property Dossier", "Atlas County Pulse", "Academy Codex", or "Ask Academy". The mapped candidates are concept/precursor matches (Mission-Control demo flow = Atlas Dossier+Pulse; codex-viewer = Academy Codex; TerraFusionAssistant = Ask Academy; Knowledge corpus = Academy education).

---

## Next recommended action

1. **Pull the demo spine first:** copy `E:\BENTON_COUNTY_CHAMPIONSHIP_DEMO\demo-scenarios.json` + the Musk Demo Script .txt into the conference build as the navigation/act backbone, plus `terrafusion.brand.json` for theming.
2. **Seed Academy/Ask-Academy:** index `E:\Files of Appraisal\Knowledge\` (USPAP, IAAO, Courses) + `D:\DOR Publications\` + `D:\RCWs and WACs\` as the grounding corpus; reuse `senior_exemption_calculator.html` as an interactive widget.
3. **Codex experience:** evaluate `E:\codex\codex-viewer.tsx` + `TFMP_SCHEMA.md` as the starting component for Academy Codex.
4. **If conversation exports are wanted**, they do not exist on these drives — request fresh NotebookLM/ChatGPT/Claude exports from the source accounts, or harvest the pasted-chat `.docx` files in `E:\CloudStorage\OneDrive\`.
