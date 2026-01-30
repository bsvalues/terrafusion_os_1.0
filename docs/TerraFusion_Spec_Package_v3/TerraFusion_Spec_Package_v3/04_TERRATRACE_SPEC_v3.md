# TerraTrace — Unified Audit Spine (v3)

TerraTrace is the single source of truth for **who did what, when, and why** across TerraFusion.

## Core rules
1. Append-only (no in-place mutation)
2. County-scoped (every event includes countyId)
3. Linkable (parcelId/dossierId/workflowId/taskId)
4. Permission-gated viewing of sensitive payloads
5. Redaction is additive (new events reference originals)

## Minimal event set
- tool_invoked / tool_succeeded / tool_failed
- mode_switched
- permission_denied / policy_blocked
- workflow_state_changed
- artifact_created / artifact_published

## Payload policy
Large or sensitive payloads should be stored **by reference** (hash + blob location), not inline.

## Retention defaults (county configurable)
- Security/system events: 7+ years
- Workflow decisions: 7+ years
- Drafts: shorter unless attached to an official dossier item
- Published notices/packets: statutory or permanent

## Workbench activity feed
Workbench shows a safe projection (timestamp, actor, action). Payload details appear only if RBAC + classification allow it.
