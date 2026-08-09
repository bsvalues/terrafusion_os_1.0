# WO-LOCALOPS-009 — Hermes Ollama Live Proof

## Status

`TASK_2_COMPLETE_COORDINATOR_CLOSEOUT_PENDING`

This Work Order records a bounded, read-only proof of the existing LocalOps Ollama path. Task 2
does not push, open a pull request, merge, alter a service, or change a remote host.

## Authority and objective

- **Authorization:** `TERRAFUSION_LOCALOPS_OLLAMA_PROOF`, 2026-08-09.
- **Risk:** R1 — transient, read-only runtime proof.
- **Final hardened proof head:** `c9bada21b481c755a8d76644184202e2b1575561`.
- **Objective:** prove that the existing LocalOps `ollama` provider can complete one
  non-sensitive request through an OMEN-owned SSH loopback forward to Hermes, and fails closed
  once that forward is removed.

## Reserved delivery scope

This Task 2 commit may contain only:

- `docs/brain/workorders/WO-LOCALOPS-009-HERMES-OLLAMA-LIVE-PROOF.md`
- `docs/brain/workorders/evidence/WO-LOCALOPS-009-HERMES-OLLAMA-LIVE-PROOF.md`

The proof implementation and focused test are limited to their governed LocalOps paths. This work
order does not modify generated code, services, host bindings, firewall rules, SSH server
configuration, Atlas, WilliamOS, or the frozen OMEN cockpit.

## Runtime boundary

1. OMEN verifies a free local loopback port and starts exactly one guarded `ssh.exe` process that
   forwards only `127.0.0.1:<port>` to Hermes `127.0.0.1:11434`.
2. The Task 1 CLI receives explicit `AI_PROFILE=localops`, `AI_PROVIDER=ollama`, model, and
   loopback `AI_BASE_URL` values. `AI_EXTERNAL_CALLS`, `AI_ALLOW_WEB`, `AI_ALLOW_SHELL`, and
   `AI_ALLOW_MUTATION` are false; trace and source requirements remain true.
3. The CLI output is retained only as its single JSON success projection: provider, SHA-256 digest,
   and UTF-8 response byte length. Raw model text is neither persisted nor reported.
   Every LocalOps safety flag is explicitly present with its required exact value, and the proof
   transport rejects redirects rather than following them beyond its explicit loopback endpoint.
4. The tunnel owner records and compares its exact PID and command line before terminating that
   process, then verifies the loopback port is released.
5. The identical CLI configuration against the released port must emit one structured nonzero
   failure. A successful retry without the tunnel is a failure of this Work Order.

## Cross-system limits

- **Hermes:** loopback Ollama forwarding only; no remote command, configuration, binding, service,
  firewall, or model mutation.
- **Atlas:** TCP connection only to `192.168.1.156:5432` and `:6379`; zero bytes, credentials,
  queries, commands, migrations, or writes.
- **WilliamOS:** read-only Git inspection of `origin/main` to confirm its separate Neon
  `DATABASE_URL` contract; no checkout mutation.
- **LocalOps:** no external provider, web call, unrestricted shell path, product mutation, silent
  fallback, or secret-bearing artifact.

## Acceptance criteria

- Tunnel model discovery independently finds `llama3.2:3b` through the tunnel.
- The final hardened CLI succeeds once with the required safe profile, a complete terminal Ollama
  NDJSON response, an explicit loopback URL, and no followed redirect.
- Tunnel cleanup is PID-and-command-line guarded and the port is released.
- Released-port rerun exits nonzero with one structured failure object.
- Both Atlas TCP-only handshakes succeed while sending zero bytes.
- WilliamOS `origin/main` retains its independent Neon `DATABASE_URL` contract.
- Focused, applicable LocalOps, core, generated-code, canon, security, diff, and scope checks are
  recorded truthfully in the evidence packet.

## Evidence and closeout boundary

The exact sanitized runtime and validation record is in
[`WO-LOCALOPS-009-HERMES-OLLAMA-LIVE-PROOF.md`](evidence/WO-LOCALOPS-009-HERMES-OLLAMA-LIVE-PROOF.md).
Coordinator-owned review, PR, exact-head, and merge work remains outside this Task 2 execution.

<!-- brain-machine-policy: bounded Task 2 delivery policy -->
```json
{
  "id": "WO-LOCALOPS-009",
  "task": "Read-only Hermes Ollama loopback proof and evidence packet",
  "risk": "R1",
  "allowed_files": [
    "docs/brain/workorders/WO-LOCALOPS-009-HERMES-OLLAMA-LIVE-PROOF.md",
    "docs/brain/workorders/evidence/WO-LOCALOPS-009-HERMES-OLLAMA-LIVE-PROOF.md"
  ],
  "forbidden_actions": [
    "remote writes", "service changes", "firewall changes", "binding changes",
    "Atlas protocol traffic", "Atlas credentials", "WilliamOS mutation", "external AI fallback",
    "product mutation", "push", "pull request", "merge"
  ],
  "required_proof": [
    "guarded SSH loopback success", "released-port structured failure", "Atlas TCP-only checks",
    "WilliamOS Neon contract inspection", "focused and required validation", "scope and secret scan"
  ]
}
```
