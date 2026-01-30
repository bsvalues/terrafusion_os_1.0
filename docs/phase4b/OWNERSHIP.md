# Phase 4B: Write Lanes (Ownership)

## Purpose

This document defines **write lanes** - exclusive ownership zones that prevent merge conflicts and ensure clear accountability during multi-slice development.

## Lane Assignments

### Slice 1: CI/Gates
**Owner**: Solo-Dev (CI Automation Lane)

| Path Pattern | Description |
|--------------|-------------|
| `.github/workflows/*.yml` | GitHub Actions workflows |
| `tools/spec-gates/**` | Specification gate tooling |
| `scripts/spec-gates/**` | Gate execution scripts |
| `tools/registry/**` | Tool/manifest registry |
| `package.json` scripts | Gate script wiring only |

### Slice 2: Policy Contracts
**Owner**: Solo-Dev (Policy Lane)

| Path Pattern | Description |
|--------------|-------------|
| `policy/contracts/**` | JSON schemas, examples |
| `policy/README.md` | Policy documentation |

### Slice 3: Backend Telemetry
**Owner**: Solo-Dev (Backend Lane)

| Path Pattern | Description |
|--------------|-------------|
| `backend/src/TerraFusion.API/Controllers/Telemetry*` | Telemetry endpoints |
| `backend/src/TerraFusion.API/Controllers/System*` | System health endpoints |
| `backend/src/TerraFusion.API/Models/Telemetry*` | Telemetry models |
| `backend/tests/**/Telemetry*` | Telemetry tests |

### Slice 4: OS Shell Sentinel
**Owner**: Solo-Dev (Frontend Lane)

| Path Pattern | Description |
|--------------|-------------|
| `frontend/apps/os-shell/src/sentinel/**` | Sentinel store + hooks |
| `frontend/apps/os-shell/src/ipc/**` | IPC layer |
| `frontend/apps/os-shell/src/lib/api*` | API client layer |

### Slice 5: Ambient UI
**Owner**: Solo-Dev (UI Lane)

| Path Pattern | Description |
|--------------|-------------|
| `frontend/apps/os-shell/src/components/ambient/**` | Ambient compositor |
| `frontend/apps/os-shell/src/components/ui/toast*` | Toast notifications |

### Slice 6: App Manifests
**Owner**: Solo-Dev (App Lane)

| Path Pattern | Description |
|--------------|-------------|
| `applications/*/terrafusion.app.json` | Module manifests |
| `applications/*/manifest.json` | Legacy manifests |

## Conflict Resolution

1. **Same-lane conflict**: Rebase onto latest lane HEAD
2. **Cross-lane conflict**: Coordinate via PR comments; merging party owns resolution
3. **Shared file conflict** (e.g., `package.json`): Last merger runs `pnpm install` to regenerate lockfile

## Automation Support

The `pnpm tf:slice` command auto-assigns ownership based on this map.

---

*Write Lanes - Solo-Dev Mode - 2026-01-30*
