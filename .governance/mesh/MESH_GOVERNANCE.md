# TerraFusion Agent Mesh Governance Specification

> **Version:** 1.0.0
> **Status:** Active
> **Last Updated:** 2026-02-07

## Overview

The Agent Mesh enables **structured lateral communication** between parallel sub-agents during multi-agent development sessions. Unlike traditional single-agent or supervisor-only architectures, the mesh allows agents to coordinate in real-time, preventing silent divergence and duplicate work.

**Key Principle:** Mesh is a power tool, not a group chat. All communication follows strict protocols.

---

## Activation

The mesh is **disabled by default**. Enable via environment variable:

```bash
TF_AGENT_MESH=1
```

Or in `.vscode/settings.json`:

```json
{
  "terrafusion.agent.mesh.enabled": true,
  "terrafusion.agent.mesh.mode": "structured",
  "terrafusion.agent.mesh.decisionAuthority": "integrator_only",
  "terrafusion.agent.mesh.broadcastDefault": false,
  "terrafusion.agent.mesh.rateLimit": 5,
  "terrafusion.agent.mesh.sensitivity": "internal"
}
```

---

## Core Principles

### 1. Structured Messages Only

Free-form chat is prohibited. All messages must use defined types with required fields.

### 2. Single Merge Authority (Integrator)

The mesh is not a democracy. One agent role (Integrator) has authority to land decisions into canonical documents.

### 3. Doc-First Law

Mailbox is ephemeral coordination. The four canonical docs (discovery, research, plan, progress) are the system record. No decision is valid until landed in docs.

### 4. Security by Default

Messages are classified. PII and credentials are prohibited. Redaction hooks apply before transmission.

### 5. Rate-Limited Routing

Broadcast is disabled by default. Messages route to specific roles, not "ALL." Each agent has a per-cycle outbound limit.

---

## Message Types

All mesh messages must conform to the schema in `message-schema.json`.

| Type | Purpose | Who Can Send | Who Can Receive |
|------|---------|--------------|-----------------|
| `REQUEST` | Ask for research/verification | Any | Targeted role |
| `PROPOSAL` | Suggest architectural/design change | Any | Integrator + affected roles |
| `DECISION` | Final determination (must land in docs) | Integrator only | ALL (broadcast) |
| `CONFLICT` | Two outputs disagree; needs resolution | Any | Integrator |
| `BLOCKER` | Needs response before proceeding | Any | Targeted role(s) |
| `FYI` | Low-priority informational (use sparingly) | Any | Targeted role(s) |
| `SYNC` | Status update during consensus windows | Any | Integrator |

### Message Schema (Required Fields)

```json
{
  "id": "uuid",
  "type": "REQUEST|PROPOSAL|DECISION|CONFLICT|BLOCKER|FYI|SYNC",
  "from_role": "string",
  "to_role": "string|string[]",
  "channel": "#discovery|#research|#architecture|#build|#qa|#decisions",
  "sensitivity": "PUBLIC|INTERNAL|RESTRICTED",
  "timestamp": "ISO8601",
  "subject": "string (max 100 chars)",
  "body": "string (max 2000 chars)",
  "references": ["doc paths or message IDs"],
  "doc_targets": ["discovery|research|plan|progress + section anchors"],
  "rationale": "string (for DECISION/PROPOSAL only)",
  "expires_at": "ISO8601 (optional TTL)"
}
```

---

## Roles

See `roles.md` for full definitions. Summary:

| Role | Permissions | Responsibilities |
|------|-------------|------------------|
| **Integrator** | Issue DECISION, merge to docs, resolve CONFLICT | Owns plan.md + progress.md, final authority |
| **Researcher** | Issue REQUEST, PROPOSAL, FYI | Domain research, gather evidence |
| **Builder** | Issue REQUEST, PROPOSAL, BLOCKER | Implementation, tests |
| **Reviewer** | Issue CONFLICT, BLOCKER, FYI | Quality gates, compliance checks |

### Integrator = Merge Authority

Only the Integrator can:
- Accept/reject PROPOSAL
- Resolve CONFLICT
- Issue DECISION
- Land changes into canonical docs

Other agents recommend but cannot land.

---

## Channels (Mailbox Namespaces)

Messages route to channels, not global broadcast:

| Channel | Purpose | Who Subscribes |
|---------|---------|----------------|
| `#discovery` | Intent clarification | All |
| `#research` | Domain findings | Researchers + Integrator |
| `#architecture` | Design decisions | Integrator + Builders |
| `#build` | Implementation coordination | Builders |
| `#qa` | Testing, compliance | Reviewers + Integrator |
| `#decisions` | Final decisions (read-only except Integrator) | All (read), Integrator (write) |

---

## Decision Workflow

```
PROPOSAL → Integrator Review → DECISION → Doc Landing → SYNC
```

### 1. PROPOSAL Submission

Any agent submits a PROPOSAL with:
- `subject`: What is proposed
- `body`: Details
- `rationale`: Why this approach
- `doc_targets`: Which docs/sections this affects
- `references`: Evidence from research

### 2. Integrator Review

Integrator evaluates using the rubric:
1. **Correctness** > Simplicity > Speed
2. **Security/Compliance** overrides convenience
3. **Plan alignment** overrides novelty

### 3. DECISION Issuance

