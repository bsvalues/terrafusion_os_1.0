# Marketplace Runtime Constitution v1.0.0 — SpecLock

> **Constitutional Anchor**: Third-party plugin governance with cryptographic integrity  
> **Blast Radius**: External code execution, attack surface containment  
> **Leverage**: Enables safe ecosystem expansion while maintaining government-grade security

---

## 1. Constitutional Scope

This constitution governs the **TerraFusion Marketplace subsystem** — the mechanism for installing, enabling, disabling, and managing third-party plugins and modules.

**In Scope:**
- Plugin lifecycle commands: `tf marketplace install`, `enable`, `disable`, `list`
- Plugin manifest schema (deterministic, versioned)
- Signature verification and bundle integrity
- Capability-based security model (permissions, sandbox boundaries)
- Plugin registry state management
- Integration with Deploy Constitution (handoff to `tf deploy`)

**Out of Scope (Phase 2+):**
- Plugin repository hosting/discovery
- Marketplace web UI
- Plugin versioning/upgrade strategy
- Plugin billing/licensing
- Runtime sandbox implementation (WASM/isolated process)

---

## 2. Constitutional Invariants

These 6 invariants are **IMMUTABLE** without constitutional amendment:

### Invariant 1: Signature Verification (Exit 1 on Unsigned)

**Plugin bundles MUST be cryptographically signed** unless running in explicit `--dev-unsigned` mode.

```bash
# ❌ Production: unsigned plugin rejected
tf marketplace install --bundle /path/to/unsigned-plugin
# Exit 1: "Signature verification failed"

# ✅ Development: unsigned allowed with flag
tf marketplace install --bundle /path/to/unsigned-plugin --dev-unsigned
# Proceeds with audit warning
```

**Enforcement:**
- Check for `bundle/signature.sig` + `bundle/public_key.pem`
- Verify signature against manifest SHA256
- Production environments (`techsupport`, `prod`) MUST reject `--dev-unsigned`
- Development environment (`dev`) MAY allow with audit trail

### Invariant 2: Deterministic Manifest Schema (Exit 2 on Invalid)

**Every plugin bundle MUST contain a valid `manifest.json`** conforming to the canonical schema.

**Required Fields:**
```json
{
  "name": "plugin-unique-name",
  "version": "1.0.0",
  "description": "Human-readable description",
  "author": "Author Name <email@example.com>",
  "license": "MIT",
  "capabilities": {
    "file_system": ["read:/data", "write:/tmp"],
    "network": ["https://api.example.com"],
    "database": ["read:properties", "write:assessments"]
  },
  "entrypoints": {
    "main": "./plugin.wasm",
    "config_ui": "./config.html"
  },
  "dependencies": {
    "react": "^18.0.0",
    "terrafusion-sdk": "^1.0.0"
  },
  "sbom_path": "./sbom.json",
  "runtime": {
    "type": "wasm",
    "max_memory_mb": 128,
    "timeout_seconds": 30
  }
}
```

**Validation Rules:**
- `name` MUST match `^[a-z0-9-]+$` (lowercase, numbers, hyphens only)
- `version` MUST be valid semver
- `capabilities` MUST NOT request forbidden permissions (e.g., `file_system: ["write:/"]`)
- `entrypoints.main` MUST exist in bundle
- `sbom_path` MUST point to valid SBOM file

**Exit Codes:**
- **Exit 2**: Malformed JSON, missing required fields, invalid format
- **Exit 1**: Valid structure but forbidden capabilities

### Invariant 3: Sandbox Execution Boundary (v1.0 = Declaration Only)

**Plugins MUST declare their runtime environment and resource limits.**

**v1.0.0 Scope (Declaration):**
- Manifest MUST include `runtime.type` (`wasm`, `node`, `python`)
- Manifest MUST include resource limits (`max_memory_mb`, `timeout_seconds`)
- Installation validates declarations (no enforcement yet)

**Phase 2 (Enforcement):**
- WASM sandbox with capability-based security
- Process isolation for native runtimes
- Resource limit enforcement (memory, CPU, I/O)

