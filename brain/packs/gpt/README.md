# Domain Pack: GPT (TerraGPT)

> Suite ID: `terragpt` · Domain: AI / GPT · Mission: **augment every role**
> Charter: ADR-005. Sub-modules: Studio, Marketplace, Management, Builder, Analytics, RAG.

## Mission

Augment every role. TerraGPT owns AI/GPT assistance patterns — summarization, drafting, Q&A,
retrieval, prompt surfaces, and explain behavior — acting **through** TerraPilot tools and approved
service APIs.

## Owns

- AI/GPT assistance patterns: summarization, drafting, Q&A, retrieval, explain behavior.
- Prompt surfaces.
- GPT configurations.
- RAG datasets (metadata) and RAG embeddings.
- Usage / cost metrics.
- Conversation history.

## Does Not Own

- Any other suite's data (valuation, GIS, workflow, documents) — read-only consumer only.
- Direct write access to suite-owned records — must act through TerraPilot tools.
- The trace store itself (**TerraTrace**) — GPT emits to it, does not own it.
- Shell routing, window management, or the Workbench frame (**Shell / OS Core**).

## Allowed Writes

- GPT configurations.
- RAG dataset metadata and embeddings.
- Usage / cost metrics.
- Conversation history.
- AI actions on other domains **only** via approved TerraPilot tools / service APIs (never direct).

## Forbidden Writes

- **Any other suite's data directly** — Forge / Atlas / Dais / Dossier records must be reached through
  TerraPilot tools or the owning lane's service.
- Property records or valuation mutation by the AI itself.
- Shell chrome, routing, or z-index.
- Trace records as mutable business state.
- Any persistence not isolated by `CountyId` for county-scoped data.

## Routing Rules

- GPT **acts through TerraPilot tools and approved service APIs** — it does not reach into suite stores.
- TerraPilot tool calls carry the risk classification (read_only / write_low / write_high / irreversible);
  write_high and irreversible actions re-confirm mode + intent and are human-gated.
- **Source grounding and traceability are required** when appropriate: cite the grounding source and
  emit a TerraTrace event for AI-initiated actions.
- Drafts that get saved become **Dossier** narratives (via the Dossier service), not GPT-owned records.

## Required Proof

- `pnpm run type-check`.
- `pnpm canon` / `pnpm canon:gatefast` (write-lane + tool-allowlist gates green).
- Evidence that AI actions route through TerraPilot tools (no direct cross-suite writes).
- Source-grounding / traceability evidence where retrieval or factual claims are involved.
- PII-sanitization + TerraTrace logging on tool calls (per TerraPilot spec).

## Common Failure Patterns

- AI writing directly into a suite's data store instead of calling a TerraPilot tool.
- Ungrounded generation presented as fact (no source, no citation) where grounding was required.
- Mutating property or valuation records via the model.
- Treating trace as editable AI state.
- Missing PII sanitization or trace emission on a tool call.

## Escalation Triggers

Stop and get human approval when a change would:

- Grant the AI a new write_high / irreversible tool, or expand the tool allowlist.
- Let GPT mutate suite-owned records by any path other than an approved TerraPilot tool.
- Change source-grounding or PII-handling behavior.
- Touch another suite's write lane.

## Non-Goals

- No direct suite-record mutation by AI.
- No property/valuation mutation by AI.
- No shell/routing changes.
- No suite-local brain or queue authority.
- Not changing TerraPilot UI (out of scope for WO-BRAIN-0013).

## Canon Sources

- `docs/architecture/ADR-005-TERRAGPT-CHARTER.md` (TerraGPT charter)
- `docs/architecture/TERRAFUSION_SUITE_CONSTITUTION_v1.md` (§3.5 TerraGPT; Article VII TerraPilot modes)
- `docs/architecture/specs/terrafusion/02_TERRAPILOT_SPEC_v3.1.md` (tool allowlists, risk classes, PII sanitization)
- `docs/architecture/specs/terrafusion/04_SUITE_BOUNDARIES_WRITE_LANES_v3.1.md` (write-lane matrix)
- Suite home: `frontend/apps/os-shell/src/pages/suites/GptSuiteHome.tsx`