If accepted, Integrator issues DECISION with:
- `doc_targets`: Exact sections to update
- `rationale`: Why this was accepted
- `acceptance_impact`: What tests/criteria change

### 4. Doc Landing

DECISION is invalid until:
- Target docs are updated with the decision content
- Commit includes reference to DECISION ID
- progress.md updated with commit hash

### 5. SYNC Broadcast

After landing, Integrator broadcasts SYNC to `#decisions` channel so all agents update their context.

---

## Conflict Resolution Protocol

When agents disagree:

### 1. Mark as CONFLICT

Either party sends CONFLICT to Integrator with:
- `claim_a`: First position
- `claim_b`: Second position
- `evidence`: Supporting data for each
- `impact`: What breaks if wrong choice made

### 2. Integrator Applies Rubric

| Priority | Criterion |
|----------|-----------|
| 1 | Correctness (does it work?) |
| 2 | Security/Compliance (does it meet requirements?) |
| 3 | Simplicity (is it maintainable?) |
| 4 | Performance (is it fast enough?) |
| 5 | Velocity (can we ship it?) |

### 3. DECISION with Rationale

Integrator issues DECISION explaining which claim won and why.

### 4. Loser Acknowledges

Losing party sends FYI acknowledging decision (prevents silent resentment).

---

## Security Policy

### Sensitivity Levels

| Level | Definition | Mailbox Allowed |
|-------|------------|-----------------|
| `PUBLIC` | Can be shared externally | ✅ |
| `INTERNAL` | Team-only, no external exposure | ✅ (default) |
| `RESTRICTED` | Sensitive business data | ⚠️ Redacted |
| `SECRET` | Credentials, PII, keys | ❌ Prohibited |

### Prohibited Content

The following MUST NEVER appear in mesh messages:
- Passwords, API keys, tokens
- SSNs, full names, addresses, phone numbers
- Internal IP addresses, hostnames
- Customer data

### Redaction Hooks

Before message transmission:
1. Scan body for credential patterns (regex)
2. Scan for PII patterns
3. Redact or block if found
4. Log violation (but not content)

---

## Rate Limiting

### Per-Agent Limits

| Limit | Default | Override |
|-------|---------|----------|
| Outbound messages per cycle | 5 | `TF_AGENT_RATE_LIMIT` |
| Broadcast (to ALL) per cycle | 0 | Integrator only |
| Max body length | 2000 chars | None |
| Max references | 10 | None |

### Cycle Definition

A "cycle" is one round of parallel work between consensus windows (typically ~30 minutes of agent work time).

---

## Consensus Windows

Instead of constant chatter:

1. **Parallel work phase** (agents research/build independently)
2. **Sync window** (agents send SYNC to Integrator)
3. **Merge window** (Integrator reviews mailbox, issues DECISIONs)
4. **Land phase** (decisions written to docs)
5. **Resume** (next parallel phase)

This batching improves determinism and reduces thrash.

---

## Observability Metrics

Track to prove mesh value:

| Metric | Target | Warning |
|--------|--------|---------|
| Duplicate work rate | < 5% | > 15% |
| Conflict count per phase | < 3 | > 10 |
| Time-to-decision | < 2 cycles | > 5 cycles |
| DECISION → Doc landing rate | 100% | < 90% |
| FYI ratio (FYI / actionable msgs) | < 20% | > 40% |

If FYI dominates, mesh is wasting time.

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `TF_AGENT_MESH` | `0` | Enable mesh (`1` = on) |
| `TF_AGENT_MAILBOX_MODE` | `structured` | `structured` or `freeform` (not recommended) |
| `TF_AGENT_DECISION_AUTHORITY` | `integrator_only` | Who can issue DECISION |
| `TF_AGENT_BROADCAST` | `0` | Allow broadcast messages |
| `TF_AGENT_RATE_LIMIT` | `5` | Max outbound per cycle |
| `TF_AGENT_SENSITIVITY` | `internal` | Default message sensitivity |
| `TF_AGENT_DOC_FIRST` | `1` | Require doc landing for DECISION |
| `TF_AGENT_CONSENSUS_WINDOW` | `30m` | Time between sync windows |

---

## Integration with Workflow Governance

Mesh operates alongside the four-document workflow:

```
discovery.md  ←  DECISION lands intent changes
research.md   ←  DECISION lands research conclusions
plan.md       ←  DECISION lands phase/task changes
progress.md   ←  DECISION lands status + commits
```

A DECISION without `doc_targets` is invalid and will be rejected.

---

## Agent Instructions

**ALL agents operating in mesh mode MUST:**

1. Read this spec before sending any message
2. Use only defined message types with required fields
3. Route to channels/roles, not broadcast
4. Respect rate limits
5. Never include prohibited content
6. Acknowledge that only Integrator can issue DECISION
7. Update docs after DECISION, not before
8. Send SYNC at consensus windows

**Violation of mesh protocol is a governance incident.**

---

## Related Documents

- [roles.md](./roles.md) - Full role definitions
- [message-schema.json](./message-schema.json) - JSON schema
- [conflict-resolution.md](./conflict-resolution.md) - Detailed conflict protocol
- [../workflow/README.md](../workflow/README.md) - Four-document workflow

---

**Classification:** Agent Coordination Protocol
**Owner:** TerraFusion Governance
