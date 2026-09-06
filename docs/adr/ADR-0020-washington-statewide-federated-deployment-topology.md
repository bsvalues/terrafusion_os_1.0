# ADR-0020: Washington Statewide Federated Deployment Topology

Status: **Accepted by owner directive; canonical on protected merge**  
Date: 2026-09-01  
Owner authority: GitHub Issue #1532  
Work Order: `WO-ARCH-WA-001`

## Context

TerraFusion has long been designed as a statewide/multi-county platform, but the physical deployment
model was never finally ratified. Historical architecture explored both a shared multi-tenant
platform and sovereign per-county deployments. Modern Washington Assessor Launch V1 has since locked
the product/runtime semantics for all 39 Washington counties while intentionally leaving the physical
hosting topology open.

The current product contract already requires:

- all 39 Washington counties as first-class contexts;
- county-scoped identity and fail-closed cross-county isolation;
- `PUBLIC`, `COUNTY_PROVIDED`, and `CONNECTED` trust/data modes;
- TerraFusion Sync as the ingestion/validation boundary;
- TerraFusion DB as product runtime truth;
- TerraFusion API as the product access layer;
- no silent Benton fallback;
- no external legacy-source write-back before later county-specific adoption authority.

A physical deployment decision is now required so Benton deployment work, statewide capacity testing,
release packaging, and future county onboarding converge on one topology rather than producing
competing county-by-county and centralized architectures.

## Decision

### 1. Default statewide model: federated multi-tenant platform

Washington TerraFusion will operate as a **federated statewide multi-tenant platform** by default.

This means one TerraFusion product/runtime estate serves multiple county tenants through shared
platform services while preserving strict county boundaries.

It does **not** mean one literal statewide physical server.

It also does **not** mean 39 independent code forks or 39 unrelated full-stack TerraFusion products.

### 2. Runtime scaling unit: deployment stamp / cell

The statewide platform is divided into one or more **deployment stamps** (also called cells).

A stamp is a bounded runtime unit containing the application/API capacity and supporting services
needed to serve an assigned set of county tenants. The tenant catalog resolves a county to its
assigned stamp.

Initial production may begin with one appropriately sized stamp. Additional stamps are added when
measured evidence demonstrates a need for:

- more compute or database throughput;
- smaller failure/blast radius;
- county-specific isolation;
- data-residency requirements;
- procurement or contract separation;
- maintenance/release segmentation;
- very large-county workload separation.

No county is permanently bound to one stamp model. Tenant-to-stamp placement is an operational
mapping and may evolve without changing the TerraFusion product contract.

### 3. Shared compute does not imply shared county data

Application and API compute may be shared across tenants.

Government operational data is isolated by default. The target production boundary is:

- county-specific operational database (tenant-per-database default);
- county-specific database credentials/identity;
- county-specific secrets and source credentials;
- county-specific TerraFusion Edge identity;
- county-scoped storage/caches where stateful data is involved;
- county-scoped audit, provenance and trace context;
- fail-closed authenticated county context inside every protected product path.

`CountyId`/canonical county identity remains an application authorization boundary even when physical
data isolation is also present. Defense in depth is required; tenant-per-database does not replace
county authorization, and county authorization does not replace physical data isolation.

### 4. County-local Edge remains the legacy-system boundary

For a `CONNECTED` county, **TerraFusion Edge / TerraFusion Sync runs inside or immediately adjacent to
the county-controlled network boundary**, close to PACS/CAMA/GIS/other legacy sources.

The Edge:

- reads authorized external sources;
- validates, normalizes, quarantines, reconciles and transfers governed data into TerraFusion;
- maintains source-specific credentials inside the county-approved boundary;
- does not turn the legacy source into a TerraFusion runtime dependency for end-user product reads.

Legacy county systems remain authoritative upstream systems. They remain read-only to TerraFusion
until a later explicit county adoption/write-back authorization permits a narrower mutation path.

Benton's current reference placement is the existing `JCASTERRAFUSION` host as the county Edge target,
with the Harris PACS estate remaining separate and authoritative. That host placement is a Benton
implementation choice, not a statewide hardware requirement.

### 5. Sovereign County mode remains a supported profile

A jurisdiction may require dedicated infrastructure, a dedicated stamp, or fully on-prem operation.
TerraFusion therefore preserves a **Sovereign County** deployment profile.

Sovereign mode must:

- use the same supported TerraFusion release artifacts and contracts;
- preserve the same county identity, Sync, API and data-trust semantics;
- avoid county-specific source forks unless a separately governed connector requires one;
- remain compatible with statewide release/provenance truth where the county contract permits.

Sovereign mode is an isolation/deployment choice, not a separate TerraFusion product.

### 6. Cross-county behavior is explicit federation only

Shared infrastructure never grants cross-county protected-data access.

Any statewide or cross-county capability must be an explicit federation feature with its own allowed
data shape, authority and audit evidence. Aggregate/public/reference functionality may be shared only
when its contract permits it.

Accidental cross-county disclosure is always a defect.

### 7. Hosting provider and Azure service are implementation choices

Azure is a first-class TerraFusion deployment target and is the current Benton/statewide reference
cloud direction, but this ADR does not mandate one Azure product.

