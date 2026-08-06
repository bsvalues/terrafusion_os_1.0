# WO-SR-009A - Authenticated County-Governed Parcel Journey

## Status

`IN_PROGRESS` under `OWNER-SR-009A-R3-AUTHENTICATED-PARCEL-JOURNEY-20260805`.

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

## No-touch boundaries

No live county data, PACS, county SQL, existing county database, schema, migration, permission
policy, frontend product source, workflow, deployment, production, secret, credential, suite
repository, package, lockfile, or suite-adoption change is authorized.

## Terminal condition

`AUTHENTICATED_COUNTY_GOVERNED_SYNTHETIC_PARCEL_JOURNEY_PROVEN_NO_LIVE_DATA_OR_CUTOVER`
