# Hermes Ollama Live Proof Design

**Work Order:** `WO-LOCALOPS-009`
**Owner authorization:** `TERRAFUSION_LOCALOPS_OLLAMA_PROOF`, 2026-08-09
**Repository:** `bsvalues/terrafusion_os_1.0`
**Risk:** R1, read-only runtime proof

## Goal

Prove that TerraFusion's existing `localops` profile and `OllamaAdapter` can send a real prompt from
OMEN to Hermes Ollama through an operator-owned transient SSH tunnel and return a real model response,
while failing closed when the tunnel or model is unavailable.

## Authority and boundaries

- OMEN runs the current TerraFusion source and owns the transient tunnel process.
- Hermes remains unchanged. The tunnel targets Hermes loopback Ollama at `127.0.0.1:11434`.
- Atlas is limited to TCP configuration/auth-boundary reachability evidence. No database command,
  query, migration, credential use, or state mutation is permitted.
- WilliamOS remains on its separate Neon database contract and is not modified.
- No external AI provider, web call, unrestricted shell path, product mutation, silent fallback, or
  secret-bearing artifact is permitted.
- Forge, the frozen OMEN cockpit implementation, and completed Stage 5 preflight are out of scope.

## Design

Add one disposable Node proof entrypoint inside the governed LocalOps surface. It constructs the
existing provider exclusively through `createLocalOpsProvider`, using the `localops` profile,
`ollama` provider, an explicit model, and an explicit loopback base URL. It sends one fixed,
non-sensitive prompt through the existing adapter contract.

The entrypoint emits a single machine-readable JSON result. Success includes the adapter identity,
UTF-8 response byte length, and SHA-256 digest. It does not emit or persist the model identity or
model response. Failure is a structured non-success result and a nonzero process exit. An abort
timeout bounds an unavailable or hung tunnel. There is no alternate provider construction or fallback
branch.

The operator starts the SSH tunnel outside the LocalOps provider, proves the live call, stops the
exact tunnel process, and immediately reruns the same entrypoint against the released port to prove
fail-closed behavior. Tests use a real loopback HTTP server that speaks the minimum Ollama NDJSON
contract; they also prove an unreachable loopback endpoint and a non-loopback URL cannot succeed.

## Evidence and completion

The evidence packet records the exact branch head, focused and required-gate results, tunnel command
shape, model identity, response digest/length, fail-closed result, Atlas TCP-only boundary result,
WilliamOS isolation check, PR review state, merge SHA, and post-merge ancestry. No credentials,
prompts containing sensitive data, or raw database payloads are recorded.
