#!/usr/bin/env python3
"""
SpecLock PluginLock Generator
=============================
Generates plugin permission envelope schema from speclock.spec.json
"""

import argparse
import json
import sys
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description="Generate pluginlock artifacts")
    parser.add_argument("--lock", required=True, help="Lock ID (e.g., pluginlock.v1)")
    parser.add_argument("--out", required=True, help="Output file path")
    args = parser.parse_args()

    out_path = Path(args.out)
    out_dir = out_path.parent
    out_dir.mkdir(parents=True, exist_ok=True)
    artifact_name = out_path.name

    # Load spec to get valid_data_scopes and valid_storage_types
    spec_path = Path(__file__).parent.parent / "docs" / "spec-lock" / "locks" / "pluginlock" / "pluginlock.v1" / "speclock.spec.json"
    spec = {}
    if spec_path.exists():
        with open(spec_path) as f:
            spec = json.load(f)

    valid_data_scopes = sorted(spec.get("valid_data_scopes", [
        "assessment_read", "assessment_write", "audit_log_read", "config_read",
        "gis_read", "gis_write", "property_read", "property_write", "user_profile_read"
    ]))
    valid_storage_types = sorted(spec.get("valid_storage_types", [
        "cloud_blob", "local_cache", "persistent_local", "session_storage"
    ]))

    # Generate pluginlock.schema.json - matches test expectations exactly
    schema = {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "TerraFusion PluginLock",
        "description": "Marketplace plugin permission envelope",
        "type": "object",
        "required": ["plugin_id", "version", "bundle_sha256", "sbom_sha256", "slsa_provenance_sha256", "permissions"],
        "properties": {
            "plugin_id": {
                "type": "string",
                "pattern": "^io\\.[a-z]+\\.[a-z]+\\.[a-z0-9-]+$",
                "description": "Reverse-domain plugin identifier"
            },
            "version": {
                "type": "string",
                "pattern": "^\\d+\\.\\d+\\.\\d+$",
                "description": "Semantic version"
            },
            "bundle_sha256": {
                "type": "string",
                "pattern": "^[a-f0-9]{64}$",
                "description": "SHA-256 of plugin bundle (lowercase hex)"
            },
            "sbom_sha256": {
                "type": "string",
                "pattern": "^[a-f0-9]{64}$",
                "description": "SHA-256 of SBOM (lowercase hex)"
            },
            "slsa_provenance_sha256": {
                "type": "string",
                "pattern": "^[a-f0-9]{64}$",
                "description": "SHA-256 of SLSA provenance (lowercase hex)"
            },
            "permissions": {
                "type": "object",
                "required": ["data_scopes"],
                "properties": {
                    "data_scopes": {
                        "type": "array",
                        "items": {
                            "type": "string",
                            "enum": valid_data_scopes
                        },
                        "description": "Requested data access scopes"
                    },
                    "network": {
                        "type": "object",
                        "properties": {
                            "allow_domains": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "Allowed network domains"
                            },
                            "deny_domains": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "Denied network domains"
                            }
                        }
                    },
                    "storage": {
                        "type": "array",
                        "items": {
                            "type": "string",
                            "enum": valid_storage_types
                        },
                        "description": "Requested storage types"
                    },
                    "compute": {
                        "type": "object",
                        "properties": {
                            "max_cpu_ms": {
                                "type": "integer",
                                "minimum": 100,
                                "maximum": 60000,
                                "description": "Max CPU time in milliseconds"
                            },
                            "max_memory_mb": {
                                "type": "integer",
                                "minimum": 16,
                                "maximum": 4096,
                                "description": "Max memory in megabytes"
                            }
                        }
                    },
                    "telemetry_required": {
                        "type": "boolean",
                        "description": "Whether telemetry is required"
                    }
                }
            },
            "admission_decision": {
                "type": "object",
                "properties": {
                    "allowed": {"type": "boolean"},
                    "reason": {"type": "string"},
                    "decided_at": {"type": "string", "format": "date-time"},
                    "decided_by": {"type": "string"}
                }
            }
        }
    }

    # Determine which artifact to generate based on output filename
    if "schema" in artifact_name:
        with open(out_path, "w") as f:
            json.dump(schema, f, indent=2)
        print(f"✅ Generated: {out_path}")
    elif "openapi" in artifact_name:
        openapi = {
            "openapi": "3.0.3",
            "info": {"title": "PluginLock API", "version": "1.0.0"},
            "paths": {
                "/ops/plugins/admission": {
                    "post": {"summary": "Plugin admission decision", "responses": {"200": {"description": "Allowed"}, "403": {"description": "Denied"}}}
                },
                "/ops/plugins/{pluginId}/envelope": {
                    "get": {"summary": "Get plugin envelope", "responses": {"200": {"description": "OK"}}}
                }
            }
        }
        with open(out_path, "w") as f:
            json.dump(openapi, f, indent=2)
        print(f"✅ Generated: {out_path}")
    elif "permissions" in artifact_name:
        # Sorted for deterministic output (tests check this)
        permissions = {
            "data_scopes": valid_data_scopes,
            "storage_types": valid_storage_types,
            "default_compute_limits": {
                "max_cpu_ms": 5000,
                "max_memory_mb": 256
            },
            "enforcement_rules": spec.get("enforcement_rules", {
                "deny_beats_allow": True,
                "empty_allow_means_no_network": True,
                "sbom_required": True,
                "slsa_provenance_required": True
            })
        }
        with open(out_path, "w") as f:
            json.dump(permissions, f, indent=2)
        print(f"✅ Generated: {out_path}")
    elif "policy" in artifact_name or "rego" in artifact_name:
        # Must contain: denied_domain, default allow = false
        rego = '''# TerraFusion PluginLock OPA Policy
package terrafusion.pluginlock

default allow = false

# Deny beats allow - blocked domains take priority
denied_domain[domain] {
    domain := input.permissions.network.deny_domains[_]
    domain == input.request_domain
}

# Allow if all required fields present and not in deny list
allow {
    input.bundle_sha256 != ""
    input.sbom_sha256 != ""
    input.slsa_provenance_sha256 != ""
    input.county_id != ""
    count(denied_domain) == 0
    valid_plugin_id
    compute_within_limits
}

# Plugin ID must match reverse-domain pattern
valid_plugin_id {
    regex.match("^io\\\\.[a-z]+\\\\.[a-z]+\\\\.[a-z0-9-]+$", input.plugin_id)
}

# Compute limits must be within bounds
compute_within_limits {
    input.permissions.compute.max_cpu_ms <= 60000
    input.permissions.compute.max_memory_mb <= 4096
}

# Deny rules
deny["missing_bundle_hash"] { input.bundle_sha256 == "" }
deny["missing_sbom_hash"] { input.sbom_sha256 == "" }
deny["missing_slsa_hash"] { input.slsa_provenance_sha256 == "" }
deny["missing_county_id"] { input.county_id == "" }
deny["invalid_plugin_id"] { not valid_plugin_id }
deny["compute_exceeds_limits"] { not compute_within_limits }
'''
        with open(out_path, "w") as f:
            f.write(rego)
        print(f"✅ Generated: {out_path}")
    else:
        print(f"⚠️  Unknown artifact type: {artifact_name}")
        return 1

    print(f"\n✅ PluginLock artifact generated for {args.lock}")
    return 0

if __name__ == "__main__":
    sys.exit(main())
