# June 10 Operator Post-Login Smoke

Generated: 2026-05-24T16:18:44.697Z
Base URL: https://terrafusionmarket.com
Operator: june10-operator@terrafusionmarket.com
Password supplied: yes (redacted)

Verdict: FAIL

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
- Profile API status: 200
- Profile identity recognized: false
- Benton parcels API status: 200
- Benton parcels rows returned: 1

## Session Controls

- Auth console/runtime errors: 0
- Page errors: 0
- Logout control found: false
- Logout returned to login: false
- Invalid token returned to login: false
- Invalid token protected API status: 401

## Auth Errors

- None

## Blockers

- /api/auth/profile did not recognize the logged-in operator identity.
- No visible logout/sign-out control found after login.
- Invalid token did not return to login cleanly and clear browser token state.