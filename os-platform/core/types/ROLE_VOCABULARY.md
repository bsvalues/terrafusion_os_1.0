# Role Vocabulary Map — R1 Frozen
<!-- STATUS: FROZEN | Do not modify without governance approval -->
<!-- Contract version: 1.0.0 | Effective: R1 (Week 1+) -->

## Purpose
This document defines the **canonical roles** used across TerraPilot, TerraTrace,
and all UI policy enforcement. All three agents MUST reference these role names.
No synonyms. No aliases. Drift = broken RBAC.

---

## Role Definitions

| Role | Auth Claims | Trace ACL | UI Policy | Write Tools |
|------|-------------|-----------|-----------|-------------|
| `viewer` | `read:parcel`, `read:dossier` | Can view own correlationIds only | Read-only surfaces, no action buttons | None |
| `appraiser` | `read:parcel`, `read:dossier`, `write:forge`, `write:dossier` | Can view all correlationIds in own county | Full workbench, forge/dossier write tools enabled | `add_dossier_note`, `draft_appeal_response`, `draft_value_change_notice`, `draft_boe_appeal_response` |
| `supervisor` | All appraiser claims + `write:dais`, `approve:irreversible` | Full county trace visibility + admin audit | Full workbench + admin panels + approval dialogs | All appraiser tools + `run_valuation_model`, `assemble_boe_packet`, `assign_task` |
| `administrator` | All supervisor claims + `admin:trace`, `admin:system` | Full county trace + system events | All surfaces + system config + trace admin | All supervisor tools + `request_trace_redaction` |
| `auditor` | `read:parcel`, `read:dossier`, `read:trace`, `audit:all` | Read-only access to ALL trace events (cross-county when authorized) | Read-only audit console, trace search, export | `search_trace_by_correlation` (read-only) |

---

## Claim Vocabulary

Claims are the atomic permissions checked by RBAC gates. They follow the pattern
`action:resource`.

### Read Claims
| Claim | Grants |
|-------|--------|
| `read:parcel` | View parcel data, assessed values, property characteristics |
| `read:dossier` | View dossier documents, case files, notes |
| `read:trace` | View trace events (subject to TraceAccessControl) |

### Write Claims
| Claim | Grants |
|-------|--------|
| `write:forge` | Create/modify valuation artifacts (models, comps, calculations) |
| `write:dossier` | Add notes, attach documents, create evidence packets |
| `write:dais` | Assign tasks, manage workflows, issue notices, manage appeals |

### Admin Claims
| Claim | Grants |
|-------|--------|
| `approve:irreversible` | Approve irreversible tool executions as supervisor |
| `admin:trace` | Manage trace events (redaction requests, retention) |
| `admin:system` | System configuration, user management |
| `audit:all` | Cross-county read access for compliance auditing |

---

## Mode Constraints

| Mode | Who Can Use | Tool Risk Ceiling |
|------|------------|-------------------|
| `pilot` | All roles | Up to `irreversible` (with appropriate claims) |
| `muse` | All roles | Up to `write_low` (Muse is a creator/reader, not an executor) |

---

## Trace Access Control Matrix

| Principal Role | Own CorrelationId | County Trace Events | System Events | Cross-County |
|---------------|-------------------|--------------------|--------------:|-------------|
| `viewer` | Yes | No | No | No |
| `appraiser` | Yes | Yes (own county) | No | No |
| `supervisor` | Yes | Yes (own county) | Limited | No |
| `administrator` | Yes | Yes (own county) | Yes | No |
| `auditor` | Yes | Yes (all authorized counties) | Yes | Yes (when claim present) |

---

## UI Policy Mapping

Frontend components check roles to determine visibility:

```typescript
// Pattern: role-based surface gating
const canWriteForge = roles.includes('appraiser') || roles.includes('supervisor') || roles.includes('administrator');
const canApproveIrreversible = roles.includes('supervisor') || roles.includes('administrator');
const canSearchTrace = roles.includes('auditor') || roles.includes('administrator');
const canRequestRedaction = roles.includes('administrator');
```

---

## Integration Rules

1. **Backend** (Codex): Map ASP.NET `[Authorize(Roles = "...")]` to these exact role names
2. **Core** (Copilot): ToolRunner RBAC gate checks `context.roles` against tool's required claims
3. **Frontend** (Claude Code): UI conditionals use `roles.includes('roleName')` pattern
4. **No role synonyms**: "admin" is NOT "administrator". "super" is NOT "supervisor".

---

## Contract Versioning

| Field | Value |
|-------|-------|
| Contract Version | 1.0.0 |
| Roles Count | 5 |
| Claims Count | 9 |
| Status | FROZEN for R1 |
