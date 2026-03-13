# Phase 11 Deployment Contract Hardening

Snapshot date: 2026-03-13

## Purpose

Phase 11 turns the Hostinger deployment contract into an enforced truth surface.

By the end of Phase 10:

- staging and production both identified themselves truthfully
- apex DNS was real
- Hostinger runtime role was decided

Phase 11 hardens that so deploy and rollback workflows stop accepting weaker truth.

## Contract

The deploy contract is now:

- public DNS truth is mandatory
- public health must pass through the real hostname
- IP-resolve fallback is no longer an acceptable success mode
- release and rollback evidence must include `aspnetcoreEnvironment`
- staging needs a valid `appsettings.Staging.json` overlay because the current backend image carries an invalid empty staging file

## Root Cause

Earlier workflow generations tolerated too much:

- DNS preflight could warn and continue
- health verification could succeed via `--resolve`
- staging environment identity depended on ad hoc runtime edits

That was acceptable during containment and recovery, but it is not acceptable for a hardened release contract.

## Canonical Fix

- `release-lane.yml` now fails if public DNS does not resolve
- `rollback-staging.yml` now fails if public DNS does not resolve
- `rollback-production.yml` now fails if public DNS does not resolve
- all three workflows now verify public `/health` directly with the public hostname
- all three workflows no longer accept `--resolve` fallback
- release and rollback evidence encode `aspnetcoreEnvironment`
- staging deploys and staging rollback recreate the valid mounted `appsettings.Staging.json` overlay

## Required Checks

- workflow files contain no `--resolve` fallback in health verification
- workflow files require public DNS preflight
- release and rollback evidence include `aspnetcoreEnvironment`
- staging release path mounts a valid staging config overlay
- rollback-staging recreates the overlay
- public staging and production `/health` both pass directly
- public release headers remain present and environment-correct

## Go / No-Go Rule

Phase 11 is `GO` only when the workflow contract and the live public surfaces both agree.

If the repo says “public truth required” but the live path still depends on fallback, the correct result is `NO_GO`.
