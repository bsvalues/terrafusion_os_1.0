# TerraTrace — Unified Audit Spine (v3.1)

## 1. Core Rules
1) **Append-only**: no in-place mutation of events  
2) **County-scoped**: `countyId` on every event  
3) **Correlation**: invoke/result linked by `correlationId`  
4) **Payload minimization**: large/sensitive payloads stored by reference  
5) **Redaction is additive**: redaction creates new event referencing original  
6) **Retention is policy-driven**: automation enforces schedules and holds

---

## 2. Event Types (recommended)
- tool_invoked
- tool_succeeded
- tool_failed
- mode_switched
- permission_denied
- policy_blocked
- workflow_state_changed
- artifact_created
- artifact_published
- redaction_applied
- retention_archived
- retention_deleted

---

## 3. Immutability Pattern
Do not update “invocation event” to add outputs.  
Instead emit:
- `tool_invoked` (with safe inputs summary + payload refs)
- `tool_succeeded` / `tool_failed` (with safe outputs summary + payload refs)

---

## 4. PII & Classification
- Event payloads are classified (PUBLIC/CONFIDENTIAL/RESTRICTED)
- Restricted details require explicit RBAC and are access-logged
- Sanitization is mandatory before payload references are created

---

## 5. Retention & Legal Hold
- retention categories: system, workflow, artifact, draft, published
- legal hold overrides retention actions
- archive/delete actions emit retention events for audit

---

## 6. Workbench Activity Feed
Workbench shows a safe projection:
- actor, time, action, suite
- payload details only if viewer has rights

---

## 7. Success Criteria
- Every action yields trace events
- No in-place updates
- Full timeline reconstructable by correlationId
- Redaction and retention are auditable
