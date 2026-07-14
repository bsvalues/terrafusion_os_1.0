# WO-MAO-002 R1 Hook Runtime Repair Evidence

- **Work Order:** `WO-MAO-002`
- **Worker:** `R1`
- **Issue:** [#1277 - Execution Runtime Defect](https://github.com/bsvalues/terrafusion_os_1.0/issues/1277)
- **Evidence observed:** `2026-07-14T17:29:54Z`
- **Classification:** Documentation of an already-completed user-global Codex hook repair

## Workspace Identity

| Field | Observed value |
| --- | --- |
| Worktree | `C:\Users\bsval\.codex-worktrees\mao-002-r1-hook-runtime-repair` |
| Branch | `codex/mao-002-r1-hook-runtime-repair` |
| Repository root | `C:/Users/bsval/.codex-worktrees/mao-002-r1-hook-runtime-repair` |
| `HEAD` | `9986f5b4e4ffea1d10e3c9915745c0f280612639` |
| `origin/main` | `9986f5b4e4ffea1d10e3c9915745c0f280612639` |
| Initial status | Clean; `git status --short` returned no entries |

The worktree path, branch, repository root, clean status, and base equality were checked before any
repository write. This worker did not operate in the shared checkout.

## Repair State Observed

The repair itself occurred before this evidence lane. R1 made no user-global configuration or plugin
cache changes. Read-only inspection found:

1. `C:\Users\bsval\.codex\config.toml` sets
   `[plugins."agentforce-adlc@claude-plugins-official"]` to `enabled = false`.
2. The Ralph Loop `1.0.0`, Security Guidance `2.0.6`, and Semgrep `2.1.2` hook manifests each contain
   explicit `commandWindows` commands that invoke
   `C:\Program Files\Git\bin\bash.exe` rather than relying on Windows command resolution.
3. The trusted hook hashes in `config.toml` match the `currentHash` values returned by the installed
   Codex app-server for every discovered synchronous Ralph, Security Guidance, and Semgrep hook.
4. Agentforce was absent from the app-server hook inventory for this worktree.

The repaired manifest paths are:

| Plugin | Manifest |
| --- | --- |
| Ralph Loop | `C:\Users\bsval\.codex\plugins\cache\claude-plugins-official\ralph-loop\1.0.0\hooks\hooks.json` |
| Security Guidance | `C:\Users\bsval\.codex\plugins\cache\claude-plugins-official\security-guidance\2.0.6\hooks\hooks.json` |
| Semgrep | `C:\Users\bsval\.codex\plugins\cache\claude-plugins-official\semgrep\2.1.2\hooks\hooks.json` |

## Codex Discovery And Fingerprints

The installed runtime is `codex-cli 0.144.4`. Its official tagged implementation selects
`commandWindows` on Windows before normalizing a command hook, computes the trust fingerprint from the
normalized event, matcher group, and selected handler definition, and compares that `currentHash`
with `hooks.state.<key>.trusted_hash`. It skips async handlers before adding runnable/list entries
because async hooks are not supported. See the official
[`rust-v0.144.4` hook discovery implementation](https://github.com/openai/codex/blob/rust-v0.144.4/codex-rs/hooks/src/engine/discovery.rs#L807-L931).

The repaired hashes observed through `hooks/list` were:

| Hook key or key set | `currentHash` | Trust |
| --- | --- | --- |
| `ralph-loop@claude-plugins-official:hooks/hooks.json:stop:0:0` | `sha256:fc8177f266c25a31740a827a9048b59ae3cc9939b779ec3b187d01b3ee02b70e` | `trusted` |
| Security Guidance `post_tool_use:0:0` | `sha256:50b11260583331be719197794cd3c9caa82651fc0375fd920d7f06de5ae70999` | `trusted` |
| Security Guidance `post_tool_use:1:0` through `post_tool_use:1:4` | `sha256:87270083ed62e8cf30eaf590c98499ccb81268796cc192f6990fcac3ed2ca1c7` | `trusted` |
| Security Guidance `session_start:0:0` | `sha256:992bff2c862c8cce5010b8a5b5315172c1649787878fa811aa6f7aed4a98cf3f` | `trusted` |
| Security Guidance `user_prompt_submit:0:0` | `sha256:11a5118400226749b5ad13d08155ee6f07827621d63e08b777eed96bfdf73b87` | `trusted` |
| Security Guidance `stop:0:0` | `sha256:533af4976286609846d2d5dafd538a72c52989dd69807d5d679cf76da7a63a01` | `trusted` |
| Semgrep `pre_tool_use:0:0` | `sha256:f8d5ec63f9391ac4d0e365c272c51ad4ced424c7bb49cbcd218875f7d847bded` | `trusted` |
| Semgrep `post_tool_use:0:0` | `sha256:5f5a7e9bda43c6a02804205854783d08dd17e0ce11c15cadc7f41498a0c17c43` | `trusted` |

R1 performed the documented app-server handshake (`initialize`, `initialized`, `hooks/list`) against
the exact assigned worktree. The official method contract is documented in the
[`rust-v0.144.4` app-server README](https://github.com/openai/codex/blob/rust-v0.144.4/codex-rs/app-server/README.md#hooks).
The response contained 17 discovered hooks in total, including 12 repaired synchronous entries from
Ralph, Security Guidance, and Semgrep. For the scoped result:

```text
errors: []
Agentforce entries: 0
Ralph/Security Guidance/Semgrep synchronous trustStatus: trusted
warning: skipping async hook in ...\semgrep\2.1.2\hooks\hooks.json: async hooks are not supported yet
```

The Semgrep async handler remains intentionally skipped. This is an observed Codex capability limit,
not a repaired or passing async execution path.

## Benign Direct Execution

R1 replayed bounded benign inputs through the repaired Windows entrypoints from the isolated
worktree:

| Hook | Safety condition | Result |
| --- | --- | --- |
| Ralph Stop | `.claude/ralph-loop.local.md` was absent, so the hook had no active loop state to mutate | Exit `0` |
| Security Guidance PostToolUse | Benign Bash payload with `SECURITY_GUIDANCE_DISABLE=1`; exercised Git Bash, the Python selector shim, and the Python hook's disabled path | Exit `0`; emitted skipped metrics |
| Semgrep PreToolUse | Empty JSON payload through Git Bash and the Windows hook binary | Exit `0`; emitted `{}` |

`git status --short` remained empty after these direct checks.

## Validation Record

| Validation | Result |
| --- | --- |
| Required worktree identity and clean-base preflight | PASS |
| Root `AGENTS.md`, `brain/packs/README.md`, issue #1277, and current MAO program/evidence docs read | PASS |
| Targeted user-global config and repaired manifest inspection | PASS |
| Codex `0.144.4` app-server `hooks/list` | PASS; repaired hooks trusted, Agentforce absent, `errors` empty |
| Benign Ralph, Security Guidance, and Semgrep direct executions | PASS; all exit `0` |
| Exact changed-file scope review | PASS; only this evidence file is present in status |
| Untracked-aware `git diff --no-index --check` | PASS; no whitespace diagnostics |
| `node docs/brain/workorders/tools/wo-query.mjs --json` | PASS; exit `0`, read-only mode |
| Markdown formatting check | NOT RUN; no local Prettier executable is installed |

## Boundaries And Non-Claims

- This evidence proves only the observed user-global hook repair state and the bounded rechecks above.
- It does not prove issue #1277 complete. In particular, it does not prove two native Codex child
  agents completed independently, two isolated mutable lanes completed without collision, either
  MAO-002 pilot PR merged, or automatic next-wave continuation occurred.
- The portfolio worker plane is not claimed operational by this document.
- The app-server result is a point-in-time observation for Codex `0.144.4`, the listed plugin
  versions, this machine, and this worktree. It is not a permanent guarantee.
- The repaired manifests are under the user-global plugin cache. A plugin install or upgrade may
  overwrite those cache edits and require the repair and trusted fingerprints to be reapplied.
- The direct executions do not claim every semantic branch of each plugin hook was exercised.
- R1 did not edit user-global files and did not change repository runtime, product behavior, CI,
  deployment, production, county, PACS, credentials, secrets, SQL, or county data.
- The only authorized repository write is this evidence file. No commit or push is part of this lane.
