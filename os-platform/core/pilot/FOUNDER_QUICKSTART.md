# TerraFusion Local Agent — Founder Quickstart

The local agent is the founder's co-pilot for the TerraFusion OS repo.
It runs entirely on your machine, writes governed artifacts under `.terrafusion/`,
and never mutates production data.

---

## Starting from scratch (30 seconds)

```powershell
# 1. Verify the repo environment
.\os-platform\core\pilot\tf.ps1 init

# 2. Check agent health (no model required)
.\os-platform\core\pilot\tf.ps1 doctor

# 3. Open the guided founder cockpit
.\os-platform\core\pilot\tf.ps1 start

# 4. View recent audit events
.\os-platform\core\pilot\tf.ps1 events

# 5. Inspect release readiness
.\os-platform\core\pilot\tf.ps1 release
```

---

## Shell-level shortcut (optional)

Add `os-platform\core\pilot` to your `$PATH` once:

```powershell
# Add permanently to your PowerShell profile:
$env:PATH += ";$PWD\os-platform\core\pilot"
```

After that, type `tf init`, `tf doctor`, `tf events`, etc. from anywhere inside the repo.

---

## Command reference

| Command | What it does |
|---------|--------------|
| `tf init` | First-run preflight — checks Node, pnpm, git, evidence folder |
| `tf doctor` | Health summary — locked card, proof, save-state, model availability |
| `tf start` | Founder cockpit — guided flows for daily work |
| `tf status` | Read-only daily glance (no model, no writes) |
| `tf events` | Tail the last 20 audit events from `.terrafusion/agent-events.jsonl` |
| `tf events --tail 50` | Show last 50 events |
| `tf events --type doctor_report_written` | Filter by event type |
| `tf release` | Read-only release plan — what's next, what's missing |
| `tf next` | Single safest next command recommendation |
| `tf help-me` | Full workflow reference |
| `tf explain-commands` | Machine-readable command map |

### Advisory (local LLM, Slice 2 — coming next)

`tf ask "..."` will send an advisory-only prompt to a locally configured model.
No writes, no governed mutations. Not wired yet — see Slice 2.

---

## NPM/pnpm equivalents (no PATH change required)

```bash
pnpm run tf:la -- init
pnpm run tf:la -- doctor
pnpm run tf:la -- start
pnpm run tf:la -- events
pnpm run tf:la -- release
```

---

## Governance rules (non-negotiable)

- No locked card → no patch.
- No preview → no write.
- No proof → no success claim.
- No finalize → no done.
- Model output is advisory only. It does not write to governed files.

---

## Troubleshooting

**`tf init` shows blockers**
Run `tf init` and address each item listed under `BLOCKERS`.

**`tf doctor` shows `WARN`**
Warnings are expected on a fresh clone (no locked card, no proof results, no model configured).
Run `tf start` to begin a bounded task; warnings clear as you progress.

**`tf doctor` shows `FAIL`**
Check `criticalFailures` in the output. Critical failures block release gates.

**Model gateway offline**
`tf doctor` and most commands work without a local LLM. Model-dependent commands
(`model-chat`, `model-health`, `list-models`) require `TF_LOCAL_MODEL_PORT` or
`--model-endpoint` to be set.

---

_TerraFusion OS — Government. Transcended._
