# Pod Security Policy - OPA Rego
# Phase 4 Week 1-2: POA&M Finding #1 Remediation
# Validated patterns from Phase 3.5 Week 2 POC (security, 60% risk reduction)

package main

import future.keywords.contains
import future.keywords.if
import future.keywords.in

# METADATA
# title: Pod Security Policy
# description: Enforces pod security best practices for TerraFusion OS
# custom:
#   phase: Phase 4 Week 1-2
#   validation: Phase 3.5 Week 2 POC
#   compliance: NIST SP 800-53 Rev 5 (SC-7, AC-6)

# Deny pods running as root
deny[msg] {
    input.kind == "Pod"
    not input.spec.securityContext.runAsNonRoot
    msg := sprintf("Pod '%s' must not run as root (runAsNonRoot: true required)", [input.metadata.name])
}

# Deny privileged containers
deny[msg] {
    input.kind == "Pod"
    container := input.spec.containers[_]
    container.securityContext.privileged
    msg := sprintf("Pod '%s' container '%s' must not run in privileged mode", [input.metadata.name, container.name])
}

# Require read-only root filesystem
deny[msg] {
    input.kind == "Pod"
    container := input.spec.containers[_]
    not container.securityContext.readOnlyRootFilesystem
    msg := sprintf("Pod '%s' container '%s' must use read-only root filesystem", [input.metadata.name, container.name])
}

# Deny privilege escalation
deny[msg] {
    input.kind == "Pod"
    container := input.spec.containers[_]
    container.securityContext.allowPrivilegeEscalation == true
    msg := sprintf("Pod '%s' container '%s' must not allow privilege escalation", [input.metadata.name, container.name])
}

# Require dropping all capabilities
deny[msg] {
    input.kind == "Pod"
    container := input.spec.containers[_]
    not container.securityContext.capabilities.drop
    msg := sprintf("Pod '%s' container '%s' must drop all capabilities", [input.metadata.name, container.name])
}

deny[msg] {
    input.kind == "Pod"
    container := input.spec.containers[_]
    not "ALL" in container.securityContext.capabilities.drop
    msg := sprintf("Pod '%s' container '%s' must drop ALL capabilities", [input.metadata.name, container.name])
}

# Deny hostNetwork usage
deny[msg] {
    input.kind == "Pod"
    input.spec.hostNetwork == true
    msg := sprintf("Pod '%s' must not use host network", [input.metadata.name])
}

# Deny hostPID usage
deny[msg] {
    input.kind == "Pod"
    input.spec.hostPID == true
    msg := sprintf("Pod '%s' must not use host PID namespace", [input.metadata.name])
}

# Deny hostIPC usage
deny[msg] {
    input.kind == "Pod"
    input.spec.hostIPC == true
    msg := sprintf("Pod '%s' must not use host IPC namespace", [input.metadata.name])
}

# Require resource limits (validated in Phase 3.5 Week 3 POC)
deny[msg] {
    input.kind == "Pod"
    container := input.spec.containers[_]
    not container.resources.limits.cpu
    msg := sprintf("Pod '%s' container '%s' must specify CPU limits", [input.metadata.name, container.name])
}

deny[msg] {
    input.kind == "Pod"
    container := input.spec.containers[_]
    not container.resources.limits.memory
    msg := sprintf("Pod '%s' container '%s' must specify memory limits", [input.metadata.name, container.name])
}

# Require resource requests (validated in Phase 3.5 Week 3 POC)
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

# Require security labels
deny[msg] {
    input.kind == "Pod"
    not input.metadata.labels["app.kubernetes.io/name"]
    msg := sprintf("Pod '%s' must have 'app.kubernetes.io/name' label", [input.metadata.name])
}

deny[msg] {
    input.kind == "Pod"
    not input.metadata.labels["app.kubernetes.io/version"]
    msg := sprintf("Pod '%s' must have 'app.kubernetes.io/version' label", [input.metadata.name])
}

# Deny mounting Docker socket
deny[msg] {
    input.kind == "Pod"
    volume := input.spec.volumes[_]
    volume.hostPath.path == "/var/run/docker.sock"
    msg := sprintf("Pod '%s' must not mount Docker socket", [input.metadata.name])
}

# Require liveness probe (validated in Phase 3.5 Week 7 POC - resilience)
warn[msg] {
    input.kind == "Pod"
    container := input.spec.containers[_]
    not container.livenessProbe
    msg := sprintf("Pod '%s' container '%s' should have liveness probe", [input.metadata.name, container.name])
}

# Require readiness probe (validated in Phase 3.5 Week 7 POC - resilience)
warn[msg] {
    input.kind == "Pod"
    container := input.spec.containers[_]
    not container.readinessProbe
    msg := sprintf("Pod '%s' container '%s' should have readiness probe", [input.metadata.name, container.name])
}

# Test cases
test_deny_root_user {
    deny[msg] with input as {
        "kind": "Pod",
        "metadata": {"name": "test-pod"},
        "spec": {"securityContext": {}}
    }
}

test_allow_non_root {
    count(deny) == 0 with input as {
        "kind": "Pod",
        "metadata": {
            "name": "test-pod",
            "labels": {
                "app.kubernetes.io/name": "test",
                "app.kubernetes.io/version": "1.0.0"
            }
        },
        "spec": {
            "securityContext": {"runAsNonRoot": true},
            "containers": [{
                "name": "test-container",
                "securityContext": {
                    "privileged": false,
                    "readOnlyRootFilesystem": true,
                    "allowPrivilegeEscalation": false,
                    "capabilities": {"drop": ["ALL"]}
                },
                "resources": {
                    "limits": {"cpu": "100m", "memory": "128Mi"},
                    "requests": {"cpu": "50m", "memory": "64Mi"}
                },
                "livenessProbe": {"httpGet": {"path": "/health", "port": 8080}},
                "readinessProbe": {"httpGet": {"path": "/ready", "port": 8080}}
            }]
        }
    }
}
