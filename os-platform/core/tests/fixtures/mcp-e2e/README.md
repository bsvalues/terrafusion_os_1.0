# Phase 12D - End-to-End MCP Integration Test Fixtures

## Overview

Phase 12D tests the full MCP PostGIS stack integration:
- **Phase 12A:** PostGIS read-only queries
- **Phase 12B:** Multi-county routing isolation
- **Phase 12C:** Supervised writes with approval artifacts
- **Phase 12D:** End-to-end flows with evidence verification

## Test Scenarios

### 1. read-write-flow-valid.json
**Full MCP flow: read → approve → write → verify**

Flow:
1. **Read property** (Phase 12A) - Query property by parcel ID
2. **Approve write** (Phase 12C) - Generate approval artifact with bindings
3. **Execute write** (Phase 12C) - Update property with approval validation
4. **Verify evidence** (Phase 12D) - Check bidirectional linking
5. **Verify read** (Phase 12A) - Confirm write succeeded

Validates:
- Read-first safety (Phase 12A)
- Approval artifact governance (Phase 12C)
- Write validation with 10 checks (Phase 12C)
- Evidence trail generation (Phase 12D)
- Data consistency after write (Phase 12A)

### 2. cross-county-isolation.json
**Cross-county write prevention**

Flow:
1. **Benton read** - Benton supervisor reads Benton property
2. **Benton approval** - Benton supervisor approves Benton write (scope: benton)
3. **Yakima write attempt** - Same approval used for Yakima write (MUST REJECT)

Validates:
- County isolation (Phase 12B)
- Approval scope binding (Phase 12C)
- Cross-county write prevention (Phase 12C)
- Governance: "County mismatch" error

### 3. evidence-trail-complete.json
**Full evidence trail with bidirectional linking**

Flow:
1. **Initial read** - Query property with trace enabled
2. **Write with approval** - Update with approval artifact, trace enabled
3. **Evidence pack verification** - Check all artifacts + bidirectional links

Validates:
- Trace emission (read + write)
- Evidence pack structure (3 artifacts)
- Bidirectional linking (4 links)
- Hash integrity (manifestHash, paramsHash, dsnHash, contractHash)
- Immutability enforcement

## Evidence Pack Structure

```
evidence-pack/
├── write.manifest.json       # Write operation manifest
├── approval.artifact.json    # Supervisor approval artifact
└── write.receipt.json        # Execution receipt
```

### Bidirectional Linking

```
manifest.approvalId ────────────────┐
                                    ↓
approval.approvalId ────────────────┘
         │
         └─→ approval.bindings.manifestHash ───┐
                                               ↓
                          manifest.manifestHash ───┘
                                    │
receipt.manifestHash ───────────────┘
receipt.approvalId ─────────────────→ approval.approvalId
```

## Governance Contract

### Read-First Safety (Phase 12A)
- All reads use parameterized SQL
- Row limits enforced (default 100)
- Statement timeout enforced (30s)
- PII redaction enabled

### Multi-County Routing (Phase 12B)
- County-specific DSN routing
- Absolute county isolation
- No cross-county queries
- DSN hash binding in approval

### Supervised Writes (Phase 12C)
- Approval artifact required (no bypass)
- Max 24h expiry enforced
- 4 hash bindings validated (params, DSN, contract, manifest)
- 3 scope checks enforced (county, environment, operationId)
- Template allowlist enforced (no raw SQL)
- Cross-county writes forbidden

### End-to-End Integration (Phase 12D)
- Full flow tested (read → approve → write → evidence)
- Evidence trail validated (3 artifacts, 4 links)
- Hash integrity verified
- Immutability enforced
- Audit trail complete

## Test Coverage Goals

- ✅ Full read-write cycle with approval
- ✅ Cross-county isolation enforcement
- ✅ Evidence trail generation + verification
- ✅ Bidirectional linking integrity
- ✅ Hash tampering detection
- ✅ Trace emission (read + write)
- ✅ Error recovery patterns

## Usage

```bash
# Run Phase 12D E2E tests
pnpm run test:phase12d-e2e

# Run all MCP tests (12A + 12B + 12C + 12D)
pnpm run test:phase12-all
```

## CI Enforcement

Phase 12D gates block PRs if:
- Read-write flow fails
- Cross-county isolation broken
- Evidence trail incomplete
- Bidirectional linking missing
- Hash integrity compromised

---

**Phase 12D Status:** Implementation pending (fixtures complete)
**Total Fixtures:** 3 scenarios (read-write-flow, cross-county-isolation, evidence-trail)
**Integration Points:** Phase 12A + 12B + 12C
