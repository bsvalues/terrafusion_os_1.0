#!/usr/bin/env python3
"""
RuntimeContract v1 SpecLock Generator

Generates:
  - runtimecontract.schema.json (JSON Schema from spec)
  - openapi-proof.yaml (OpenAPI fragment for /healthz/proof)
  - k8s-readiness-snippet.yaml (Kubernetes readiness probe config)

Idempotent: Produces identical output for identical spec input.
"""
import hashlib
import json
import os
import sys

SPEC_PATH = "docs/spec-lock/locks/runtimecontract/runtimecontract.v1/speclock.spec.json"
OUT_DIR = "docs/spec-lock/locks/runtimecontract/runtimecontract.v1/generated"

def find_repo_root():
    """Walk up to find repo root (contains docs/spec-lock)."""
    d = os.path.dirname(os.path.abspath(__file__))
    while d != os.path.dirname(d):
        if os.path.isdir(os.path.join(d, "docs", "spec-lock")):
            return d
        d = os.path.dirname(d)
    return os.getcwd()

def load_spec(repo_root: str) -> dict:
    """Load the speclock.spec.json file."""
    path = os.path.join(repo_root, SPEC_PATH)
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def generate_schema(spec: dict) -> dict:
    """Generate JSON Schema for /healthz/proof response."""
    proof = spec.get("proof_schema", {})

    schema = {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "$id": "https://terrafusion.gov/schemas/runtimecontract.v1.proof.json",
        "title": "RuntimeContract v1 Proof Response",
        "description": "Schema for /healthz/proof endpoint response - constitutional runtime contract",
        "type": "object",
        "properties": {},
        "required": list(proof.get("required", [])),
        "additionalProperties": proof.get("additional_properties", False)
    }

    # Copy properties from spec
    for key, val in proof.get("properties", {}).items():
        schema["properties"][key] = dict(val)

    return schema

def generate_openapi_fragment(spec: dict) -> str:
    """Generate OpenAPI YAML fragment for proof endpoints."""
    endpoints = spec.get("required_endpoints", [])

    yaml_lines = [
        "# Auto-generated from runtimecontract.v1 spec",
        "# DO NOT EDIT - regenerate with speclock-runtimecontract-gen.py",
        "",
        "paths:",
    ]

    for ep in endpoints:
        path = ep.get("path", "")
        method = ep.get("method", "GET").lower()
        desc = ep.get("description", "")

        yaml_lines.extend([
            f"  {path}:",
            f"    {method}:",
            f"      summary: \"{desc}\"",
            f"      operationId: {path.replace('/', '_').strip('_')}",
            "      responses:",
            "        '200':",
            "          description: Success",
        ])

        # Add schema reference for proof endpoint
        if "/proof" in path:
            yaml_lines.extend([
                "          content:",
                "            application/json:",
                "              schema:",
                "                $ref: 'runtimecontract.schema.json'",
            ])

        yaml_lines.append("")

    return "\n".join(yaml_lines)

def generate_k8s_readiness(spec: dict) -> str:
    """Generate Kubernetes readiness probe YAML snippet."""
    endpoints = spec.get("required_endpoints", [])

    readiness_path = "/healthz/ready"
    for ep in endpoints:
        if ep.get("purpose") == "readiness":
            readiness_path = ep.get("path", readiness_path)
            break

    return f"""# Auto-generated from runtimecontract.v1 spec
# DO NOT EDIT - regenerate with speclock-runtimecontract-gen.py

# Kubernetes readiness probe configuration
# Apply to all TerraFusion deployments

readinessProbe:
  httpGet:
    path: {readiness_path}
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 10
  timeoutSeconds: 3
  failureThreshold: 3
  successThreshold: 1

# livenessProbe (less strict - just checks process alive)
livenessProbe:
  httpGet:
    path: {readiness_path}
    port: 8080
  initialDelaySeconds: 15
  periodSeconds: 20
  timeoutSeconds: 5
  failureThreshold: 5

# CONSTITUTIONAL REQUIREMENT:
# Readiness MUST return non-200 when:
#   - speclock_ok = false
#   - state_mesh_ok = false
# This prevents traffic routing to nodes with constitutional violations.
"""

def write_outputs(repo_root: str, schema: dict, openapi: str, k8s: str):
    """Write generated artifacts."""
    out = os.path.join(repo_root, OUT_DIR)
    os.makedirs(out, exist_ok=True)

    # Schema (deterministic JSON)
    schema_path = os.path.join(out, "runtimecontract.schema.json")
    with open(schema_path, 'w', encoding='utf-8') as f:
        json.dump(schema, f, indent=2, sort_keys=True)
        f.write("\n")

    # OpenAPI fragment
    openapi_path = os.path.join(out, "openapi-proof.yaml")
    with open(openapi_path, 'w', encoding='utf-8') as f:
        f.write(openapi)

    # K8s readiness snippet
    k8s_path = os.path.join(out, "k8s-readiness-snippet.yaml")
    with open(k8s_path, 'w', encoding='utf-8') as f:
        f.write(k8s)

    return [schema_path, openapi_path, k8s_path]

def compute_sha256(file_path: str) -> str:
    """Compute SHA-256 of file."""
    h = hashlib.sha256()
    with open(file_path, 'rb') as f:
        h.update(f.read())
    return h.hexdigest()

def main():
    repo_root = find_repo_root()
    print(f"[runtimecontract-gen] repo_root={repo_root}")

    try:
        spec = load_spec(repo_root)
    except FileNotFoundError:
        print(f"[ERROR] Spec file not found: {SPEC_PATH}")
        sys.exit(1)

    print(f"[runtimecontract-gen] Loaded spec: {spec.get('lock_id', 'unknown')}")

    # Generate artifacts
    schema = generate_schema(spec)
    openapi = generate_openapi_fragment(spec)
    k8s = generate_k8s_readiness(spec)

    # Write outputs
    files = write_outputs(repo_root, schema, openapi, k8s)

    print("[runtimecontract-gen] Generated artifacts:")
    for f in files:
        sha = compute_sha256(f)
        print(f"  {os.path.basename(f)}: sha256={sha[:16]}...")

    print("[runtimecontract-gen] ✅ Done")
    return 0

if __name__ == "__main__":
    sys.exit(main())
