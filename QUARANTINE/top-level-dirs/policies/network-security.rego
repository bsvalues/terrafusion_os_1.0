# Network Security Policy - OPA Rego
# Phase 4 Week 1-2: POA&M Finding #1 Remediation
# Validated patterns from Phase 3.5 Week 2 POC (network security, least privilege)

package main

import future.keywords.contains
import future.keywords.if
import future.keywords.in

# METADATA
# title: Network Security Policy
# description: Enforces network security best practices for TerraFusion OS
# custom:
#   phase: Phase 4 Week 1-2
#   validation: Phase 3.5 Week 2 POC
#   compliance: NIST SP 800-53 Rev 5 (SC-7, SC-8)

# Require NetworkPolicy for all namespaces
deny[msg] {
    input.kind == "Namespace"
    input.metadata.name != "kube-system"
    input.metadata.name != "kube-public"
    input.metadata.name != "kube-node-lease"
    not has_network_policy
    msg := sprintf("Namespace '%s' must have NetworkPolicy defined", [input.metadata.name])
}

has_network_policy {
    input.kind == "NetworkPolicy"
}

# Deny default allow-all NetworkPolicies
deny[msg] {
    input.kind == "NetworkPolicy"
    not input.spec.policyTypes
    msg := sprintf("NetworkPolicy '%s' must specify policyTypes (Ingress/Egress)", [input.metadata.name])
}

# Require egress policy (prevent data exfiltration)
deny[msg] {
    input.kind == "NetworkPolicy"
    input.spec.policyTypes[_] == "Egress"
    count(input.spec.egress) == 0
    msg := sprintf("NetworkPolicy '%s' with Egress policy must define egress rules", [input.metadata.name])
}

# Deny overly permissive ingress (0.0.0.0/0)
deny[msg] {
    input.kind == "NetworkPolicy"
    rule := input.spec.ingress[_]
    from := rule.from[_]
    from.ipBlock.cidr == "0.0.0.0/0"
    msg := sprintf("NetworkPolicy '%s' must not allow ingress from 0.0.0.0/0 (too permissive)", [input.metadata.name])
}

# Deny overly permissive egress (0.0.0.0/0)
warn[msg] {
    input.kind == "NetworkPolicy"
    rule := input.spec.egress[_]
    to := rule.to[_]
    to.ipBlock.cidr == "0.0.0.0/0"
    msg := sprintf("NetworkPolicy '%s' allows egress to 0.0.0.0/0 (consider restricting)", [input.metadata.name])
}

# Require pod selector
deny[msg] {
    input.kind == "NetworkPolicy"
    not input.spec.podSelector
    msg := sprintf("NetworkPolicy '%s' must specify podSelector", [input.metadata.name])
}

# Deny LoadBalancer services without IP whitelist (validated in Phase 3.5 Week 2 POC)
deny[msg] {
    input.kind == "Service"
    input.spec.type == "LoadBalancer"
    not input.spec.loadBalancerSourceRanges
    msg := sprintf("Service '%s' of type LoadBalancer must specify loadBalancerSourceRanges", [input.metadata.name])
}

# Require TLS for Ingress (validated in Phase 3.5 Week 2 POC: TLS 1.3)
deny[msg] {
    input.kind == "Ingress"
    not input.spec.tls
    msg := sprintf("Ingress '%s' must enable TLS", [input.metadata.name])
}

# Deny Ingress without TLS certificate
deny[msg] {
    input.kind == "Ingress"
    tls := input.spec.tls[_]
    not tls.secretName
    msg := sprintf("Ingress '%s' TLS configuration must specify secretName", [input.metadata.name])
}

# Require NetworkPolicy labels
deny[msg] {
    input.kind == "NetworkPolicy"
    not input.metadata.labels["app.kubernetes.io/name"]
    msg := sprintf("NetworkPolicy '%s' must have 'app.kubernetes.io/name' label", [input.metadata.name])
}

# Warn about ClusterIP services exposed externally
warn[msg] {
    input.kind == "Service"
    input.spec.type == "ClusterIP"
    input.spec.externalIPs
    msg := sprintf("Service '%s' of type ClusterIP should not use externalIPs (security risk)", [input.metadata.name])
}

# Deny NodePort services in production (validated in Phase 3.5 Week 2 POC)
deny[msg] {
    input.kind == "Service"
    input.spec.type == "NodePort"
    input.metadata.namespace == "production"
    msg := sprintf("Service '%s' must not use NodePort type in production namespace", [input.metadata.name])
}

# Require namespace isolation
deny[msg] {
    input.kind == "Pod"
    input.metadata.namespace == "default"
    msg := sprintf("Pod '%s' must not be deployed to 'default' namespace", [input.metadata.name])
}

# Test cases
test_deny_no_network_policy {
    deny[msg] with input as {
        "kind": "Namespace",
        "metadata": {"name": "production"}
    }
}

test_allow_network_policy {
    count(deny) == 0 with input as {
        "kind": "NetworkPolicy",
        "metadata": {
            "name": "test-netpol",
            "labels": {"app.kubernetes.io/name": "test"}
        },
        "spec": {
            "podSelector": {"matchLabels": {"app": "test"}},
            "policyTypes": ["Ingress", "Egress"],
            "ingress": [{
                "from": [{
                    "podSelector": {"matchLabels": {"role": "frontend"}}
                }],
                "ports": [{"protocol": "TCP", "port": 8080}]
            }],
            "egress": [{
                "to": [{
                    "podSelector": {"matchLabels": {"role": "database"}}
                }],
                "ports": [{"protocol": "TCP", "port": 5432}]
            }]
        }
    }
}

test_deny_insecure_ingress {
    deny[msg] with input as {
        "kind": "Ingress",
        "metadata": {"name": "test-ingress"},
        "spec": {"rules": []}
    }
}

test_allow_secure_ingress {
    count(deny) == 0 with input as {
        "kind": "Ingress",
        "metadata": {"name": "test-ingress"},
        "spec": {
            "tls": [{
                "secretName": "tls-secret",
                "hosts": ["app.terrafusion.io"]
            }],
            "rules": [{
                "host": "app.terrafusion.io",
                "http": {"paths": [{"path": "/", "pathType": "Prefix"}]}
            }]
        }
    }
}
