# Phase 35-G SW-2 Scope Exception Request

Date: 2026-03-19
Branch: post-r3/w5f-registry-edge-cleanup
Requester lane: Slice 35 / Lane 3 / AI Swarm Scale
Status: PENDING APPROVAL

## Purpose

Request a narrow, line-bounded scope exception to execute SW-2 hardening from the AI Swarm charter:
- Replace hardcoded WebSocket port with environment-based port configuration.
- Add bounded queue-depth guard to prevent unbounded enqueue growth.

No other behavior changes are requested.

## Exception Target Paths

- os-platform/ai-systems/ai-systems/ai-swarm/SwarmStrategicCoordinator.ts
- os-platform/ai-systems/ai-systems/ai-swarm/SwarmOrchestrator.ts

## Requested Changes

1. SwarmStrategicCoordinator.ts
- Replace:
  - new WebSocket.Server({ port: 8080 })
- With:
  - new WebSocket.Server({ port: Number(process.env.TF_SWARM_WS_PORT) || 8081 })

2. SwarmOrchestrator.ts
- Add queue cap constant:
  - const MAX_QUEUE_DEPTH = 1000;
- Guard enqueue site before taskQueue.push(...):
  - reject or drop with explicit warning event when queue depth is exceeded.

## Security and Governance Rationale

- Eliminates direct violation of zero-tolerance hardcoded-port policy.
- Adds resilience against memory pressure and queue blow-up under burst load.
- Keeps change set minimal and auditable.
- Does not alter swarm topology, agent behavior, permissions model, or county routing semantics.

## Out of Scope

- No edits to backend swarm production runtime trees outside listed files.
- No refactor of scheduler architecture.
- No new protocols, no schema changes, no endpoint changes.

## Acceptance Gates (post-approval)

- pnpm run type-check
- node --test os-platform/core/tests/phase83-tools.test.mjs
- Search gate:
  - no "port: 8080" remains in SwarmStrategicCoordinator.ts
- New guard gate:
  - enqueue path has explicit queue-depth check and deterministic behavior at cap.

## Evidence Plan

- Commit message includes: "Phase 35-G SW-2 exception-bounded hardening"
- Diff must include only the two target files above.
- progress.md updated with approval timestamp, implementation hash, and gate outputs.