**Forbidden Patterns (v1.0):**
```json
{
  "runtime": {
    "type": "native",  // ❌ Not allowed in v1.0
    "unrestricted": true  // ❌ Never allowed
  }
}
```

### Invariant 4: SBOM Requirement (Exit 1 on Missing)

**Every plugin bundle MUST include a valid Software Bill of Materials.**

**Required Structure:**
```
plugin-bundle/
├── manifest.json
├── sbom.json          ← CycloneDX 1.4+ format
├── signature.sig
├── public_key.pem
└── plugin.wasm
```

**SBOM Validation:**
- MUST be CycloneDX 1.4+ or SPDX 2.3+ format
- MUST list all runtime dependencies
- MUST include component licenses
- MUST match `manifest.json` dependencies

**Rationale:** Government compliance (NIST SP 800-161, EO 14028 SBOM requirements)

### Invariant 5: Auditable Lifecycle (Exit 1 on Invalid State)

**Plugin state transitions MUST be deterministic and reversible.**

**State Machine:**
```
NOT_INSTALLED ──install──> INSTALLED (disabled)
                              │
                              │ enable
                              ▼
                           ENABLED (active)
                              │
                              │ disable
                              ▼
                           INSTALLED (disabled)
                              │
                              │ uninstall
                              ▼
                         NOT_INSTALLED
```

**Registry State:**
- Plugin registry stored at `config/marketplace/registry.json`
- Each state change appends to audit log (`config/marketplace/audit.log`)
- Concurrent modifications prevented (atomic file updates)

**Audit Log Entry:**
```json
{
  "timestamp": "2025-12-18T12:00:00Z",
  "action": "install",
  "plugin": "benton-property-importer",
  "version": "1.2.3",
  "user": "admin",
  "bundle_hash": "sha256:abc123..."
}
```

**Invalid State Transitions (Exit 1):**
- Enable a plugin that's not installed
- Install a plugin that's already installed (use `upgrade` instead)
- Uninstall an enabled plugin (must disable first)

### Invariant 6: Gate-First + No Active Sessions (Exit 1)

**Marketplace operations integrate with existing constitutional checks:**

1. **Gate Check**: All `install`/`enable` operations require passing gate
2. **No Active Sessions**: Prevent plugin modifications during agent sessions
3. **Deploy Handoff**: Plugin deployments use `tf deploy` for consistency

**Example Flow:**
```bash
# 1. Install plugin (gate + session checks)
tf marketplace install --bundle ./my-plugin.tar.gz
# → Runs gate check
# → Validates no active agent session
# → Verifies signature
# → Validates manifest + SBOM
# → Extracts to config/marketplace/plugins/my-plugin/

# 2. Enable plugin
tf marketplace enable --plugin my-plugin
# → Updates registry.json
# → Appends to audit.log

# 3. Deploy plugin to runtime (uses Deploy Constitution)
tf deploy --env dev --bundle config/marketplace/plugins/my-plugin/
```

---

## 3. Exit Code Contract

**Standardized across all marketplace commands:**

| Exit Code | Meaning | Examples |
|-----------|---------|----------|
| **0** | Success | Plugin installed, enabled, disabled, listed |
| **1** | Operational Failure | Signature verification failed, SBOM missing, gate check failed, active session detected, invalid state transition |
| **2** | Invalid Invocation | Missing required flags, malformed manifest, unknown command, invalid plugin name format |

**Consistency with Existing Constitutions:**
- Gate: 0=pass, 1=fail, 2=invalid
- Agent: 0=pass, 1=fail, 2=invalid
- Deploy: 0=success, 1=failure, 2=invalid
- **Marketplace**: 0=success, 1=failure, 2=invalid ✓

---

## 4. Command Surface

### 4.1 `tf marketplace install`

**Purpose:** Install a plugin bundle into the marketplace registry.

**Syntax:**
```bash
tf marketplace install --bundle <path> [--dev-unsigned] [--ci]
```

**Flags:**
- `--bundle <path>` (required): Path to plugin bundle (directory or .tar.gz)
- `--dev-unsigned` (optional): Allow unsigned plugins in dev environment only
- `--ci` (optional): Machine-readable JSON output

