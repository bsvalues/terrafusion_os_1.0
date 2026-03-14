# Phase 9 Runtime Role Separation

Snapshot date: 2026-03-12

## Decision Target

Phase 9 exists to close one question cleanly:

- Hostinger is the remote Benton operator proof surface
- Hostinger is not the PACS-connected sync/conversion runtime

The canonical role split is:

- Hostinger staging = Benton operational-snapshot runtime
- Hostinger production = Benton operational-snapshot runtime
- PACS-connected sync/conversion = local canonical runtime or separate SQL-reachable infrastructure

## Required Checks

- `proof:phase7` passes
- `proof:phase8` passes
- Hostinger control-plane canon declares snapshot-only runtime role
- production deploy contract keeps PACS connection strings blank and `HarrisPACS__Enabled=false`
- `staging.terrafusionmarket.com` publicly resolves to `72.60.126.11`
- `terrafusionmarket.com` apex publicly resolves to `72.60.126.11`
- public health on staging and production works without `--resolve`

## Go / No-Go Rule

Phase 9 is `GO` only when all of the above are true.

If apex DNS is missing or public production health still requires resolve fallback, the correct result is `NO_GO`.

## Current Blocker Shape

The remaining external blocker for true public production is not the Benton data spine.
It is public production DNS truth.

- snapshot runtime role = decided
- deployed operator parity = proven
- public production truth = blocked until apex DNS resolves directly
