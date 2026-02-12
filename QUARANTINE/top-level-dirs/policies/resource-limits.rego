# Resource Limits Policy - OPA Rego
# Phase 4 Week 1-2: POA&M Finding #1 Remediation
# Validated patterns from Phase 3.5 Week 3 POC (scalability, auto-scaling 2-100 pods)

package main

import future.keywords.contains
import future.keywords.if
import future.keywords.in

# METADATA
# title: Resource Limits Policy
# description: Enforces resource limit best practices for TerraFusion OS
# custom:
#   phase: Phase 4 Week 1-2
#   validation: Phase 3.5 Week 3 POC
#   compliance: NIST SP 800-53 Rev 5 (SC-6)

# CPU limits (validated in Phase 3.5 Week 3 POC)
deny[msg] {
    input.kind == "Pod"
    container := input.spec.containers[_]
    cpu_limit := to_number(trim_suffix(container.resources.limits.cpu, "m"))
    cpu_limit > 4000  # Max 4 CPU cores per container
    msg := sprintf("Pod '%s' container '%s' CPU limit exceeds 4000m (4 cores)", [input.metadata.name, container.name])
}

deny[msg] {
    input.kind == "Pod"
    container := input.spec.containers[_]
    not container.resources.limits.cpu
    msg := sprintf("Pod '%s' container '%s' must specify CPU limits", [input.metadata.name, container.name])
}

# Memory limits (validated in Phase 3.5 Week 3 POC)
deny[msg] {
    input.kind == "Pod"
    container := input.spec.containers[_]
    memory_limit := parse_memory(container.resources.limits.memory)
    memory_limit > 16384  # Max 16GB per container
    msg := sprintf("Pod '%s' container '%s' memory limit exceeds 16Gi", [input.metadata.name, container.name])
}

deny[msg] {
    input.kind == "Pod"
    container := input.spec.containers[_]
    not container.resources.limits.memory
    msg := sprintf("Pod '%s' container '%s' must specify memory limits", [input.metadata.name, container.name])
}

# Resource requests must be specified
deny[msg] {
    input.kind == "Pod"
    container := input.spec.containers[_]
    not container.resources.requests.cpu
    msg := sprintf("Pod '%s' container '%s' must specify CPU requests", [input.metadata.name, container.name])
}

deny[msg] {
    input.kind == "Pod"
    container := input.spec.containers[_]
    not container.resources.requests.memory
    msg := sprintf("Pod '%s' container '%s' must specify memory requests", [input.metadata.name, container.name])
}

# Requests must be <= limits
deny[msg] {
    input.kind == "Pod"
    container := input.spec.containers[_]
    cpu_request := to_number(trim_suffix(container.resources.requests.cpu, "m"))
    cpu_limit := to_number(trim_suffix(container.resources.limits.cpu, "m"))
    cpu_request > cpu_limit
    msg := sprintf("Pod '%s' container '%s' CPU request must be <= CPU limit", [input.metadata.name, container.name])
}

deny[msg] {
    input.kind == "Pod"
    container := input.spec.containers[_]
    memory_request := parse_memory(container.resources.requests.memory)
    memory_limit := parse_memory(container.resources.limits.memory)
    memory_request > memory_limit
    msg := sprintf("Pod '%s' container '%s' memory request must be <= memory limit", [input.metadata.name, container.name])
}

# HPA validation (validated in Phase 3.5 Week 3 POC: auto-scale 2-100 pods)
deny[msg] {
    input.kind == "HorizontalPodAutoscaler"
    input.spec.minReplicas < 2
    msg := sprintf("HPA '%s' minReplicas must be >= 2 (high availability)", [input.metadata.name])
}

deny[msg] {
    input.kind == "HorizontalPodAutoscaler"
    input.spec.maxReplicas > 100
    msg := sprintf("HPA '%s' maxReplicas must be <= 100 (validated in Week 3 POC)", [input.metadata.name])
}

deny[msg] {
    input.kind == "HorizontalPodAutoscaler"
    input.spec.minReplicas > input.spec.maxReplicas
    msg := sprintf("HPA '%s' minReplicas must be <= maxReplicas", [input.metadata.name])
}

# PDB validation (validated in Phase 3.5 Week 7 POC: resilience, 0 downtime)
warn[msg] {
    input.kind == "Deployment"
    input.spec.replicas > 1
    not has_pdb
    msg := sprintf("Deployment '%s' with multiple replicas should have PodDisruptionBudget", [input.metadata.name])
}

has_pdb {
    input.kind == "PodDisruptionBudget"
}

# PDB must allow disruptions
deny[msg] {
    input.kind == "PodDisruptionBudget"
    input.spec.maxUnavailable == "0"
    input.spec.minAvailable == input.spec.replicas
    msg := sprintf("PDB '%s' must allow at least 1 pod disruption", [input.metadata.name])
}

# Storage limits
deny[msg] {
    input.kind == "PersistentVolumeClaim"
    storage_size := parse_memory(input.spec.resources.requests.storage)
    storage_size > 1048576  # Max 1TB
    msg := sprintf("PVC '%s' storage request exceeds 1Ti", [input.metadata.name])
}

# Helper function to parse memory (Mi, Gi, etc.)
parse_memory(mem_str) = result {
    endswith(mem_str, "Gi")
    result := to_number(trim_suffix(mem_str, "Gi")) * 1024
}

parse_memory(mem_str) = result {
    endswith(mem_str, "Mi")
    result := to_number(trim_suffix(mem_str, "Mi"))
}

parse_memory(mem_str) = result {
    endswith(mem_str, "Ki")
    result := to_number(trim_suffix(mem_str, "Ki")) / 1024
}

parse_memory(mem_str) = result {
    not endswith(mem_str, "Gi")
    not endswith(mem_str, "Mi")
    not endswith(mem_str, "Ki")
    result := to_number(mem_str) / 1048576  # Bytes to Mi
}

# Test cases
test_deny_excessive_cpu {
    deny[msg] with input as {
        "kind": "Pod",
        "metadata": {"name": "test-pod"},
        "spec": {
            "containers": [{
                "name": "test-container",
                "resources": {
                    "limits": {"cpu": "8000m", "memory": "1Gi"},
                    "requests": {"cpu": "100m", "memory": "512Mi"}
                }
            }]
        }
    }
}

test_allow_valid_resources {
    count(deny) == 0 with input as {
        "kind": "Pod",
        "metadata": {"name": "test-pod"},
        "spec": {
            "containers": [{
                "name": "test-container",
                "resources": {
                    "limits": {"cpu": "2000m", "memory": "4Gi"},
                    "requests": {"cpu": "1000m", "memory": "2Gi"}
                }
            }]
        }
    }
}

test_deny_invalid_hpa {
    deny[msg] with input as {
        "kind": "HorizontalPodAutoscaler",
        "metadata": {"name": "test-hpa"},
        "spec": {
            "minReplicas": 1,
            "maxReplicas": 150
        }
    }
}

test_allow_valid_hpa {
    count(deny) == 0 with input as {
        "kind": "HorizontalPodAutoscaler",
        "metadata": {"name": "test-hpa"},
        "spec": {
            "minReplicas": 2,
            "maxReplicas": 50,
            "targetCPUUtilizationPercentage": 80
        }
    }
}
