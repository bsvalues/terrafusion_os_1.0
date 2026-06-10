# Benton AI Profile (LocalOps)

> **Status:** CONTRACT IMPLEMENTED (WO-LOCALOPS-001) — the config contract now exists at
> `os-platform/core/pilot/local-agent/aiProfile.ts` (`resolveAiProfile`, `redactedAiProfileSummary`),
> with tests in `os-platform/core/tests/local-agent-ai-profile.test.mjs` and the env template in
> `.env.example`. Provider calls, RAG, diagnostics, and UI remain **unimplemented** (later WOs).
> **Rule:** the default posture is **local-only, no silent fallback**. Anything that loosens this must
> be an explicit, auditable flag with a documented approval record.

## Implemented contract (WO-LOCALOPS-001)

| Env flag | Field | Notes |
|----------|-------|-------|
| `AI_PROFILE` | `profile` | `cloud-dev` \| `hybrid-approved` \| `localops` \| `disabled`. **Unset → `disabled`** (opt-in). Unknown values are **rejected**, not coerced. |
| `AI_PROVIDER` | `provider` | Provider id (e.g. `ollama`). Empty = unset. |
| `AI_BASE_URL` | `baseUrl` | Endpoint URL. Empty = unset; **no hardcoded port defaults**. |
| `AI_MODEL` | `model` | Model name. |
| `AI_EXTERNAL_CALLS` | `externalCalls` | `localops`/`disabled`: `false`, **cannot be set true** (tighten-only). |
| `AI_ALLOW_WEB` | `allowWeb` | Same tighten-only rule. |
| `AI_ALLOW_SHELL` | `allowShell` | Default `false` in **every** profile; tighten-only under `localops`/`disabled`. |
| `AI_ALLOW_MUTATION` | `allowMutation` | Default `false` in **every** profile; tighten-only under `localops`/`disabled`. |
| `AI_REQUIRE_TRACE` | `requireTrace` | Default `true`; `localops`/`disabled` **cannot set false**. |
| `AI_REQUIRE_SOURCES` | `requireSources` | `localops`: `true`, cannot set false. `cloud-dev` default `false`. |
| `AI_LOCAL_KB_PATH` | `localKbPath` | Default `docs/localops`. |
| `AI_RUNBOOK_PATH` | `runbookPath` | Default `docs/localops/BENTON_SERVER_RUNBOOK.md`. |

Profile permission defaults:

| Profile | external | web | shell | mutation | trace | sources |
|---------|----------|-----|-------|----------|-------|---------|
| `cloud-dev` | true | true | false | false | true | false |
| `hybrid-approved` | true | false | false | false | true | true |
| `localops` | **false** | **false** | **false** | **false** | **true** | **true** |
| `disabled` | **false** | **false** | **false** | **false** | **true** | **true** |

Validation guarantees (enforced by `resolveAiProfile`, proven by tests):

- The contract **cannot express** "localops with cloud fallback": `AI_EXTERNAL_CALLS=true` under
  `localops`/`disabled` throws `AiProfileError` directing the operator to `hybrid-approved` (which
  requires a documented approval record per county policy).
- Malformed booleans (anything other than `1/0/true/false`) are rejected — a typo never silently
  becomes `false`.
- `redactedAiProfileSummary` strips URL credentials and routes every string through the local-agent
  redactor (API keys, tokens, emails, SSNs, user paths) before display.

## Provider abstraction (WO-LOCALOPS-002)

`createLocalOpsProvider` (`os-platform/core/pilot/local-agent/localOpsProvider.ts`) turns a resolved
profile into the **one** provider it permits, and **fails closed** otherwise — no silent fallback:

- `disabled` → refusing provider (`AI_DISABLED`); all `complete()` calls return a structured refusal.
- `localops` + a **local** provider (`ollama`, loopback base URL) → active local provider.
- `localops`/`disabled` + an **external** provider (`openai`/`claude`/`anthropic`/`remote`) →
  `EXTERNAL_PROVIDER_REFUSED`. External adapters are not constructed by v1 at all
  (`EXTERNAL_NOT_IMPLEMENTED` even under `hybrid-approved`) — wiring them is a later, separately-approved WO.
- missing/unknown provider, missing model, or non-loopback base URL → fail closed
  (`PROVIDER_NOT_CONFIGURED` / `UNKNOWN_PROVIDER_REFUSED` / `PROVIDER_UNAVAILABLE`).
