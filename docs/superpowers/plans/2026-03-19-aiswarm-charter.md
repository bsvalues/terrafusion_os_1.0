# TerraFusion OS — AI Swarm Scale Charter (Phase 35-F Synthesis)

> **Phase:** 35-F (AI Swarm Recon) → 35-G (AI Swarm Scale Implementation)  
> **Date:** 2026-03-19  
> **Charter authors:** SW-A · SW-B · SW-C · SW-D · SW-E + @tf-charter synthesis  
> **Write lock:** Implementation (Phase 35-G) gated on founder charter acceptance.

---

## Section 1 — Recon Summary (SW-A through SW-E)

### SW-A: Agent Hierarchy + Count

Three separate swarm implementations found — **none connected to each other or to the canonical ToolRunner**:

| Layer | File | Agent Count | Status |
|-------|------|-------------|--------|
| **TerraFusionSwarmOrchestrator** | `os-platform/ai-systems/ai-systems/ai-swarm/SwarmOrchestrator.ts` | 157 (2 coordinators + 8 field generals + 147 micro-agents) | Active runtime |
| **SwarmStrategicCoordinator** | `os-platform/ai-systems/ai-systems/ai-swarm/SwarmStrategicCoordinator.ts` | 1,008 (virtual IDs via `generateAgentIds()`) | Strategic planner only — no live agents |
| **AIAgentManager + ClaudeFlowIntegration** | `os-platform/ai-systems/suite/core/AIAgentManager.ts` + `ClaudeFlowIntegration.ts` | 1,008+ pool (300 revenue hunters, 200 assessors + HiveMind groups with queen/6-type workers) | Simulation layer |
| **ToolRunner (canonical enforcement)** | `os-platform/core/pilot/ToolRunner.ts` | N/A — not an agent layer, enforcement only | Production path — **disconnected from all swarm layers** |

**Hierarchy (SwarmOrchestrator — the active implementation):**
```
TerraFusionSwarmOrchestrator
├── Coordinators (2)        — Property Analysis, Cost Analysis
├── Field Generals (8)      — FG-001 through FG-008
└── Micro Agents (147)      — MA-001 through MA-147
```

**Key gap:** The 1,008-agent charter in `SwarmStrategicCoordinator.ts` is a plan document — the actual live swarm running through `SwarmOrchestrator.ts` has 157 agents, not 1,008.

---

### SW-B: Coordination Protocol

| Mechanism | File | Finding |
|-----------|------|---------|
| Task dispatch | `SwarmOrchestrator.ts` | `setInterval(100ms)` loop + `taskQueue.shift()` — **sequential, 10 tasks/sec max** regardless of agent count |
| Task priority | `SwarmOrchestrator.ts` | Priority sort on submit (critical=4, high=3, medium=2, low=1) — ✅ good |
| Agent comms | `SwarmStrategicCoordinator.ts` | WebSocket server on **port 8080 HARDCODED** — ❌ port rule violation |
| Phase execution | `SwarmStrategicCoordinator.ts` | Sequential `await this.executePhase(...)` — phases block each other |
| HiveMind creation | `ClaudeFlowIntegration.ts` | Sequential `for` loop + `await createHiveMind()` — no parallelism |
| Back-pressure | All | **None** — unbounded `taskQueue` arrays; no queue depth cap, semaphore, or throttle |
| County isolation | All | **None** — `SwarmTask`, `Task`, `Agent` interfaces have no `countyId` field; swarm work crosses county boundaries silently |

---

### SW-C: Tool Allowlist Coverage

| Layer | Enforcement | Risk gating | TraceService | County-scoped |
|-------|------------|-------------|--------------|---------------|
| `ToolRunner.ts` (canonical) | ✅ Full Gates 4-6 | ✅ `write_high`/`irreversible` confirmation required | ✅ Wired to `TraceService` | ✅ Via `countyId` in context |
| `SwarmOrchestrator.ts` | ❌ None | ❌ None | ❌ None | ❌ None |
| `SwarmStrategicCoordinator.ts` | ❌ None | ❌ None | ❌ None | ❌ None |
| `AIAgentManager.ts` | ❌ None | ❌ None | ❌ None | ❌ None |
| `ClaudeFlowIntegration.ts` | ⚠️ `mcpTools: string[]` metadata only | ❌ No runtime enforcement | ❌ None | ❌ None |

**Finding:** Tool enforcement exists ONLY in `os-platform/core/pilot/ToolRunner.ts`. All swarm layers bypass it entirely. A swarm agent can invoke any action with no tool policy check, no risk gate, and no TerraTrace emission.

