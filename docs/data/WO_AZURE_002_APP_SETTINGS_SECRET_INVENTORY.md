# WO-AZURE-002 - Benton Demo App Settings and Secret Inventory

**Program:** P8 - Azure / DevOps / County Runtime

**Base:** `09f3cb847a503f23b9e64f479c09b9d53cdd04aa`

**Mode:** R1 committed-evidence inventory only

**Status:** COMPLETE WITH PROTECTED REMEDIATION GAPS

**Boundary:** No Azure query, secret access, resource or configuration mutation, deployment,
database connection, schema change, PACS access, or county-production action was performed.

## Result

The Benton demo configuration surface is inventory-complete at the key-name level supported by
committed deployment evidence. The current demo used App Service settings for runtime configuration
and three secret-bearing application values. Later evidence added the same-origin UI path setting.
The required release SHA setting is documented but not proven configured.

The inventory does not establish release readiness for secret management. Committed evidence still
records a database connection string bundled in a deployment-local configuration artifact, while
managed identity, Key Vault references, least-privilege application identity, and rotation proof are
absent. Those are protected remediation items, not permissions granted by this work order.

## Evidence States

| State | Meaning |
|---|---|
| EVIDENCED | Committed deployment evidence records the key as configured without disclosing a value |
| EVIDENCED-WITH-GAP | The key is recorded, but its current storage or provenance has a material gap |
| REQUIRED-NOT-PROVEN | The key is required by committed preflight or runtime evidence but configuration is not proven |
| OPTIONAL-DEFERRED | The key or family is intentionally omitted or deferred for the Benton demo |
| PROTECTED | Any value, live verification, or remediation crosses a separate authority boundary |

## Required Configuration Inventory

No values are reproduced below.

