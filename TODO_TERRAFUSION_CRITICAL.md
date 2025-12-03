# TerraFusion Critical TODOs (High Priority)

## Security & Authentication
- [ ] Implement lockout tracking and failed-attempt logging/clearing in `backend/TerraFusion.Security/ProductionAuthenticationService.cs`.
- [ ] Implement roles/permissions resolution from data store in `ProductionAuthenticationService`.
- [ ] Implement token revocation checks and revoke flows in `ProductionAuthenticationService`.
- [ ] Implement password history/common-password checks in `ProductionAuthenticationService`.
- [ ] Implement LDAP auto-provisioning in `ProductionAuthenticationService`.

## Audit Integrity
- [ ] Implement dynamic WHERE clause building in `backend/TerraFusion.Security/ProductionAuditService.cs::BuildWhereClause`.
- [ ] Implement archive write/storage and hashing in `ProductionAuditService` (replace current stubbed return values).
- [ ] Implement SIEM/fallback logging and security alert triggers in `ProductionAuditService`.

## Operational Services
- [ ] Wire real implementations (or guard mocks behind feature flags) for health monitoring/self-healing/performance services in `backend/TerraFusion.Operations`.
- [ ] Register real services/health checks in `backend/TerraFusion.Operations/Configuration/DependencyInjection.cs`.

## Service Registry
- [ ] Implement secure Government OS client/communication in `applications/terra-proplus-production/server/elite-service-registry.ts`.
- [ ] Harden health checks (auth/backoff) in `elite-service-registry.ts`.

## Workspace Mapping
- [ ] Add all `terra-*` workspaces to backend mapping (see `WORKSPACE_ARCHITECTURE_CURRENT_SESSION.md`).
- [ ] Rebuild backend container and update FileExplorer to use the selector for new workspaces.
