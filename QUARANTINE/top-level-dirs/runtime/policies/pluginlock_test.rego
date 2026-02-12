# TerraFusion PluginLock OPA Tests (GOD-TIER)
# Tests for pluginlock.policy.rego

package terrafusion.pluginlock_test

import data.terrafusion.pluginlock

# Test: Valid plugin ID is allowed
test_valid_plugin_id {
    pluginlock.valid_plugin_id with input as {
        "plugin_id": "io.terrafusion.plugins.property-analyzer"
    }
}

# Test: Invalid plugin ID is denied
test_invalid_plugin_id {
    not pluginlock.valid_plugin_id with input as {
        "plugin_id": "io.malicious.plugins.bad-actor"
    }
}

# Test: Valid data scope is allowed
test_valid_data_scope {
    pluginlock.valid_data_scope with input as {
        "data_scope": "assessment_read"
    }
}

# Test: Invalid data scope is denied
test_invalid_data_scope {
    not pluginlock.valid_data_scope with input as {
        "data_scope": "admin_write"
    }
}

# Test: Valid network domain is allowed
test_valid_network_domain {
    pluginlock.valid_network_access with input as {
        "network": {"domain": "api.terrafusion.io"}
    }
}

# Test: Invalid network domain is denied
test_invalid_network_domain {
    not pluginlock.valid_network_access with input as {
        "network": {"domain": "evil.example.com"}
    }
}

# Test: Denied domain is blocked (deny-wins)
test_denied_domain_blocked {
    pluginlock.denied_domain with input as {
        "network": {"domain": "malicious.example.com"}
    }
}

# Test: CPU within limit is allowed
test_cpu_within_limit {
    pluginlock.valid_compute_limits with input as {
        "cpu_ms": 4000,
        "memory_mb": 200
    }
}

# Test: CPU exceeds limit is denied
test_cpu_exceeds_limit {
    not pluginlock.valid_compute_limits with input as {
        "cpu_ms": 6000,
        "memory_mb": 200
    }
}

# Test: Memory exceeds limit is denied
test_memory_exceeds_limit {
    not pluginlock.valid_compute_limits with input as {
        "cpu_ms": 4000,
        "memory_mb": 300
    }
}

# Test: Full allow with all valid inputs
test_full_allow {
    pluginlock.allow with input as {
        "plugin_id": "io.terrafusion.plugins.property-analyzer",
        "data_scope": "assessment_read",
        "network": {"domain": "api.terrafusion.io"},
        "cpu_ms": 4000,
        "memory_mb": 200
    }
}

# Test: Full deny with denied domain (deny-wins)
test_deny_wins_over_allow {
    not pluginlock.allow with input as {
        "plugin_id": "io.terrafusion.plugins.property-analyzer",
        "data_scope": "assessment_read",
        "network": {"domain": "malicious.example.com"},
        "cpu_ms": 4000,
        "memory_mb": 200
    }
}

# Test: Storage validation
test_valid_storage {
    pluginlock.valid_storage with input as {
        "storage_type": "local_cache"
    }
}

# Test: Invalid storage is denied
test_invalid_storage {
    not pluginlock.valid_storage with input as {
        "storage_type": "filesystem_full_access"
    }
}

# Test: Telemetry compliance
test_telemetry_compliant {
    pluginlock.telemetry_compliant with input as {
        "telemetry_enabled": true
    }
}

# Test: Telemetry non-compliance
test_telemetry_non_compliant {
    not pluginlock.telemetry_compliant with input as {
        "telemetry_enabled": false
    }
}

# Test: Sandbox allowed with all requirements
test_sandbox_allowed {
    pluginlock.sandbox_allowed with input as {
        "plugin_id": "io.terrafusion.plugins.property-analyzer",
        "data_scope": "assessment_read",
        "network": {"domain": "api.terrafusion.io"},
        "cpu_ms": 4000,
        "memory_mb": 200,
        "storage_type": "local_cache",
        "telemetry_enabled": true
    }
}