| Key | Purpose | Source class | Current storage evidence | Accountable owner | State |
|---|---|---|---|---|---|
| `ASPNETCORE_ENVIRONMENT` | Select the county/runtime configuration profile | Deployment environment classification | App Service application setting | TerraFusion release operator | EVIDENCED |
| `ASPNETCORE_URLS` | Bind the API listener | Runtime hosting contract | App Service application setting | TerraFusion Azure operator | EVIDENCED |
| `WEBSITES_PORT` | Map the App Service listener port | Azure hosting contract | App Service application setting | TerraFusion Azure operator | EVIDENCED |
| `TZ` | Set runtime timezone behavior | Deployment environment classification | App Service application setting | TerraFusion release operator | EVIDENCED |
| `TF_GIT_SHA` | Bind health evidence to the deployed source revision | Release/build provenance | App setting or build-time environment input is required; current configuration is not proven | TerraFusion release operator | REQUIRED-NOT-PROVEN |
| `TERRAFUSION_UI_DIST_PATH` | Locate the same-origin os-shell static artifact | Deployment artifact path | App Service application setting added by committed MGMT-005 evidence | TerraFusion Azure operator | EVIDENCED |
| `ConnectionStrings__DefaultConnection` | Connect the API to the Benton demo PostgreSQL database | Protected database connection issued by the data platform | App Service application setting plus a deployment-local artifact copy recorded by 003C | TerraFusion data-platform operator; county-production owner not established | EVIDENCED-WITH-GAP |
| `JwtSettings__SecretKey` | Sign and validate API JWTs | Protected application signing material | Undisclosed App Service application setting | TerraFusion security operator; county-production owner not established | EVIDENCED |
| `JwtSettings__Issuer` | Define accepted token issuer | Application security contract | App Service application setting | TerraFusion security operator | EVIDENCED |
| `JwtSettings__Audience` | Define accepted token audience | Application security contract | App Service application setting | TerraFusion security operator | EVIDENCED |
| `JwtSettings__ExpirationMinutes` | Define token lifetime | Application security policy | App Service application setting | TerraFusion security operator | EVIDENCED |
| `County__Name` | Identify the demo county profile | Committed Benton configuration canon | App Service application setting | Benton demo configuration owner; county-production owner not established | EVIDENCED |
| `County__State` | Identify the demo jurisdiction | Committed Benton configuration canon | App Service application setting | Benton demo configuration owner; county-production owner not established | EVIDENCED |
| `County__Code` | Identify the county code | Committed Benton configuration canon | App Service application setting | Benton demo configuration owner; county-production owner not established | EVIDENCED |
| `County__PropertyCount` | Bind configured county-size truth | Committed Benton data-quality evidence | App Service application setting | Benton demo data-quality owner | EVIDENCED |
| `RuntimeTruth__ExpectedBentonParcelCount` | Validate runtime parcel-count truth | Committed Benton data-quality evidence | App Service application setting | Benton demo data-quality owner | EVIDENCED |
| `RuntimeTruth__ExpectedJune10Database` | Validate expected database identity | Committed deployment/configuration evidence | App Service application setting | TerraFusion data-platform operator | EVIDENCED |
| `RuntimeTruth__ExpectedJune10Provider` | Validate expected database provider | Committed deployment/configuration evidence | App Service application setting | TerraFusion data-platform operator | EVIDENCED |
| `Workbench__Evidence__HmacKey` | Sign Workbench evidence artifacts | Protected evidence-signing material | Undisclosed App Service application setting | TerraFusion security/evidence operator; county-production owner not established | EVIDENCED |
| `Workbench__Evidence__KeyId` | Identify the active evidence-signing key | Evidence-signing metadata | App Service application setting | TerraFusion security/evidence operator | EVIDENCED |
| `Security__RequireHttps` | Enforce HTTPS behavior | Application security policy | App Service application setting | TerraFusion security operator | EVIDENCED |
| `Security__EnableRateLimiting` | Enable request-rate controls | Application security policy | App Service application setting | TerraFusion security operator | EVIDENCED |
| `Security__MaxRequestsPerMinute` | Set the request-rate policy threshold | Application security policy | App Service application setting | TerraFusion security operator | EVIDENCED |
| `AllowedOrigins__0` | Permit the selected browser origin | Deployment-specific CORS policy | App Service application setting | TerraFusion security and release operators | EVIDENCED |

## Secret-Bearing Register

The recommended secret aliases below come from committed preflight evidence. They are naming
recommendations, not proof that Key Vault objects exist.

| Application key or protected credential | Recommended secret alias | Current evidence | Intended protected posture | Owner | Disposition |
|---|---|---|---|---|---|
| `ConnectionStrings__DefaultConnection` database password component | `TerraFusion-DB-Password` | App setting is recorded; 003C also records a full connection string in a deployment-local artifact | Key Vault reference through managed identity; least-privilege application database principal; no artifact copy | TerraFusion data-platform operator until a county-production boundary is ratified | HOLD - storage repair and rotation proof absent |
| `JwtSettings__SecretKey` | `TerraFusion-JWT-SecretKey` | Undisclosed App Service setting | Key Vault reference through managed identity with documented rotation and revocation | TerraFusion security operator | HOLD - Key Vault and rotation proof absent |
| `Workbench__Evidence__HmacKey` | `TerraFusion-Workbench-HmacKey` | Undisclosed App Service setting | Key Vault reference through managed identity with key-ID and rotation evidence | TerraFusion security/evidence operator | HOLD - Key Vault and rotation proof absent |
| Azure PostgreSQL administrative credential | Not an application-setting secret | Separate administrative credential is described by preflight evidence | Retain outside application configuration; application must use a distinct least-privilege principal | TerraFusion Azure database operator | PROTECTED - no value or live verification authorized |

## Optional, Deferred, and Excluded Configuration