- an injected adapter that does not declare `capabilities.local` is refused under a no-external profile
  (`NON_LOCAL_ADAPTER_REFUSED`) — silent fallback is impossible even through dependency injection.

`provider.status()` returns a redacted, network-free health summary (profile/provider/model/baseUrl
redacted; adapter name; refusal code+reason). All refusal `reason` strings are redaction-safe.
**No provider performs network I/O at construction or status time.**

## Purpose

Describe, in plain terms, what a Benton County LocalOps AI profile must express so that LocalOps can
operate safely inside the county boundary. WO-LOCALOPS-001 turns this into a typed schema with
validation; the shapes below are illustrative, not final.

## Profile dimensions

### 1. Providers (ordered preference, local-first)

| Field | Intent |
|-------|--------|
| `providers.local` | The on-prem/local model(s) LocalOps prefers (e.g. an Ollama model). |
| `providers.cloud` | Allowed **only** if `egress.cloud_allowed: true` with an approval record. Empty/forbidden by default. |
| `providers.fallback_policy` | Must be `none` by default. **No silent cloud fallback.** |

### 2. Egress / boundary

| Field | Intent |
|-------|--------|
| `egress.mode` | Default `local-only`. Other values require explicit approval + justification. |
| `egress.cloud_allowed` | Default `false`. If `true`, must reference an `approval_record`. |
| `egress.approval_record` | Pointer to the documented human approval for any non-local egress. |

### 3. Data boundary

| Field | Intent |
|-------|--------|
| `data.county_id` | The sovereign county scope (Benton). County-scoped reads filter by this. |
| `data.pii_policy` | PII never leaves the boundary and never enters trace payloads (sanitized/by-reference). |
| `data.indexable_sources` | Allowlist of sources a local KB may index (runbooks, public docs). County docs/PII excluded unless an approval rule names them. |

### 4. Grounding

| Field | Intent |
|-------|--------|
| `grounding.required` | Default `true`. Operational answers must cite a source. |
| `grounding.sources` | The grounding corpus (local runbooks, this `docs/localops/` tree, approved docs). |

### 5. Trace

| Field | Intent |
|-------|--------|
| `trace.emit` | Default `true`. Every action emits an append-only TerraTrace event. |
| `trace.pii_sanitize` | Default `true`. Enforced per TerraPilot spec §4. |
| `trace.retention_category` | County-configurable retention class for LocalOps events. |

## Illustrative shape (NOT a live config)

```yaml
# ILLUSTRATIVE ONLY — WO-LOCALOPS-001 defines the authoritative schema.
profile: benton-localops-v1
providers:
  local: ['ollama:<model>']     # on-prem
  cloud: []                     # empty unless explicitly approved
  fallback_policy: none         # NO silent cloud fallback
egress:
  mode: local-only
  cloud_allowed: false
  approval_record: null
data:
  county_id: '<benton-county-id>'
  pii_policy: never-egress-never-trace
  indexable_sources: ['docs/localops/**', '<approved-runbooks>']
grounding:
  required: true
  sources: ['docs/localops/**', '<approved-docs>']
trace:
  emit: true
  pii_sanitize: true
  retention_category: '<county-configured>'
```

## Validation expectations — disposition after WO-LOCALOPS-001

WO-LOCALOPS-001 implemented the contract as **env flags** (table above) rather than the richer YAML
document sketched earlier in this file. Disposition of the original expectations:

- *"cloud allowed requires an approval record"* → **Implemented as profile structure:** cloud egress
  is only expressible via the `hybrid-approved`/`cloud-dev` profiles; `localops`/`disabled` reject
  `AI_EXTERNAL_CALLS=true` outright. The machine-readable `approval_record` pointer is **deferred**
  (revisit when Benton IT answers the egress questions).
- *"fallback_policy other than none requires approval"* → **Implemented:** there is no fallback flag
  at all; a provider may only be external if the profile itself permits external calls.
- *"indexable_sources approval rules"* → **Deferred to WO-LOCALOPS-004** (`AI_LOCAL_KB_PATH` exists,
  but indexing approval gates are the KB work order's contract).
- *"missing county_id is invalid"* → **Deferred:** county scoping rides on the existing Sovereign
  County mechanisms; a profile-level `county_id` field is revisited with WO-LOCALOPS-003/004.

## Open questions

These are deferred to [`BENTON_IT_QUESTIONS.md`](BENTON_IT_QUESTIONS.md): which local model/hardware
is available, what egress (if any) Benton policy permits, and what data classification rules apply.
