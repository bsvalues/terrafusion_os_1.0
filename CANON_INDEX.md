# TerraFusion Canon Index

This index identifies controlling governance documents. A file becomes controlling only through its
ratified authority and membership here; an authoritative title alone does not grant authority.

## Authority Order

Conflict order is defined by
[`ADR-EXEC-001`](docs/adr/ADR-EXEC-001-governance-authority-hierarchy.md) and summarized in root
[`AGENTS.md`](AGENTS.md): Constitution, ratified owner decisions, canonical Brain/root governance,
active program/Work Order authority, directory-local restrictions, active playbooks/runbooks,
implementation patterns, then agent judgment.

## Controlling Documents

| Surface | Canonical document | Status and boundary |
|---------|--------------------|---------------------|
| Constitution | [`TERRAFUSION_SUITE_CONSTITUTION_v1.md`](docs/architecture/TERRAFUSION_SUITE_CONSTITUTION_v1.md) | Highest authority; TF-052 |
| Governance precedence | [`ADR-EXEC-001`](docs/adr/ADR-EXEC-001-governance-authority-hierarchy.md) | Pending activation with PR #1273; replaces the audited six-level hierarchy |
| Owner decisions | [`.governance/owner-decisions.json`](.governance/owner-decisions.json) | Machine-readable active/expiry/revocation register; MAO-001 entry is exact and bounded |
| Root agent governance | [`AGENTS.md`](AGENTS.md) | Repository-wide operating defaults and protected boundaries |
| Brain/domain governance | [`brain/packs/README.md`](brain/packs/README.md) | One Brain, many knowledge packs, many isolated workers |
| Program register | [`PROGRAM_PLAYBOOK_REGISTER.md`](docs/brain/workorders/PROGRAM_PLAYBOOK_REGISTER.md) | Active program/Goal/Loop/WO routing |
| Merge authority | [`MERGE_AUTHORITY_MODEL.md`](docs/brain/workorders/operator/MERGE_AUTHORITY_MODEL.md) | Canonical Mode A/B/C semantics; operator merge inactive until an exact grant activates |
| Branch protection | [`.governance/main.protection.json`](.governance/main.protection.json) | Normalized live-protection invariants checked by required governance tooling |
| MAO-002 pilot authority | [`.governance/mao-002-pilot-merge-authority.json`](.governance/mao-002-pilot-merge-authority.json) | Machine interlock record; `inactive` in MAO-001 |
| MAO program | [`governed-multi-agent-operator-activation.md`](docs/brain/workorders/programs/governed-multi-agent-operator-activation.md) | Active program graph; does not create portfolio-wide merge authority |

## Evidence, Not Authority

[`WO-MAO-000-proof.md`](docs/brain/evidence/WO-MAO-000-proof.md) is immutable audit evidence for the
MAO-001 amendments. It proves why the amendments exist but does not grant authority.

## Unavailable Canon

`PATH_CANON_REGISTER.md` does not exist on the MAO-001 base. Cross-repository dispatch therefore
remains blocked. The in-repository path map in `brain/packs/README.md` is the only currently indexed
path-routing evidence.
