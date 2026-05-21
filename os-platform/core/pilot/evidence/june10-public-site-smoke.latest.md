# June 10 Public Site Smoke

Generated: 2026-05-21T23:39:17.805Z

Base URL: https://terrafusionmarket.com
Passed: true

## Summary

- Routes checked: 4
- Reachable routes: 4
- Rendered routes checked: 2
- Reachable rendered routes: 2
- API probes checked: 2
- Auth-gated API probes: 1
- Blockers: 0
- Warnings: 1

## Route Probes

| Path | Status | OK | Evidence |
|---|---:|---:|---|
/ | 200 | true | <!doctype html> <html lang="en"> <head> <meta charset="UTF-8" /> <!-- Theme bootstrap: read localStorage before any CSS render to prevent flash --> <script> (function () { try { var t = localStorage.getItem('tf-theme'); // Default to 'night
/login | 200 | true | <!doctype html> <html lang="en"> <head> <meta charset="UTF-8" /> <!-- Theme bootstrap: read localStorage before any CSS render to prevent flash --> <script> (function () { try { var t = localStorage.getItem('tf-theme'); // Default to 'night
/signup | 200 | true | <!doctype html> <html lang="en"> <head> <meta charset="UTF-8" /> <!-- Theme bootstrap: read localStorage before any CSS render to prevent flash --> <script> (function () { try { var t = localStorage.getItem('tf-theme'); // Default to 'night
/marketplace | 200 | true | <!doctype html> <html lang="en"> <head> <meta charset="UTF-8" /> <!-- Theme bootstrap: read localStorage before any CSS render to prevent flash --> <script> (function () { try { var t = localStorage.getItem('tf-theme'); // Default to 'night

## Rendered Browser Probes

| Path | Status | OK | Final URL | Evidence |
|---|---:|---:|---|---|
/login | 200 | true | https://terrafusionmarket.com/login | TerraFusion OS Sign in with administrator-issued TerraFusion credentials. Provisioned access only TerraFusion access is provisioned by an administrator. Public self-signup and public access requests are disabled. Email Password Sign In
/signup | 200 | true | https://terrafusionmarket.com/login | TerraFusion OS Sign in with administrator-issued TerraFusion credentials. Provisioned access only TerraFusion access is provisioned by an administrator. Public self-signup and public access requests are disabled. Email Password Sign In

## API Probes

| Path | Status | OK | Evidence |
|---|---:|---:|---|
/api/health | 401 | false | -
/api/auth/access-policy | 200 | true | {"signupMode":"provisioned_access_only","publicSignupEnabled":false,"message":"TerraFusion access is provisioned by an administrator. Public self-signup and public access requests are disabled."}

## Blockers

- None

## Warnings

- **api_auth**: /api/health is auth-gated on the public site. (status=401)

## Interpretation

Public site smoke passed for launch-control evidence.