**Preflight Checks (in order):**
1. Validate invocation (exit 2 if `--bundle` missing)
2. Run gate check (exit 1 if gate fails)
3. Check for active sessions (exit 1 if session active)
4. Verify bundle exists (exit 1 if not found)
5. Validate manifest.json (exit 2 if malformed, exit 1 if forbidden capabilities)
6. Verify signature (exit 1 if unsigned and not `--dev-unsigned`)
7. Check SBOM presence (exit 1 if missing)
8. Check for duplicate install (exit 1 if already installed)

**Success Output (Human):**
```
✓ Plugin installed: benton-property-importer v1.2.3
  Bundle:      /path/to/bundle
  Signature:   ✓ Verified
  SBOM:        ✓ Valid (42 components)
  Installed:   config/marketplace/plugins/benton-property-importer/
  
Next steps:
  tf marketplace enable --plugin benton-property-importer
```

**Success Output (CI):**
```json
{
  "version": "1.0.0",
  "timestamp": "2025-12-18T12:00:00Z",
  "status": "success",
  "operation": "install",
  "plugin": {
    "name": "benton-property-importer",
    "version": "1.2.3",
    "bundle_hash": "sha256:abc123...",
    "signature_verified": true,
    "sbom_components": 42
  }
}
```

### 4.2 `tf marketplace enable`

**Purpose:** Enable an installed plugin for runtime use.

**Syntax:**
```bash
tf marketplace enable --plugin <name> [--ci]
```

**Preflight Checks:**
1. Validate plugin name format (exit 2 if invalid)
2. Check plugin is installed (exit 1 if not found)
3. Check plugin is not already enabled (exit 1 if already enabled)
4. Update registry.json atomically
5. Append to audit.log

**Success Output (Human):**
```
✓ Plugin enabled: benton-property-importer v1.2.3
  Status: ENABLED
  
Deploy to runtime:
  tf deploy --env dev --bundle config/marketplace/plugins/benton-property-importer/
```

### 4.3 `tf marketplace disable`

**Purpose:** Disable an enabled plugin.

**Syntax:**
```bash
tf marketplace disable --plugin <name> [--ci]
```

**Preflight Checks:**
1. Validate plugin name format (exit 2 if invalid)
2. Check plugin is enabled (exit 1 if not enabled)
3. Update registry.json atomically
4. Append to audit.log

**Success Output (Human):**
```
✓ Plugin disabled: benton-property-importer v1.2.3
  Status: INSTALLED (disabled)
```

### 4.4 `tf marketplace list`

**Purpose:** List all installed plugins and their status.

**Syntax:**
```bash
tf marketplace list [--status <installed|enabled|all>] [--ci]
```

**Flags:**
- `--status <filter>` (optional): Filter by status (default: all)
- `--ci` (optional): Machine-readable JSON output

**Success Output (Human):**
```
Installed Plugins:

  benton-property-importer v1.2.3 [ENABLED]
    Capabilities: database:read, database:write
    Runtime: wasm (128MB, 30s timeout)
    
  yakima-gis-overlay v2.0.1 [INSTALLED]
    Capabilities: file_system:read, network:https
    Runtime: wasm (64MB, 10s timeout)
    
Total: 2 plugins (1 enabled, 1 disabled)
```

**Success Output (CI):**
```json
{
  "version": "1.0.0",
  "timestamp": "2025-12-18T12:00:00Z",
  "status": "success",
  "plugins": [
    {
      "name": "benton-property-importer",
      "version": "1.2.3",
      "status": "enabled",
      "capabilities": ["database:read", "database:write"],
      "runtime": {"type": "wasm", "max_memory_mb": 128}
    },
    {
      "name": "yakima-gis-overlay",
      "version": "2.0.1",
      "status": "installed",
      "capabilities": ["file_system:read", "network:https"],
      "runtime": {"type": "wasm", "max_memory_mb": 64}
    }
  ]
}
```

---

## 5. Output Doctrine

