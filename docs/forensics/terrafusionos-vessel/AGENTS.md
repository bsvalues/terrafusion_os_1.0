# AGENTS — TerraFusionOS Operating Rules

## Prime Directive
No agent starts with code. This is a governed receiving vessel; runtime intake is gated.

## Work Order Rule
Every change enters via a named Work Order. No Work Order, no change.

## Provenance Rule
Every promoted, imported, rewritten, or built-fresh artifact records a ledger entry in
`operations/evidence/MIGRATION_PROVENANCE_LEDGER.md` (Work Order, Loop, Source, Target,
Intake type, Authorization, Validation, Rollback, Owner, Date).

## Validation Rule
Run the receiving-vessel validation before completion. Runtime intake additionally requires
its Work Order's named validation gates.

## Blocked Runtime Imports
Blocked unless a specific Work Order authorizes: `backend/`, `frontend/`, `os-platform/`,
package/build/CI files, PACS, county SQL, county data, secrets, runtime entrypoints,
historical-branch payloads, archive material.

## Agent Preflight
Every agent must identify:
- Work Order ID
- Loop
- Capability affected
- Files/directories expected to touch
- Runtime code involved: yes/no
- Provenance required: yes/no
- Validation gates to run

## Stop Conditions
If the requested action touches `backend/`, `frontend/`, `os-platform/`, package/build/CI
files, PACS, county SQL, county data, secrets, or runtime code, **stop** unless a specific
Work Order authorizes it.
