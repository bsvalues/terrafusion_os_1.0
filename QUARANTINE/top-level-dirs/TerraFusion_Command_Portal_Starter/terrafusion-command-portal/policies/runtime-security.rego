package terrafusion.runtime

import rego.v1

# TerraFusion Runtime Security Policies
# Enforces security policies during application runtime

default allow_request := false

# Allow request if all runtime security checks pass
allow_request if {
    valid_authentication
    valid_authorization  
    rate_limit_check
    data_access_authorized
    audit_logging_enabled
    threat_detection_passed
}

# Authentication validation
valid_authentication if {
    # JWT token validation
    jwt_valid
    token_not_expired
    issuer_trusted
}

jwt_valid if {
    input.request.headers["authorization"]
    token := trim_prefix(input.request.headers["authorization"], "Bearer ")
    io.jwt.verify_rs256(token, input.config.public_key)
}

token_not_expired if {
    token := trim_prefix(input.request.headers["authorization"], "Bearer ")
    payload := io.jwt.decode(token)[1]
    payload.exp > time.now_ns() / 1000000000
}

issuer_trusted if {
    token := trim_prefix(input.request.headers["authorization"], "Bearer ")
    payload := io.jwt.decode(token)[1]
    payload.iss in trusted_issuers
}

trusted_issuers := {
    "https://auth.terrafusion.gov",
    "https://county.benton.gov/auth",
    "https://county.franklin.gov/auth", 
    "https://county.yakima.gov/auth"
}

# Authorization validation based on user roles and permissions
valid_authorization if {
    user_has_required_permissions
    resource_access_allowed
    time_based_access_valid
}

user_has_required_permissions if {
    token := trim_prefix(input.request.headers["authorization"], "Bearer ")
    payload := io.jwt.decode(token)[1]
    user_permissions := payload.permissions
    
    required_permission := resource_permission_mapping[input.request.path]
    required_permission in user_permissions
}

resource_permission_mapping := {
    "/api/citizens": "citizen.read",
    "/api/citizens/create": "citizen.write", 
    "/api/records": "records.read",
    "/api/records/create": "records.write",
    "/api/permits": "permits.read",
    "/api/permits/approve": "permits.approve",
    "/api/emergency": "emergency.access",
    "/api/admin": "admin.access",
    "/api/federation": "federation.access"
}

resource_access_allowed if {
    # Check resource-specific access rules
    resource_type := extract_resource_type(input.request.path)
    resource_rules_satisfied(resource_type)
}

extract_resource_type(path) := type if {
    path_parts := split(path, "/")
    count(path_parts) >= 3
    type := path_parts[2]  # /api/{resource_type}/...
}

resource_rules_satisfied("citizens") if {
    # Citizen data access requires specific jurisdiction
    token := trim_prefix(input.request.headers["authorization"], "Bearer ")
    payload := io.jwt.decode(token)[1]
    user_county := payload.county
    
    # Users can only access citizens from their county or federated counties
    target_county := input.request.query.county
    target_county in accessible_counties(user_county)
}

resource_rules_satisfied("records") if {
    # Public records access based on classification
    record_classification := input.request.query.classification
    classification_accessible(record_classification)
}

resource_rules_satisfied("permits") if {
    # Permit access based on jurisdiction and permit type
    permit_jurisdiction_valid
    permit_type_authorized
}

resource_rules_satisfied("emergency") if {
    # Emergency access has special rules
    emergency_access_authorized
}

accessible_counties(user_county) := counties if {
    base_counties := {user_county}
    federated_counties := federation_partners[user_county]
    counties := base_counties | federated_counties
}

federation_partners := {
    "benton": {"franklin", "yakima"},
    "franklin": {"benton", "yakima"}, 
    "yakima": {"benton", "franklin"}
}

classification_accessible("public") := true
classification_accessible("internal") if user_is_employee
classification_accessible("confidential") if user_has_clearance
classification_accessible("restricted") if user_has_high_clearance

user_is_employee if {
    token := trim_prefix(input.request.headers["authorization"], "Bearer ")
    payload := io.jwt.decode(token)[1]
    "employee" in payload.roles
}

user_has_clearance if {
    token := trim_prefix(input.request.headers["authorization"], "Bearer ")
    payload := io.jwt.decode(token)[1]
    payload.clearance_level >= 3
}

user_has_high_clearance if {
    token := trim_prefix(input.request.headers["authorization"], "Bearer ")
    payload := io.jwt.decode(token)[1]
    payload.clearance_level >= 5
}

