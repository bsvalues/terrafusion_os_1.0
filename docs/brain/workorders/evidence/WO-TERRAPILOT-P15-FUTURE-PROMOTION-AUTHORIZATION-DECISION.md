# WO-TERRAPILOT-P15 — Future Promotion Authorization Decision Packet

## Status

Decision packet only. This work order does not authorize or implement live/backend integration.

## Authorization

Owner authorization for WO-TERRAPILOT-P15 allowed evidence/governance documentation under
`docs/brain/workorders/**` to create the future promotion decision packet and update the
TerraPilot program routing docs. This authorization did not include runtime code, handler behavior,
tool metadata mutation, CI workflow changes, schema/database changes, deployment, secrets, county
data, PACS, SQL, or live DB access.

Authorized file scope:

- `docs/brain/workorders/PROGRAM_PLAYBOOK_REGISTER.md`
- `docs/brain/workorders/evidence/WO-TERRAPILOT-P15-FUTURE-PROMOTION-AUTHORIZATION-DECISION.md`
- `docs/brain/workorders/goal-loop/COMMAND_TO_PROGRAM_MAP.md`
- `docs/brain/workorders/goal-loop/GOAL_COMMANDS.md`
- `docs/brain/workorders/programs/terrapilot-tool-maturity.md`

## Current Truth

`summarize_levy_rate_components` is the current TerraPilot promotion-path candidate.

Current maturity state:

- `state`: `contract-covered`
- `level`: `L2`
- `liveIntegration`: `false`
- Backend integrated: no
- Live: no
- Promoted: no
- Handler behavior changed in this packet: no
- Backend integration implemented in this packet: no

WO-TERRAPILOT-P13 made only the owner-authorized contract-covered metadata change. WO-TERRAPILOT-P14 then recorded the stop gate: contract coverage is evidence of stable contract behavior, not proof of live backend/product integration.

## Owner Decision Choices

The owner has four valid choices after this packet:

1. Hold at L2 / contract-covered.
   - No future live/backend integration work starts.
   - The tool remains contract-covered with `liveIntegration: false`.

2. Authorize a future live-integration design packet only.
   - The next WO may design the required backend/service integration path.
   - No runtime implementation, metadata promotion, or live claim is allowed in the design packet.

3. Authorize a future backend-integrated implementation WO.
   - This requires an explicit new owner authorization and must name the backing service, integration surface, test plan, rollback path, and deployment boundary.
   - The future WO must still stop before production deployment, secrets, county data, PACS, live DB access, or schema migration.

4. Reject the promotion path.
   - The tool remains contract-covered only, or a later owner-authorized metadata rollback packet may move it back to a lower maturity state if the L2 claim becomes misleading.

## Evidence Required Before Any Future Live/Backend Promotion

Any future WO that attempts to move beyond L2 must provide all of the following before metadata can claim backend integration or live operation:

- Backing service name, owner, and source path.
- Integration surface: endpoint, handler, command, or service boundary.
- Authentication and authorization model.
- Test data model using non-secret, non-county, non-PACS fixtures.
- Handler behavior contract and failure behavior.
- UI/operator disclosure behavior showing whether the result is contract-covered, simulated, or live.
- Trace/correlation evidence for request and failure diagnosis.
- County-boundary proof showing no protected county data is accessed without a separately authorized runtime packet.
- Rollback path for metadata, handler behavior, and routing.
- Validation gates that fail if the tool is overclaimed as live/backend-integrated without proof.

## Required Tests For A Future Promotion WO

A future live/backend promotion packet must define and pass focused tests for:

- Tool maturity schema validation.
- `os-platform/core/tests/tool-maturity.test.mjs`.
- `os-platform/core/tests/phase83-tools.test.mjs`.
- Handler contract behavior.
- Failure and disclosure behavior.
- Backing service contract behavior.
- Trace/correlation output.
- No-secret and no-protected-data execution.

The existing core validation remains required:

- `pnpm run type-check`
- `node docs/brain/workorders/tools/wo-query.mjs --json`
- `node --test os-platform/core/tests/tool-maturity.test.mjs`
- `node --test os-platform/core/tests/phase83-tools.test.mjs`

## Stop Gates

The TerraPilot loop must stop for owner authority before any of the following:

- Mutating `tools/registry/tool-maturity.json` beyond the current L2 contract-covered state.
- Setting `liveIntegration: true`.
- Marking the tool backend-integrated, live, or promoted.
- Implementing backend integration.
- Changing handler or runtime behavior.
- Changing CI workflow behavior.
- Applying schema or database migrations.
- Deploying.
- Accessing secrets, credentials, county data, PACS, county SQL, or a live DB.

## Rollback Path

If future evidence shows that the L2 contract-covered state is misleading, the safe rollback is:

1. Open a metadata rollback WO.
2. Revert only the affected `summarize_levy_rate_components` maturity fields.
3. Preserve explicit disclosure that the tool is not live/backend-integrated.
4. Run maturity schema and phase83 validation.
5. Record rollback evidence.

Runtime rollback is intentionally not described here because this packet does not create runtime behavior.

## P15 Decision

P15 does not choose live promotion. It records the owner decision boundary and keeps TerraPilot at a safe stop gate.

Recommended current posture:

- Hold `summarize_levy_rate_components` at L2 / contract-covered.
- Do not start live/backend integration until a separate owner-authorized runtime or design WO exists.
- If future work continues, start with a design-only packet before implementation.

## Next Recommended WO

If owner wants to keep TerraPilot parked:

- No immediate TerraPilot implementation WO. Move to another program lane.

If owner wants to explore live integration later:

- `WO-TERRAPILOT-P16 — Live Integration Design Packet`

P16 must be design-only unless the owner explicitly authorizes runtime implementation.

## Non-Changes

- Runtime code changed: no
- Handler behavior changed: no
- Backend integration changed: no
- Tool marked backend-integrated: no
- Tool marked live: no
- Tool marked promoted: no
- CI workflow changed: no
- Schema/database changed: no
- Deployment changed: no
- Secrets/county/PACS/SQL touched: no
