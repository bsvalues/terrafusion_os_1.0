# Phase 32 No-Wait Solo-Dev Execution Plan

Date: 2026-03-21
Status: ACTIVE PLANNING ARTIFACT
Owner: Copilot / solo-dev execution lane
Scope: Correct the Phase 32 operating model so agent-capacity limits do not masquerade as environment blockers

## Why This Artifact Exists

The current Phase 32 planning correctly describes the live verification work, but it does not explicitly separate two different failure classes:

1. agent/session exhaustion
2. external runtime dependency absence

Those are not the same problem.

If an AI agent runs out of tokens, stalls, or must be replaced, that is a continuity problem and should be solved by baton-passing, smaller slices, and pre-written execution artifacts.

If the live runtime is not reachable, the secret is not deployed, the hub is not mapped, or the pager/on-call surface is not live, that is an environment problem and cannot be solved by swapping to another agent.

The missing concept was not parallelism.

The missing concept was strict separation between:

- machine-owned work that must continue immediately with no waiting
- operator/SRE-owned facts that must be observed, supplied, or executed on a real runtime

## Corrected Principle

We do not wait on agent capacity.

We only wait on facts that exist outside the repository.

Therefore:

- every repo-owned Phase 32 task must be completed now or pre-staged now
- every external dependency must be reduced to an explicit input contract
- no machine time should be spent re-discovering the same dependency gap twice

## Failure-Class Split

### Class A — Agent Continuity Failure

Examples:

- Codex/Copilot/Claude session exhausts tokens
- one agent loses context
- one lane fails mid-run but files and state are preserved

Resolution:

- split work into bounded files and scripts
- preserve state in committed or repo-local artifacts
- hand off to another agent immediately
- never make progress depend on one long-lived session

This class is machine-solvable.

### Class B — Environment Dependency Failure

Examples:

- `/api/codex/system-wide` returns 404 or 500 because service is not live
- `TF_*` env vars are absent in staging
- valid live token is unavailable
- SignalR hub route is not deployed or method surface differs from assumption
- pager/on-call receiver path is not reachable on a verified execution surface

Resolution:

- reduce to explicit missing input
- pre-build everything that does not depend on the missing input
- when the input appears, execute immediately using the pre-staged artifact bundle

This class is not solved by more agents.

## No-Wait Operating Model

Phase 32 is now treated as five lanes.

Only Lane 5 requires live environment facts.

Lanes 1 through 4 are machine-owned and should be completed without delay.

### Lane 1 — Contract Truth Lock

Goal: eliminate guesswork about the actual Codex live surface before any live drill.

Tasks:

- inspect the real controller routes for Codex endpoints
- inspect the real hub path and hub method names
- inspect whether correlation-id headers are already honored or only best-effort
- record exact route and method truth in a repo artifact

Exit condition:

- no Phase 32 smoke script contains invented route names or method names

### Lane 2 — Smoke Script Prebuild

Goal: fully prepare the scripts that will execute the moment the environment is ready.

Tasks:

- finalize REST smoke script shape
- finalize collaboration smoke script shape against actual hub method names
- remove any hardcoded localhost assumptions and use `TF_API_URL` / `TF_API_PORT`
- make failure output identify missing dependency versus contract mismatch

Exit condition:

- scripts are ready to run with only env values substituted

### Lane 3 — Evidence Bundle Prebuild

Goal: remove all human improvisation from proof capture.

Tasks:

- pre-write CP25 seal template with placeholders
- pre-write success receipt format
- pre-write blocked-attempt receipt format for Phase 32 live checks
- bind each result field to a specific command or response field

Exit condition:

- a replacement agent can execute Phase 32 proof without inventing artifact shape

### Lane 4 — Local Dry-Run And Static Regression

Goal: exhaust all non-live uncertainty before staging opens.

Tasks:

- static verification of endpoint references
- static verification of hub references
- local syntax/runtime validation of the Node smoke scripts
- required repo gates for touched governed files

Exit condition:

- only live-runtime truth remains unresolved

### Lane 5 — Live Execution Window

Goal: perform the actual live verification as soon as the environment contract is satisfied.

Required external inputs:

- verified `TF_*` deployment
- reachable Codex API surface
- valid auth token or equivalent authorized path
- verified Codex hub route
- verified Benton release binding

Exit condition:

- live REST smoke passes
- live collaboration smoke passes
- CP25 seal is populated with real outputs

## Immediate Solo-Dev Marching Orders

The correct no-wait sequence is:

1. finish all repo-owned truth gathering for Phase 32
2. build the smoke scripts against real contracts, not assumptions
3. build the seal/evidence artifacts now
4. pre-stage the exact environment input checklist
5. the moment SRE or the live surface supplies the missing facts, run the scripts without redesign

This means the repo should reach a state where the remaining live work is execution-only, not thinking-work.

## What We Were Missing

The missing idea was this:

Spreading duties across agents protects against lost context and token exhaustion.

It does not remove the need for a real target to hit.

So the original plan was incomplete only if it allowed live execution readiness to remain bundled together with agent continuity.

That is corrected here.

## Corrected Definition Of "Blocked"

Phase 32 is blocked only if both of the following are true:

1. the remaining task depends on a live external fact not present in the repo
2. every machine-owned preparatory task has already been completed

If item 2 is false, then we are not blocked.

We are simply unfinished.

## Required Artifact Set

The no-wait bundle for Phase 32 must contain:

- contract-truth note for actual Codex routes and hub methods:
	`os-platform/core/pilot/ops/phase32-contract-truth-lock-2026-03-21.md`
- REST smoke script:
	`os-platform/core/pilot/phase32-codex-live-smoke.mjs`
- collaboration smoke script:
	`os-platform/core/pilot/phase32-codex-collab-smoke.mjs`
- CP25 seal template, success receipt, and blocked-attempt template:
	`os-platform/core/pilot/ops/phase32-evidence-bundle-templates-2026-03-21.md`
- exact environment input list:
	`os-platform/core/pilot/ops/phase32-live-input-contract-2026-03-21.md`

Once those exist, an agent failure is no longer operationally relevant.

Another agent can resume immediately.

## Decision Rule

From this point forward:

- never say "Phase 32 is blocked" when repo-owned prep work is still outstanding
- say "Phase 32 live execution is environment-gated; repo-owned prep remains in progress"
- only use "blocked" after the no-wait bundle is complete and the missing fact is purely external

## Bottom Line

We were right to design for distributed duties across agents.

What needed correction was the execution model:

- agent continuity is a machine problem and must be solved by artifactization
- environment truth is an external fact problem and must be solved by input acquisition

The correct response is not to wait.

The correct response is to finish every machine-owned lane now, so the remaining dependency is a single explicit external handoff and not a blended planning gap.