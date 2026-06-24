# Shared-Contracts Matrix (core-owned)

*What lives in `core: shared-contracts` — core-OWNED, explicitly shared, never buried in shell
code (HR-8). These are the boundaries every suite/platform repo must obey.*

| Contract surface | Governs | Core-owned? | Producers / Consumers | Notes |
|---|---|---|---|---|
| **Workbench tab contract** | how a suite mounts a tab in the workbench host (props, lifecycle, route, capability flags) | ✅ yes | core (host) ← Atlas/Dais/Forge/Dossier (tabs) | the seam that keeps workbench host-only (R-WB) |
| **Suite→core integration contract** | how suites register, expose capabilities, surface status to the shell | ✅ yes | core ← all suites | registry-adjacent |
| **Sync→suite payload contract** | the shape of normalized data Sync hands to suites (parcel, owner, sales, levy inputs) | ✅ yes | Sync (producer) → suites (consumers) | decouples ETL impl from suite consumption |
| **Cross-repo DTO / event / interface boundaries** | shared types, domain events, service interfaces crossing repos | ✅ yes | all | extract+formalize from scattered `TerraFusion.Core`/`Abstractions` |
| **Auth / session contract** | identity, session, RBAC, county-context propagation across repos | ✅ yes | core ← all | contract only — NOT the LDAP impl; honesty per F15/baseline |
| **Registry contract surface** | module manifest schema, mount/runtime composition API | ✅ yes | core ← all | `terrafusion.app.json` schema + ServiceRegistry/ToolRegistry API |
| **County-context / isolation contract** | sovereign-county boundary enforced cross-repo (AC-4 target) | ✅ yes | core ← Sync + suites | governance-critical; currently weak in code (baseline AC-4) |

## Rules
- A suite/platform repo may **implement** against these contracts but may **not redefine** them.
- Changing a shared contract is a **core** change with cross-repo blast radius → governance review.
- Contracts are versioned in core; consumers pin a contract version.
- **No contract may be implied via shared shell code** — if it crosses a repo boundary, it is an explicit artifact here.