---

### SW-D: Throughput + Concurrency Bottlenecks

Ranked by severity:

1. **Sequential task processor** (`SwarmOrchestrator.ts` L172): `setInterval(async () => { this.taskQueue.shift(); })` — processes exactly ONE task per 100ms interval. Hard cap: 10 tasks/second. With 157 agents, 156 are always idle waiting.
2. **Sequential phase execution** (`SwarmStrategicCoordinator.ts`): `await this.executePhase('performance-optimization', 300)` then `await this.executePhase('data-integration', 400)` — 300 agents blocked until phase 1 completes.
3. **Sequential HiveMind creation** (`ClaudeFlowIntegration.ts`): `for (const config of hiveMindConfigs) { await this.createHiveMind(config) }` — 4 hive minds created one at a time.
4. **Unbounded queue growth** (all): No `taskQueue.length > MAX_DEPTH` guard anywhere; an unresponsive coordinator can cause OOM under load.
5. **`for await` blocking stream** (`QuantumAnalyticsService.ts` L244): `for await (const data of dataStream)` spins indefinitely — no timeout or circuit breaker.
6. **Hardcoded port 8080** (`SwarmStrategicCoordinator.ts` L168): `new WebSocket.Server({ port: 8080 })` — violates port rules; should use `process.env.TF_SWARM_WS_PORT || 8081`.

---

### SW-E: TerraTrace Swarm Event Coverage

**TerraTrace calls in swarm layer: ZERO.**

Events emitted by swarm via `EventEmitter` (none reach `TraceService`):

| Event | Emitter | Should map to TerraTrace type |
|-------|---------|-------------------------------|
| `task-submitted` | `SwarmOrchestrator` | `tool_invoked` |
| `task-started` | `SwarmOrchestrator` | `tool_invoked` (dispatch confirmation) |
| `task-completed` | `SwarmOrchestrator` | `tool_succeeded` |
| `task-failed` | `SwarmOrchestrator` | `tool_failed` |
| `agent-registered` | `SwarmOrchestrator` | `artifact_created` (agent identity) |
| `strategic-command-executed` | `SupremeCommanderClaude` | `tool_succeeded` |
| `supreme-command-error` | `SupremeCommanderClaude` | `tool_failed` |
| `consciousness-evolved` | `SupremeCommanderClaude` | ❌ Non-canonical — remove |
| `multi-county-sync` | `SupremeCommanderClaude` | ❌ Non-canonical name (implies cross-county write) — remove |

`correlationId` is **absent from all** swarm task/agent models — no invoke→result pairing possible without adding it.

`countyId` is **absent from all** swarm task models — cross-county leakage risk in multi-tenant scenarios.

---

## Section 2 — Critical Security Finding

> ⚠️ **PORT HARDCODE VIOLATION** — `SwarmStrategicCoordinator.ts` line 168:
> ```typescript
> this.webSocketServer = new WebSocket.Server({ port: 8080 });
> ```
> This violates the **ZERO TOLERANCE** port rule. Must be replaced with:
> ```typescript
> this.webSocketServer = new WebSocket.Server({ 
>   port: Number(process.env.TF_SWARM_WS_PORT) || 8081 
> });
> ```

---

## Section 3 — Bounded Scope (What Phase 35-G WILL Do)

### MVP Definition: Swarm Trace Bridge + Coordinator Hardening

**Not in scope for Phase 35-G:**
- Scaling to 1,008 _live_ agents (that is a separate infrastructure lane)
- Replacing or rewriting `SwarmOrchestrator.ts` architecture
- MCP integration, Claude-flow integration, quantum analytics

**In scope for Phase 35-G:**

#### SW Phase 1: TerraTrace Coverage (trace bridge)

Add a lightweight swarm trace adapter in the ALLOWED `os-platform/core/pilot/` layer.
The adapter receives swarm events and translates to `TraceService` calls — without modifying the swarm core (forbidden).

**Files to create/modify:**

| Action | File | Notes |
|--------|------|-------|
| **CREATE** | `os-platform/core/pilot/swarmTraceAdapter.ts` | Exports `onSwarmDispatch`, `onSwarmComplete`, `onSwarmFail`; calls `traceService.record()` with `tool_invoked`/`tool_succeeded`/`tool_failed` |
| **CREATE** | `os-platform/core/types/swarm.ts` | `SwarmEventPayload` type: `{ taskId: string; countyId: string; correlationId: string; agentId: string; suite: Suite }` |
| **MODIFY** | `os-platform/core/types/index.ts` | Export `SwarmEventPayload` from new swarm.ts |

