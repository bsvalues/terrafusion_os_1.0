# Release Playbooks — CI/CD JSON Examples

> **Constitutional Layer:** Adoption (Docs-Only)  
> **Purpose:** Machine-readable examples for pipeline integration  
> **SpecLock:** `RELEASE_PLAYBOOKS_CONSTITUTION_v1.0.0_SPECLOCK.md`

---

## Overview

All `tf release *` commands support `--ci` flag for JSON-only output. These examples show expected JSON structures for pipeline integration.

---

## 1. Prepare Command

### Invocation

```bash
tf release prepare --bundle ./releases/v2.1.0 --ci
```

### Success Response

```json
{
  "schema_version": "1.0.0",
  "command": "release_prepare",
  "status": "PASS",
  "bundle": "./releases/v2.1.0",
  "steps": [
    {
      "name": "bundle",
      "status": "PASS",
      "output": "Bundle created"
    },
    {
      "name": "verify",
      "status": "PASS",
      "proofs_valid": 4,
      "proofs_total": 4
    }
  ],
  "artifacts": {
    "proofs": [
      "proofs/gate.proof.json",
      "proofs/agent.proof.json",
      "proofs/deploy.proof.json",
      "proofs/marketplace.proof.json"
    ]
  },
  "timestamp": "2025-12-22T18:00:00Z"
}
```

### Failure Response

```json
{
  "schema_version": "1.0.0",
  "command": "release_prepare",
  "status": "FAIL",
  "bundle": "./releases/v2.1.0",
  "error": {
    "code": "VERIFY_FAILED",
    "message": "Bundle verification failed: 2/4 proofs invalid",
    "details": {
      "invalid_proofs": ["gate.proof.json", "agent.proof.json"]
    }
  },
  "timestamp": "2025-12-22T18:00:00Z"
}
```

---

## 2. Deploy Command

### Invocation

```bash
tf release deploy --bundle ./releases/v2.1.0 --namespace terrafusion-prod --ci
```

### Success Response

```json
{
  "schema_version": "1.0.0",
  "command": "release_deploy",
  "status": "PASS",
  "bundle": "./releases/v2.1.0",
  "namespace": "terrafusion-prod",
  "steps": [
    {
      "name": "verify",
      "status": "PASS"
    },
    {
      "name": "apply",
      "status": "PASS",
      "resources_applied": 12
    }
  ],
  "receipt": "receipts/deploy.1734890700.json",
  "timestamp": "2025-12-22T18:05:00Z"
}
```

### Failure Response (Namespace)

```json
{
  "schema_version": "1.0.0",
  "command": "release_deploy",
  "status": "FAIL",
  "bundle": "./releases/v2.1.0",
  "namespace": "terrafusion-prod",
  "error": {
    "code": "NAMESPACE_NOT_FOUND",
    "message": "Namespace 'terrafusion-prod' does not exist",
    "suggestion": "Create namespace or verify K8s context"
  },
  "timestamp": "2025-12-22T18:05:00Z"
}
```

---

## 3. Promote Command

### Invocation

```bash
tf release promote --bundle ./releases/v2.1.0 --to techsupport --ci
```

### Success Response

```json
{
  "schema_version": "1.0.0",
  "command": "release_promote",
  "status": "PASS",
  "bundle": "./releases/v2.1.0",
  "promotion": {
    "from_env": "dev",
    "to_env": "techsupport",
    "auto_inferred_from": true
  },
  "steps": [
    {
      "name": "verify",
      "status": "PASS"
    },
    {
      "name": "policy",
      "status": "PASS",
      "chain_valid": true,
      "freshness_valid": true
    },
    {
      "name": "promote",
      "status": "PASS"
    }
  ],
  "receipt": "receipts/promote.dev-to-techsupport.1734890703.json",
  "timestamp": "2025-12-22T18:10:00Z"
}
```

### Failure Response (Policy)

```json
{
  "schema_version": "1.0.0",
  "command": "release_promote",
  "status": "FAIL",
  "bundle": "./releases/v2.1.0",
  "promotion": {
    "from_env": "dev",
    "to_env": "techsupport"
  },
  "error": {
    "code": "STALE_CHAIN",
    "message": "Chain freshness check failed",
    "details": {
      "age_seconds": 172800,
      "max_age_seconds": 86400
    },
    "suggestion": "Re-prepare bundle or use --skip-freshness"
  },
  "timestamp": "2025-12-22T18:10:00Z"
}
```

---

## 4. Audit Command

### Invocation

```bash
tf release audit --bundle ./releases/v2.1.0 --ci
```

### Success Response

