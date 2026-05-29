# June 10 Data Dev Server Plan

Generated: 2026-05-29T19:01:14.663Z

## Verdict

- Decision: READY_TO_PROVISION_DATA_DEV
- Data-dev binding allowed: yes
- Production binding allowed: no
- Sync DB mutation allowed: no
- Runtime role: 39-county canonical Postgres proving ground
- Public URL: https://dev39.terrafusionmarket.com
- APP_ROOT: /opt/terrafusion/june10-data-dev

## Database Boundary

- Provider: Postgres
- Database: terrafusion_j10_data_dev
- Host label: j10-data-dev-postgres
- Connection string: ConnectionStrings__DefaultConnection
- Source: vps-local app.env
- Restore mode: logical_snapshot_restore
- Restore source: canonical 39-county Postgres snapshot/export
- Shares database with Sync: no
- Shares database with production: no
- SQLite fallback: no

## Blockers

- none

## Warnings

- DNS is not verified yet for the data-dev hostname.
- Canonical Postgres snapshot has not been restored to data-dev yet.
- Live data-dev API smoke has not been verified yet.

## Required Truth Gates

- GET /health
- GET /api/runtime/truth/db-identity
- GET /api/runtime/truth/db-content
- GET /api/counties/benton/parcels
- GET /api/counties/king/parcels
- GET /api/counties/spokane/parcels
- pnpm run truth:runtime-db-identity
- pnpm run truth:runtime-db-content
- pnpm run truth:county-runtime-registration-ledger
- pnpm run truth:benton-parcel-count-sanity
- pnpm run truth:june10-wa-initial-seed-receipt-reconciliation
- pnpm run truth:runtime-row-path-proof
- pnpm run truth:june10-readiness-packet

## Next Actions

- Create DNS A record for dev39.terrafusionmarket.com or june10-dev.terrafusionmarket.com.
- Provision a separate Postgres database named terrafusion_j10_data_dev.
- Restore a logical snapshot/export of the canonical 39-county DB into the data-dev database.
- Deploy API/frontend with DatabaseProvider=Postgres and app.env-bound ConnectionStrings__DefaultConnection.
- Run all required truth gates against the data-dev hostname.
- Keep terrafusionmarket.com production binding blocked until data-dev truth gates pass.

## Forbidden Actions

- Do not use terrafusion-postgres-dev.
- Do not attach the app runtime directly to the active Sync database.
- Do not use SQLite fallback.
- Do not mutate production data.
- Do not call this production.
- Do not claim 39-county production certification from this plan alone.
