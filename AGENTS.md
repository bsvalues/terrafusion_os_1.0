# TerraFusion OS  Agent Operating Rules (Core Governance)

## PRIME DIRECTIVE
Do not destabilize the Core Governance Surface.

## CORE GOVERNANCE SURFACE (ALLOWED SCOPE)
Only modify files under:
- os-platform/core/pilot/**
- os-platform/core/types/**
- tools/registry/**
- tsconfig.core.json
- package.json
- .github/workflows/** (only for gate wiring)

Anything outside this scope requires explicit authorization.

## DO NOT TOUCH
- **/ARCHIVE/**
- development/tools/championship-dev/ARCHIVE/**
- specialized/** (unless explicitly authorized)
- applications/** (unless explicitly authorized)

## BUILD ARTIFACTS POLICY (ENFORCED)
- `.ts` is the source of truth.
- `.js` files in `os-platform/core/**` are generated and must match their `.ts` source.
- Do not hand-edit generated `.js` files.
- Regen command (manual): `pnpm run build:core-js` then `pnpm run check:generated`.

## REQUIRED GATES (MUST PASS)
- `pnpm run type-check` (core boundary)
- `node --test os-platform/core/tests/phase83-tools.test.mjs`

## BRANCH PROTECTION (CONSTITUTIONAL GATES)

The following status checks are **required** on `main` branch:

| Check | Scope | Enforcement |
|-------|-------|-------------|
| `🔒 SEAL` | All PRs | Required, admins enforced |
| `typecheck-core` | All PRs | Required |
| `phase83-tools` | All PRs | Required |
| `Accreditation Compat Check` | Accreditation paths only | Required when triggered |
| `Accreditation Oracle Health` | Scheduled weekly | Non-blocking (monitoring) |

### Two-Tier Oracle Model

1. **OS Evidence-Plane Oracle** (golden corpus)
   - Enforcement: `oracle-health.yml` + `GOLDEN_CORPUS.lock.json`
   - Scope: Global governance invariants

2. **County Accreditation Oracle** (reference packet lock)
   - Enforcement: `accreditation-compat.yml` + `ACCREDITATION_REFERENCE.lock.json`
   - Scope: County deployment/accreditation invariants

### Branch Protection Settings (GitHub)

```
main:
  required_status_checks:
    strict: true
    contexts:
      - "🔒 SEAL"
      - "typecheck-core"
      - "phase83-tools"
      - "Accreditation Compat Check (ubuntu-latest)"
      - "Accreditation Compat Check (windows-latest)"
  enforce_admins: true
  required_pull_request_reviews:
    required_approving_review_count: 1
  restrictions: null
```

## TOOL GOVERNANCE RULES
- ToolRegistry must resolve the manifest path canonically (relative to ToolRegistry) and allow env override only:
  - `TERRAFUSION_TOOL_MANIFEST_PATH`
- ToolRegistry logging must be silent unless:
  - `DEBUG_TOOLREGISTRY=1`

## COMMIT HYGIENE
- Small commits, one logical change per commit.
- Never fix by exclusion unless the exclusion is policy-backed and documented here.