permit_jurisdiction_valid if {
    token := trim_prefix(input.request.headers["authorization"], "Bearer ")
    payload := io.jwt.decode(token)[1]
    user_county := payload.county
    permit_county := input.request.query.county
    
    # Can access permits from own county or federated counties
    permit_county in accessible_counties(user_county)
}

permit_type_authorized if {
    token := trim_prefix(input.request.headers["authorization"], "Bearer ")
    payload := io.jwt.decode(token)[1]
    user_permissions := payload.permissions
    
    permit_type := input.request.query.type
    required_permission := permit_permission_map[permit_type]
    required_permission in user_permissions
}

permit_permission_map := {
    "building": "permits.building",
    "business": "permits.business",
    "environmental": "permits.environmental",
    "emergency": "permits.emergency"
}

emergency_access_authorized if {
    token := trim_prefix(input.request.headers["authorization"], "Bearer ")
    payload := io.jwt.decode(token)[1]
    
    # Emergency access requires special role or active emergency declaration
    emergency_role_assigned(payload) or active_emergency_declared
}

emergency_role_assigned(payload) if {
    "emergency_responder" in payload.roles
}

emergency_role_assigned(payload) if {
    "emergency_coordinator" in payload.roles  
}

emergency_role_assigned(payload) if {
    "county_emergency_manager" in payload.roles
}

active_emergency_declared if {
    # Check if there's an active emergency declaration
    input.system.emergency_status == "active"
    input.system.emergency_level in ["yellow", "orange", "red"]
}

time_based_access_valid if {
    # Check business hours for certain operations
    current_hour := time.clock(time.now_ns())[0]
    
    # Most operations allowed 24/7
    always_allowed_resource
}

time_based_access_valid if {
    # Some operations only during business hours
    current_hour := time.clock(time.now_ns())[0]
    current_hour >= 8
    current_hour <= 17
    business_hours_resource
}

always_allowed_resource if {
    resource := extract_resource_type(input.request.path)
    resource in ["emergency", "citizens", "records"]
}

business_hours_resource if {
    resource := extract_resource_type(input.request.path)  
    resource in ["admin", "permits"]
    input.request.method != "GET"
}

# Rate limiting based on user and resource type
rate_limit_check if {
    rate_limit_not_exceeded
}

rate_limit_not_exceeded if {
    token := trim_prefix(input.request.headers["authorization"], "Bearer ")
    payload := io.jwt.decode(token)[1]
    user_id := payload.sub
    
    current_rate := input.system.rate_limits[user_id].current_requests
    rate_limit := user_rate_limit(payload)
    
    current_rate < rate_limit
}

user_rate_limit(payload) := limit if {
    "admin" in payload.roles
    limit := 1000  # Higher limit for admins
}

user_rate_limit(payload) := limit if {
    "employee" in payload.roles
    not "admin" in payload.roles
    limit := 500  # Medium limit for employees
}

user_rate_limit(payload) := limit if {
    not "employee" in payload.roles
    limit := 100  # Lower limit for citizens
}

# Data access authorization with field-level controls
data_access_authorized if {
    requested_fields_allowed
    data_masking_applied
}

requested_fields_allowed if {
    token := trim_prefix(input.request.headers["authorization"], "Bearer ")
    payload := io.jwt.decode(token)[1]
    
    requested_fields := input.request.query.fields
    allowed_fields := user_allowed_fields(payload)
    
    # All requested fields must be in allowed fields
    field_subset_allowed(requested_fields, allowed_fields)
}

field_subset_allowed(requested, allowed) if {
    count([field | field := requested[_]; not field in allowed]) == 0
}

user_allowed_fields(payload) := fields if {
    "admin" in payload.roles
    fields := all_fields  # Admins see everything
}

user_allowed_fields(payload) := fields if {
    "employee" in payload.roles
    not "admin" in payload.roles
    fields := employee_fields
}

user_allowed_fields(payload) := fields if {
    not "employee" in payload.roles
    fields := public_fields
}

all_fields := {
    "name", "address", "phone", "email", "ssn", 
    "birth_date", "employment", "income", "assets"
}

employee_fields := {
    "name", "address", "phone", "email", "birth_date"
}

public_fields := {
    "name", "public_records"
}

data_masking_applied if {
    # Ensure PII is masked for non-authorized users
    token := trim_prefix(input.request.headers["authorization"], "Bearer ")
    payload := io.jwt.decode(token)[1]
    
    not "admin" in payload.roles
    pii_masking_enabled
}

data_masking_applied if {
    # Admins don't need masking
    token := trim_prefix(input.request.headers["authorization"], "Bearer ")
    payload := io.jwt.decode(token)[1]
    "admin" in payload.roles
}

pii_masking_enabled if {
    input.system.data_masking == true
}

