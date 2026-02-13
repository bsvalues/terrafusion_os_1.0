---
name: tf-pr-evidence-pack
lane: governance
riskLevel: read
triggers: ["evidence pack", "build evidence", "aggregate audits", "pr receipt"]
description: Keystone aggregator for all lane contracts with SHA-256 integrity receipts
version: 1.0.0
contractVersion: 1.0.0
---

# TerraFusion PR Evidence Pack

**Status:** Operational (Phase 7 delivered 2026-02-13)  
**Owner:** Governance Lane  
**Risk Level:** Read-only (no file modifications, aggregation only)

## Purpose

The **Evidence Pack** is the **keystone forcing function** for deterministic, auditable PR quality gates. It aggregates all lane-specific audit contracts (UI, Security, Infra, Data, GIS, SDUI) into a single cryptographically-sealed receipt that:

1. **Enforces strict rollup**: Any child lane FAIL → overall FAIL (no exceptions)
2. **Prevents tampering**: SHA-256 hashing for all referenced artifacts
3. **Provides PR receipts**: Markdown snippet auto-generated for PR body injection
4. **Enables CI enforcement**: SEAL gate blocks merge if status=FAIL or validation fails
5. **Maintains audit trail**: Timestamped contracts stored in `.terrafusion/contracts/`

## Architecture

```
Evidence Pack (Keystone)
├── Aggregates contracts from ALL lanes
│   ├── UI Lane (token compliance, a11y, density)
│   ├── Security Lane (authz, PII, secure coding)
│   ├── Ops Lane (Terraform, K8s, IaC)
│   ├── Data Lane (schema migrations, PostGIS)
│   ├── GIS Lane (spatial queries)
│   └── SDUI Lane (schema-driven UI)
│
├── Generates cryptographic receipts
│   ├── SHA-256 hash for each artifact
│   ├── CID (Content Identifier) for IPFS-ready receipts
│   └── Context Pack hash for tamper detection
│
├── Emits validated contract (JSON)
│   └→ .terrafusion/contracts/evidence-pack-{timestamp}.json
│
├── Updates Context Pack (lean summary only)
│   └→ .terrafusion/context/latest.json
│       └→ evidencePack: { status, violationsCount, lastRunAt, snippet }
│
└── Blocks CI on FAIL
    └→ SEAL gate enforces: status must be PASS or PR blocked
```

## Contract Schema

**File:** `evidence-pack.contract.json`  
**Format:** JSON Schema draft-07

**Required fields:**

```typescript
{
  contractVersion: string;        // Must match skill version
  prNumber: number;               // GitHub PR number
  branchRef: string;              // Git branch name
  generatedAt: string;            // ISO 8601 timestamp
  overallStatus: "PASS" | "FAIL" | "WARN" | "SKIP";
  lanesAudited: string[];         // ["ui", "security", "ops", ...]
  contracts: Array<{
    skillName: string;
    lane: string;
    status: "PASS" | "FAIL" | "WARN" | "SKIP";
    violationsCount: number;
    artifactPath: string;         // Relative to repo root
    hash: string;                 // "sha256:{hash}" format
    cid?: string;                 // Optional IPFS CID
  }>;
  totalViolations: number;
  contextHash: string;            // SHA-256 of Context Pack at build time
  markdownSnippet: string;        // PR-ready markdown for body injection
}
```

## TDC Commands

### 1. Build Evidence Pack

```bash
tdc evidence build [--pr=<number>] [--branch=<name>]
```

**Behavior:**
- Discovers all contracts in `.terrafusion/contracts/` (excluding evidence-pack-*.json)
- Validates each contract against its registered schema (via registry.json)
- Computes SHA-256 hash for each artifact
- Generates CID for IPFS-ready receipts (optional)
- Aggregates into single evidence pack with strict rollup (any FAIL → overall FAIL)
- Writes to `.terrafusion/contracts/evidence-pack-{timestamp}.json`
- Updates Context Pack (`.terrafusion/context/latest.json`) with lean summary

**Exit codes:**
- `0`: Build succeeded (status may be PASS, FAIL, or WARN)
- `1`: Build failed (malformed contracts, missing files, schema validation errors)

