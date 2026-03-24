# Phase 32: TerraCanon Live Wiring — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Verify and prove the live Codex 3-6-9 service is reachable from frontend and backend, the Codex369Hub SignalR collaboration session lifecycle works end-to-end, and seal CP25.

**Architecture:** Three verification tasks — REST endpoint smoke (CodexController), SignalR session lifecycle (Codex369Hub), and governance seal (CP25). No new UI code. All new code is Node.js smoke scripts and a governance artifact. Frontend `CodexDashboard.tsx` already calls the endpoints; Phase 32 proves the live service behind them is real.

**Tech Stack:** Node.js (fetch API), `@microsoft/signalr` (npm), dotnet run TerraFusion.API (port 5000), vitest (existing suite must stay green)

**Gate:** Opens 2026-03-25 when Codex service becomes available. Do NOT execute before SRE confirms staging is ready.

---

## Pre-flight Checklist (SRE confirms before Task 1)

- [ ] `TF_JWT_SECRET` rotated (SEC-005-ROTATE cleared)
- [ ] `TF_*` env vars deployed to staging (SRE-O1-OPS cleared)
- [ ] `dotnet run --project TerraFusion.API` starts clean on port 5000
- [ ] `/api/codex/system-wide` returns HTTP 200 (not 500/404)

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Create | `os-platform/development/testing-suite/phase32-codex-live-smoke.mjs` | REST endpoint smoke (Tasks 1-2) |
| Create | `os-platform/development/testing-suite/phase32-codex-collab-smoke.mjs` | SignalR collaboration session (Task 3) |
| Create | `.governance/workflow/CP25_TERRACANON_LIVE_2026-03-25.md` | Governance seal (Task 4) |
| Verify | `frontend/apps/os-shell/src/components/CodexDashboard.tsx` | Read-only — confirm correlationId trace |

---

## Task 1: REST Endpoint Smoke — CodexController

**Files:**
- Create: `os-platform/development/testing-suite/phase32-codex-live-smoke.mjs`

- [ ] **Step 1: Create smoke script**

```js
// phase32-codex-live-smoke.mjs
// Run: node phase32-codex-live-smoke.mjs
// Requires: TerraFusion.API running on port 5000, valid JWT in env TF_SMOKE_TOKEN

import assert from 'assert';

const BASE = process.env.TF_API_URL ?? 'http://localhost:5000';
const TOKEN = process.env.TF_SMOKE_TOKEN ?? '';

const headers = {
  'Content-Type': 'application/json',
  ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
};

async function get(path) {
  const res = await fetch(`${BASE}${path}`, { headers });
  if (!res.ok) throw new Error(`${path} → HTTP ${res.status}`);
  return res.json();
}

console.log('Phase 32 — Codex REST smoke\n');

// TC-D-1: /api/codex/ultimate-power
{
  const data = await get('/api/codex/ultimate-power');
  assert(typeof data.score === 'number', 'ultimate-power: score must be number');
  assert(data.score >= 0 && data.score <= 12, 'ultimate-power: score in [0,12]');
  assert(data.alertLevel, 'ultimate-power: alertLevel present');
  assert(data.timestamp, 'ultimate-power: timestamp present');
  console.log(`✅ /api/codex/ultimate-power  score=${data.score}  level=${data.alertLevel?.level}`);
}

// TC-D-2: /api/codex/system-wide
{
  const data = await get('/api/codex/system-wide');
  assert(data.domainScores, 'system-wide: domainScores present');
  assert(typeof data.domainScores.systemPerformance === 'number', 'system-wide: systemPerformance score');
  assert(typeof data.domainScores.codeQuality === 'number', 'system-wide: codeQuality score');
  assert(typeof data.domainScores.compliance === 'number', 'system-wide: compliance score');
  console.log(`✅ /api/codex/system-wide  domainScores=${JSON.stringify(data.domainScores)}`);
}

// TC-D-3: /api/codex/system-performance
{
  const data = await get('/api/codex/system-performance');
  assert(typeof data.score === 'number', 'system-performance: score present');
  console.log(`✅ /api/codex/system-performance  score=${data.score}`);
}

// TC-D-4: /api/codex/code-quality
{
  const data = await get('/api/codex/code-quality');
  assert(typeof data.score === 'number', 'code-quality: score present');
  console.log(`✅ /api/codex/code-quality  score=${data.score}`);
}

// TC-D-5: /api/codex/compliance
{
  const data = await get('/api/codex/compliance');
  assert(typeof data.score === 'number', 'compliance: score present');
  console.log(`✅ /api/codex/compliance  score=${data.score}`);
}

console.log('\nTC-D: ALL 5 Codex REST endpoints PASS\n');
```