```json
{
  "schema_version": "1.0.0",
  "command": "release_audit",
  "status": "PASS",
  "bundle": "./releases/v2.1.0",
  "integrity": {
    "proofs_valid": 4,
    "proofs_total": 4,
    "proofs": [
      {"name": "gate.proof.json", "status": "valid"},
      {"name": "agent.proof.json", "status": "valid"},
      {"name": "deploy.proof.json", "status": "valid"},
      {"name": "marketplace.proof.json", "status": "valid"}
    ]
  },
  "chain": {
    "promotions": [
      {
        "from": "dev",
        "to": "techsupport",
        "receipt": "receipts/promote.dev-to-techsupport.1734890703.json",
        "timestamp": "2025-12-22T18:10:03Z"
      }
    ],
    "timestamps_monotonic": true,
    "hashes_valid": true
  },
  "policy": {
    "chain_integrity": "PASS",
    "freshness": "PASS",
    "freshness_age_seconds": 300,
    "freshness_max_seconds": 86400
  },
  "summary": {
    "status": "PASS",
    "proofs_valid": 4,
    "promotions": 1,
    "violations": 0,
    "last_promotion": "2025-12-22T18:10:03Z",
    "environments": ["dev", "techsupport"]
  },
  "timestamp": "2025-12-22T18:15:00Z"
}
```

---

## 5. Status Command

### Invocation

```bash
tf release status --ci
```

### Healthy Response

```json
{
  "schema_version": "1.0.0",
  "command": "release_status",
  "status": "PASS",
  "gate": {
    "status": "PASS",
    "checks_passed": 11,
    "checks_total": 11
  },
  "sessions": {
    "active": 0,
    "stale": 0
  },
  "timestamp": "2025-12-22T18:00:00Z"
}
```

### Degraded Response

```json
{
  "schema_version": "1.0.0",
  "command": "release_status",
  "status": "WARN",
  "gate": {
    "status": "WARN",
    "checks_passed": 10,
    "checks_total": 11,
    "warnings": ["RAG index stale (7d old)"]
  },
  "sessions": {
    "active": 1,
    "stale": 0
  },
  "timestamp": "2025-12-22T18:00:00Z"
}
```

---

## Pipeline Integration Examples

### GitHub Actions

```yaml
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - name: Prepare Release
        run: |
          output=$(tf release prepare --bundle ./releases/${{ github.ref_name }} --ci)
          status=$(echo "$output" | jq -r '.status')
          if [ "$status" != "PASS" ]; then
            echo "$output" | jq '.error'
            exit 1
          fi

      - name: Deploy Release
        run: |
          tf release deploy --bundle ./releases/${{ github.ref_name }} \
            --namespace terrafusion-${{ env.ENVIRONMENT }} --ci

      - name: Audit Release
        run: |
          tf release audit --bundle ./releases/${{ github.ref_name }} --ci \
            > audit_report.json
          
      - name: Upload Audit Report
        uses: actions/upload-artifact@v3
        with:
          name: audit-report
          path: audit_report.json
```

### GitLab CI

```yaml
release:
  script:
    - |
      RESULT=$(tf release prepare --bundle ./releases/${CI_COMMIT_TAG} --ci)
      if [ "$(echo $RESULT | jq -r '.status')" != "PASS" ]; then
        echo $RESULT | jq '.error'
        exit 1
      fi
    - tf release deploy --bundle ./releases/${CI_COMMIT_TAG} --namespace ${NAMESPACE} --ci
    - tf release audit --bundle ./releases/${CI_COMMIT_TAG} --ci > audit.json
  artifacts:
    paths:
      - audit.json
```

### Azure DevOps

```yaml
steps:
  - script: |
      result=$(tf release prepare --bundle $(Build.SourcesDirectory)/releases/$(Build.BuildNumber) --ci)
      echo "##vso[task.setvariable variable=prepareResult]$result"
      status=$(echo "$result" | jq -r '.status')
      if [ "$status" != "PASS" ]; then
        echo "##vso[task.logissue type=error]Prepare failed"
        exit 1
      fi
    displayName: 'Prepare Release'

  - script: |
      tf release audit --bundle $(Build.SourcesDirectory)/releases/$(Build.BuildNumber) --ci \
        > $(Build.ArtifactStagingDirectory)/audit.json
    displayName: 'Generate Audit Report'

  - publish: $(Build.ArtifactStagingDirectory)/audit.json
    artifact: AuditReport
```

---

## Error Code Reference

| Code | Command | Meaning |
|------|---------|---------|
| `VERIFY_FAILED` | prepare | Bundle verification failed |
| `BUNDLE_NOT_FOUND` | all | Bundle directory missing |
| `NAMESPACE_NOT_FOUND` | deploy | K8s namespace missing |
| `APPLY_FAILED` | deploy | K8s apply failed |
| `MISSING_CHAIN` | promote | No prior promotion receipt |
| `CHAIN_INTEGRITY_FAILED` | promote | Hash mismatch in chain |
| `STALE_CHAIN` | promote | Bundle exceeds max age |
| `TIME_SKEW` | promote | Future timestamp detected |
| `INVALID_ENV` | promote | Unknown environment name |

---

**This document contains examples only. No execution authority is granted.**
