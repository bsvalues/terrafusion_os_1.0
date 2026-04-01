# PACS Server-Benton

Local workspace to emulate the legacy Benton County PACS SQL environment.

## Quickstart

1. Start MSSQL:
   ```bash
   cd pacs-server-benton/infra/docker
   docker compose -f compose.mssql.yml up -d
   ```
2. Publish databases (requires dotnet SDK + SqlPackage):
   ```powershell
   pwsh ../../scripts/publish.ps1 -SqlServer "localhost,1433" -SaPassword "TF_Pacs2026!"
   ```

Databases created: `pacs_oltp`, `PACS_Training`, `TA_AppSvr`, `CIAPS`, `Web_Internet_Benton`, `SSISDB`.

## Notes
- SQL projects are built from existing `DatabaseProject*` directories in the repo.
- `pacs_oltp` is the production database; `PACS_Training` is an identical training/backup clone.
- Adjust SA password via env var `SA_PASSWORD` for compose and script.
- Extend init SQL and publish order as needed for cross-db synonyms and security.