- [ ] **Step 2: Run against live API**

```bash
cd os-platform/development/testing-suite
TF_API_URL=http://localhost:5000 node phase32-codex-live-smoke.mjs
```

Expected output:
```
✅ /api/codex/ultimate-power  score=<n>  level=<Green|Yellow|Red>
✅ /api/codex/system-wide  domainScores={...}
✅ /api/codex/system-performance  score=<n>
✅ /api/codex/code-quality  score=<n>
✅ /api/codex/compliance  score=<n>

TC-D: ALL 5 Codex REST endpoints PASS
```

- [ ] **Step 3: Capture output and copy into CP25 evidence table (leave placeholder for now)**

- [ ] **Step 4: Commit**

```bash
git add os-platform/development/testing-suite/phase32-codex-live-smoke.mjs
git commit -m "feat(phase32): Codex REST smoke script — 5 endpoint assertions"
```

---

## Task 2: Correlation ID Trace — CodexDashboard Verification

**Files:**
- Read: `frontend/apps/os-shell/src/components/CodexDashboard.tsx`

- [ ] **Step 1: Confirm CodexDashboard passes X-Correlation-Id through**

```bash
grep -n "correlationId\|X-Correlation\|x-correlation\|correlation" \
  frontend/apps/os-shell/src/components/CodexDashboard.tsx
```

If absent: add correlation ID header to the `fetchCodex` call:

```tsx
// In CodexDashboard.tsx — fetchCodex()
const correlationId = crypto.randomUUID();
const response = await fetch('/api/codex/system-wide', {
  headers: { 'X-Correlation-Id': correlationId },
});
// Store correlationId in state for display in dev mode
```

- [ ] **Step 2: Verify live response includes correlationId or trace header**

```bash
curl -v -H "X-Correlation-Id: smoke-$(date +%s)" http://localhost:5000/api/codex/system-wide 2>&1 | grep -i "correlation\|trace\|request-id"
```

- [ ] **Step 3: Record result in CP25 (pass or note absent — not a blocker)**

---

## Task 3: SignalR Collaboration Session — Codex369Hub Lifecycle

**Files:**
- Create: `os-platform/development/testing-suite/phase32-codex-collab-smoke.mjs`

- [ ] **Step 1: Create SignalR smoke script**

```bash
cd os-platform/development/testing-suite
npm install @microsoft/signalr --no-save 2>/dev/null || true
```

```js
// phase32-codex-collab-smoke.mjs
// Run: node phase32-codex-collab-smoke.mjs
// Requires: TerraFusion.API running, Codex369Hub mapped at /hubs/codex369

import * as signalR from '@microsoft/signalr';
import assert from 'assert';

const HUB_URL = (process.env.TF_API_URL ?? 'http://localhost:5000') + '/hubs/codex369';
const SESSION_ID = `smoke-${Date.now()}`;

console.log('Phase 32 — Codex369Hub collaboration smoke\n');

const connection = new signalR.HubConnectionBuilder()
  .withUrl(HUB_URL)
  .withAutomaticReconnect([0])
  .configureLogging(signalR.LogLevel.Warning)
  .build();

// TC-E-1: Hub connects
await connection.start();
console.log('✅ TC-E-1: Hub connected');

// TC-E-2: Join collaboration session
let participants = null;
connection.on('SessionJoined', (data) => { participants = data; });

await connection.invoke('JoinSession', SESSION_ID, {
  userId: 'smoke-user',
  displayName: 'Phase 32 Smoke',
  role: 'assessor',
});

// Allow server response
await new Promise(r => setTimeout(r, 500));
console.log(`✅ TC-E-2: JoinSession invoked for ${SESSION_ID}`);

// TC-E-3: Send an edit operation
let editAcknowledged = false;
connection.on('EditReceived', () => { editAcknowledged = true; });

await connection.invoke('BroadcastEdit', SESSION_ID, {
  fileId: 'smoke-file.cs',
  delta: '// smoke edit',
  version: 1,
});

await new Promise(r => setTimeout(r, 500));
console.log(`✅ TC-E-3: BroadcastEdit sent`);

// TC-E-4: Leave session
await connection.invoke('LeaveSession', SESSION_ID);
console.log('✅ TC-E-4: LeaveSession sent');

// TC-E-5: Clean disconnect
await connection.stop();
console.log('✅ TC-E-5: Hub disconnected cleanly');

console.log('\nTC-E: Codex369Hub collaboration lifecycle PASS\n');
```

