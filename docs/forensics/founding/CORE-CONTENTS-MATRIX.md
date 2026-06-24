# Core Contents Matrix (Phase 1)

*What TerraFusionOS core includes / excludes in the founding slice.* Owner column = the repo
that owns the **implementation**; contracts are core-owned per `SHARED-CONTRACTS-MATRIX.md`.

| Surface | In Phase 1? | Why | Owner | Notes |
|---|---|---|---|---|
| Shell / desktop / windowing | ✅ yes | the OS center; nothing renders without it | TerraFusionOS | from `frontend/apps/os-shell/src/shell` (live) |
| Top bar / dock | ✅ yes | shell chrome; core UX spine | TerraFusionOS | — |
| **Workbench host / orchestration** | ✅ yes | host + route-collapse target only (R-WB) | TerraFusionOS | **domain surfaces inside it are suite-owned** |
| Pilot / Trace / Canon **shell surfaces** | ✅ yes | shell-facing governed surfaces; LATENT-real (F17) | TerraFusionOS | deep AI internals excluded (undecided) |
| Registry / runtime composition | ✅ yes | how modules mount; the OS wiring | TerraFusionOS | `tools/registry`, `ToolRegistry`, ServiceRegistry → consolidate |
| Governance / canon tooling | ✅ yes | the governance spine; recovery-spine | TerraFusionOS | `feat/canon-*`, `os-canon-*`, `.governance/` |
| **Shared contracts** | ✅ yes | explicit core-owned boundary surface | TerraFusionOS | see `SHARED-CONTRACTS-MATRIX.md` |
| Core config standards | ✅ yes | ports/env/SDK truth (platform.json discipline) | TerraFusionOS | exclude the `config/`↔`configs/` duplication (F15) |
| Ownership map + repo rules | ✅ yes | the rules future extractions obey | TerraFusionOS | meta; `OWNERSHIP-CELLS.md`, `NON-OWNERSHIP-RULES.md` |
| Auth / session **contract** | ✅ yes | cross-repo identity boundary | TerraFusionOS (contract) | impl honesty per F17/baseline; not the LDAP impl |
| — | | | | |
| PACS ETL / county ingestion | ❌ no | platform ingress | TerraFusion-Sync | behind F14 schema gate |
| ArcGIS nightly ingestion | ❌ no | spatial feed = platform (R-ATLAS) | TerraFusion-Sync | seam from Atlas UI |
| Atlas map UI | ❌ no | suite UI | TerraFusion-Atlas | core owns the tab contract only |
| Levy internals / math | ❌ no | Dais business domain | TerraFusion-Dais | dual-cert (F14) resolved before extraction |
| Forge stats / valuation engines | ❌ no | suite domain | TerraFusion-Forge | CostForge "Ultimate" cut first |
| Income / Current-Use studios | ❌ no | suite domain | TerraFusion-Forge | — |
| Dossier internals | ❌ no | suite domain | TerraFusion-Dossier | — |
| Workbench domain surfaces (comps/valuation) | ❌ no | suite domain rendered in host | Forge / Dais | core owns tab contract only (R-WB) |
| County Hub | ❌ no (mostly) | **consumer of Sync**, not core | TerraFusion-Sync (feed) | *exception:* pure shell routing/UI host → core |
| Deep Pilot AI internals | ❌ no | undecided until F17 solid (R-PILOT) | undecided / future Pilot | shell-facing Pilot stays core |
| CostForge "Ultimate", wrapper noise, ghost workspace | ❌ no | F18 Tier-5 / F11 ghost | legacy-only (cut) | never pulled forward (HR-7) |
| Dead legacy ports / recut dupes / snyk-* | ❌ no | archaeology / ignore | legacy | — |
| Schema-fractured domain internals | ❌ no | unsafe until reconciled | (behind F14 gate) | HR-2 |
