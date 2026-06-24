# Ownership Cells (provisional, filled now)

*Per R-SPLIT (HR-8): every surface/boundary names exactly one owner per concern. Provisional —
but filled now so no split proceeds on assumed ownership.*

## Top-level ownership
| Surface / boundary | Owner |
|---|---|
| shell host | **TerraFusionOS** |
| workbench host / orchestration | **TerraFusionOS** |
| shared contracts (all of `SHARED-CONTRACTS-MATRIX.md`) | **TerraFusionOS** |
| sync ingress contract | **core-owned contract**, impl in **TerraFusion-Sync** |
| atlas tab contract | **core-owned contract**, impl in **TerraFusion-Atlas** |
| dais tab contract | **core-owned contract**, impl in **TerraFusion-Dais** |
| forge tab contract | **core-owned contract**, impl in **TerraFusion-Forge** |
| dossier tab contract | **core-owned contract**, impl in **TerraFusion-Dossier** |
| registry contract | **core-owned**, suites implement manifests against it |
| auth/session contract | **core-owned**, suites consume |

## Split-surface ownership (runtime · contracts · persistence · ingestion · UI host · tests)
| Split surface | runtime | contracts | persistence | ingestion | UI host | tests |
|---|---|---|---|---|---|---|
| **Workbench** | core (host) / suite (domain) | **core** (tab) | suite | — | **core** | per layer |
| **Atlas** | Atlas (UI) / Sync (feed) | **core** | Atlas (view) / Sync (geo) | **Sync** | core (shell) | per repo |
| **County studio** | Sync (ingest) / core (shell host) | **core** | Sync | **Sync** | core | per repo |
| **Levy / Dais** | Dais | **core** | **Dais** (resolve dual-cert, F14) | Sync (source) | core (tab) | Dais |
| **Pilot** | core (shell) / undecided (deep) | **core** | core (shell state) | — | core | core (shell); deep=defer |

> Any unfilled cell for a surface ⇒ that surface is **not cleared to split** (HR-8/R-SPLIT).
> All split surfaces above are now fully assigned at the provisional level.
