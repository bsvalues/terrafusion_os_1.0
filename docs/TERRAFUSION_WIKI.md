# TerraFusion Wiki

This page is the repo-hosted substitute for GitHub Wiki while the native Wiki
feature is disabled.

## Who This Is For

- contributors trying to understand where to start
- maintainers working on GitHub automation and release lanes
- operators verifying staging/production status
- auditors looking for governance and evidence entrypoints

## Fast Paths

### I want to understand the repo

- [../README.md](../README.md)
- [../REPO_MAP.md](../REPO_MAP.md)

### I want to contribute safely

- [../CONTRIBUTING.md](../CONTRIBUTING.md)
- [../AGENTS.md](../AGENTS.md)
- [../.github/pull_request_template.md](../.github/pull_request_template.md)

### I want to understand GitHub automation

- [../.github/README.md](../.github/README.md)
- [../.github/QUICK_START.md](../.github/QUICK_START.md)
- [../.github/branch-protection.md](../.github/branch-protection.md)

### I want the live deployment truth

- [../os-platform/core/pilot/ops/hostinger-control-plane.md](../os-platform/core/pilot/ops/hostinger-control-plane.md)

### I want backend/frontend/testing docs

- [backend/README.md](./backend/README.md)
- [frontend/README.md](./frontend/README.md)
- [testing/README.md](./testing/README.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)

### I want evidence and governance context

- [evidence/README.md](./evidence/README.md)
- [../SUSTAINMENT.md](../SUSTAINMENT.md)
- [governance/CI_GOVERNANCE_INDEX.md](./governance/CI_GOVERNANCE_INDEX.md)

### I want to understand TerraCanon

- [TerraCanon/PILLAR_MAPPING.md](./TerraCanon/PILLAR_MAPPING.md)
- [TerraCanon/TerraCanon_ Understanding the Single Source of Truth.md](./TerraCanon/TerraCanon_ Understanding the Single Source of Truth.md)
- [../tools/canon/](../tools/canon/)
- [../os-platform/core/canon/](../os-platform/core/canon/)
- [../frontend/apps/os-shell/src/canon/](../frontend/apps/os-shell/src/canon/)
- [../frontend/apps/os-shell/src/pages/CanonHome.tsx](../frontend/apps/os-shell/src/pages/CanonHome.tsx)

## TerraCanon

`TerraCanon` is the practical name for TerraFusion's canonical truth and
operator surface. In repo terms, it is not one file or one app. It is the
combined set of command, governance, and operator-facing surfaces that enforce
the system's authoritative state.

Use `TerraCanon` consistently in docs and PRs. Treat `TerraCannon` as a
misspelling unless a deliberate branded use is discovered later.

The fastest concrete entrypoints are:

- CLI and diagnostics: [../tools/canon/](../tools/canon/)
- governed core canon surface: [../os-platform/core/canon/](../os-platform/core/canon/)
- OS Shell canon UI: [../frontend/apps/os-shell/src/canon/](../frontend/apps/os-shell/src/canon/)
- canon landing page: [../frontend/apps/os-shell/src/pages/CanonHome.tsx](../frontend/apps/os-shell/src/pages/CanonHome.tsx)
- strategy and background docs: [TerraCanon/](./TerraCanon/)

## Current Operational Summary

As of 2026-03-11:

- repository visibility is private
- staging deploy/rollback/redeploy proof sequence is complete
- production proof sequence is still pending
- workflows have been cut over to internal GHCR package names
- remaining production blockers are documented in the Hostinger control-plane runbook

## Suggested Future Wiki Structure

If this grows, keep it small and practical:

1. Home
2. Contributing
3. Governance
4. Release and rollback
5. Operations and evidence
6. Backend
7. Frontend
8. Testing
9. Security

Do not mirror the entire `docs/` tree into a second documentation universe.
Curate the high-signal entrypoints instead.