**Human Mode (Default):**
- **Streaming**: Real-time progress indicators for signature verification, SBOM parsing
- **Color-coded**: Green (✓), red (✗), yellow (⚠) for status
- **Structured**: Clear sections with consistent formatting
- **Actionable**: Next steps and remediation guidance

**Machine Mode (`--ci`):**
- **JSON-only stdout**: Single-line JSON object
- **No ANSI sequences**: Plain text only
- **Deterministic schema**: Always includes `version`, `timestamp`, `status`
- **Errors on stderr**: Detailed error messages on stderr, JSON summary on stdout

**Consistency:**
- Matches Gate, Agent, Deploy output patterns
- Same color codes, same flag names (`--ci`)
- Same JSON schema structure

---

## 6. Forbidden Patterns

**The following patterns are NEVER allowed (breaker targets):**

1. **Unsigned Production Plugins:**
   ```bash
   # ❌ FORBIDDEN in techsupport/prod
   tf marketplace install --bundle ./plugin --dev-unsigned
   ```

2. **Unrestricted Capabilities:**
   ```json
   {
     "capabilities": {
       "file_system": ["write:/"],  // ❌ Root filesystem write
       "network": ["*"],             // ❌ Unrestricted network
       "database": ["admin"]         // ❌ Admin privileges
     }
   }
   ```

3. **Missing SBOM:**
   ```
   plugin-bundle/
   ├── manifest.json
   └── plugin.wasm
   # ❌ Missing sbom.json
   ```

4. **Bypass Gate Check:**
   ```bash
   # ❌ FORBIDDEN - no --skip-gate flag exists
   tf marketplace install --bundle ./plugin --skip-gate
   ```

5. **Direct File Manipulation:**
   ```bash
   # ❌ FORBIDDEN - must use tf marketplace commands
   echo '{"status":"enabled"}' > config/marketplace/registry.json
   ```

---

## 7. Implementation Checkpoints

**Phase 1 Deliverables (v1.0.0):**

- [ ] SpecLock document (this file)
- [ ] RED baseline test suite (`ops/dev/tests/test_marketplace_governance.sh`)
- [ ] Command implementations in `ops/dev/tf.sh`:
  - [ ] `cmd_marketplace()` dispatcher
  - [ ] `cmd_marketplace_install()` with signature verification
  - [ ] `cmd_marketplace_enable()` with state validation
  - [ ] `cmd_marketplace_disable()` with audit logging
  - [ ] `cmd_marketplace_list()` with JSON mode
- [ ] Plugin manifest schema validator
- [ ] Registry state manager (`config/marketplace/registry.json`)
- [ ] Audit log appender (`config/marketplace/audit.log`)
- [ ] GREEN test suite (all tests passing)
- [ ] Constitutional freeze in `ops/agents/CONVENTIONS.md`
- [ ] Git tag: `v1.0.0-marketplace-constitution`

**Phase 2 (Future):**
- Runtime sandbox enforcement (WASM execution)
- Plugin upgrade/downgrade commands
- Marketplace repository integration
- Plugin dependency resolution
- Capability enforcement at runtime

---

## 8. Test Plan (15 Tests)

**Section A: Invocation Validity (4 tests)**
- A1: Missing `--bundle` returns exit 2
- A2: Invalid plugin name format returns exit 2
- A3: Unknown subcommand returns exit 2
- A4: Invalid flag combination returns exit 2

**Section B: Gate-First Enforcement (2 tests)**
- B1: Install rejects when gate fails (exit 1)
- B2: Gate pass allows install to proceed

**Section C: Active Session Prevention (2 tests)**
- C1: Install rejects with active session (exit 1)
- C2: No active session allows install

**Section D: Bundle Validation (4 tests)**
- D1: Missing manifest.json returns exit 2
- D2: Malformed manifest JSON returns exit 2
- D3: Forbidden capabilities return exit 1
- D4: Valid bundle passes validation

**Section E: Signature Verification (2 tests)**
- E1: Unsigned bundle rejects in production (exit 1)
- E2: `--dev-unsigned` allows in dev environment

**Section F: CI JSON Purity (3 tests)**
- F1: `--ci` emits JSON-only stdout
- F2: CI JSON includes required schema fields
- F3: No ANSI sequences in CI output

