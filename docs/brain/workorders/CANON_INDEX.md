# TerraFusion Governance Canon Index

> **WO-MAO-001 audit basis:** `docs/brain/evidence/WO-MAO-000-proof.md`
> **Parent index:** root [`CANON_INDEX.md`](../../../CANON_INDEX.md)

This subordinate register identifies Work Order governance documents. It cannot redefine the root
authority precedence. A file becomes controlling only through ratified authority and membership in
the root canon or its delegated register; an authoritative title alone does not grant authority.

## Authority Order

Conflict order is defined by
[`ADR-EXEC-001`](../../adr/ADR-EXEC-001-governance-authority-hierarchy.md) and summarized in root
[`AGENTS.md`](../../../AGENTS.md): Constitution, ratified owner decisions, canonical Brain/root
governance, active program/Work Order authority, directory-local restrictions, active
playbooks/runbooks, implementation patterns, then agent judgment.

## Controlling Documents

| Surface | Canonical document | Status and boundary |
|---------|--------------------|---------------------|
| Constitution | [`TERRAFUSION_SUITE_CONSTITUTION_v1.md`](../../architecture/TERRAFUSION_SUITE_CONSTITUTION_v1.md) | Highest authority; TF-052 |
| Governance precedence | [`ADR-EXEC-001`](../../adr/ADR-EXEC-001-governance-authority-hierarchy.md) | Active after PR #1273; replaces the audited six-level hierarchy |
| Owner decisions | [`.governance/owner-decisions.json`](../../../.governance/owner-decisions.json) | Machine-readable active/expiry/revocation register; MAO-001A is complete and the bounded MAO-002 bootstrap is active |
| Root agent governance | [`AGENTS.md`](../../../AGENTS.md) | Repository-wide operating defaults and protected boundaries |
| Brain/domain governance | [`brain/packs/README.md`](../../../brain/packs/README.md) | One Brain, many knowledge packs, many isolated workers |
| Program register | [`PROGRAM_PLAYBOOK_REGISTER.md`](PROGRAM_PLAYBOOK_REGISTER.md) | Active program/Goal/Loop/WO routing |
| Merge authority | [`MERGE_AUTHORITY_MODEL.md`](operator/MERGE_AUTHORITY_MODEL.md) | Canonical Mode A/B/C semantics; MAO-002 Mode B is bounded by the active owner envelope and exact execution record |
| Branch protection | [`.governance/main.protection.json`](../../../.governance/main.protection.json) | Normalized live-protection invariants checked by required governance tooling |
| MAO-001A correction | [`WO-MAO-001A-authority-state-separation.md`](active/WO-MAO-001A-authority-state-separation.md) | Completed with PR #1274; separates owner authority from mutable operator state |
| MAO-002 pilot authority | [`.governance/mao-002-pilot-merge-authority.json`](../../../.governance/mao-002-pilot-merge-authority.json) | Checked-in fail-closed policy; issue #1276 grants the active owner envelope and Codex maintains exact execution state in the paired repository variables |
| MAO program | [`governed-multi-agent-operator-activation.md`](programs/governed-multi-agent-operator-activation.md) | Active program graph; does not create portfolio-wide merge authority |
| Work Order / PR boundary | [`WORKORDER_PR_BOUNDARY.md`](../../branching/WORKORDER_PR_BOUNDARY.md) | One WO per PR; dependency/reservation scheduling replaces global serialization |
| Cortex source discovery | [`BRAIN_AUTHORITY.md`](../BRAIN_AUTHORITY.md) and [`source-priority.json`](../canon/source-priority.json) | Discovery order only; root canon and ADR-EXEC-001 decide authority conflicts |
| Legacy agent model | [`AGENT_OPERATING_MODEL.md`](../../../AGENT_OPERATING_MODEL.md) | Superseded Phase 33A dispatch model; only the no-colliding-builders invariant remains active |

## Evidence, Not Authority

[`WO-MAO-000-proof.md`](../evidence/WO-MAO-000-proof.md) is immutable audit evidence for the MAO-001
amendments. It proves why the amendments exist but does not grant authority.

## Unavailable Canon

`PATH_CANON_REGISTER.md` does not exist on the MAO-001 base. Cross-repository dispatch therefore
remains blocked. The in-repository path map in `brain/packs/README.md` is the only currently indexed
path-routing evidence.
