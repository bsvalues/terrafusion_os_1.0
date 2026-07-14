# WO-AZURE-001 — Azure App Service Current-State Preflight

**Program:** P8 — Azure / DevOps / County Runtime

**Base:** `48b7bc2a97b6222aa5f9901ef3dde6ae1d5067bb`

**Mode:** R1 documentation and evidence reconciliation only

**Status:** COMPLETE — requirements reconciled to existing deployment evidence

**Boundary:** No Azure query, provisioning, configuration change, deployment, secret access, database
connection, schema change, or county-production action was performed.

## Result

The prospective App Service preflight required by WO-AZURE-001 was substantively completed by
`WO-DEPLOY-BENTON-003B`, and the planned target was subsequently provisioned and smoke-verified by
`WO-DEPLOY-BENTON-003C`. This packet records the planned-versus-evidenced posture so the Azure program
does not repeat a completed preflight or falsely claim that no App Service exists.

The existing deployment is a Benton demonstration environment, not a county-production boundary.
Nothing in this packet authorizes a new resource, deployment, public launch, or production promotion.

## Planned Versus Evidenced Posture

| Requirement | Preflight requirement | Current evidence | Disposition |
|---|---|---|---|
| Runtime | Linux App Service running .NET 8 | `app-terrafusion-benton-demo` is recorded as Linux `DOTNETCORE\|8.0` | Satisfied for demo |
| Process | Start `TerraFusion.API` and bind the App Service port | Startup command is `dotnet TerraFusion.API.dll`; `ASPNETCORE_URLS` and `WEBSITES_PORT` are recorded | Satisfied for demo |
| Health | Configure a stable App Service health path | `/health` is configured and returned HTTP 200 in deployment evidence | Satisfied for demo |
| Database | Reach Azure PostgreSQL with SSL and no committed credential | Azure PostgreSQL connectivity and zero pending migrations are recorded; values remain secret | Satisfied for demo; no live re-probe here |
| Network | Permit App Service outbound traffic through PostgreSQL firewall | Deployment evidence records an Azure-services rule | Operational, but broader than least-privilege target |
| Identity | Define managed identity / MSI posture | No managed-identity or Key Vault proof is recorded | Gap; carry to AZURE-002 |
| Slots | Estimate and define non-production slot posture | The current demo uses the App Service directly; no staging-slot proof is recorded | Gap; carry to AZURE-003 |
| Observability | Preserve startup and health evidence | Startup, sovereign-manifest, migration, and health events are recorded in 003C | Baseline only; AZURE-004 remains follow-up |
| Rollback | Identify a recoverable deployment target | Manual ZIP deployment is recorded; executed rollback proof is absent | Gap; AZURE-005 remains follow-up |

## Required App Settings — Key Names Only

The preflight and deployment evidence identify these configuration families. This list intentionally
contains no values:

- `ASPNETCORE_ENVIRONMENT`
- `ASPNETCORE_URLS`
- `WEBSITES_PORT`
- `TZ`
- `TF_GIT_SHA`
- `ConnectionStrings__DefaultConnection`
- `JwtSettings__SecretKey`
- `JwtSettings__Issuer`
- `JwtSettings__Audience`
- `JwtSettings__ExpirationMinutes`
- `County__Name`
- `County__State`
- `County__Code`
- `County__PropertyCount`
- `RuntimeTruth__ExpectedBentonParcelCount`
- `RuntimeTruth__ExpectedJune10Database`
- `RuntimeTruth__ExpectedJune10Provider`
- `Workbench__Evidence__HmacKey`
- `Workbench__Evidence__KeyId`
- `Security__RequireHttps`
- `Security__EnableRateLimiting`
- `Security__MaxRequestsPerMinute`
- `AllowedOrigins__0`
- `TERRAFUSION_UI_DIST_PATH`

Secret-bearing keys must remain in an authorized secret store or protected App Service configuration.
This WO neither reads nor validates their values.

## Identity And Secret-Storage Requirements

The intended end state is a managed identity with Key Vault references and least-privilege database
credentials. Current evidence does not prove that end state. It records JWT and Workbench HMAC values
as undisclosed App Service settings, but it also records that a real PostgreSQL connection string was
bundled into `appsettings.BentonCounty.local.json` in the deployed publish output to work around
configuration-source ordering. The committed evidence does not reveal the value, but embedding a live
connection string in a deployment artifact is a material secret-storage gap.

Current evidence does not prove:

- a system- or user-assigned managed identity is enabled;
- Key Vault access uses RBAC with the minimum required role;
- all secret-bearing settings use Key Vault references;
- the application database principal is distinct from an administrative principal;
- secret rotation and revocation have been rehearsed.

WO-AZURE-002 must inventory this artifact-bundled connection string explicitly and define its protected
replacement. Removing it, correcting configuration precedence, rotating the affected credential, and
redeploying are runtime/security operations that require a separately authorized follow-on Work Order.
This packet is not permission to inspect the artifact, read the value, rotate credentials, or change
the live resource.

## Network And PostgreSQL Requirements

The durable network contract is:

1. App Service outbound addresses must be authorized to reach PostgreSQL on port 5432.
2. PostgreSQL connections must require TLS.
3. Firewall scope should be no broader than the demonstrated runtime needs.
4. PACS, county networks, and county SQL are outside this demo boundary.
5. A future slot must have its own outbound-address and configuration review before traffic.

The recorded `0.0.0.0` Azure-services firewall rule enabled the demo, but it is not evidence of a
least-privilege production posture. Narrowing it is a live infrastructure/security change and requires
its own authorized Work Order.

## Slot Estimate

WO-AZURE-003 must make the slot decision. The current evidence supports this starting estimate:

| Slot | Purpose | Required posture |
|---|---|---|
| Existing app | Benton demo only | Preserve current demo evidence; do not relabel as production |
| Staging slot | Future smoke and rollback target | Slot-sticky secrets, separate health proof, database compatibility check, explicit swap/rollback plan |
| County production | Not established | Requires WO-AZURE-006 and explicit owner authorization |

No slot was created or modified by this packet.

## Evidence And Drift Reconciliation

- `docs/data/WO_DEPLOY_BENTON_003B_APP_SERVICE_PREFLIGHT.md` contains the original runtime, settings,
  firewall, health, build, and stop-wall inventory.
- `docs/data/WO_DEPLOY_BENTON_003C_APP_SERVICE_DEPLOYMENT.md` records the provisioned demo App Service,
  undisclosed JWT/HMAC App Service settings, the artifact-bundled PostgreSQL connection-string gap,
  startup corrections, and successful health smoke.
- `docs/data/WO_P8_MGMT_005_AZURE_FRONTEND_REACHABILITY_DEPLOYMENT.md` records the later same-origin UI
  deployment and the remaining authentication wall.
- `docs/brain/workorders/programs/azure-county-runtime.md` still says no App Service exists. That fact
  predates 003C and is stale; this packet does not silently treat it as runtime truth.

## Completion And Routing

WO-AZURE-001 is complete as a current-state evidence reconciliation. Its prospective checklist is
covered by 003B, and its actual demo posture is bounded by 003C and MGMT-005.

Next program nodes:

1. **WO-AZURE-002:** configuration and secret inventory, names and ownership only unless separate live
   access authority is granted.
2. **WO-AZURE-003:** staging-slot and swap/rollback strategy.
3. **WO-AZURE-004/005:** remain dependent on an authorized live-slot evidence boundary.
4. **WO-AZURE-006:** county-production boundary packet; explicit owner authorization remains mandatory.

`STOP_TYPE: AZURE_APP_SERVICE_PREFLIGHT_RECONCILED`
