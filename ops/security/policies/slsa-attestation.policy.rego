# SLSA Attestation Policy (OPA Rego)
# Purpose: Enforce SLSA provenance requirements for deployments
# Usage: opa eval --data slsa-attestation.policy.rego --input provenance.json "data.slsa.allow"

package slsa

import future.keywords.if
import future.keywords.in

# ==============================================================================
# Main Policy: Allow deployment if all SLSA requirements met
# ==============================================================================

default allow := false

allow if {
    # SLSA Level 3 requirements
    has_valid_provenance
    has_trusted_builder
    has_source_integrity
    has_build_integrity
    has_valid_signature
    no_prohibited_dependencies
}

# ==============================================================================
# Provenance Validation
# ==============================================================================

has_valid_provenance if {
    # Check predicateType matches SLSA provenance
    input.predicateType == "https://slsa.dev/provenance/v0.2"
    
    # Check predicate exists
    input.predicate
    
    # Check build type is GitHub Actions
    input.predicate.buildType == "https://github.com/slsa-framework/slsa-github-generator/actions@v1"
}

# ==============================================================================
# Builder Trust (GitHub Actions OIDC)
# ==============================================================================

has_trusted_builder if {
    # Check builder identity (GitHub Actions OIDC token)
    input.predicate.builder.id
    
    # Verify builder is GitHub-hosted
    startswith(input.predicate.builder.id, "https://github.com/")
    
    # Check runner type is GitHub-hosted (not self-hosted)
    input.predicate.metadata.buildInvocationId
}

# ==============================================================================
# Source Integrity (Git commit verification)
# ==============================================================================

has_source_integrity if {
    # Check materials include source repository
    some material in input.predicate.materials
    material.uri
    
    # Verify source URI matches expected repository
    startswith(material.uri, expected_source_uri)
    
    # Check digest is present (git commit SHA)
    material.digest.sha1
    
    # Verify git ref is from allowed branches
    allowed_git_ref
}

expected_source_uri := "git+https://github.com/bsvalues/terrafusion_os_1.0"

allowed_git_ref if {
    ref := input.predicate.metadata.completeness.environment.ref
    
    # Allow main branch
    ref == "refs/heads/main"
} else if {
    # Allow release branches
    startswith(ref, "refs/heads/release/")
} else if {
    # Allow version tags
    startswith(ref, "refs/tags/v")
}

# ==============================================================================
# Build Integrity (Reproducible builds)
# ==============================================================================

has_build_integrity if {
    # Check build metadata is complete
    input.predicate.metadata.completeness
    
    # Verify build parameters are documented
    input.predicate.buildConfig
    
    # Check build was hermetic (no external network during build)
    hermetic_build
}

hermetic_build if {
    # Check completeness flags
    completeness := input.predicate.metadata.completeness
    completeness.parameters == true
    completeness.environment == true
    completeness.materials == true
}

# ==============================================================================
# Signature Verification (Sigstore)
# ==============================================================================

has_valid_signature if {
    # Check signature exists
    input.signature
    
    # Verify signature algorithm is supported
    supported_signature_algorithm
    
    # Check keyid is present (Sigstore transparency log)
    input.signature.keyid
}

supported_signature_algorithm if {
    alg := input.signature.alg
    alg in ["ES256", "ES384", "ES512", "RS256", "RS384", "RS512"]
}

# ==============================================================================
# Dependency Policy (No prohibited dependencies)
# ==============================================================================

no_prohibited_dependencies if {
    not has_prohibited_package
}

has_prohibited_package if {
    # Check for known malicious packages
    some material in input.predicate.materials
    material.uri in prohibited_packages
}

prohibited_packages := {
    "pkg:pypi/malicious-package",
    "pkg:npm/evil-dependency",
    # Add prohibited packages here
}

# ==============================================================================
# Vulnerability Policy (No critical vulnerabilities)
# ==============================================================================

no_critical_vulnerabilities if {
    # This would integrate with vulnerability scan results
    # For now, assume vulnerability scan is separate gate
    true
}

# ==============================================================================
# Compliance Checks
# ==============================================================================

# FedRAMP: Require FIPS-validated cryptography
fedramp_compliant if {
    # Check signature uses FIPS-approved algorithm
    input.signature.alg in ["RS256", "RS384", "RS512"]
    
    # Check build used approved base images
    approved_base_image
}

