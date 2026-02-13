# TerraFusion OS Skills Registry

**Version:** 1.0 (DX Spine Charter § integrated)  
**Owner:** Governance Lane  
**Status:** Operational (Phase 7 delivered 2026-02-13)

## Overview

The Skills Registry is the canonical catalog of all Claude Skills integrated into TerraFusion OS development workflows. Skills follow the **Progressive Disclosure** pattern: lightweight YAML frontmatter (<1024 chars) triggers full skill activation only when needed.

## Architecture

```
skills/
├── README.md                    # This file
├── registry.json                # Canonical skill catalog (SSOT)
├── {skill-name}/                # Skill directory (one per skill)
│   ├── SKILL.md                 # Progressive disclosure frontmatter + full docs
│   └── {skill-name}.contract.json  # JSON Schema contract for deterministic outputs
```

## Progressive Disclosure Pattern

**Idle State (context always loaded):**
- YAML frontmatter only (<1024 chars): name, trigger phrases, owner lane, risk level
- Costs: 30-50 tokens per skill
- Parsed by registry.json for skill discovery

**Active State (triggered by user/agent):**
- Full SKILL.md body loaded: rules, examples, anti-patterns, fixtures
- TDC command invoked with contract enforcement
- Output validated against JSON Schema

## Skill Lifecycle

```
1. User/Agent mentions trigger phrase
   └→ Registry lookup: skillName → tdcCommand
2. TDC executes: tdc {command} {args}
   └→ Command emits JSON matching contract schema
3. Contract validation via ajv (JSON Schema draft-07)
   └→ Valid: output stored in .terrafusion/contracts/{skill-name}-{timestamp}.json
   └→ Invalid: FAIL with schema violation details
4. Evidence Pack aggregation (keystone skill)
   └→ All lane contracts rolled up with cryptographic integrity (SHA-256)
5. Context Pack summary update
   └→ Lean summary (status, violations_count, lastRunAt) added to .terrafusion/context/latest.json
```

## Lane Model

Skills are organized by **owner lane** for cross-lane write blocking:

| Lane | Scope | Example Skills |
|------|-------|----------------|
| `governance` | Constitutional gates, evidence packs | `tf-pr-evidence-pack` (keystone) |
| `ui` | Frontend components, accessibility, design | `tf-ui-foundation`, `tf-a11y-508-audit`, `tf-data-dense-layouts` |
| `security` | AuthZ, PII, secure coding | `tf-authz-boundary-check`, `tf-logging-pii-guard` *(Phase 8)* |
| `ops` | Infrastructure, Terraform, K8s | `tf-terraform-governor`, `tf-k8s-baseline` *(Phase 9)* |
| `data` | Schema, migrations, PostGIS | `tf-schema-migration-safety` *(Phase 9)* |
| `geo` | Spatial queries, PostGIS compliance | `tf-postgis-spatial-guard` *(Phase 9)* |
| `sdui` | Server-driven UI, county variants | `tf-sdui-schema-validator` *(Phase 10)* |

## Registry Schema

**`registry.json` structure:**

```json
{
  "version": "1.0.0",
  "skills": [
    {
      "skillName": "tf-pr-evidence-pack",
      "lane": "governance",
      "riskLevel": "read",
      "tdcCommand": "evidence build",
      "contractPath": "tools/dx/skills/tf-pr-evidence-pack/evidence-pack.contract.json",
      "contextPath": ".terrafusion/context/latest.json",
      "owners": ["governance-lane"],
      "triggers": ["evidence pack", "build evidence", "aggregate audits"],
      "description": "Keystone aggregator for all lane audit contracts with cryptographic integrity"
    }
  ]
}
```

## Risk Levels

| Level | Scope | Example |
|-------|-------|---------|
| `read` | Read-only operations (no file writes) | Evidence Pack aggregation, contract validation |
| `write-local` | Writes to `.terrafusion/` only | Contract emission, Context Pack updates |
| `write-remote` | Remote API calls, git operations | *Requires explicit approval (not in Phase 7)* |

## Contract-First Validation