| Key or family | Benton demo posture | Owner | Reason |
|---|---|---|---|
| `ConnectionStrings__PacsConnection` | Omitted or disabled | Future county integration owner | PACS is outside the demo read path and remains a protected county boundary |
| `Cache__Redis__ConnectionString` | Omitted | TerraFusion platform operator | No Redis deployment is evidenced; degraded/no-op cache posture is accepted for the demo |
| `AzureKeyVault__Enabled` | Source configuration flag exists, but enabled state and integration are not proven | TerraFusion security and Azure operators | Managed identity and Key Vault evidence are absent |
| `AuditLogging__LogToDatabase` | Deferred/defaulted | TerraFusion application operator | Initial demo evidence intentionally avoided an unproven database audit target |
| `Muse__*` | Omitted for the demo | TerraFusion AI platform owner | AI model routing is not required for this bounded deployment |
| `Security__JwtSecret` and `Security__EncryptionKey` | Legacy county-config names; not accepted as proof of active API signing material | TerraFusion security operator | Committed preflight identifies `JwtSettings__SecretKey` as the active API signer |

## Storage And Identity Verdict

| Question | Evidence-backed answer |
|---|---|
| Is managed identity enabled? | Not proven |
| Are Key Vault references configured? | Not proven |
| Are secret-bearing settings absent from Git? | Values are not committed in the reviewed evidence, but 003C records a connection string in a deployment-local publish artifact |
| Is the application database principal distinct from an administrator? | Not proven |
| Has secret rotation or revocation been rehearsed? | Not proven |
| Is future county-production secret ownership established? | No; WO-AZURE-006 remains the explicit county-production authority packet |

## Required Protected Follow-Ups

These gaps are documented but not authorized for implementation:

1. Remove the deployment-local connection-string copy by correcting configuration precedence.
2. Rotate the affected database credential after storage repair.
3. Establish managed identity and minimum required Key Vault access.
4. Replace direct secret-bearing App Service values with Key Vault references.
5. Prove a least-privilege application database principal distinct from administration.
6. Define and rehearse rotation and revocation for database, JWT, and Workbench signing material.

Each item requires a separately bounded security/runtime/Azure Work Order. Nothing here authorizes a
live query, value read, resource change, redeployment, restart, or secret operation.

## Evidence Sources

- `docs/data/WO_DEPLOY_BENTON_003B_APP_SERVICE_PREFLIGHT.md` - required key names, recommended secret
  aliases, and intended Key Vault posture; merged in PR #1119.
- `docs/data/WO_DEPLOY_BENTON_003C_APP_SERVICE_DEPLOYMENT.md` - configured key names, App Service
  storage evidence, and the deployment-local connection-string gap; merged in PR #1121.
- `docs/data/WO_P8_MGMT_005_AZURE_FRONTEND_REACHABILITY_DEPLOYMENT.md` - later same-origin UI path
  setting; merged in PR #1157.
- `docs/data/WO_AZURE_001_APP_SERVICE_PREFLIGHT.md` - current-state reconciliation and protected gaps;
  merged in PR #1275.
- `docs/data/WO_CONFIG_BENTON_001_EVIDENCE.md` - county count and runtime-truth provenance.
- `docs/data/WO_BACKEND_008_OPERATIONAL_RUNBOOK.md` - missing release-SHA evidence in the observed
  runtime posture.
- `backend/src/TerraFusion.API/appsettings.json`, `appsettings.BentonCounty.json`, and `Program.cs` -
  committed key-name and configuration-precedence source inspection only; no runtime files changed.

## Completion And Routing

WO-AZURE-002 is complete as a committed-evidence inventory. Configuration names, source classes,
current storage evidence, ownership, and gaps are explicit without reading values or live resources.
The documentation-only lane may proceed to **WO-AZURE-003 - Deployment slot strategy**. WO-AZURE-003
may define policy only; it cannot create, inspect, configure, swap, or deploy a slot.

`STOP_TYPE: AZURE_APP_SETTINGS_SECRET_INVENTORY_COMPLETE`