**Section G: Lifecycle State Machine (3 tests)**
- G1: Enable uninstalled plugin fails (exit 1)
- G2: Disable not-enabled plugin fails (exit 1)
- G3: Install → Enable → Disable → Uninstall succeeds

**Total: 20 tests** (RED baseline → implementation → GREEN validation)

---

## 9. Rollback Protocol

**If constitutional violations are discovered post-seal:**

1. **Immediate:** Revert to last known-good tag
   ```bash
   git checkout v1.0.0-marketplace-constitution~1
   ```

2. **Emergency:** Disable all plugins
   ```bash
   # Emergency plugin killswitch
   tf marketplace disable --all --force
   ```

3. **Investigation:** Conduct shadow review against historical sessions
4. **Amendment:** Follow constitutional amendment process (SpecLock → RFC → shadow review → tag)

**Rollback Safety:**
- Plugin registry is versioned (can restore previous state)
- Audit log is append-only (no data loss)
- Enabled plugins can be disabled without data loss

---

## 10. Amendment Process

**This constitution can only be modified through:**

1. Create SpecLock document with proposed changes
2. Submit RFC with evidence (security vulnerability, scale requirement, compliance mandate)
3. Pass breaker review (all 20 tests remain GREEN)
4. Conduct shadow review (test against 10+ historical plugin installations)
5. Tag constitutional version bump: `v1.1.0-marketplace-constitution`

**Minor Amendments (Patch):**
- Clarifications to existing invariants
- Documentation improvements
- Non-breaking test additions

**Major Amendments (Minor):**
- New capabilities in capability model
- New manifest schema fields
- New subcommands

**Breaking Amendments (Major):**
- Changes to exit code contract
- Removal of invariants
- Changes to manifest schema that break existing plugins

---

## 11. Related Constitutional Documents

**Prerequisites:**
- [Gate Constitution v1.0.0](../dev/GATE_RUNTIME_CONSTITUTION_v1.0.0_SPECLOCK.md)
- [Agent Constitution v1.0.0](../agents/AGENT_RUNTIME_CONSTITUTION_v1.0.0_SPECLOCK.md)
- [Deploy Constitution v1.0.0](../deploy/DEPLOY_RUNTIME_CONSTITUTION_v1.0.0_SPECLOCK.md)

**Integration Points:**
- Marketplace `install` calls `tf gate` for preflight
- Marketplace checks `ops/agents/ACTIVE_SESSION` before modifications
- Plugin deployment uses `tf deploy --bundle` for consistency

**Audit Trail:**
- All marketplace operations logged to `config/marketplace/audit.log`
- Audit log included in gate check (`tf gate` reads audit log)
- Constitutional amendments require audit log review

---

## 12. Security Model

**Defense in Depth:**

1. **Layer 1: Signature Verification** (cryptographic integrity)
2. **Layer 2: Manifest Validation** (capability declarations)
3. **Layer 3: SBOM Enforcement** (dependency transparency)
4. **Layer 4: State Machine** (lifecycle integrity)
5. **Layer 5: Audit Logging** (forensic evidence)
6. **Layer 6: Runtime Sandbox** (Phase 2: execution isolation)

**Threat Model:**

| Threat | Mitigation |
|--------|------------|
| Malicious plugin | Signature verification, capability restrictions |
| Supply chain attack | SBOM requirement, dependency transparency |
| Privilege escalation | Capability-based security, sandbox isolation |
| State corruption | Atomic registry updates, audit logging |
| Bypass gate check | Hard-coded gate enforcement, no skip flags |

**Compliance Alignment:**
- FISMA-High: Cryptographic signatures, audit logging
- NIST SP 800-161: SBOM requirements, supply chain transparency
- EO 14028: Software bill of materials, secure development

---

**Constitutional Anchor Established**: v1.0.0-marketplace-constitution  
**Date**: 2025-12-18  
**Status**: DRAFT (pending RED → GREEN → SEAL)  
**Next**: Create `test_marketplace_governance.sh` RED baseline
