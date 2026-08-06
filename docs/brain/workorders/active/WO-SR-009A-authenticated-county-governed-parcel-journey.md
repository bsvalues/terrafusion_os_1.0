# WO-SR-009A - Authenticated County-Governed Parcel Journey

## Status

`COMPLETE` under `OWNER-SR-009A-R3-AUTHENTICATED-PARCEL-JOURNEY-20260805`; authority completed and
consumed by terminal closeout.

## Objective

Prove one authenticated, synthetic, county-authorized parcel journey through the sovereign API and
canonical Property Workbench while repairing parcel-enrichment county isolation.

## Authority

- Base: `f71cdffb66305c4af1abb5193586aa60818e3969`.
- Decision packet: Issue #1413, corrected to county-scope CAMA and fail closed on GIS where county
  ownership cannot be proven.
- Risk: bounded R3 local implementation and synthetic proof.
- Merge mode: bounded Mode B with required checks, zero substantive threads, and exact-head
  assurance.

## Implementation sequence

1. Filter `CamaCharacteristics` by authenticated `countyId` and parcel identifier.
2. Remove the legacy parcel-only GIS legal-description fallback because `GisParcelGeometry` does
   not carry county identity.
3. Prove authentication, permission, county mismatch, unknown parcel, duplicate parcel identifier,
   county-scoped CAMA, and fail-closed GIS behavior with focused tests.
4. Run the Workbench journey against a disposable local SQLite database and Development-only
   ephemeral token.
5. Verify Summary, Forge, Atlas, Dais, Dossier, and Pilot settle honestly without changing the
   default-disabled Forge response posture.
6. Merge, verify main, consume authority, and return to portfolio reconciliation.

## Completion

PR #1415 merged exact assured head `0423615c82840978673916831de788f61766c1b7` as
`b934cf0c02ab7e6b5eb20e122f290e9adb665f83`. All required checks passed, five substantive review
threads were resolved, and post-merge verification confirmed the implementation and evidence on
`origin/main`. The synthetic SQLite database was removed after the browser proof.

Routing returns to portfolio reconciliation. This completion grants no live-data, suite-adoption,
deployment, production, or cutover authority.

## No-touch boundaries

No live county data, PACS, county SQL, existing county database, schema, migration, permission
policy, frontend product source, workflow, deployment, production, secret, credential, suite
repository, package, lockfile, or suite-adoption change is authorized.

## Terminal condition

`AUTHENTICATED_COUNTY_GOVERNED_SYNTHETIC_PARCEL_JOURNEY_PROVEN_NO_LIVE_DATA_OR_CUTOVER`

`PASS`
