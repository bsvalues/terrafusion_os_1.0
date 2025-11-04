## Security, Governance & Compliance — TerraFusion Elite

Scope
- Provide explicit guardrails and enforcement patterns for county isolation, audit logging, RBAC, secrets, and safe AI-swarm operations.

Core principles (non-negotiable)
- Never allow unapproved cross-county data access.
- Every production-change action must be auditable and traceable to user, time, and PR/approval artifact.
- AI-swarm changes require explicit safety plan and `AI-SWARM` review label.

Key controls
- County isolation: middleware enforces `countyId` on requests. Any service-layer call touching persistent data must include county context and fail if missing.
- Audit interceptor: `AuditableEntityInterceptor` in EF Core must run on SaveChanges and populate CreatedAt/UpdatedAt/CreatedBy/UpdatedBy. Add unit tests to validate behavior.
- RBAC / Roles: implement at least these roles: Researcher (sandbox only), Analyst (dev), Operator (canary), Admin (full). Map actions to roles and enforce via policies (ASP.NET Core Authorization policies).
- Secrets management: use Azure Key Vault or HashiCorp Vault. CI should never reveal secrets; use GitHub Actions secrets and Service Principals for runtime.

AI-Swarm specific governance
- PR gating: GitHub Action to require `AI-SWARM` label for PRs that modify `TerraFusion.Consciousness` or `TerraFusion.AI` paths; require a `safety-plan.md` file in the PR root for changes affecting orchestration.
- Canary policy: every swarm rollout must define a canaryConfig: { percentSteps:[10,50,100], durationMinutes, rollbackThresholds:{metric:'error_rate',value:0.05} }.
- Emergency kill-switch: protected endpoint (Admin-only) that sets system-wide `drain=true` and sends termination signals to agent orchestrator.

Audit & compliance workflows
- Every experiment creation that touches county data logs an AuditLog entry with {user, action, experimentId, countyId, ip, timestamp, prId (optional)}.
- Quarterly compliance report generator: aggregates audit logs, list of PRs touching sensitive paths, and access attempts.

CI/CD safety gates (recommended)
- Enforce tests and linting via pre-submit Action.
- Block merge if PR touches `TerraFusion.Consciousness`/`TerraFusion.AI` without `AI-SWARM` label.
- Run a lightweight static check that ensures EF entities contain audit fields when located in `TerraFusion.Core/Entities`.

Quick implementation checklist
- Add county middleware that validates `countyId` present and authorized.
- Authorize all controller endpoints that modify data with `[Authorize(Policy = "CountyScopedWrite")]`.
- Create GitHub Action `ai-swarm-safety.yml` to enforce label+fileset policy and require `safety-plan.md`.
- Add unit tests validating `AuditableEntityInterceptor` runs and audit fields are populated.

Notes
- For any changes that increase privileges or change audit behavior, add a short risk assessment note in the PR and tag compliance owners.
