#!/usr/bin/env python3
"""
TerraFusion PluginLock Compiler (GOD-TIER)

Compiles PluginLock spec to runtime artifacts:
- pluginlock.policy.rego (OPA policy)
- pluginlock.permissions.json (runtime permissions)

Usage:
  python scripts/speclock-compile-pluginlock.py [--spec PATH] [--out DIR]
"""

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

SPEC_DEFAULT = Path("docs/spec-lock/locks/pluginlock/pluginlock.v1/speclock.spec.json")
OUT_DEFAULT = Path("docs/spec-lock/locks/pluginlock/pluginlock.v1/generated")
RUNTIME_OUT = Path("runtime/policies")

def load_spec(path: Path) -> dict[str, Any]:
    """Load PluginLock spec JSON."""
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def generate_rego_policy(spec: dict[str, Any]) -> str:
    """Generate OPA Rego policy from spec."""
    data_scopes = spec.get("data_scopes", [])
    network = spec.get("network", {})
    compute = spec.get("compute", {})
    storage = spec.get("storage", [])

    allow_domains = network.get("allow_domains", [])
    deny_domains = network.get("deny_domains", [])
    max_cpu = compute.get("max_cpu_ms", 5000)
    max_mem = compute.get("max_memory_mb", 256)

    scopes_set = ", ".join(f'"{s}"' for s in data_scopes)
    allow_set = ", ".join(f'"{d}"' for d in allow_domains)
    deny_set = ", ".join(f'"{d}"' for d in deny_domains)
    storage_set = ", ".join(f'"{s}"' for s in storage)

    return f'''# TerraFusion PluginLock Policy v{spec.get("version", "1.0.0")}
# Auto-generated - DO NOT EDIT MANUALLY
# Source: {spec.get("lock_id", "pluginlock.v1")}
# Generated: {datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")}

package terrafusion.pluginlock

default allow = false

# Main allow rule - all conditions must pass
allow {{
    valid_plugin_id
    valid_data_scope
    valid_network_access
    valid_compute_limits
    not denied_domain
}}

# Plugin ID validation
valid_plugin_id {{
    input.plugin_id == "{spec.get("plugin_id", "")}"
}}

# Data scope validation - input scope must be in allowed list
valid_data_scope {{
    allowed_scopes := {{{scopes_set}}}
    allowed_scopes[input.data_scope]
}}

# Network access validation - domain must be in allow list
valid_network_access {{
    allowed_domains := {{{allow_set}}}
    allowed_domains[input.network.domain]
}}

# Compute limit validation
valid_compute_limits {{
    input.cpu_ms <= {max_cpu}
    input.memory_mb <= {max_mem}
}}

# Deny list takes precedence - if domain is denied, block (DENY-WINS)
denied_domain {{
    denied_domains := {{{deny_set}}}
    denied_domains[input.network.domain]
}}

# Storage access validation
valid_storage {{
    allowed_storage := {{{storage_set}}}
    allowed_storage[input.storage_type]
}}

# Telemetry requirement check
telemetry_compliant {{
    input.telemetry_enabled == true
}}

# Combined enforcement for sandbox
sandbox_allowed {{
    allow
    valid_storage
    telemetry_compliant
}}
'''

def generate_permissions_json(spec: dict[str, Any]) -> dict[str, Any]:
    """Generate runtime permissions JSON from spec."""
    return {
        "plugin_id": spec.get("plugin_id", ""),
        "version": spec.get("version", "1.0.0"),
        "data_scopes": spec.get("data_scopes", []),
        "network": {
            "allow_domains": spec.get("network", {}).get("allow_domains", []),
            "deny_domains": spec.get("network", {}).get("deny_domains", [])
        },
        "compute": {
            "max_cpu_ms": spec.get("compute", {}).get("max_cpu_ms", 5000),
            "max_memory_mb": spec.get("compute", {}).get("max_memory_mb", 256)
        },
        "storage": spec.get("storage", []),
        "telemetry_required": spec.get("telemetry_required", True)
    }

def main():
    parser = argparse.ArgumentParser(description="TerraFusion PluginLock Compiler (GOD-TIER)")
    parser.add_argument("--spec", type=Path, default=SPEC_DEFAULT, help="Path to speclock.spec.json")
    parser.add_argument("--out", type=Path, default=OUT_DEFAULT, help="Output directory for generated files")
    parser.add_argument("--runtime", type=Path, default=RUNTIME_OUT, help="Runtime policies directory")

    args = parser.parse_args()

    print("═" * 60)
    print("  TerraFusion PluginLock Compiler (GOD-TIER)")
    print("═" * 60)

    if not args.spec.exists():
        print(f"❌ Spec file not found: {args.spec}")
        sys.exit(1)

    # Load spec
    spec = load_spec(args.spec)
    print(f"\n📋 Loaded: {spec.get('lock_id', 'unknown')} v{spec.get('version', '?')}")

    # Ensure output directories exist
    args.out.mkdir(parents=True, exist_ok=True)
    args.runtime.mkdir(parents=True, exist_ok=True)

    # Generate Rego policy
    rego = generate_rego_policy(spec)
    rego_path = args.out / "pluginlock.policy.rego"
    rego_path.write_text(rego, encoding="utf-8")
    print(f"   📄 Generated: {rego_path}")

    # Copy to runtime
    runtime_rego = args.runtime / "pluginlock.rego"
    runtime_rego.write_text(rego, encoding="utf-8")
    print(f"   📄 Copied to: {runtime_rego}")

    # Generate permissions JSON
    permissions = generate_permissions_json(spec)
    permissions_path = args.out / "pluginlock.permissions.json"
    with open(permissions_path, "w", encoding="utf-8") as f:
        json.dump(permissions, f, indent=2, sort_keys=True)
    print(f"   📄 Generated: {permissions_path}")

    print("\n✅ PluginLock compilation complete")
    print(f"   Data scopes: {len(spec.get('data_scopes', []))}")
    print(f"   Allow domains: {len(spec.get('network', {}).get('allow_domains', []))}")
    print(f"   Deny domains: {len(spec.get('network', {}).get('deny_domains', []))}")
    print(f"   Max CPU: {spec.get('compute', {}).get('max_cpu_ms', '?')}ms")
    print(f"   Max Memory: {spec.get('compute', {}).get('max_memory_mb', '?')}MB")

if __name__ == "__main__":
    main()