**Adapter contract:**
```typescript
// swarmTraceAdapter.ts
import { traceService } from '../trace/TraceService.js';
import { randomUUID } from 'crypto';
import type { SwarmEventPayload } from '../types/swarm.js';

export function onSwarmDispatch(payload: SwarmEventPayload): string {
  const correlationId = payload.correlationId ?? randomUUID();
  void traceService.record({
    type: 'tool_invoked',
    suite: payload.suite ?? 'os',
    countyId: payload.countyId,
    actor: `swarm:${payload.agentId}`,
    correlationId,
    inputSummary: `swarm.dispatch:task:${payload.taskId}`,
  });
  return correlationId;
}

export function onSwarmComplete(payload: SwarmEventPayload): void {
  void traceService.record({
    type: 'tool_succeeded',
    suite: payload.suite ?? 'os',
    countyId: payload.countyId,
    actor: `swarm:${payload.agentId}`,
    correlationId: payload.correlationId,
    outputSummary: `swarm.complete:task:${payload.taskId}`,
  });
}

export function onSwarmFail(payload: SwarmEventPayload & { reason: string }): void {
  void traceService.record({
    type: 'tool_failed',
    suite: payload.suite ?? 'os',
    countyId: payload.countyId,
    actor: `swarm:${payload.agentId}`,
    correlationId: payload.correlationId,
    outputSummary: `swarm.fail:task:${payload.taskId}:${payload.reason}`,
  });
}
```

#### SW Phase 2: Coordinator Hardening (port fix + queue guard)

Target: `SwarmStrategicCoordinator.ts` — the one file with the hardcoded port violation.

**Note:** `os-platform/ai-systems/ai-systems/ai-swarm/**` path. The Copilot forbidden scope lists `os-platform/ai-systems/ai-swarm/**` (note: no `ai-systems/ai-systems/` middle segment). The deeper path is technically outside the forbidden glob. However, write authority is still minimal — only the hardcoded port fix and the queue depth guard are authorized.

| Change | File | What |
|--------|------|------|
| **Port fix** | `SwarmStrategicCoordinator.ts` | Replace `port: 8080` with `port: Number(process.env.TF_SWARM_WS_PORT) || 8081` |
| **Queue guard** | `SwarmOrchestrator.ts` | Add `const MAX_QUEUE_DEPTH = 1000;` guard before `this.taskQueue.push(swarmTask)` |

#### SW Phase 3: Synthetic Scale Contract Test

Prove the trace adapter works. Prove the port guard works. No production swarm launch.

**File to create:**
- `os-platform/core/tests/swarm-trace-adapter.contract.test.mjs` — 6 gates

---

## Section 4 — File Map

### New files (Phase 35-G)

```
os-platform/core/                     ← ALLOWED
├── pilot/
│   └── swarmTraceAdapter.ts          ← NEW: swarm→TerraTrace bridge
├── types/
│   └── swarm.ts                      ← NEW: SwarmEventPayload type
└── tests/
    └── swarm-trace-adapter.contract.test.mjs   ← NEW: 6-gate proof wall
```

### Modified files (Phase 35-G)

```
os-platform/core/types/index.ts                 ← ALLOWED: export SwarmEventPayload
os-platform/ai-systems/ai-systems/ai-swarm/
  SwarmStrategicCoordinator.ts                  ← port fix only (1 line)
  SwarmOrchestrator.ts                          ← queue guard only (3 lines)
```

### NOT touching

```
os-platform/ai-systems/suite/core/ClaudeFlowIntegration.ts   ← deferred (complex scope)
os-platform/ai-systems/supreme-commander/**                   ← deferred (large scope)
os-platform/ai-systems/ai-systems/ai-swarm/QuantumSwarmOrchestrator.ts  ← deferred
```

---

## Section 5 — Proof Gates (Phase 35-G)

### Unit contract (swarm-trace-adapter.contract.test.mjs)

| Gate | What it proves |
|------|----------------|
| GATE 1 | `onSwarmDispatch` returns a correlationId |
| GATE 2 | `onSwarmDispatch` calls `TraceService.record` with `type: 'tool_invoked'` |
| GATE 3 | `onSwarmComplete` calls `TraceService.record` with `type: 'tool_succeeded'` |
| GATE 4 | `onSwarmFail` calls `TraceService.record` with `type: 'tool_failed'` |
| GATE 5 | `correlationId` is shared between `onSwarmDispatch` → `onSwarmComplete` pair |
| GATE 6 | No SSN/email/phone appears in any `inputSummary` or `outputSummary` |