### 2. Validate Evidence Pack

```bash
tdc evidence validate [--pack=<path>]
```

**Behavior:**
- Loads evidence pack (default: latest in `.terrafusion/contracts/`)
- Validates JSON against evidence-pack.contract.json schema
- Re-computes SHA-256 for all referenced artifacts
- Compares computed hashes with stored hashes
- Validates Context Pack hash (detects Context Pack tampering)
- Reports tampering if any hash mismatch

**Exit codes:**
- `0`: Validation passed (all hashes match, schema valid)
- `1`: Validation failed (hash mismatch, schema violation, missing artifacts)

### 3. Show Evidence Pack

```bash
tdc evidence show [--pack=<path>] [--format=json|markdown|summary]
```

**Behavior:**
- Loads evidence pack (default: latest)
- Displays in requested format:
  - `json`: Full contract output
  - `markdown`: PR-ready snippet (default)
  - `summary`: Human-readable terminal output with color

**Example output (markdown format):**

```markdown
## 🏛️ TerraFusion PR Evidence Pack

**Overall Status:** ✅ PASS  
**PR:** #314  
**Branch:** `feature/phase4-sprint1-storage`  
**Generated:** 2026-02-13T14:30:00Z  
**Lanes Audited:** ui, security (2 lanes)  
**Total Violations:** 0

### Lane Results

| Lane | Skill | Status | Violations |
|------|-------|--------|------------|
| ui | tf-ui-foundation | ✅ PASS | 0 |
| ui | tf-a11y-508-audit | ✅ PASS | 0 |

### Cryptographic Integrity

- **Artifacts Hashed:** 2
- **Context Pack:** `sha256:abc123...` ✅ Verified
- **CID:** `Qm...` (IPFS-ready)

---

**Government. Transcended. Receipted.** 🏛️
```

## Strict Rollup Rules

**ANY child lane FAIL → overall FAIL** (no exceptions):

```typescript
// Rollup logic (pseudocode)
function computeOverallStatus(contracts: Contract[]): Status {
  if (contracts.some(c => c.status === "FAIL")) return "FAIL";
  if (contracts.some(c => c.status === "WARN")) return "WARN";
  if (contracts.every(c => c.status === "SKIP")) return "SKIP";
  return "PASS";
}
```

**Why strict?** Government compliance is binary: either all gates pass or the PR is not mergeable.

## Cryptographic Integrity

### SHA-256 Hashing

**All artifacts referenced by the Evidence Pack are hashed:**

```typescript
import crypto from 'crypto';

function hashFile(filePath: string): string {
  const content = fs.readFileSync(filePath, 'utf8');
  const hash = crypto.createHash('sha256').update(content).digest('hex');
  return `sha256:${hash}`;
}
```

**Validation detects ANY single-byte modification:**

```bash
# Original artifact
echo '{"status": "PASS"}' > artifact.json
# hash: sha256:abc123...

# Tampered artifact (1 byte changed)
echo '{"status": "FAIL"}' > artifact.json
# hash: sha256:def456...  ← MISMATCH detected by tdc evidence validate
```

### CID (Content Identifier) for IPFS

**Optional IPFS-ready receipts using CID v1:**

```typescript
import { CID } from 'multiformats/cid';
import * as Block from 'multiformats/block';
import { sha256 } from 'multiformats/hashes/sha2';
import * as dagJSON from '@ipld/dag-json';

async function computeCID(data: any): Promise<string> {
  const block = await Block.encode({ value: data, codec: dagJSON, hasher: sha256 });
  return block.cid.toString(); // e.g., "bafyrei..."
}
```

**Why CID?** Future-proofs Evidence Packs for decentralized audit trails (IPFS/Filecoin storage).

## CI Integration (SEAL Gate)

**Workflow:** `.github/workflows/seal-evidence-gate.yml`

