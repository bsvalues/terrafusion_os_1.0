# June 10 Operator Post-Login Smoke

Generated: 2026-05-24T17:06:24.518Z
Base URL: https://terrafusionmarket.com
Operator: june10-operator@terrafusionmarket.com
Password supplied: yes (redacted)

Verdict: PASS

## Shell

- Final URL: https://terrafusionmarket.com/canon
- /canon loaded: true
- Shell chrome: true
- Benton county context: true
- Screenshot: os-platform/core/pilot/evidence/screenshots/june10-operator-post-login-shell.latest.png

## Identity And APIs

- JWT email: june10-operator@terrafusionmarket.com
- JWT roles: GovernmentUser, Administrator
- JWT permissions: runtime:read, county:read, june10:smoke, ecosystem:view, workbench:access, costforge:read, atlas:read, salesforge:read
- JWT county FIPS: 53005
- Operator identity recognized: true
- Protected API succeeded: true
- Benton context / FIPS 53005 present: true
- Profile API status: 200
- Profile identity recognized: false
- Benton parcels API status: 200
- Benton parcels rows returned: 1

## Session Controls

- Auth console/runtime errors: 0
- Page errors: 0
- Logout control found: true
- Logout returned to login: true
- Invalid token returned to login: true
- Invalid token protected API status: 401

## Auth Errors

- None

## Warnings

- /api/auth/profile did not recognize the logged-in operator identity.

## Blockers

- None