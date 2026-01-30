# TerraPilot — Canonical Specification (v3.1)

## 0. Canonical Decision
TerraPilot is **one OS feature** with two modes:
- **Pilot Mode**: operator (do/route/act/execute)
- **Muse Mode**: creator (draft/explain/summarize/synthesize)

Muse is a **mode**, not a separate product.

---

## 1. Permission Architecture Split (RBAC vs Tool Allowlists)
TerraPilot authorization is two-layered:

1) **RBAC claims**: what the user is allowed to do in principle  
2) **Tool allowlists**: which tools are enabled for this county/license/policy

A tool executes only if:
- user has required claims
- tool is enabled in allowlist
- mode matches (pilot/muse/both)
- risk policy satisfied (confirmation/reason/supervisor if required)
- events emitted to TerraTrace (invoke + result)

---

## 2. RiskPolicy Configuration (complete)
Each tool declares `risk`:
- `read_only`
- `write_low` (drafts, non-final)
- `write_high` (decisions, approvals, certification steps)
- `irreversible` (publish/issue roll, final certification, external sending)

### 2.1 Default policy by risk
- read_only: no confirmation (optional)
- write_low: confirmation optional, reason optional
- write_high: **confirmation required + reason required**, optional supervisor
- irreversible: **confirmation required + reason required + supervisor required by default**

County policy may tighten, not loosen, irreversible defaults.

---

## 3. Approval Workflow UI Pattern
For write_high / irreversible tools:
- Confirmation modal shows:
  - tool name + summary + target parcel/workflow
  - risk level badge
  - required reason code dropdown
  - optional “add note to file”
  - supervisor approval step if configured

The approval record is emitted to TerraTrace and linked to the resulting artifact/workflow.

---

## 4. PII Sanitization Rules (Trace-safe)
TerraPilot must never log raw PII into TerraTrace payloads.

### 4.1 Sanitization
- Detect and redact:
  - SSNs (###-##-####)
  - phone numbers
  - email addresses (configurable)
- Store sensitive payloads by reference (hash + secure blob), not inline.
- TerraTrace stores only minimal safe projections.

---

## 5. Redaction Strategy (audit-preserving)
Requests to delete/redact content (e.g., GDPR-like requests) are handled via:
- `redaction_applied` event referencing original trace correlationId
- payload pointer swapped to a redacted version
- hashes retained to prove integrity without revealing content
- access logged for any viewing of restricted content

---

## 6. Retention Automation
Retention is enforced by scheduled jobs:
- archive -> cold storage
- delete -> only where legally permitted
- legal hold overrides retention

Retention category is set per event and can be county-configured.

---

## 7. Tool Model (mode + risk + ownership)
Tools declare:
- mode: pilot|muse|both
- risk: read_only|write_low|write_high|irreversible
- suiteOwner: forge|atlas|dais|dossier|os
- requiredClaims: RBAC claims
- enabledBy: license/policy flags
- writesTo: write lane(s) (must match boundary doc)

---

## 8. Minimal MVP Tool Set
Pilot Mode:
- route_to_parcel
- show_my_queue
- assign_task
- check_status
- run_valuation_model
- assemble_packet

Muse Mode:
- draft_notice
- explain_value_change
- summarize_dossier
- draft_appeal_response
- commissioner_memo

---

## 9. Success Criteria
- RBAC claims and tool allowlists are separate and enforced
- All tools are mode-locked and risk-classified
- write_high/irreversible require confirmation + reason (+ supervisor as configured)
- PII never appears in TerraTrace payloads
- Redaction is additive and audit-preserving
- Retention is automated and policy-driven
