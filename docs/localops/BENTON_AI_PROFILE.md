# Benton AI Profile (LocalOps)

> **Status:** PLANNING — documented profile *shape*. This is the source material for the config
> contract that **WO-LOCALOPS-001** will implement and validate. It is **not** a live config and binds
> nothing at runtime today.
> **Rule:** the default posture is **local-only, no silent fallback**. Anything that loosens this must
> be an explicit, auditable flag with a documented approval record.

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

## Validation expectations (for WO-LOCALOPS-001)

- A profile with `egress.cloud_allowed: true` **and** `approval_record: null` is **invalid**.
- A profile with `fallback_policy` other than `none` requires `egress.cloud_allowed: true` + approval.
- `indexable_sources` may not include county-document or PII paths unless an explicit approval rule
  names them.
- Missing `county_id` on a county-scoped profile is **invalid**.

## Open questions

These are deferred to [`BENTON_IT_QUESTIONS.md`](BENTON_IT_QUESTIONS.md): which local model/hardware
is available, what egress (if any) Benton policy permits, and what data classification rules apply.
