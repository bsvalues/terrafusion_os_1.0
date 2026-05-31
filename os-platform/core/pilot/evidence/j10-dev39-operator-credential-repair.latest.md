# dev39 Operator Credential Repair + Matrix Refresh

- Generated: 2026-05-31T20:11:51.8843809Z
- Target: dev39 only
- Production touched: false
- Database mutation: false
- Auth config mutation: true
- Code mutation: true
- Secret values recorded: false

## Root Cause

dev39 did not have TERRAFUSION_BOOTSTRAP_EMAIL / TERRAFUSION_BOOTSTRAP_PASSWORD in its active runtime env, so the configured provisioned-operator security service was not active and login fell through to fail-closed credential validation.

After credential repair, /api/auth/profile still returned null identity because it read only narrow raw claim names. The token had valid email, role, permission, and county claims; the profile endpoint now reads mapped and raw JWT claim shapes.

## Auth Repair

- Operator: dev39.operator@terrafusionmarket.com
- Roles: GovernmentUser, Administrator, FullSystemAccess, SystemAdministrator, AIModuleAccess
- /api/auth/login: 200
- /api/auth/profile: 200 with email, roles, permissions, countyId=53005, sessionValid=true
- /api/gpt: 200
- /api/gpt/conversations: 200

## DB-Backed Provisioner Finding

No DB-backed GovernmentUsers password provisioner is wired into this dev39 deployed auth path. The repair used the existing configured provisioned-operator path and did not mutate GovernmentUsers data.

## Disk Preflight

- Cleanup: Docker builder cache only
- Root disk before: 86%
- Root disk after: 85%
- Current post-deploy root disk check: 87%
- Threshold: 90%
- Verdict: PASS_BELOW_WARNING_THRESHOLD

## Endpoint Matrix Refresh

- Matrix: j10-backend-endpoint-contract-matrix.dev39-auth-repair.json
- Live: 263
- Broken: 175
- Protected: 525
- Mock: 16
- Dead: 45
- Unknown: 257

Authenticated probing exposes more module failures than unauthenticated probing; full application capability remains NOT_READY.
