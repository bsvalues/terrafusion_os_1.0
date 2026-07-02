# WO-WORKBENCH-010 - Property Workbench Operational Packet

**Date:** 2026-07-02
**Mode:** Property Workbench operational packet / governance evidence
**Scope:** Documentation and evidence only

## Objective

Package the Property Workbench Program 3 lane into an operator-facing packet
that explains what the canonical assessor Workbench is, how to validate its
evidence, what boundaries remain protected, and what rollback or recovery path
is available.

This packet does not authorize release, deployment, production access, runtime
behavior changes, route changes, schema migration, PACS access, county SQL
access, protected-data handling, service connections, Key Vault changes, CI
changes, or branch-protection changes.

## Capability Statement

The Property Workbench is governed by an evidence chain rather than informal
claims:

- `WO-WORKBENCH-001` establishes Workbench reality from source, tests, and
  existing documentation.
- `WO-WORKBENCH-002` records routing and deep-link truth.
- `WO-WORKBENCH-003` classifies tab and tool maturity.
- `WO-WORKBENCH-004` records Forge surface truth.
- `WO-WORKBENCH-005` records Atlas surface truth.
- `WO-WORKBENCH-006` records Dais surface truth.
- `WO-WORKBENCH-007` records Dossier surface truth.
- `WO-WORKBENCH-008` records Pilot integration truth.
- `WO-WORKBENCH-009` records end-to-end parcel flow evidence.
- `WO-WORKBENCH-010` packages those results into this operator packet.

The Program 3 evidence PRs become authoritative when merged. Until then, this
packet is an active-loop operating packet that records the current evidence
shape without overclaiming production readiness or runtime completeness.

## Canon References

| Canon / artifact | Use in this packet |
|------------------|--------------------|
| `AGENTS.md` | Worktree isolation, authority walls, governance surfaces, and branch protection. |
| `brain/packs/README.md` | One-Brain doctrine and domain-pack routing. |
| `brain/packs/shell/README.md` | Workbench shell and routing boundary. |
| `brain/packs/forge/README.md` | Forge valuation-engineering boundary. |
| `brain/packs/atlas/README.md` | Atlas GIS/spatial boundary. |
| `brain/packs/dais/README.md` | Dais assessor-administration boundary. |
| `brain/packs/dossier/README.md` | Dossier records/evidence boundary. |
| `brain/packs/gpt/README.md` | AI/Pilot assistance boundary. |
| `brain/packs/trace/README.md` | Evidence/trace boundary. |
| `docs/brain/workorders/playbooks/PROGRAM_PLAYBOOK_REGISTER.md` | Program map and /goal + /loop model. |
| `docs/brain/workorders/playbooks/program-property-workbench.md` | Property Workbench program chain. |
| `docs/brain/workorders/operator/WORK_ORDER_OPERATOR_DOCTRINE.md` | Operator continuation and stop-gate doctrine. |
| `docs/architecture/TERRAFUSION_SUITE_CONSTITUTION_v1.md` | Suite constitution and authority hierarchy. |

## Sovereignty Boundary

Allowed in this packet:

- Workbench operational evidence,
- route and tab truth statements,
- validation command truth,
- operator playbook instructions,
- rollback and recovery statements,
- promotion criteria, and
- explicit non-authorization language.

Blocked in this packet:

- Workbench runtime code changes,
- route or deep-link behavior changes,
- suite implementation changes,
- tool-risk or trace-policy changes,
- backend, frontend, or OS runtime changes,
- schema or migration changes,
- CI or branch-protection changes,
- registry or automation changes,
- production deployment,
- service connection or Key Vault changes,
- PACS access,
- county SQL access,
- protected county data access, and
- secret handling.

## Canonical Assessor Experience

The canonical Property Workbench experience is parcel-centered. The operator
starts from the Workbench route and follows evidence-backed tabs rather than
launching disconnected suite surfaces.

| Surface | Canonical role in Workbench |
|---------|-----------------------------|
| Summary | Parcel context and assessor-facing orientation. |
| Forge | Valuation-engineering signal surface. |
| Atlas | GIS/spatial and map-context surface. |
| Dais | Assessor workflow and administrative state surface. |
| Dossier | Records, evidence, documents, and packet surface. |
| Pilot | Read-only assistance/Muse surface for Workbench context. |

Pilot inside the Workbench is not the broader operator console. Dossier records
and assembles evidence; it does not initiate Dais workflow. Suite-specific
implementation changes require separate authorized work orders.

## Execution Playbook

When operating the Property Workbench lane, use this sequence:

1. Confirm the Work Order ID and allowed file scope.
2. Confirm the worktree is dedicated, clean, and not the shared checkout.
3. Read the relevant domain pack before touching any suite or evidence surface.
4. Identify whether the Work Order is docs/evidence, test-only, route, runtime,
   schema, CI, deployment, or protected-data scope.
