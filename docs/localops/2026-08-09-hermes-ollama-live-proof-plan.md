# Hermes Ollama Live Proof Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver and merge a disposable, fail-closed LocalOps proof that reaches Hermes Ollama only through an OMEN loopback SSH tunnel.

**Architecture:** A small Node entrypoint constructs the existing `createLocalOpsProvider` contract with `AI_PROFILE=localops`, `AI_PROVIDER=ollama`, an explicit loopback base URL, and an explicit model. Automated tests exercise the real entrypoint against a real loopback HTTP fixture; the coordinator performs the transient live tunnel proof and records evidence before PR closeout.

**Tech Stack:** Node.js ESM, Node test runner, TerraFusion LocalOps provider/OllamaAdapter, OpenSSH, GitHub CLI.

## Global Constraints

- Work Order is `WO-LOCALOPS-009`; one branch, one worktree, one PR.
- All AI traffic must target an explicit `http://127.0.0.1:<port>` or `http://localhost:<port>` URL.
- Use `createLocalOpsProvider`; do not instantiate an external adapter or add fallback logic.
- `AI_EXTERNAL_CALLS`, `AI_ALLOW_WEB`, `AI_ALLOW_SHELL`, and `AI_ALLOW_MUTATION` remain false.
- Failure, timeout, malformed response, unavailable tunnel, or unavailable Ollama returns nonzero.
- No external AI/provider calls, shell execution by LocalOps, product mutation, or secret persistence.
- Atlas proof is TCP configuration/auth-boundary only; no protocol command, query, migration, or mutation.
- WilliamOS remains on its separate Neon contract and is not modified.
- Do not touch Forge, frozen OMEN cockpit code, Hermes/Atlas service configuration, or completed Stage 5 preflight.

---

### Task 1: Disposable LocalOps Ollama proof entrypoint

**Files:**
- Create: `os-platform/core/pilot/localops-ollama-live-proof.mjs`
- Create: `os-platform/core/tests/local-agent-ollama-live-proof.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: `createLocalOpsProvider`, `isLocalOpsSuccess`, and `isLocalOpsProblem` from `os-platform/core/pilot/local-agent/index.js`.
- Produces: `runLocalOpsOllamaLiveProof({ env, prompt, timeoutMs })` and a CLI that prints one JSON object and exits `0` only for verified LocalOps success.

- [ ] **Step 1: Write failing behavioral tests**

Add tests that run the real proof entrypoint against a real loopback HTTP fixture and prove: the
Ollama `/api/chat` request carries the explicit model and prompt; a valid NDJSON response produces
success with a literal expected SHA-256/length; a refused non-loopback URL performs zero requests;
an unavailable loopback port and an abort timeout return structured failure and nonzero CLI status.

- [ ] **Step 2: Run the focused tests and verify RED**

Run:

```powershell
node --test os-platform/core/tests/local-agent-ollama-live-proof.test.mjs
```

Expected: failure because `localops-ollama-live-proof.mjs` does not exist.

- [ ] **Step 3: Implement the minimal entrypoint**

Implement strict input validation, a bounded abort controller, construction through
`createLocalOpsProvider`, one read-only completion request, response digest/length projection, and a
single JSON CLI result. Do not add tunnel orchestration, provider discovery, persistence, or fallback.

- [ ] **Step 4: Verify GREEN and regression scope**

Run the focused test, LocalOps provider/Ollama tests, `pnpm run type-check`, Phase 8.3, generated-code
check, canon fast gate, and `git diff --check`.

- [ ] **Step 5: Commit Task 1 and write the task report**

Commit only the three reserved implementation paths and record RED/GREEN evidence, exact commands,
scope, and concerns in the SDD task report.

### Task 2: Live evidence and governed delivery closeout

**Files:**
- Create: `docs/brain/workorders/WO-LOCALOPS-009-HERMES-OLLAMA-LIVE-PROOF.md`
- Create: `docs/brain/workorders/evidence/WO-LOCALOPS-009-HERMES-OLLAMA-LIVE-PROOF.md`

**Interfaces:**
- Consumes: Task 1 proof CLI and its machine-readable result.
- Produces: the durable Work Order boundary and evidence packet used by PR review and exact-head merge verification.

- [ ] **Step 1: Run the transient live proof**

Start one exact OMEN SSH process forwarding a free loopback port to Hermes `127.0.0.1:11434`, select
an installed model through that tunnel, run the proof entrypoint, capture the sanitized result, stop
only that tunnel PID, and verify the local port is released.

- [ ] **Step 2: Prove fail-closed and boundary behavior**

Rerun the same proof after tunnel shutdown and require nonzero structured failure. Perform TCP-only
Atlas Postgres/Redis configuration-boundary checks without sending protocol payloads. Confirm the
WilliamOS documentation/config still declares its separate Neon contract.

- [ ] **Step 3: Write evidence and validate the branch**

Record exact sanitized evidence. Run focused tests, required core gates, LocalOps tests applicable to
the changed path, canon gate, generated-code check, secret scan, `git diff --check`, and branch scope.

- [ ] **Step 4: Commit Task 2 and complete review loop**

Commit only the two evidence paths, obtain task review and whole-branch review, remediate legitimate
Critical/Important findings test-first, and repeat scoped review.

- [ ] **Step 5: PR, exact-head verification, and merge**

Push the branch, open the single Work Order PR, wait for required checks, resolve all review threads,
verify the exact head and clean merge state, squash merge under standing owner authority, and verify
the merge SHA is on `origin/main`.
