# June 10 Data Dev Provisioning Status

Generated: 2026-05-29T19:13:06Z

## Completed

- VPS app root created: `/opt/terrafusion/june10-data-dev`
- Isolated Postgres container created: `terrafusion-j10-data-dev-postgres`
- Isolated database created: `terrafusion_j10_data_dev`
- Database user created: `terrafusion_j10_dev`
- DB identity proof captured: `terrafusion_j10_data_dev|terrafusion_j10_dev`
- Runtime compose template staged under data-dev app root
- App env staged with `DatabaseProvider=Postgres`
- Production binding remains false
- Sync DB sharing remains false
- Production DB sharing remains false

## Blocked

- DNS: `dev39.terrafusionmarket.com` does not resolve yet.
- Restore: no safe canonical 39-county logical snapshot/export has been provided that is separate from the active Sync Postgres DB.
- Runtime: API/frontend not started because restore is blocked.

## Stop Conditions Preserved

- Did not use `terrafusion-postgres-dev`.
- Did not attach runtime to the active Sync DB.
- Did not bind `terrafusionmarket.com`.
- Did not modify production app containers.
- Did not start data-dev API/frontend against an empty DB.

## Next Required Actions

1. Create Hostinger DNS A record: `dev39 -> 72.60.126.11`.
2. Produce or provide a safe canonical 39-county logical Postgres snapshot/export.
3. Restore that snapshot into `terrafusion_j10_data_dev`.
4. Start the data-dev API/frontend stack.
5. Run the dev39 truth gates.
