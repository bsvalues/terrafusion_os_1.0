# PluginLock Spec Lock v1.0.0

> **Purpose:** Marketplace plugins must declare an enforceable permission envelope. This is the contract between plugins and the TerraFusion runtime.

---

## Contract Status

| Field         | Value                |
| ------------- | -------------------- |
| Lock ID       | `pluginlock.v1`      |
| Surface       | `pluginlock`         |
| Version       | `1.0.0`              |
| Status        | `active`             |
| Owner         | `systemgpt`          |
| Created       | `2025-12-12`         |
| Updated       | `2025-12-12`         |

---

## Canonical PluginLock JSON Schema

### Required Fields

| Field                      | Type     | Description                                       |
| -------------------------- | -------- | ------------------------------------------------- |
| `plugin_id`                | string   | Unique plugin identifier (reverse domain)         |
| `version`                  | string   | Semantic version (X.Y.Z)                          |
| `permissions`              | object   | Permission envelope                               |
| `permissions.data_scopes`  | string[] | Data access scopes requested                      |
| `permissions.network`      | object   | Network access policy                             |
| `permissions.storage`      | string[] | Storage access types                              |
| `permissions.compute`      | object   | Compute resource limits                           |
| `sbom_sha256`              | string   | SHA-256 of SBOM (Software Bill of Materials)      |
| `slsa_provenance_sha256`   | string   | SHA-256 of SLSA provenance attestation            |

### Permission Scopes (Enum)

#### Data Scopes

| Scope                    | Description                              |
| ------------------------ | ---------------------------------------- |
| `property_read`          | Read property records                    |
| `property_write`         | Write property records                   |
| `assessment_read`        | Read assessment data                     |
| `assessment_write`       | Write assessment data                    |
| `gis_read`               | Read GIS/geospatial data                 |
| `gis_write`              | Write GIS/geospatial data                |
| `user_profile_read`      | Read user profile info                   |
| `audit_log_read`         | Read audit logs                          |
| `config_read`            | Read system configuration                |

#### Storage Types

| Type                     | Description                              |
| ------------------------ | ---------------------------------------- |
| `local_cache`            | Temporary local cache                    |
| `session_storage`        | Session-scoped storage                   |
| `persistent_local`       | Persistent local storage                 |
| `cloud_blob`             | Cloud blob storage access                |

#### Network Policies

- `allow_domains`: Explicit allowlist of domains
- `deny_domains`: Explicit denylist (takes precedence)

---

## Permission Enforcement Rules (MUST)

1. **Deny beats Allow**: If a domain appears in both `allow_domains` and `deny_domains`, DENY wins
2. **Default Deny**: If `allow_domains` is empty, no network access
3. **Compute Limits**: Plugin execution MUST be terminated if `max_cpu_ms` or `max_memory_mb` exceeded
4. **Scope Validation**: Unknown scopes MUST be rejected at load time
5. **SBOM Required**: Plugins without valid SBOM are not loadable
6. **SLSA Provenance**: SLSA Level 2+ provenance required for production deployment

---

## Generated Artifacts

| Artifact                                    | Purpose                                |
| ------------------------------------------- | -------------------------------------- |
| `generated/pluginlock.schema.json`          | JSON Schema for validation             |
| `generated/pluginlock.permissions.json`     | Normalized permissions (deterministic) |
| `generated/pluginlock.policy.rego`          | OPA policy fragment                    |

---

## Compiler Output

The PluginLock compiler transforms `speclock.spec.json` into:

1. **Normalized permissions JSON** — deterministic sorted keys
2. **OPA Rego policy** — runtime enforcement rules

### OPA Policy Template

```rego
package terrafusion.pluginlock

default allow = false

allow {
  input.plugin_id == "<plugin_id>"
  valid_data_scope
  valid_network
  valid_compute
  not denied_domain
}

denied_domain {
  some d
  d := input.network.domain
  d == data.pluginlock.deny_domains[_]
}

valid_data_scope {
  input.data_scope == data.pluginlock.data_scopes[_]
}

valid_network {
  input.network.domain == data.pluginlock.allow_domains[_]
}

valid_compute {
  input.cpu_ms <= data.pluginlock.compute.max_cpu_ms
  input.memory_mb <= data.pluginlock.compute.max_memory_mb
}
```

---

## Tests (MUST PASS)

### Schema Validation Tests

1. ✅ Schema validates canonical examples
2. ✅ Schema rejects missing required fields
3. ✅ Schema rejects unknown data scopes
4. ✅ Schema rejects invalid semver
5. ✅ Schema rejects malformed SHA-256

### Compiler Tests

1. ✅ Compiler emits deterministic outputs (stable hash)
2. ✅ Compiler generates valid OPA Rego
3. ✅ Deny list beats allow list in generated policy
4. ✅ Empty allow_domains means no network access

### Runtime Enforcement Tests

1. ✅ Plugin terminated on CPU limit exceeded
2. ✅ Plugin terminated on memory limit exceeded
3. ✅ Network request to denied domain blocked
4. ✅ Unknown scope rejected at load time

---

## Example PluginLock (Canonical)

```json
{
  "permissions": {
    "compute": {
      "max_cpu_ms": 5000,
      "max_memory_mb": 256
    },
    "data_scopes": [
      "assessment_read",
      "property_read"
    ],
    "network": {
      "allow_domains": [
        "api.terrafusion.io",
        "maps.googleapis.com"
      ],
      "deny_domains": [
        "malicious.example.com"
      ]
    },
    "storage": [
      "local_cache",
      "session_storage"
    ],
    "telemetry_required": true
  },
  "plugin_id": "io.terrafusion.plugins.property-analyzer",
  "sbom_sha256": "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  "slsa_provenance_sha256": "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  "version": "2.1.0"
}
```

---

## Sandbox Contract

Plugins run in an isolated sandbox with:

1. **Process isolation** — separate process/container
2. **Network filtering** — egress firewall based on allow/deny lists
3. **Resource limits** — cgroups/ulimit enforcement
4. **Capability drops** — no raw sockets, no ptrace, no mount
5. **Seccomp** — restricted syscall set

### Sandbox Verification Endpoint

```
GET /ops/plugins/{plugin_id}/sandbox-status

Response:
{
  "plugin_id": "io.terrafusion.plugins.property-analyzer",
  "version": "2.1.0",
  "sandbox": {
    "isolated": true,
    "network_filtered": true,
    "resource_limited": true,
    "capabilities_dropped": true,
    "seccomp_enabled": true
  },
  "permissions_enforced": true,
  "last_verified": "2025-12-12T12:00:00Z"
}
```

---

## CI/CD Enforcement

- **Plugin submission**: SBOM + SLSA provenance required
- **Schema validation**: `speclock-governance-gate.sh`
- **Permission audit**: Manual review for elevated scopes
- **Sandbox test**: Automated sandbox verification
- **Runtime monitoring**: Continuous enforcement telemetry

---

## Related Locks

- `receipt.v1` — Receipt generation for plugin artifacts
- `amendment.v1` — Governance changes for plugin system

---

## Agent Notes (do not delete)

<!--
Builder Session: 2025-12-12
- Created initial PluginLock v1.0.0 spec
- Defined permission envelope structure
- Established compiler output format (OPA Rego + normalized JSON)
- Defined sandbox contract
- Next: Generate schema and OPA policy

Breaker Session: pending
- Attacks to attempt:
  - [ ] Unknown data scope injection
  - [ ] Domain allow/deny confusion
  - [ ] Exceed compute limits
  - [ ] Missing SBOM/SLSA bypass
  - [ ] Invalid semver
-->
