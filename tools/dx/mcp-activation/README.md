# MCP Activation Workflow

**DX Spine Security Gating for Model Context Protocol (MCP) Servers**

Version: 1.0
Owner Lane: `ops`
Risk Level: `write-safe`
Charter: DX Spine Charter §7

---

## Overview

The MCP Activation Workflow enforces the DX Spine Charter's security posture for MCP server activation. MCP servers expand the tool surface area and are treated as security events.

**Key Principle**: Read-only by default. Write capabilities require explicit approval and audit.

---

## Available MCP Servers

| Server ID | Default State | Risk Level | Activation Requires |
|-----------|---------------|------------|---------------------|
| `document-server` | Active (read-only) | `read` | None (auto-approved) |
| `compliance-monitoring-kit` | Active (read-only) | `read` | None (auto-approved) |
| `harris-pacs-connector` | Inactive | `write-remote` | Explicit approval + audit |
| `revenue-discovery-tools` | Inactive | `write-local` | Explicit approval + audit |
| `property-assessment-suite` | Inactive | `write-local` | Explicit approval + audit |

---

## Security Gating (DX Spine §7)

### §7.1 Controlled Rollout

MCP servers are NOT activated automatically. Activation is a deliberate security event that requires:

1. **Risk Assessment**: Determine risk level per Charter §4.2
2. **Approval**: Obtain approval from appropriate authority
3. **Audit Trail**: Log activation to audit system
4. **Context Update**: Update Context Pack with new MCP state

### §7.2 MCP Tool Invocation Rules

All MCP tool calls MUST:

1. **Log to audit trail** - Every invocation logged with timestamp, actor, parameters
2. **Check RiskPolicy before execution** - Confirm risk level allows operation
3. **Update Context Pack** - Reflect tool results in `.terrafusion/context/latest.json`

---

## Approval Workflow

### Step 1: Request Activation

```bash
tdc mcp activate harris-pacs-connector \
  --scope development \
  --justification "Testing parcel sync for Benton County" \
  --approved-by "coach@terrafusion.dev" \
  --expires-in-days 180
```

### Step 2: Approval Artifact Generated

The system generates an approval artifact (see `approval-schema.json`):

```json
{
  "toolId": "harris-pacs-connector",
  "approvedBy": "coach@terrafusion.dev",
  "approvalDate": "2026-02-13T10:00:00Z",
  "riskLevel": "write-remote",
  "scope": "development",
  "expiresAt": "2026-08-13T10:00:00Z",
  "justification": "Testing parcel sync for Benton County",
  "constraints": {
    "maxRequestsPerHour": 100,
    "allowedOperations": ["read-parcel", "sync-metadata"],
    "dataAccessRestrictions": ["no-production-parcels"],
    "auditLevel": "verbose"
  },
  "revoked": false
}
```

Artifact stored in:
```
.terrafusion/
└── mcp-approvals/
    └── harris-pacs-connector-development.json
```

### Step 3: Audit Trail Logged

Every activation creates an audit record:

```json
{
  "auditId": "audit-20260213-100000-mcp-activate",
  "timestamp": "2026-02-13T10:00:00Z",
  "event": "mcp-server-activated",
  "actor": "coach@terrafusion.dev",
  "serverId": "harris-pacs-connector",
  "scope": "development",
  "riskLevel": "write-remote",
  "approvalArtifact": ".terrafusion/mcp-approvals/harris-pacs-connector-development.json"
}
```

### Step 4: Context Pack Updated

The Context Pack (`.terrafusion/context/latest.json`) reflects new MCP state:

```json
{
  "mcpServers": {
    "active": [
      {
        "serverId": "harris-pacs-connector",
        "scope": "development",
        "activatedAt": "2026-02-13T10:00:00Z",
        "expiresAt": "2026-08-13T10:00:00Z",
        "approvalArtifact": ".terrafusion/mcp-approvals/harris-pacs-connector-development.json"
      }
    ],
    "inactive": [
      "revenue-discovery-tools",
      "property-assessment-suite"
    ]
  }
}
```

---

## Risk Policy Enforcement (DX Spine §4)

### Read-Only Servers (Auto-Approved)

Servers with `riskLevel: "read"` can be activated without explicit approval:

```bash
tdc mcp activate document-server --skip-approval
```

### Write Servers (Require Approval)

Servers with `riskLevel: "write-*"` require:

- `--approved-by` parameter
- `--justification` (minimum 10 characters)
- Audit trail entry
- Approval artifact

### Production Servers (Enhanced Security)

Production scope activations require:

- `--approved-by` from authorized approver
- `--justification` (minimum 50 characters)
- Security review within 30 days
- Mandatory expiration (max 365 days)

---

## Lane Discipline (DX Spine §5)

### Owner Lane: `ops`

This workflow is owned by the `ops` lane. Cross-lane activation attempts will be logged:

```bash
# Current context in dev lane
tdc mcp activate harris-pacs-connector
# → Warning: Cross-lane write from 'dev' to 'ops'. Approval required.
```

### Cross-Lane Approval

If activating from a different lane:

```bash
tdc mcp activate harris-pacs-connector \
  --cross-lane-approval \
  --justification "Dev lane needs PACS connector for integration tests"
```

---

## Usage Examples

### Example 1: Activate Read-Only Server (Development)

```bash
tdc mcp activate document-server --scope development
```

**Output:**
```json
{
  "success": true,
  "serverId": "document-server",
  "status": "active",
  "auditId": "audit-20260213-100000-mcp-activate",
  "contextPackUpdated": true,
  "nextActions": [
    "MCP server 'document-server' is now active in development",
    "No further approval required (read-only server)",
    "Check Context Pack at .terrafusion/context/latest.json"
  ],
  "warnings": []
}
```

