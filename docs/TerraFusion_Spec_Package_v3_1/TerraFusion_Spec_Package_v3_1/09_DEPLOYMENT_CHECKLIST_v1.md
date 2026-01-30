# Deployment Checklist (v1)

## Phase 1 — Foundation
- [ ] Add Workbench shell routes
- [ ] Add TerraTrace projection feed (read-only)
- [ ] Add TerraPilot global entry + profile storage

## Phase 2 — Tools + Policies
- [ ] Implement RBAC vs allowlist
- [ ] Implement RiskPolicy confirmation/reason/supervisor patterns
- [ ] Implement PII sanitization + payload refs

## Phase 3 — Suite Adapters
- [ ] Atlas tab adapter + redirects
- [ ] Forge tab adapter + redirects
- [ ] Dais tab adapter + redirects
- [ ] Dossier tab adapter + redirects

## Phase 4 — Hardening + Gates
- [ ] Turn on CI gates
- [ ] Validate write-lanes for all tools
- [ ] Decommission legacy parcel screens after redirect stability