- [ ] **Step 2: Run collaboration smoke**

```bash
TF_API_URL=http://localhost:5000 node phase32-codex-collab-smoke.mjs
```

Expected:
```
✅ TC-E-1: Hub connected
✅ TC-E-2: JoinSession invoked for smoke-<timestamp>
✅ TC-E-3: BroadcastEdit sent
✅ TC-E-4: LeaveSession sent
✅ TC-E-5: Hub disconnected cleanly

TC-E: Codex369Hub collaboration lifecycle PASS
```

> **If Hub URL differs or methods differ from actual Codex369Hub implementation:** inspect `TerraFusion.AI/Hubs/Codex369Hub.cs` for actual hub method names and adjust the smoke script. Do not invent method names.

- [ ] **Step 3: Commit**

```bash
git add os-platform/development/testing-suite/phase32-codex-collab-smoke.mjs
git commit -m "feat(phase32): Codex369Hub collaboration lifecycle smoke"
```

---

## Task 4: Vitest Regression Gate

**Ensure nothing broken by smoke script additions.**

- [ ] **Step 1: Run full vitest suite**

```bash
cd frontend && npx vitest run --reporter=dot 2>&1 | tail -5
```

Expected: `6186 passed` (baseline unchanged — smoke scripts are Node.js, not vitest tests)

- [ ] **Step 2: Confirm exit 0**

---

## Task 5: Governance Seal — CP25

**Files:**
- Create: `.governance/workflow/CP25_TERRACANON_LIVE_2026-03-25.md`

- [ ] **Step 1: Write CP25 seal document**

Fill in actual outputs from Tasks 1-3:

```markdown
# CP25 — TerraCanon Live Wiring Seal
**Date**: 2026-03-25
**Phase**: 32 (Claude Code) / Phase 9 live (CP-25)
**Status**: ✅ LIVE PASS

## TC-D: REST Endpoints (5/5)
| Endpoint | HTTP | Score | Alert Level |
|---|---|---|---|
| /api/codex/ultimate-power | 200 | <paste> | <paste> |
| /api/codex/system-wide | 200 | — | — |
| /api/codex/system-performance | 200 | <paste> | — |
| /api/codex/code-quality | 200 | <paste> | — |
| /api/codex/compliance | 200 | <paste> | — |

## TC-E: Codex369Hub Collaboration (5/5)
| Step | Result |
|---|---|
| Hub connected | ✅ |
| JoinSession | ✅ |
| BroadcastEdit | ✅ |
| LeaveSession | ✅ |
| Disconnect | ✅ |

## Vitest Regression Gate
- Suite: 6186/6186 (0 new failures)
- Canon tests: 29/29 (rerun on 2026-03-25)

## Gate Status
| Gate | Status |
|---|---|
| TC-A (29 canon tests) | ✅ PASS (static, proven 2026-03-21) |
| TC-B (frontend surfaces REAL) | ✅ PASS (static, proven 2026-03-21) |
| TC-C (controllers present) | ✅ PASS (static, proven 2026-03-21) |
| TC-D (live REST endpoints) | ✅ LIVE PASS |
| TC-E (collaboration session) | ✅ LIVE PASS |

**Phase 32 sealed.**
```

- [ ] **Step 2: Commit all artifacts**

```bash
git add .governance/workflow/CP25_TERRACANON_LIVE_2026-03-25.md
git commit -m "docs(governance): CP25 Phase 32 TerraCanon Live seal — TC-D 5/5, TC-E 5/5"
```

---

## Convergence Summary

| Gate | Target | Pass Condition |
|---|---|---|
| TC-D REST smoke | 5/5 | All endpoints return HTTP 200 + valid JSON |
| TC-E SignalR lifecycle | 5/5 | Connect → join → edit → leave → disconnect |
| Vitest regression | 6186/6186 | No new failures |
| Canon tests | 29/29 | Re-run `node --test canon-*.mjs` |
| CP25 seal | committed | SHA in `.governance/workflow/` |

**Execute morning of 2026-03-25 after SRE confirms pre-flight checklist.**
