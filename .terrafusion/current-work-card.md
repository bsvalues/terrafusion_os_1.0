# Work Card: local-agent-runtime

## Mode

Plan

## Task

Build local agent runtime

## Why

Build the founder-simple local agent runtime inside the governed pilot surface without crossing into suites or external egress.

## Readiness

R1 — bounded plan generated; safe for read-only inspection.

## Truth Posture

plan-only; no writes; no commands outside proof gates.

## Confidence

0.65

## Allowed Files

- os-platform/core/pilot/local-agent/**
- os-platform/core/pilot/index.ts
- os-platform/core/tests/local-agent*.test.mjs
- tools/registry/build-core-js.mjs
- package.json

## Forbidden Files

- .env
- .env.*
- secrets/**
- docs/superpowers/**
- backend/**
- frontend/**
- marketplace/**
- modules/**

## Proof Gates

- git diff --check
- pnpm run type-check
- pnpm run test:local-agent

## Success Criteria

- The local agent stays model-agnostic.
- The harness owns permissions, proof, and audit state.
- The founder workflow remains bounded by locked work cards.
- No forbidden files touched.
- Proof gates are identified before patching.
- Final response includes changed files, proof gates, remaining risk, and save state.

## Risks

- UI polish before harness safety would create a fake control surface.
- Broad command allowlists would undercut county-safe posture.
- Repository has uncommitted changes; inspect git diff before patching.

## Notes

- Matched profile: TerraFusion Local Agent Runtime
- Lock this card before switching to Patch Mode.
