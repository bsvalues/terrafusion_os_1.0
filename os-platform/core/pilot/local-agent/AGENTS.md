# AGENTS.md — LocalOps (local-agent)

This is **LocalOps** — TerraPilot **inside the shell**, an OS feature, **not** a standalone app.

**Before modifying anything here, read the LocalOps domain pack:** [`brain/packs/localops/README.md`](../../../../brain/packs/localops/README.md).

Hard limits (full detail in the pack):

- **No property record or valuation mutation by AI** — ever.
- **No silent cloud fallback** — when local AI is unavailable/prohibited, stay local; do not quietly
  route to the cloud.
- **No unrestricted shell** — command execution stays within the controlled command registry.
- **No autonomous production repair.**
- **LocalOps v1 is local-first, read-only diagnostic, source-grounded, trace-emitting, and
  human-approved before any mutation.**
- Mutations route only through approved TerraPilot tools (risk-classified, human-gated).

This directory is inside the **Core Governance Surface** (`os-platform/core/pilot/**`) — changes here
require the gates and approvals defined in the root [`AGENTS.md`](../../../../AGENTS.md), including
`pnpm run type-check` and `node --test os-platform/core/tests/phase83-tools.test.mjs`.