```yaml
name: 🔒 SEAL Evidence Gate

on:
  pull_request:
    paths:
      - 'frontend/**'
      - 'backend/**'
      - 'tools/**'
      - 'os-platform/**'
      # Excludes: docs/, *.md, .github/workflows/ (docs-only PRs skip)

jobs:
  evidence-pack:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install TDC
        run: |
          cd tools/tdc
          npm ci

      - name: Build Evidence Pack
        id: build
        run: |
          cd tools/tdc
          npm run tdc -- evidence build --pr=${{ github.event.pull_request.number }} --branch=${{ github.head_ref }}
        continue-on-error: true

      - name: Validate Evidence Pack
        id: validate
        run: |
          cd tools/tdc
          npm run tdc -- evidence validate

      - name: Check Overall Status
        run: |
          STATUS=$(jq -r '.overallStatus' .terrafusion/contracts/evidence-pack-latest.json)
          if [ "$STATUS" == "FAIL" ]; then
            echo "❌ Evidence Pack FAIL - blocking merge"
            exit 1
          elif [ "$STATUS" == "WARN" ]; then
            echo "⚠️  Evidence Pack WARN - review required"
          else
            echo "✅ Evidence Pack PASS"
          fi

      - name: Comment PR with Evidence
        uses: actions/github-script@v7
        if: always()
        with:
          script: |
            const fs = require('fs');
            const pack = JSON.parse(fs.readFileSync('.terrafusion/contracts/evidence-pack-latest.json', 'utf8'));
            await github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: pack.markdownSnippet
            });
```

## Context Pack Integration

**Evidence Pack updates Context Pack with LEAN summary only:**

**File:** `.terrafusion/context/latest.json`

```json
{
  "evidencePack": {
    "status": "PASS",
    "violationsCount": 0,
    "lastRunAt": "2026-02-13T14:30:00Z",
    "lanesAudited": ["ui", "security"],
    "snippet": "## Evidence Pack\n**Status:** ✅ PASS\n..."
  }
}
```

**Why lean?** Context Pack must remain fast (<50KB). Full audit details live in `.terrafusion/contracts/`.

## Fixtures (Determinism Testing)

**Known-good fixture:** `evidence-pack-pass.fixture.json`

```json
{
  "contractVersion": "1.0.0",
  "prNumber": 314,
  "branchRef": "feature/test",
  "generatedAt": "2026-02-13T00:00:00Z",
  "overallStatus": "PASS",
  "lanesAudited": ["ui"],
  "contracts": [
    {
      "skillName": "tf-ui-foundation",
      "lane": "ui",
      "status": "PASS",
      "violationsCount": 0,
      "artifactPath": ".terrafusion/contracts/ui-token-compliance.json",
      "hash": "sha256:abc123..."
    }
  ],
  "totalViolations": 0,
  "contextHash": "sha256:def456...",
  "markdownSnippet": "## Evidence\n**Status:** ✅ PASS"
}
```

**Known-bad fixture:** `evidence-pack-fail.fixture.json` (status="FAIL", violationsCount > 0)

## Anti-Patterns

❌ **DO NOT:**
- Manually edit Evidence Pack JSON (always regenerate via `tdc evidence build`)
- Skip validation before CI merge (always run `tdc evidence validate`)
- Modify artifact files after pack generation (breaks cryptographic integrity)
- Store full audit details in Context Pack (use lean summary only)
- Bypass SEAL gate on FAIL status (government compliance is non-negotiable)

✅ **DO:**
- Regenerate Evidence Pack after any source code change
- Validate pack before pushing commits
- Store full contracts in `.terrafusion/contracts/` (Evidence Pack references them)
- Use CID for future IPFS integration
- Fail fast on FAIL status (fix violations, don't bypass)

## Phase 7A Hardening (Testing Requirements)

**Before Phase 8 begins, Evidence Pack MUST prove:**

1. **Determinism:** Two consecutive `tdc evidence build` runs on identical source → identical normalized output
2. **Tamper Detection:** Any single-byte artifact modification → `tdc evidence validate` FAILS deterministically
3. **Gate Scoping:** Docs-only PR skips evidence enforcement; code PR enforces it
4. **Registry Invariants:** All 4 skills have complete metadata (lane, risk, contract, command)
5. **Contract Drift Detection:** Schema change without version bump → validation FAIL

**Test location:** `tools/tdc/src/__tests__/evidence/`

---

**Government. Transcended. Receipted. Tamper-Proof.** 🏛️