### Example 2: Activate Write Server (Development)

```bash
tdc mcp activate harris-pacs-connector \
  --scope development \
  --justification "Testing Benton County parcel sync integration" \
  --approved-by "coach@terrafusion.dev" \
  --expires-in-days 90
```

**Output:**
```json
{
  "success": true,
  "serverId": "harris-pacs-connector",
  "status": "active",
  "approvalArtifact": {
    "toolId": "harris-pacs-connector",
    "approvedBy": "coach@terrafusion.dev",
    "approvalDate": "2026-02-13T10:00:00Z",
    "riskLevel": "write-remote",
    "scope": "development",
    "expiresAt": "2026-05-14T10:00:00Z"
  },
  "auditId": "audit-20260213-100000-mcp-activate",
  "contextPackUpdated": true,
  "nextActions": [
    "MCP server 'harris-pacs-connector' activated in development",
    "Approval artifact: .terrafusion/mcp-approvals/harris-pacs-connector-development.json",
    "Expires: 2026-05-14T10:00:00Z (90 days)",
    "Rate limit: 100 requests/hour (default)",
    "Audit level: verbose (write-remote servers)"
  ],
  "warnings": [
    "This server can modify remote state (PACS database)",
    "All operations will be logged to audit trail",
    "Renewal required before 2026-05-14"
  ]
}
```

### Example 3: Activate Production Server (Enhanced Security)

```bash
tdc mcp activate harris-pacs-connector \
  --scope production \
  --justification "Production parcel sync for Benton County go-live (approved in security review SR-2026-001)" \
  --approved-by "security-lead@terrafusion.dev" \
  --expires-in-days 180
```

**Validation:**
- Justification minimum 50 characters: ✅
- Approved by authorized approver: ✅
- Expiration required: ✅ (180 days)
- Security review reference: ✅ (SR-2026-001)

---

## Deactivation / Revocation

### Manual Deactivation

```bash
tdc mcp deactivate harris-pacs-connector --scope development
```

### Revoke Approval

```bash
tdc mcp revoke harris-pacs-connector \
  --scope development \
  --reason "Security incident SI-2026-042"
```

This marks the approval artifact as `revoked: true` and updates audit trail.

---

## Monitoring & Compliance

### List Active MCP Servers

```bash
tdc mcp list --scope development
```

**Output:**
```
Active MCP Servers (development):
  ✓ document-server (read-only, no expiration)
  ✓ harris-pacs-connector (write-remote, expires 2026-05-14)

Inactive MCP Servers:
  ✗ revenue-discovery-tools
  ✗ property-assessment-suite
```

### Check Approval Status

```bash
tdc mcp approval harris-pacs-connector --scope development
```

**Output:**
```json
{
  "toolId": "harris-pacs-connector",
  "status": "active",
  "approvalArtifact": ".terrafusion/mcp-approvals/harris-pacs-connector-development.json",
  "expiresAt": "2026-05-14T10:00:00Z",
  "daysUntilExpiration": 90,
  "revoked": false
}
```

### Audit Trail Query

```bash
tdc audit query --event mcp-server-activated --since 2026-02-01
```

---

## Integration with DX Spine

### VS Code Extension

Command Palette: `⌘K TerraFusion: MCP Activate`

1. User selects server from dropdown
2. Extension prompts for scope, justification, approver
3. Extension calls `tdc mcp activate` via bridge
4. Results displayed in WebView panel

### Claude Code Slash Command

```
/mcp-activate harris-pacs-connector
```

Claude prompts for required parameters and executes `tdc mcp activate`.

### Codex Agent Mode

```bash
codex mcp activate harris-pacs-connector
```

Interactive prompts guide user through approval workflow.

---

## File Structure

```
tools/dx/mcp-activation/
├── activation.contract.json    # Command contract (this workflow)
├── approval-schema.json         # JSON schema for approval artifacts
├── activate.mjs                 # Activation script implementation
└── README.md                    # This documentation

.terrafusion/
└── mcp-approvals/
    ├── document-server-development.json
    ├── harris-pacs-connector-development.json
    └── harris-pacs-connector-production.json
```

---

## Golden Snapshot Testing

Parity tests ensure identical output across skins:

```bash
npm run test:dx-parity -- --command mcp-activate
```

Compares against:
```
tools/dx/command-contracts/mcp-activate.golden.json
```

Ignores dynamic fields:
- `approvalArtifact.approvalDate`
- `auditId`
- `output.timestamp`

---

## Security Checklist

Before activating any MCP server:

- [ ] **Risk Level Assessed**: Server risk level documented
- [ ] **Justification Provided**: Business need clearly stated
- [ ] **Approver Identified**: Appropriate authority assigned
- [ ] **Scope Defined**: Development, staging, or production
- [ ] **Expiration Set**: Renewal date established (if applicable)
- [ ] **Constraints Defined**: Rate limits, allowed operations documented
- [ ] **Audit Level Confirmed**: Logging level appropriate for risk
- [ ] **Security Review**: Production activations have security sign-off

---

## References

- **DX Spine Charter**: `docs/dev/DX_SPINE_CHARTER.md`
- **Command Contract**: `tools/dx/mcp-activation/activation.contract.json`
- **Approval Schema**: `tools/dx/mcp-activation/approval-schema.json`
- **Activation Script**: `tools/dx/mcp-activation/activate.mjs`

---

**Context never lost. Skins never contain logic. The spine is the truth.**