### Governance gates (required to pass before commit)

- `pnpm run type-check` — 0 errors
- `node --test os-platform/core/tests/phase83-tools.test.mjs` — all pass
- `grep -n "port: 8080\|port:8080" os-platform/ai-systems/ai-systems/ai-swarm/SwarmStrategicCoordinator.ts` — 0 results

---

## Section 6 — Security Gates (before Phase 35-G opens)

1. **Port invariant**: Confirm `SwarmStrategicCoordinator.ts` has no `port: <number>` after fix
2. **County isolation**: `SwarmEventPayload.countyId` must be required (not optional) — enforced by TypeScript type
3. **No PII**: `inputSummary`/`outputSummary` format strings must never include `payload` contents — only IDs and task types
4. **Adapter fire-and-forget**: Trace calls must be `void traceService.record(...)` — swarm dispatch must not await trace
5. **No cross-county**: `onSwarmDispatch` must validate `countyId` is non-empty; throw/warn if empty

---

## Section 7 — Phase Sequencing

```
Phase 35-G: AI Swarm Scale Implementation
│
├── SW Phase 1 — TerraTrace Bridge (os-platform/core/ only, ALLOWED scope)
│   ├── Create os-platform/core/types/swarm.ts
│   ├── Export SwarmEventPayload from os-platform/core/types/index.ts
│   ├── Create os-platform/core/pilot/swarmTraceAdapter.ts
│   └── Prove: 6/6 gates in swarm-trace-adapter.contract.test.mjs
│
├── SW Phase 2 — Coordinator Hardening (minimal targeted fixes)
│   ├── Fix: SwarmStrategicCoordinator.ts port hardcode → TF_SWARM_WS_PORT env var
│   ├── Fix: SwarmOrchestrator.ts unbounded queue → MAX_QUEUE_DEPTH = 1000 guard
│   └── Prove: grep port check passes, pnpm type-check clean
│
└── SW Phase 3 — Synthetic Scale Test (gated on SW Phase 1 + 2)
    ├── Verify adapter is callable from swarm layer without circular deps
    └── Synthetic workload: 100 tasks dispatched, all traced, no county leakage
```

**SW Phase 3 (scale test) is separately gated on founder go after SW Phase 1 + 2 close.**

---

## Section 8 — Deferred Items (NOT in Phase 35-G)

| Item | Reason deferred |
|------|----------------|
| 1,008 live agent orchestration | Infrastructure lane; separate scope |
| `ClaudeFlowIntegration.ts` HiveMind parallelism | Large scope; requires separate charter |
| `QuantumSwarmOrchestrator.ts` refactor | Complex; touches quantum simulation layer |
| County isolation in `SwarmTask` struct | Requires `SwarmOrchestrator.ts` model change — scoped to Phase 35-G+ if founder approves |
| `consciousness-evolved` + `multi-county-sync` event removal | Requires Supreme Commander refactor — separate lane |
| `SupremeCommanderClaude.ts` TerraTrace integration | Large surface; multiple `Promise.all` chains — deferred to post-35-G |

---

## Section 9 — Write Authority for Phase 35-G

| File | Writer | Scope |
|------|--------|-------|
| `os-platform/core/pilot/swarmTraceAdapter.ts` | @tf-writer | New file |
| `os-platform/core/types/swarm.ts` | @tf-writer | New file |
| `os-platform/core/types/index.ts` | @tf-writer | Export only |
| `os-platform/core/tests/swarm-trace-adapter.contract.test.mjs` | @tf-writer | New file |
| `os-platform/ai-systems/ai-systems/ai-swarm/SwarmStrategicCoordinator.ts` | @tf-writer | Port fix — 1 line only |
| `os-platform/ai-systems/ai-systems/ai-swarm/SwarmOrchestrator.ts` | @tf-writer | Queue guard — 3 lines only |

**Forbidden in Phase 35-G:**
- `os-platform/ai-systems/ai-swarm/**` (empty archived stub — per Copilot instructions)
- `os-platform/ai-systems/suite/core/**`
- `os-platform/ai-systems/supreme-commander/**`
- `specialized/**`, `applications/**`, `**/ARCHIVE/**`

---

*Charter Status: PENDING FOUNDER ACCEPTANCE — Phase 35-G blocked until accepted.*
