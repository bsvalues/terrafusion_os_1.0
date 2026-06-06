# Architecture Decision Records

## ADR-001 — Canon authority is OS/platform-owned

**Decision:** Canon Runtime lives under `os-platform/canon`.

**Reason:** Canon enforces OS law, shell contract, write-lanes, gates, permissions, and trace. It is not a marketplace app.

**Implication:** TerraFusionIDE consumes Canon. It does not own Canon.

## ADR-002 — os-canon is the primary surface

**Decision:** `os-canon` is the canonical in-shell workbench.

**Reason:** Canon is an OS Feature. It must preserve the shell frame, Dock, Top Bar, window manager, and global truth.

**Implication:** Canon Desktop is secondary.

## ADR-003 — standalone Canon exists only as developer/repair shell

**Decision:** standalone Canon may edit source code, run gates, manage Git/worktrees, and prepare PRs.

**Prohibited:** direct production county record mutation, valuation changes, exemption/appeal decisions, evidence chain mutation, or fake runtime TerraTrace emission.

## ADR-004 — Engineering write-lanes are required

**Decision:** Add source-code path ownership to supplement municipal data write-lanes.

**Reason:** Canon/IDE edits source code, not just runtime data. Agents need source-code ownership and risk policies.

## ADR-005 — Every task is a state machine

**Decision:** Agent tasks must pass through explicit states from Draft to Trace Sealed.

**Reason:** Prevent prompt-to-edit bypass and support auditability.

## ADR-006 — Hooks enforce law

**Decision:** Hooks run before edits/commands/commits/PRs and after diffs/gates.

**Reason:** Governance must be deterministic and automatic, not conversational.

## ADR-007 — Evidence bundle is mandatory

**Decision:** Every applied task produces an evidence bundle.

**Reason:** TerraFusion advantage is traceable, defensible engineering completion.
