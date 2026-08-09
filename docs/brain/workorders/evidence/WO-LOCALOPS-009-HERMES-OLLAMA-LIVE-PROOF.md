# WO-LOCALOPS-009 Evidence — Hermes Ollama Live Proof

## Verdict

`LIVE_PROOF_PASS — COORDINATOR_CLOSEOUT_PENDING`

The existing Task 1 LocalOps proof entrypoint completed one bounded request to Hermes Ollama only
through an OMEN-owned loopback SSH tunnel. The tunnel was guarded and removed; the same invocation
then failed closed against the released port. No raw model text, credentials, database protocol
payload, query, mutation, service change, firewall change, binding change, or remote write was made.

## Provenance

| Field | Value |
| --- | --- |
| Branch | `codex/localops-hermes-ollama-proof` |
| Final hardened proof head | `c9bada21b481c755a8d76644184202e2b1575561` |
| Final proof CLI | `os-platform/core/pilot/localops-ollama-live-proof.mjs` |
| Tunnel target | Hermes `127.0.0.1:11434` only |
| Local forward | OMEN `127.0.0.1:11455` only |
| Independently discovered model | `llama3.2:3b` |

## Guarded live tunnel and sanitized proof

The local `127.0.0.1:11455` listener count was zero before launch. One exact process was launched:

```text
PID: 29204
"C:\\Windows\\System32\\OpenSSH\\ssh.exe" -N -T -o ExitOnForwardFailure=yes -o BatchMode=yes -o ConnectTimeout=10 -L 127.0.0.1:11455:127.0.0.1:11434 hermes
```

The port bound to PID `29204`. `GET /api/tags` through that loopback forward independently found
`llama3.2:3b`; no model-discovery result was taken from a cached assertion.

The final hardened CLI used the explicit `localops` / `ollama` profile, that model, explicit
`http://127.0.0.1:11455` base URL, false external/web/shell/mutation flags, and true
trace/source requirements. It observed every NDJSON line, required one final `done:true` marker and
a non-empty aggregate, and rejects proof-transport redirects rather than following them. It then
returned exactly one sanitized JSON result and exited zero. `length` is the UTF-8 byte length, not
JavaScript string length:

```json
{
  "ok": true,
  "status": "success",
  "provider": "ollama",
  "response": {
    "sha256": "70a04cf250614cce019e24b73ed3c04cb56b1a66ebee5fd8d01e891ff3ca8ffd",
    "length": 181
  }
}
```

The current process still matched the recorded PID and complete command line before termination.
Only that guarded process was stopped. `127.0.0.1:11455` listener count was zero after cleanup.

## Fail-closed evidence

With no tunnel listener present, the same explicit safe configuration emitted exactly one JSON
object, exited `1`, and failed structurally:

```json
{
  "ok": false,
  "status": "failed",
  "reasonCode": "LOCAL_PROVIDER_FAILED"
}
```

The released port remained unbound after this check. This proves the entrypoint did not use a
fallback provider or an alternate reachable endpoint.

## Atlas TCP-only configuration boundary

| Target | TCP connection | Bytes sent | Credentials | Protocol payload/query |
| --- | --- | ---: | --- | --- |
| `192.168.1.156:5432` | success | 0 | none | none |
| `192.168.1.156:6379` | success | 0 | none | none |

Each socket was disposed immediately after the handshake; no stream was opened or written.

## WilliamOS separation proof

Read-only Git inspection of the separate WilliamOS checkout found `origin/main` at
`d46bd5bce523f4bf60337ef1450280651eafaf31` and its remote as
`git@github.com:bsvalues/terragroq.git`. Its tracked `.env.example` declares a `DATABASE_URL`
Postgres URL, and `README.md` explicitly identifies Neon Postgres and `DATABASE_URL` as the Neon
connection string. No file in that checkout was changed; pre-existing `?? .obsidian/` remained
untouched.

## Validation ledger

| Check | Result | Detail |
| --- | --- | --- |
| Final focused proof suite | PASS | `node --test os-platform/core/tests/local-agent-ollama-live-proof.test.mjs`: 15 passed, 0 failed; includes malformed-only, missing-terminal, empty-terminal, post-terminal malformed/additional, trailing-slash loopback, redirect rejection without a followed target request, and every required explicit safety flag. |
| Applicable provider/Ollama suites | PASS | `node --test os-platform/core/tests/local-agent-localops-provider.test.mjs os-platform/core/tests/local-agent-ollama-adapter.test.mjs`: 25 passed, 0 failed. |
| Core TypeScript | PASS | Direct repository-local invocation: `node node_modules/typescript/bin/tsc -p tsconfig.core.json`. |
| Phase 8.3 core tools | PASS | `node --test os-platform/core/tests/phase83-tools.test.mjs`: 56 passed, 0 failed. |
| Generated-code check | PASS | `node tools/registry/check-generated-js.mjs`: generated JS headers verified. |
| Normal `pnpm` wrappers | HOST-UNAVAILABLE | `pnpm run type-check`, `pnpm run check:generated`, and `pnpm canon:gatefast` each exit 1 before product evaluation because their child `node` is not recognized in this Windows/Volta shell. This is the unchanged Task 1 host PATH fault; direct TypeScript/generated checks above pass. |
| Direct canon GateFast | NOT-GREEN, EXPECTED | `node tools/canon/canon.mjs gatefast` reports dirty worktree (the uncommitted Task 2 docs) and the same unavailable `pnpm run type-check`; Phase 8.3 and naming lint pass. It is not represented as green. |
| Full registry security runner | BOUNDED-UNAVAILABLE | `node tools/registry/security-scan-runner.mjs` did not return within a 60-second bounded run; no matching runner process remained after timeout. |
| Exact changed-file secret-assignment scan | PASS | No matches for credential, token, password, secret, or API-key assignment forms in the two Task 2 documents. |
| Diff and branch scope | PASS | Candidate scope from the final hardened proof head is exactly the two reserved documentation paths; no other tracked or untracked non-ignored candidate file exists. |

## Non-claims

This evidence does not claim model quality, production readiness, deployment, compliance,
accreditation, Atlas database or Redis authorization, WilliamOS integration, a live county data
operation, service administration, PR review completion, remote checks, merge, or post-merge state.