AKS, App Service, Container Apps, VMs, managed databases, or another supported substrate may implement
a stamp if they satisfy the runtime, isolation, operability, release, rollback and security contracts.

Likewise, a county may host a sovereign stamp on approved on-prem infrastructure.

The architecture is **provider/substrate tolerant; the deployment-stamp and county-boundary model is
not optional**.

### 8. AI placement is independent of county runtime placement

TerraFusion Core does not require a GPU or one mandatory AI provider.

AI may be:

- disabled for a deployment/profile;
- provided by an approved cloud provider;
- provided by county/local inference;
- provided by a dedicated AI tier.

AI routing must respect the same county/data authority boundaries and does not redefine the statewide
runtime topology.

### 9. HERMES is the statewide pre-production proving environment, not county production

The personal HERMES lab may model and stress the statewide topology using synthetic or lawful public
data. It may exercise:

- 39 canonical county contexts;
- tenant-to-stamp routing;
- one-stamp and multi-stamp behavior;
- Edge/source simulations;
- cross-county isolation and adversarial denial;
- outage/recovery behavior;
- rolling upgrades and rollback;
- load/capacity measurements;
- Counties HUB and TerraForge statewide runtime behavior.

Protected/non-public county data must not enter the personal lab without separate explicit legal and
owner authority.

## Required topology

```text
                         WASHINGTON TERRAFUSION
                     STATEWIDE CONTROL / PRODUCT PLANE
                                  |
                         tenant -> stamp routing
                                  |
                +-----------------+-----------------+
                |                                   |
         Deployment Stamp A                 Deployment Stamp B+
         shared app/API compute             added as required
                |
      +---------+---------+
      |         |         |
   County A  County B   County C
      |         |         |
  county DB county DB county DB
  + secrets  + secrets  + secrets
      |         |         |
    Edge      Edge      Edge
      |         |         |
 legacy DB  legacy DB  legacy DB
```

A sovereign county may instead receive a dedicated stamp/runtime while preserving the same product
contracts.

## Deployment implications

### Statewide platform owns

- common TerraFusion release identity;
- shared web/API/runtime services within a stamp;
- county/stamp catalog and routing;
- platform observability and release management;
- Counties HUB and statewide product surfaces;
- explicit federation services.

### County tenant owns/controls by boundary

- authorization to use county source systems;
- source credentials and connector permissions;
- county-local Edge placement where `CONNECTED`;
- county data authority and adoption state;
- county-specific role/identity mapping;
- decision to use shared or sovereign infrastructure where contract/procurement permits.

## Alternatives considered

### One literal central statewide server

Rejected. It creates unnecessary capacity, maintenance and blast-radius concentration and confuses a
centralized product plane with a single machine.

### Full independent TerraFusion stack for every county by default

Rejected. It multiplies operational/release cost, fragments statewide product truth, complicates
Counties HUB/statewide management and wastes the existing multi-tenant architecture.

### Shared database tables for all counties with only row filtering

Rejected as the default government-data boundary. Application county authorization remains required,
but physical/logical data isolation should not rely on every query remembering a county predicate.

### Mandatory dedicated database server/stamp for every county

Rejected as the default. Strong tenant data isolation can coexist with shared managed infrastructure;
dedicated stamps remain available when scale or county requirements justify them.

### Mandatory AKS statewide architecture

Rejected as an architectural mandate. Historical work explored AKS multi-tenancy, but the current
decision locks the stamp/isolation model and leaves the concrete Azure substrate to measured
implementation work.

## Consequences

- Benton becomes the first real `CONNECTED` county reference, not a special one-off architecture.
- The same county release can be promoted into future Washington tenants without source forks.
- Statewide operating cost can be shared while county data remains isolated.
- Large/restrictive counties can move to dedicated stamps without product redesign.
- HERMES capacity tests can inform real statewide stamp sizing before cloud spend is committed.
- Deployment/IaC work must model tenant-to-stamp assignment explicitly.
- Release and rollback tooling must operate at both platform/stamp and county-tenant scopes.
- Observability must always carry county and stamp identity where applicable.

## Acceptance requirements for implementation

This ADR is architectural canon; it is not itself proof that the topology has been deployed.
Implementation work must prove, before a statewide production claim:

1. tenant-to-stamp routing is deterministic and fail-closed;
2. county data/secret/identity isolation survives adversarial cross-county tests;
3. one shared stamp can serve multiple county contexts without Benton/default fallback;
4. a second stamp can be introduced without product code fork or county identity change;
5. a tenant can be placed on a dedicated/sovereign stamp using the same release contract;
6. Edge disconnect/reconnect does not affect legacy-system availability or cross county boundaries;
7. upgrade and rollback operate without cross-tenant data contamination;
8. statewide HUB/TerraForge report each county's actual trust/capability state rather than shared
   infrastructure state;
9. production release, monitoring, backup/recovery and external assessor acceptance satisfy the
   existing WAL terminal gates.

## Supersession rule

This ADR resolves the statewide physical deployment ambiguity. Future implementation documents,
runbooks, IaC and county deployment plans must conform to this topology unless a later owner-ratified
ADR explicitly supersedes `ADR-0020`.
