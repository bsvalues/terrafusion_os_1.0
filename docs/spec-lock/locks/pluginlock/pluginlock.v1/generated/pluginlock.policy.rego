# TerraFusion PluginLock OPA Policy
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
    regex.match("^io\\.[a-z]+\\.[a-z]+\\.[a-z0-9-]+$", input.plugin_id)
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