**Every skill MUST have an associated `.contract.json` file:**

- JSON Schema draft-07 format
- Defines deterministic output shape
- Enforced via ajv in TDC commands
- Violations block CI (SEAL gate)

**Example contract (minimal):**

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "skillName": { "type": "string" },
    "status": { "enum": ["PASS", "FAIL", "WARN", "SKIP"] },
    "violationsCount": { "type": "integer", "minimum": 0 }
  },
  "required": ["skillName", "status", "violationsCount"]
}
```

## Keystone Skill: Evidence Pack

**`tf-pr-evidence-pack`** is the **forcing function** for all other skills:

- Aggregates all lane contracts into single deterministic receipt
- Strict rollup: **any child FAIL → overall FAIL**
- Cryptographic integrity: SHA-256 for artifacts + CID receipts
- Generates PR-ready markdown snippet
- Enforced by SEAL gate (seal-evidence-gate.yml)

## Adding New Skills

**Step 1: Create skill directory**

```bash
mkdir -p tools/dx/skills/your-skill-name
```

**Step 2: Write SKILL.md with Progressive Disclosure**

```yaml
---
name: your-skill-name
lane: security
riskLevel: read
triggers: ["your trigger phrase"]
description: One-sentence summary (<100 chars)
---

# Your Skill Name

Full documentation below frontmatter...
```

**Step 3: Define contract schema**

```bash
tools/dx/skills/your-skill-name/your-skill-name.contract.json
```

**Step 4: Register in registry.json**

Add entry to `skills[]` array with all required fields.

**Step 5: Implement TDC command**

Create command in `tools/tdc/src/commands/{your-command}.ts` that emits contract-valid JSON.

**Step 6: Add tests with fixtures**

Create known-good and known-bad fixtures to prove determinism.

## CI Integration

**SEAL Evidence Gate (`.github/workflows/seal-evidence-gate.yml`):**

```yaml
- name: Build Evidence Pack
  run: |
    cd tools/tdc
    npm run build
    npm run tdc -- evidence build --pr=${{ github.event.pull_request.number }}

- name: Validate Evidence Pack
  run: |
    cd tools/tdc
    npm run tdc -- evidence validate

- name: Fail PR if Evidence Pack FAIL
  run: |
    if [ "$(jq -r '.overallStatus' .terrafusion/contracts/evidence-pack-latest.json)" == "FAIL" ]; then
      echo "Evidence Pack FAIL - blocking merge"
      exit 1
    fi
```

## Governance Principles

1. **TDC is SSOT** - No logic in skins (VS Code extension, Claude Code, Codex)
2. **Contract-first** - Schema validation catches drift before CI
3. **Progressive Disclosure** - Cheap in idle, rich when triggered
4. **Lane isolation** - Skill ownership prevents cross-lane coupling
5. **Evidence Pack is forcing function** - All lanes plug into keystone aggregator
6. **Cryptographic integrity** - SHA-256 + CID prevent tampering
7. **Determinism mandatory** - Same source → same output (enables reliable CI gates)

## Current Skills (Phase 7)

| Skill | Lane | Status | Purpose |
|-------|------|--------|---------|
| `tf-pr-evidence-pack` | governance | ✅ Operational | Keystone aggregator |
| `tf-ui-foundation` | ui | ✅ Operational | Token governance (OKLCH-only) |
| `tf-a11y-508-audit` | ui | ✅ Operational | WCAG 2.1 AA + Section 508 |
| `tf-data-dense-layouts` | ui | ✅ Operational | Virtualization + density |

## Roadmap (Phases 8-12)

- **Phase 8:** Security Lane (authz-boundary-check, logging-pii-guard, secure-coding-audit)
- **Phase 9:** Ops + Data Lanes (Terraform governor, K8s baseline, PostGIS spatial)
- **Phase 10:** SDUI (schema-driven UI for county variants)
- **Phase 11:** Context Pack as Posture Bus (real-time lane health)
- **Phase 12:** County Packs (marketplace distribution)

---

**Government. Transcended. Receipted.** 🏛️
