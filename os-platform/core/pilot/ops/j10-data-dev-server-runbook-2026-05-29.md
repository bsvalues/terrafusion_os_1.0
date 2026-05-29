# June 10 Data Dev Server Runbook

## Purpose

Create a separate June 10 data-dev runtime for proving the 39-county canonical Postgres dataset without touching `terrafusionmarket.com` production and without sharing the active TerraFusion Sync Postgres database.

This environment is not production.

## Target

- Primary hostname: `dev39.terrafusionmarket.com`
- Alternate hostname: `june10-dev.terrafusionmarket.com`
- Environment name: `june10-data-dev`
- APP_ROOT: `/opt/terrafusion/june10-data-dev`
- Runtime role: 39-county canonical Postgres proving ground
- DB provider: `Postgres`
- DB name: `terrafusion_j10_data_dev`
- DB source: logical snapshot/restore from canonical 39-county Postgres export

## Hard Boundaries

- Do not use `terrafusion-postgres-dev`.
- Do not attach the app runtime directly to the active Sync database.
- Do not bind `terrafusionmarket.com` production to this database.
- Do not use SQLite fallback.
- Do not mutate production data.
- Do not call this environment production.
- Do not claim 39-county production certification from this environment alone.

## Provisioning Checklist

- [ ] Create DNS A record for `dev39.terrafusionmarket.com` or `june10-dev.terrafusionmarket.com`.
- [ ] Provision an isolated Postgres target named `terrafusion_j10_data_dev`.
- [ ] Confirm the target DB is separate from the Sync DB and production DB.
- [ ] Produce a logical snapshot/export of the canonical 39-county Postgres dataset.
- [ ] Restore the snapshot into the isolated data-dev Postgres target.
- [ ] Deploy API/frontend stack to `/opt/terrafusion/june10-data-dev`.
- [ ] Set VPS-local non-git `app.env` values:

```text
ASPNETCORE_ENVIRONMENT=Staging
TF_RELEASE_ENVIRONMENT=june10-data-dev
DatabaseProvider=Postgres
ConnectionStrings__DefaultConnection=<data-dev-postgres-connection-string>
```

- [ ] Verify the runtime compose does not override `DatabaseProvider` or `ConnectionStrings__DefaultConnection`.
- [ ] Route the hostname through the shared edge proxy without changing production routing.

## Required Verification

Run these against the data-dev hostname:

```bash
curl -fsS https://dev39.terrafusionmarket.com/health
curl -fsS https://dev39.terrafusionmarket.com/api/runtime/truth/db-identity
curl -fsS https://dev39.terrafusionmarket.com/api/runtime/truth/db-content
curl -fsS https://dev39.terrafusionmarket.com/api/counties/benton/parcels
curl -fsS https://dev39.terrafusionmarket.com/api/counties/king/parcels
curl -fsS https://dev39.terrafusionmarket.com/api/counties/spokane/parcels
```

Run these from the repo with `API_BASE_URL` pointed at data-dev where supported:

```bash
pnpm run truth:june10-data-dev-server-plan
pnpm run truth:runtime-db-identity
pnpm run truth:runtime-db-content
pnpm run truth:county-runtime-registration-ledger
pnpm run truth:benton-parcel-count-sanity
pnpm run truth:june10-wa-initial-seed-receipt-reconciliation
pnpm run truth:runtime-row-path-proof
pnpm run truth:june10-readiness-packet
```

## Stop Conditions

Stop immediately if any of these are true:

- Data-dev resolves to production app root.
- Data-dev uses SQLite.
- Data-dev connection string points at `terrafusion-postgres-dev`.
- Data-dev connection string points at production.
- Runtime truth cannot prove database identity.
- Runtime content gate returns rows from the wrong database.
- Any truth gate requires direct legacy/source-system runtime access.

## Promotion Rule

`terrafusionmarket.com` production binding remains blocked until data-dev passes runtime DB identity, runtime DB content, county registration, receipt reconciliation, row-path proof, and readiness gates against the isolated 39-county Postgres runtime.
