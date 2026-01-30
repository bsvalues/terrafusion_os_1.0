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

## TOOL GOVERNANCE RULES
- ToolRegistry must resolve the manifest path canonically (relative to ToolRegistry) and allow env override only:
  - `TERRAFUSION_TOOL_MANIFEST_PATH`
- ToolRegistry logging must be silent unless:
  - `DEBUG_TOOLREGISTRY=1`

## COMMIT HYGIENE
- Small commits, one logical change per commit.
- Never fix by exclusion unless the exclusion is policy-backed and documented here.
