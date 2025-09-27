# TerraFusion Security Policies - Open Policy Agent (OPA)
# Government-grade access control and security policies

package terrafusion.authz

import future.keywords.if
import future.keywords.in

# Default deny - Zero Trust principle
default allow = false

# Service-to-service communication policy
allow if {
    input.source_service
    input.target_service
    input.operation
    
    # Verify source service has valid attestation
    valid_attestation(input.source_service)
    
    # Check if operation is allowed for this service pair
    allowed_operation(input.source_service, input.target_service, input.operation)
    
    # Verify trust relationship exists
    trust_relationship_exists(input.source_service, input.target_service)
}

# County services access policy
allow if {
    input.user
    input.resource == "county_records"
    input.operation in ["read", "search"]
    
    # User must have county access role
    has_role(input.user, "county_staff")
    
    # Must be accessing own county's data
    same_county(input.user, input.parcel_county)
}

# Property valuation policy
allow if {
    input.user
    input.resource == "property_valuation"
    input.operation == "calculate"
    
    # Either county staff or licensed appraiser
    any([
        has_role(input.user, "county_staff"),
        has_role(input.user, "licensed_appraiser"),
        has_role(input.user, "ai_swarm_operator")
    ])
}

# AI Swarm access policy
allow if {
    input.service_identity
    input.resource == "ai_swarm"
    input.operation in ["analyze", "predict", "optimize"]
    
    # Service must be attested and have AI capabilities
    valid_attestation(input.service_identity)
    has_capability(input.service_identity, "ai_integration")
}

# Administrative access policy
allow if {
    input.user
    input.resource == "system_admin"
    
    # Must be system administrator
    has_role(input.user, "system_admin")
    
    # Must have MFA enabled
    mfa_enabled(input.user)
    
    # Must be from secure network
    secure_network(input.source_ip)
}

# Helper functions
valid_attestation(service_id) if {
    # Query Trust Fabric for attestation status
    response := http.send({
        "method": "GET",
        "url": sprintf("http://trust-fabric:7000/verify/%s", [service_id]),
        "headers": {"Content-Type": "application/json"}
    })
    
    response.status_code == 200
    response.body.verified == true
}

allowed_operation(source, target, operation) if {
    # Define allowed operations between services
    allowed_ops := {
        "terrafusion-backend": {
            "postgres": ["read", "write"],
            "redis": ["read", "write", "cache"],
            "trust-fabric": ["verify", "attest"],
            "ai-swarm": ["analyze", "predict"]
        },
        "trust-fabric": {
            "consul": ["register", "discover"],
            "vault": ["read_secrets"],
            "spire-server": ["identity", "verify"]
        },
        "ai-swarm": {
            "postgres": ["read"],
            "redis": ["cache"],
            "trust-fabric": ["attest"]
        }
    }
    
    operation in allowed_ops[source][target]
}

trust_relationship_exists(source, target) if {
    # Query Trust Fabric for trust relationship
    response := http.send({
        "method": "GET",
        "url": sprintf("http://trust-fabric:7000/trust/%s/%s", [source, target]),
        "headers": {"Content-Type": "application/json"}
    })
    
    response.status_code == 200
    response.body.trust_exists == true
}

has_role(user, role) if {
    # Query user service for role information
    user_roles := data.users[user].roles
    role in user_roles
}

same_county(user, parcel_county) if {
    user_county := data.users[user].county
    user_county == parcel_county
}

has_capability(service_id, capability) if {
    # Query Trust Fabric for service capabilities
    response := http.send({
        "method": "GET",
        "url": sprintf("http://trust-fabric:7000/capabilities/%s", [service_id]),
        "headers": {"Content-Type": "application/json"}
    })
    
    response.status_code == 200
    capability in response.body.capabilities
}

mfa_enabled(user) if {
    user_info := data.users[user]
    user_info.mfa_enabled == true
}

secure_network(ip) if {
    # Define secure IP ranges
    secure_ranges := [
        "172.20.0.0/16",  # Internal Docker network
        "10.0.0.0/8",     # Internal corporate network
        "127.0.0.1/32"    # Localhost
    ]
    
    net.cidr_contains(secure_ranges[_], ip)
}
