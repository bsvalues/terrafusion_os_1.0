# June 10 Public Site Smoke

Generated: 2026-05-20T16:21:24.707Z

Base URL: https://terrafusionmarket.com
Passed: false

## Summary

- Routes checked: 4
- Reachable routes: 4
- API probes checked: 2
- Auth-gated API probes: 1
- Blockers: 1
- Warnings: 1

## Route Probes

| Path | Status | OK | Evidence |
|---|---:|---:|---|
/ | 200 | true | <!doctype html> <html lang="en"> <head> <meta charset="UTF-8" /> <!-- Theme bootstrap: read localStorage before any CSS render to prevent flash --> <script> (function () { try { var t = localStorage.getItem('tf-theme'); // Default to 'night
/login | 200 | true | <!doctype html> <html lang="en"> <head> <meta charset="UTF-8" /> <!-- Theme bootstrap: read localStorage before any CSS render to prevent flash --> <script> (function () { try { var t = localStorage.getItem('tf-theme'); // Default to 'night
/signup | 200 | true | <!doctype html> <html lang="en"> <head> <meta charset="UTF-8" /> <!-- Theme bootstrap: read localStorage before any CSS render to prevent flash --> <script> (function () { try { var t = localStorage.getItem('tf-theme'); // Default to 'night
/marketplace | 200 | true | <!doctype html> <html lang="en"> <head> <meta charset="UTF-8" /> <!-- Theme bootstrap: read localStorage before any CSS render to prevent flash --> <script> (function () { try { var t = localStorage.getItem('tf-theme'); // Default to 'night

## API Probes

| Path | Status | OK | Evidence |
|---|---:|---:|---|
/api/health | 401 | false | -
/api/auth/access-policy | 200 | true | {"signupMode":"provisioned_access_only","publicSignupEnabled":false,"message":"TerraFusion access is provisioned by an administrator. Public self-signup is disabled."}

## Blockers

- **access_policy**: Public signup is disabled and no access-request channel is exposed by /api/auth/access-policy. ({"signupMode":"provisioned_access_only","publicSignupEnabled":false,"message":"TerraFusion access is provisioned by an administrator. Public self-signup is disabled."})

## Warnings

- **api_auth**: /api/health is auth-gated on the public site. (status=401)

## Interpretation

Public site is not production-usable as a public entry point until blockers clear.