# Audit logging requirements
audit_logging_enabled if {
    # All requests must be logged for compliance
    input.system.audit_logging == true
}

# Threat detection integration
threat_detection_passed if {
    not suspicious_activity_detected
    not known_threat_source
    not anomalous_behavior
}

suspicious_activity_detected if {
    # Check for suspicious patterns
    input.request.suspicious_indicators > 3
}

known_threat_source if {
    client_ip := input.request.client_ip
    client_ip in blocked_ips
}

blocked_ips := {
    "192.168.1.100",  # Example blocked IPs
    "10.0.0.50"
}

anomalous_behavior if {
    # Check for unusual access patterns
    token := trim_prefix(input.request.headers["authorization"], "Bearer ")
    payload := io.jwt.decode(token)[1]
    user_id := payload.sub
    
    # Unusual time access
    unusual_time_access(user_id)
}

unusual_time_access(user_id) if {
    current_hour := time.clock(time.now_ns())[0]
    user_typical_hours := input.system.user_patterns[user_id].typical_hours
    
    not current_hour in user_typical_hours
    count(user_typical_hours) > 0  # Only if we have pattern data
}

# Risk scoring for requests
risk_score := score if {
    auth_risk := authentication_risk
    authz_risk := authorization_risk
    data_risk := data_access_risk
    threat_risk := threat_detection_risk
    
    score := auth_risk + authz_risk + data_risk + threat_risk
}

authentication_risk := 0 if valid_authentication
authentication_risk := 50 if not valid_authentication

authorization_risk := 0 if valid_authorization
authorization_risk := 30 if not valid_authorization

data_access_risk := 0 if data_access_authorized
data_access_risk := 20 if not data_access_authorized

threat_detection_risk := 0 if threat_detection_passed
threat_detection_risk := 40 if not threat_detection_passed

# Final request decision with context
request_decision := decision if {
    decision := {
        "allowed": allow_request,
        "risk_score": risk_score,
        "risk_level": risk_category(risk_score),
        "user_context": extract_user_context,
        "resource_context": extract_resource_context,
        "security_context": {
            "authentication": valid_authentication,
            "authorization": valid_authorization,
            "rate_limit": rate_limit_check,
            "data_access": data_access_authorized,
            "audit_logging": audit_logging_enabled,
            "threat_detection": threat_detection_passed
        },
        "recommendations": security_recommendations
    }
}

extract_user_context := context if {
    token := trim_prefix(input.request.headers["authorization"], "Bearer ")
    payload := io.jwt.decode(token)[1]
    context := {
        "user_id": payload.sub,
        "county": payload.county,
        "roles": payload.roles,
        "permissions": payload.permissions,
        "clearance_level": payload.clearance_level
    }
}

extract_resource_context := context if {
    context := {
        "path": input.request.path,
        "method": input.request.method,
        "resource_type": extract_resource_type(input.request.path),
        "classification": input.request.query.classification
    }
}

risk_category(score) := "low" if score <= 20
risk_category(score) := "medium" if { score > 20; score <= 50 }
risk_category(score) := "high" if { score > 50; score <= 80 }
risk_category(score) := "critical" if score > 80

security_recommendations := recommendations if {
    recommendations := [rec |
        some check in failed_checks
        rec := generate_security_recommendation(check)
    ]
}

failed_checks := checks if {
    checks := array.concat(
        auth_checks,
        array.concat(
            authz_checks, 
            array.concat(
                data_checks,
                threat_checks
            )
        )
    )
}

auth_checks := ["authentication"] if not valid_authentication
auth_checks := [] if valid_authentication

authz_checks := ["authorization"] if not valid_authorization  
authz_checks := [] if valid_authorization

data_checks := ["data_access"] if not data_access_authorized
data_checks := [] if data_access_authorized

threat_checks := ["threat_detection"] if not threat_detection_passed
threat_checks := [] if threat_detection_passed

generate_security_recommendation("authentication") := {
    "type": "authentication_failure",
    "severity": "high", 
    "message": "Request authentication failed",
    "action": "Verify JWT token and ensure trusted issuer"
}

generate_security_recommendation("authorization") := {
    "type": "authorization_failure",
    "severity": "high",
    "message": "User lacks required permissions", 
    "action": "Review user roles and resource permissions"
}

generate_security_recommendation("data_access") := {
    "type": "data_access_violation",
    "severity": "medium",
    "message": "Data access not properly authorized",
    "action": "Apply appropriate data masking and field restrictions"
}

generate_security_recommendation("threat_detection") := {
    "type": "security_threat",
    "severity": "critical",
    "message": "Potential security threat detected",
    "action": "Block request and investigate anomalous behavior"
}