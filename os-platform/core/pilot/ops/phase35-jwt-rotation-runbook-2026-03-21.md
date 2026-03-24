# Phase 35 — JWT Rotation Runbook

**Date**: 2026-03-21
**Status**: INVENTORY ONLY (SRE owns execution)
**Baseline**: `199f0f931`

---

## Overview

TerraFusion uses HS256 JWT signing. The signing key is `TF_JWT_SECRET`.
In dev, the key is a hardcoded static string. In production, it must be:
- ≥256-bit cryptographically random
- Stored as a Kubernetes secret (or equivalent secrets manager)
- Rotated before Phase 35 K8s staging and again before production cut

**DO NOT** rotate in production without SRE sign-off. This runbook is reference only.

---

## Where TF_JWT_SECRET Is Consumed

```
backend/publish/appsettings.json                              JwtSettings:SecretKey
backend/src/TerraFusion.Operations/appsettings.json          JwtSettings:Secret
backend/TerraFusion.IDE.Gateway/appsettings.json             JwtSettings:Key
backend/TerraFusion.QuantumAnalytics/appsettings.json        JwtSettings:SecretKey
backend/TerraFusion.StreamingAnalytics/appsettings.json      JwtSettings:SecretKey
```

All services must receive the same key simultaneously. Partial rotation = broken tokens.

---

## Rotation Steps (SRE Executes)

### Step 1 — Generate new key

```bash
# Generate 256-bit (32-byte) base64 key
openssl rand -base64 32
# Example output: X7kP2mQn9vRs4tWy8uJd6eHgAzBcFiLo3nMqOpSrTuVwXyZa (not real)
```

### Step 2 — Maintenance window

Rotation is not zero-downtime. All in-flight JWT tokens become invalid on key swap.
- Notify county users of scheduled maintenance (minimum 5-min window)
- Schedule during off-hours

### Step 3 — Update secret store

**K8s (Phase 35+):**
```bash
kubectl create secret generic terrafusion-jwt \
  --from-literal=TF_JWT_SECRET='<new-key>' \
  --dry-run=client -o yaml | kubectl apply -f -
```

**Dev (local):**
```bash
# Set in shell before dotnet run
$env:TF_JWT_SECRET = "<new-key>"
```

### Step 4 — Rolling restart all services

```bash
# K8s rolling restart (Phase 35+)
kubectl rollout restart deployment/terrafusion-api
kubectl rollout restart deployment/terrafusion-operations
kubectl rollout restart deployment/terrafusion-gateway
kubectl rollout restart deployment/terrafusion-quantum-analytics
kubectl rollout restart deployment/terrafusion-streaming-analytics
```

Wait for all pods to be `Running` and `1/1 Ready` before reopening traffic.

### Step 5 — Verify

```bash
# Obtain a new token
curl -X POST http://api:5000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"<test-user>","password":"<test-password>"}'

# Confirm token validates
curl -H 'Authorization: Bearer <token>' http://api:5000/api/health
# Expected: 200 OK
```

### Step 6 — Retire old key

Old tokens are immediately invalid after restart. No grace period with HS256 single-key.
If grace period is required for Phase 35, SRE must implement key-id header (`kid`) and maintain two active keys during overlap window.

---

## Current State (Phase 34 / Dev)

```
JwtSettings:SecretKey = "TerraFusion-Dev-Secret-Key-2026-Do-Not-Use-In-Production!!"
```

This value appears in `backend/src/TerraFusion.API/appsettings.json` and `appsettings.Development.json`.
It is a placeholder. It must be replaced before Phase 35 staging.

---

## Phase 35 Gate

- [ ] `TF_JWT_SECRET` set in K8s secret `terrafusion-jwt` (not in appsettings)
- [ ] `appsettings.json` `JwtSettings:SecretKey` reads from env (already uses `${TF_JWT_SECRET}` syntax — but .NET doesn't substitute; must use env var injection at container startup)
- [ ] All services restarted with new key
- [ ] Smoke: token issued and accepted across API, Operations, Gateway
- [ ] Dev static key NOT present in any staging/prod environment variable

---

## .NET Config Note

`.NET WebApplication.CreateBuilder` does NOT substitute `${TF_JWT_SECRET}` in appsettings values.
The correct pattern is environment variable injection at the OS/container level:

```bash
# Docker / K8s env:
- name: JwtSettings__SecretKey
  valueFrom:
    secretKeyRef:
      name: terrafusion-jwt
      key: TF_JWT_SECRET
```

Double-underscore `__` = nested key separator in .NET env-var config override.
`JwtSettings__SecretKey` overrides `appsettings.json > JwtSettings > SecretKey`.
