# June 10 Benton UAT Screenshot Evidence Checklist

Date: 2026-05-13
Mode: wait-state UAT prep while TerraFusion Sync owns the DB lane
Scope: evidence checklist only; no browser UAT is authorized until runtime truth gates are stable

## Purpose

This checklist defines the screenshot and evidence packet needed for an honest Benton County June 10 runtime pilot review. It is not a substitute for runtime proof. It is the capture plan to run after TerraFusion DB identity, content, parcel sanity, sales lineage, and Benton pilot closure gates are green or explicitly red with blockers.

## Preconditions

Do not start browser UAT until these commands have been run after the DB drain:

```powershell
pnpm run truth:runtime-db-identity
pnpm run truth:runtime-db-content
pnpm run truth:benton-parcel-count-sanity
pnpm run truth:runtime-source-lineage
pnpm run truth:runtime-sale-qualification
pnpm run truth:benton-runtime-pilot-closure
pnpm run truth:june10-readiness-packet
```

Minimum runtime health probes before screenshots:

```powershell
$base = "http://localhost:5046"
Invoke-WebRequest -Uri "$base/health" -UseBasicParsing -TimeoutSec 10
Invoke-WebRequest -Uri "$base/healthz/ready" -UseBasicParsing -TimeoutSec 10
```

If either probe fails, stop and classify the issue before opening the UI.

## Evidence Folder Convention

Use one timestamped folder per UAT run:

```text
evidence/june10-uat/YYYY-MM-DD-HHMM/
```

Recommended files:

```text
00-readiness-packet.json
00-readiness-packet.md
01-runtime-db-identity.png
02-runtime-db-content.png
03-county-studio-load.png
04-county-health.png
05-critical-drill.png
06-segment-inspector.png
07-manual-cohort.png
08-scenario-preview.png
09-scenario-compare.png
10-approval-posture.png
11-downstream-route.png
12-downstream-return.png
13-apply-handoff.png
14-property-workbench-context.png
15-defense-packet-export.png
16-no-39-county-runtime-claim.png
```

Do not commit screenshots automatically. Commit only when the run is accepted as a formal evidence packet.

## UAT Capture Matrix

| Step | Surface | Required evidence | Pass condition | Failure classification |
|---|---|---|---|---|
| 1 | Runtime truth endpoint | DB identity/content proof visible or artifact rendered | API is using the expected TerraFusion DB and content proof is current | `SHIP_BLOCKER` |
| 2 | County Studio load | Benton study loaded in OS shell | Study opens without mock/demo fallback | `SHIP_BLOCKER` |
| 3 | County health | Health summary visible | Metrics render from runtime truth or show explicit blocker | `SHIP_BLOCKER` |
| 4 | Critical drill | Critical segment drill selected | Queue/map/context are scoped to the selected failing set | `UAT_CRITICAL` |
| 5 | Segment inspector | Segment detail/action context visible | Segment metadata and next actions are present | `UAT_CRITICAL` |
| 6 | Manual parcel cohort | Manual parcel-list cohort created | Pasted IDs normalize, dedupe, count, and persist through governed payload | `UAT_CRITICAL` |
| 7 | Scenario preview | Preview rendered for selected cohort/segment | Scenario does not imply official mutation | `UAT_CRITICAL` |
| 8 | Scenario compare | Compare view rendered | Delta, affected set, and approval posture are visible | `UAT_CRITICAL` |
| 9 | Approval posture | Approval state transition visible | State is durable and reloadable | `SHIP_BLOCKER` |
| 10 | Downstream route | Dais/Dossier handoff prepared | Durable receipt exists before downstream open | `SHIP_BLOCKER` |
| 11 | Downstream return | Return detail visible | Artifact/evidence identifiers are displayed | `SHIP_BLOCKER` |
| 12 | Apply handoff | Apply handoff receipt/status visible | No applied state appears without backend evidence | `SHIP_BLOCKER` |
| 13 | Property Workbench | Workbench opened from County Studio context | Segment/receipt context survives into Workbench | `UAT_CRITICAL` |
| 14 | Defense packet | Evidence packet exported or rendered | Packet contains defensible source/context detail | `SHIP_BLOCKER` |
| 15 | Claim boundary | 39-county runtime claim absent | UI/readiness says Benton runtime pilot and 39-county provenance inventory only | `GOVERNANCE_CRITICAL` |

## Screenshots That Must Not Be Accepted

Reject the UAT evidence packet if screenshots show:

- demo/sample/stub language in an active June 10 workflow;
- "coming soon" on the primary Benton pilot path;
- 39-county full runtime readiness claims;
- CostForge official/certified claims without proof;
- direct legacy/source-system labels in product runtime screens;
- a downstream route that opens without durable receipt proof;
- parcel counts shown as trusted when sanity gates are red;
- screenshots taken before runtime truth artifacts are regenerated.

## Operator Notes To Record During UAT

For each failure, record:

- URL;
- browser viewport size;
- user action;
- visible error text;
- correlation ID, if present;
- network status code, if visible;
- related proof artifact name;
- classification: `SHIP_BLOCKER`, `UAT_CRITICAL`, `NEXT`, `POST_LAUNCH`, or `CUT`.

## Minimum Browser Targets

Known targets to verify after runtime gates pass:

```text
http://localhost:5173/forge/county-studio
http://localhost:5046/health
http://localhost:5046/healthz/ready
http://localhost:5046/api/runtime/truth/db-identity
http://localhost:5046/api/runtime/truth/db-content
http://localhost:5046/api/counties/benton/parcels?limit=5
http://localhost:5046/api/counties/benton/runtime-lineage
```

If the frontend is hosted on a different port after restart, record the actual URL in the evidence packet.

## UAT Exit Rule

The Benton UAT packet is accepted only when:

- all runtime truth gates have current artifacts;
- screenshots cover each pass-critical step above;
- every failure is classified;
- no 39-county runtime claim appears;
- no product runtime surface depends on upstream/source systems;
- the final readiness packet agrees with what the screenshots show.

If any of those fail, the UAT packet is an ATTEMPT, not a verification packet.