5. Inspect the route, tab, service, test, and evidence surfaces that are inside
   the active Work Order.
6. Record what is proven, partial, missing, blocked, and explicitly not
   authorized.
7. Run the smallest relevant validation before committing.
8. Commit and open a PR.
9. Let PR checks be the authoritative remote gate.
10. Resolve review comments only inside scope.
11. Batch merge-ready PRs for owner merge authorization.
12. Do not deploy, release, alter runtime behavior, apply schema migrations, or
    touch PACS/county data without a separate authorized Work Order.

## Validation Gates

| Gate | Required for | Evidence |
|------|--------------|----------|
| Worktree gate | Every Workbench WO | Dedicated clean worktree and scoped branch. |
| Domain-pack gate | Every Workbench WO | Relevant `brain/packs/**` file read before edits. |
| Scope gate | Every Workbench WO | Changed files match the authorized Work Order. |
| Diff gate | Every changed file | `git diff --check` passes. |
| Workbench compliance gate | Workbench evidence/docs | `node scripts/spec-gates/workbench-compliance.mjs` passes. |
| Query gate | Work Order evidence/docs | `node docs/brain/workorders/tools/wo-query.mjs --json` runs. |
| Focused test gate | Runtime/test changes | Relevant focused tests pass. |
| PR gate | Every PR | Required GitHub checks pass. |
| Owner gate | Merge, release, deployment, protected data | Owner authorization is explicit and separate. |

Docs/evidence-only Workbench WOs do not require broad runtime test execution
unless the Work Order changes runtime, tests, routes, CI, schema, registry,
automation, or deployment behavior.

## Evidence Requirements

Every Property Workbench operational WO should record:

- Work Order ID,
- branch/worktree,
- files inspected,
- files changed,
- suite/domain packs consulted,
- validation commands,
- validation results,
- route/tab/tool maturity classification,
- runtime/code/CI/schema/deployment impact,
- secret/county/PACS/SQL status,
- known gaps,
- rollback path, and
- next recommended WO.

## Operational Owner

Property Workbench operational evidence is owned by the Work Order Operator
until an explicit owner is assigned in a future Workbench program update. Merge
authority, release authority, deployment authority, schema authority, product
behavior authority, and protected-data authority remain owner-controlled
authority walls.

## Rollback Path

For docs/evidence-only Workbench WOs:

1. Revert the PR commit.
2. Re-run `git diff --check` on the revert.
3. Re-run `node scripts/spec-gates/workbench-compliance.mjs`.
4. Re-run `node docs/brain/workorders/tools/wo-query.mjs --json` if the Work
   Order touched Work Order evidence or docs.
5. Confirm no runtime, CI, schema, deployment, secret, county, PACS, or SQL
   surface changed.

For Workbench runtime or test WOs:

1. Revert the PR commit.
2. Re-run the focused tests from the original evidence packet.
3. Re-run the relevant Workbench compliance gate.
4. Do not apply or roll back schema migrations unless a schema-specific Work
   Order authorized that path.

## Promotion Criteria

Property Workbench evidence may be promoted toward implementation or release
consideration only when:

- relevant evidence PRs are merged,
- changed surfaces have focused validation,
- route and tab truth is explicit,
- suite ownership is clear,
- known failures are classified,
- county/PACS/SQL/protected-data status is explicit,
- rollback path is documented,
- PR checks are green, and
- owner merge/release decisions are separate and explicit.

## ADR Impact

No ADR is created by this packet. Future ADR work is required if Workbench
evidence reveals a durable architecture choice, such as a new canonical routing
contract, Workbench-to-suite ownership model, Pilot integration model, or parcel
flow contract that supersedes existing canon.

## Runbook Impact

This packet is a Property Workbench operational runbook seed. It establishes the
operator steps and evidence expectations but does not replace suite-specific
runbooks, endpoint-specific runbooks, production incident playbooks, or county
deployment playbooks.

## Known Limitations

- Program 3 evidence PRs may still be open when this packet is created. Their
  evidence becomes authoritative only when merged.
- No live browser-authenticated parcel session is proven by this packet.
- No live backend, PACS, county SQL, protected county data, or production system
  is accessed by this packet.
- Clerk, Treasury, and Audit tabs remain outside the primary maturity chain
  unless a future Workbench Work Order explicitly expands scope.
- `docs/brain/workorders/tools/wo-query.mjs --json` may report stale or
  unrelated next-WO recommendations relative to the active Program 3 loop.

## Done Definition

This packet is complete when:

- it exists under the Work Order evidence path,
- it links the Property Workbench evidence chain,
- it defines execution, validation, rollback, owner, and promotion
  expectations,
- validation passes, and
- no runtime, CI, schema, registry, automation, deployment, secret, county data,
  PACS, or SQL changes are included.

## Next Recommended WO

Proceed to `WO-WORKBENCH-011 - Evidence Rollup` after this packet is published.
