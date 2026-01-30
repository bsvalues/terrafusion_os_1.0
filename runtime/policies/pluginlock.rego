# TerraFusion PluginLock Policy v1.0.0
# Auto-generated - DO NOT EDIT MANUALLY
# Source: docs/spec-lock/locks/pluginlock/pluginlock.v1/speclock.spec.json

package terrafusion.pluginlock

default allow = false

# Main allow rule - all conditions must pass
allow {
    valid_plugin_id
    valid_data_scope
    valid_network_access
    valid_compute_limits
    not denied_domain
}

# Plugin ID validation
valid_plugin_id {
    input.plugin_id == "io.terrafusion.plugins.property-analyzer"
}

# Data scope validation - input scope must be in allowed list
valid_data_scope {
    allowed_scopes := {"assessment_read", "property_read"}
    allowed_scopes[input.data_scope]
}

# Network access validation - domain must be in allow list
valid_network_access {
    allowed_domains := {"api.terrafusion.io", "maps.googleapis.com"}
    allowed_domains[input.network.domain]
}

# Compute limit validation
valid_compute_limits {
    input.cpu_ms <= 5000
    input.memory_mb <= 256
}

# Deny list takes precedence - if domain is denied, block
denied_domain {
    denied_domains := {"malicious.example.com"}
    denied_domains[input.network.domain]
}

# Storage access validation
valid_storage {
    allowed_storage := {"local_cache", "session_storage"}
    allowed_storage[input.storage_type]
}

# Telemetry requirement check
telemetry_compliant {
    input.telemetry_enabled == true
}

# Combined enforcement for sandbox
sandbox_allowed {
    allow
    valid_storage
    telemetry_compliant
}
