# Codex Autonomous Continuation Rules


> **WO-MAO-001 audit basis:** `docs/brain/evidence/WO-MAO-000-proof.md`
Work order: WO-CODEX-OP-004
Program: codex-operator-playbook

## Allowed Continuation

Codex may continue without asking the owner when all conditions are true:

- the next Work Order is in the same program,
- the next Work Order is in the same goal,
- the next Work Order is in the same loop,
- dependency state is clear,
- risk class, systems, files, and actions are inside the active recorded authority,
- file scope is already defined,
- validation passed or failures are repairable in scope,
- review comments are fixable within authorized files,
- PR branch updates are routine updates from `origin/main`,
- no local hook bypass is needed,
- no protected resource is implicated.

## Examples Of Routine Continuation

- docs/governance-only next Work Order in a defined chain,
- evidence rollup after prerequisite evidence PRs merge,
- review fix in the same evidence file,
- branch update from latest `origin/main`,
- rerun of failed check after an in-scope documentation correction,
- post-merge verification before proceeding to the next Work Order.

## Must Stop

Codex must stop when the next action would require:

- runtime expansion,
- new files outside the authorized set,
- destructive git or filesystem operations,
- hook bypass without an active bounded exception,
- force push,
- no standing or bounded merge authority applies under the canonical merge model,
- production, county, PACS, SQL, live DB, or secrets access,
- ambiguous or conflicting canon,
- CI/release/deployment wiring,
- schema or migration changes,
- product or architecture decision not already answered by the active authority record.

STOP_TYPE: AUTONOMOUS_CONTINUATION_RULES_DEFINED