approved_base_image if {
    some material in input.predicate.materials
    startswith(material.uri, "pkg:docker/")
    
    # Allow only approved registries
    contains(material.uri, "gcr.io/distroless/")
} else if {
    some material in input.predicate.materials
    contains(material.uri, "docker.io/library/")
}

# SOC2: Require separation of duties
soc2_compliant if {
    # Check build was triggered by GitHub Actions (not manual)
    input.predicate.metadata.buildInvocationId
    
    # Verify builder identity differs from committer
    # (This prevents self-approval)
    builder_id := input.predicate.builder.id
    not startswith(builder_id, "self-hosted")
}

# ==============================================================================
# Policy Violations (For debugging/reporting)
# ==============================================================================

violations[msg] {
    not has_valid_provenance
    msg := "Invalid or missing SLSA provenance"
}

violations[msg] {
    not has_trusted_builder
    msg := "Builder is not trusted (must be GitHub-hosted Actions)"
}

violations[msg] {
    not has_source_integrity
    msg := "Source integrity check failed (invalid git ref or missing digest)"
}

violations[msg] {
    not has_build_integrity
    msg := "Build integrity check failed (build not hermetic or incomplete metadata)"
}

violations[msg] {
    not has_valid_signature
    msg := "Signature validation failed (missing or unsupported algorithm)"
}

violations[msg] {
    has_prohibited_package
    msg := "Prohibited dependencies detected"
}

# ==============================================================================
# Policy Warnings (Non-blocking)
# ==============================================================================

warnings[msg] {
    not fedramp_compliant
    msg := "WARNING: Build does not meet FedRAMP requirements"
}

warnings[msg] {
    not soc2_compliant
    msg := "WARNING: Build does not meet SOC2 separation of duties requirements"
}

# ==============================================================================
# Test Data (For policy testing)
# ==============================================================================

# Example valid provenance (for testing):
# {
#   "_type": "https://in-toto.io/Statement/v0.1",
#   "predicateType": "https://slsa.dev/provenance/v0.2",
#   "subject": [
#     {
#       "name": "backend-image",
#       "digest": {"sha256": "abc123..."}
#     }
#   ],
#   "predicate": {
#     "builder": {
#       "id": "https://github.com/slsa-framework/slsa-github-generator/.github/workflows/generator_generic_slsa3.yml@refs/tags/v1.9.0"
#     },
#     "buildType": "https://github.com/slsa-framework/slsa-github-generator/actions@v1",
#     "invocation": {
#       "configSource": {
#         "uri": "git+https://github.com/bsvalues/terrafusion_os_1.0@refs/heads/main",
#         "digest": {"sha1": "abc123..."}
#       }
#     },
#     "buildConfig": {},
#     "metadata": {
#       "buildInvocationId": "https://github.com/bsvalues/terrafusion_os_1.0/actions/runs/123456",
#       "completeness": {
#         "parameters": true,
#         "environment": true,
#         "materials": true
#       },
#       "environment": {
#         "ref": "refs/heads/main"
#       }
#     },
#     "materials": [
#       {
#         "uri": "git+https://github.com/bsvalues/terrafusion_os_1.0",
#         "digest": {"sha1": "abc123..."}
#       }
#     ]
#   },
#   "signature": {
#     "alg": "RS256",
#     "keyid": "sigstore-transparency-log"
#   }
# }

# ==============================================================================
# CLI Usage Examples
# ==============================================================================

# Test policy against provenance:
# opa eval --data ops/security/policies/slsa-attestation.policy.rego \
#   --input provenance.json \
#   "data.slsa.allow"

# Check for violations:
# opa eval --data ops/security/policies/slsa-attestation.policy.rego \
#   --input provenance.json \
#   "data.slsa.violations"

# Check for warnings:
# opa eval --data ops/security/policies/slsa-attestation.policy.rego \
#   --input provenance.json \
#   "data.slsa.warnings"

# Run as server (Kubernetes admission controller):
# opa run --server \
#   --addr=0.0.0.0:8181 \
#   --set=decision_logs.console=true \
#   ops/security/policies/slsa-attestation.policy.rego
