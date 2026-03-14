# Phase 10 Environment Identity Truth

Snapshot date: 2026-03-12

## Purpose

Phase 10 closes one specific drift:

- staging and production are both publicly healthy
- staging was still identifying itself as `"environment":"Production"` in `GET /health`

That contaminates every later proof packet because the runtime works but the identity surface lies.

## Root Cause

The shared Hostinger runtime compose template hardcodes:

- `ASPNETCORE_ENVIRONMENT: Production`

for every environment.

That means staging receives the same ASP.NET environment label as production unless the deploy path rewrites it.

The current backend image also contains an invalid empty `/app/appsettings.Staging.json`.
So a truthful staging runtime needs two things:

- `ASPNETCORE_ENVIRONMENT: Staging`
- a valid mounted `appsettings.Staging.json` override file

The public health endpoint reflects that value:

- [SimpleHealthController.cs](../../../../backend/src/TerraFusion.API/Controllers/SimpleHealthController.cs) returns `Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")`

## Canonical Fix

Phase 10 fixes the problem in the deploy path, not by handwaving around it.

- `release-lane.yml` now patches `runtime/runtime-compose.yml` before upload
- staging gets `ASPNETCORE_ENVIRONMENT: Staging`
- production keeps `ASPNETCORE_ENVIRONMENT: Production`
- staging deploys also mount `./config/appsettings.Staging.json` to `/app/appsettings.Staging.json`
- both rollback workflows also rewrite `runtime-compose.yml` before `docker compose up -d`
- staging rollback also recreates the mounted config overlay before compose up

This makes new deploys and rollbacks preserve environment identity truth instead of regressing on the next run.

## Required Checks

- staging `GET /health` returns `200`
- production `GET /health` returns `200`
- staging `environment` label is `Staging`
- production `environment` label is `Production`
- both public `/health` surfaces still emit `X-Release-Sha`

## Go / No-Go Rule

Phase 10 is `GO` only when all checks above pass.

If staging still reports `Production`, the correct result is `NO_GO` even when both environments are otherwise healthy.
