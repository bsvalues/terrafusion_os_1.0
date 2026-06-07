# June 10 Launch Scope Freeze

## Decision

June 10 launch freeze is active.

TerraFusion is not using June 10 to claim full platform completion, full Washington production readiness, or statewide certification. June 10 is a controlled launch posture for the Washington county operating model with Benton as the first runtime-proven county.

## Launch Posture

TerraFusion launches the Washington county operating model:

- Each county is represented as a sovereign jurisdictional workspace.
- Benton County is the first runtime-proven county.
- Other Washington counties are onboarding, provenance, and intake workspaces until county-specific TerraFusion DB/API runtime proof exists.
- Runtime truth is TerraFusion DB -> TerraFusion API -> TerraFusion apps.
- Source truth is PACS / Proval / Ascend / ArcGIS / public sources -> constrained ingestion / validation -> TerraFusion DB.

## Locked Scope

Allowed before June 10:

- Demo-path blocker fixes.
- Evidence refresh.
- Launch packet corrections.
- Screenshot proof capture.
- Assessor acceptance documentation.
- Truthful labels for preview, onboarding, provenance, unavailable, and not runtime enabled surfaces.

Not allowed before June 10:

- Broad backend cleanup.
- New suite/module work.
- CMA implementation sprint.
- AI valuation product claims.
- PACS write-back.
- TerraFusion Sync productization.
- County replication work.
- Production DB mutation.
- Frontend redesign.
- Unscoped package script churn.

## Committed Anchors

- `4a53776e2` - J10-INTAKE: County Data Intake is governed onboarding only; `canonicalImportAllowed: false`.
- `444d3dd16` - J10-SOV: all 39 Washington counties represented; Benton is the only runtime pilot; non-Benton runtime actions blocked until DB/API proof exists.

## Runtime Boundary

Benton County data may be PACS-derived, but PACS is provenance only in the June 10 story. PACS is not the Hostinger runtime dependency and not the product story.

The runtime claim is:

```text
TerraFusion DB -> TerraFusion API -> TerraFusion apps
```

## Production Boundary

June 10 does not authorize:

- Production readiness claims.
- Full statewide certification claims.
- Claims that all 39 counties are live.
- Claims that Hostinger is connected to PACS.
- Claims that TerraFusion Sync is fully productized.
- Claims that AI valuations are official.

