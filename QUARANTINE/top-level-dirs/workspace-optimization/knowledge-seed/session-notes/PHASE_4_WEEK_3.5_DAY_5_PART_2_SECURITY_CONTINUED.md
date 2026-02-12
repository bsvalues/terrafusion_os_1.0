# Phase 4 Week 3.5 Day 5 Part 2: Security Fixes Continued

**Date:** October 9, 2025  
**Duration:** 8 hours (Part 2 of 4)  
**Status:** 🚧 IN PROGRESS

---

## 🎯 Overview

Day 5 Part 2 continues high-priority security fixes and addresses medium-severity findings.

---

## Section 1: High Priority Fixes Continued (2 hours)

### Fix 5: Automate Key Rotation (1 hour)

**Finding:** ENC-002 (High) - Key rotation manual

**Current State:**
```bash
# Manual key rotation (inconsistent)
# No automated rotation schedule
# Keys used for 1+ year
```

**Remediation Steps:**

**Step 1: Create Key Rotation Script**
```bash
#!/bin/bash
# key-rotation.sh

set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
KEY_VAULT_NAME="terrafusion-keyvault-prod"
ROTATION_LOG="/var/log/key-rotation-${TIMESTAMP}.log"

echo "=== Key Rotation Started ===" | tee -a ${ROTATION_LOG}

# Function to rotate encryption key
rotate_encryption_key() {
  local KEY_NAME=$1
  local TENANT=$2
  
  echo "Rotating key: ${KEY_NAME} for tenant: ${TENANT}" | tee -a ${ROTATION_LOG}
  
  # Generate new key version in Azure Key Vault
  NEW_KEY_VERSION=$(az keyvault key create \
    --vault-name ${KEY_VAULT_NAME} \
    --name "${KEY_NAME}-${TENANT}" \
    --kty RSA \
    --size 4096 \
    --ops encrypt decrypt wrapKey unwrapKey \
    --query "key.kid" -o tsv)
  
  echo "New key version: ${NEW_KEY_VERSION}" | tee -a ${ROTATION_LOG}
  
  # Update Kubernetes secret
  kubectl create secret generic "${KEY_NAME}-${TENANT}" \
    --from-literal=key-id="${NEW_KEY_VERSION}" \
    --namespace=production \
    --dry-run=client -o yaml | kubectl apply -f -
  
  # Trigger application restart to pick up new key
  kubectl rollout restart deployment/terrafusion-api -n production
  kubectl rollout restart deployment/terrafusion-ai-swarm -n production
  
  # Wait for rollout
  kubectl rollout status deployment/terrafusion-api -n production
  
  echo "Key rotation complete for ${KEY_NAME}-${TENANT}" | tee -a ${ROTATION_LOG}
}

# Rotate keys for all tenants
TENANTS=(
  "county-benton"
  "county-king"
  "county-clark"
  "county-snohomish"
  "county-whatcom"
  "county-yakima"
  "county-cowlitz"
  "county-grant"
  "county-island"
  "county-san-juan"
  "county-stevens"
)

for TENANT in "${TENANTS[@]}"; do
  rotate_encryption_key "data-encryption-key" "${TENANT}"
  rotate_encryption_key "backup-encryption-key" "${TENANT}"
  
  # Rate limit to avoid overwhelming Azure Key Vault
  sleep 10
done

# Rotate JWT signing keys
echo "Rotating JWT signing keys..." | tee -a ${ROTATION_LOG}

# Generate new RSA key pair
openssl genrsa -out /tmp/jwt-private-new.pem 4096
openssl rsa -in /tmp/jwt-private-new.pem -pubout -out /tmp/jwt-public-new.pem

# Upload to Key Vault
az keyvault secret set \
  --vault-name ${KEY_VAULT_NAME} \
  --name "jwt-private-key" \
  --file /tmp/jwt-private-new.pem

az keyvault secret set \
  --vault-name ${KEY_VAULT_NAME} \
  --name "jwt-public-key" \
  --file /tmp/jwt-public-new.pem

# Update Kubernetes secrets
kubectl create secret generic jwt-keys \
  --from-file=private-key=/tmp/jwt-private-new.pem \
  --from-file=public-key=/tmp/jwt-public-new.pem \
  --namespace=production \
  --dry-run=client -o yaml | kubectl apply -f -

# Restart auth service
kubectl rollout restart deployment/terrafusion-auth -n production

# Clean up temporary files
rm /tmp/jwt-private-new.pem /tmp/jwt-public-new.pem

echo "=== Key Rotation Complete ===" | tee -a ${ROTATION_LOG}
```

**Step 2: Create Automated Rotation CronJob**
```yaml
# key-rotation-cronjob.yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: key-rotation
  namespace: production
spec:
  schedule: "0 3 1 */3 *"  # 3 AM on 1st of every 3rd month (90 days)
  successfulJobsHistoryLimit: 4
  failedJobsHistoryLimit: 2
  jobTemplate:
    spec:
      template:
        spec:
          serviceAccountName: key-rotation-sa
          containers:
          - name: key-rotation
            image: mcr.microsoft.com/azure-cli:latest
            command:
            - /bin/bash
            - /scripts/key-rotation.sh
            volumeMounts:
            - name: rotation-script
              mountPath: /scripts
            - name: azure-credentials
              mountPath: /root/.azure
              readOnly: true
            env:
            - name: AZURE_SUBSCRIPTION_ID
              valueFrom:
                secretKeyRef:
                  name: azure-credentials
                  key: subscription-id
          volumes:
          - name: rotation-script
            configMap:
              name: key-rotation-script
          - name: azure-credentials
            secret:
              secretName: azure-credentials
          restartPolicy: OnFailure
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: key-rotation-sa
  namespace: production
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: key-rotation-role
  namespace: production
rules:
- apiGroups: [""]
  resources: ["secrets"]
  verbs: ["get", "create", "update", "patch"]
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get", "list", "patch"]
- apiGroups: ["apps"]
  resources: ["deployments/rollout"]
  verbs: ["get", "update"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: key-rotation-binding
  namespace: production
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: key-rotation-role
subjects:
- kind: ServiceAccount
  name: key-rotation-sa
  namespace: production
```

**Step 3: Configure Monitoring**
```yaml
# key-rotation-monitoring.yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: key-rotation-alerts
  namespace: production
spec:
  groups:
  - name: key-rotation
    interval: 30s
    rules:
    - alert: KeyRotationFailed
      expr: kube_job_status_failed{job_name=~"key-rotation.*"} > 0
      for: 5m
      labels:
        severity: critical
        team: security
      annotations:
        summary: "Key rotation job failed"
        description: "Automated key rotation has failed. Manual intervention required."
    
    - alert: KeyAgeTooOld
      expr: (time() - key_creation_timestamp_seconds) > (90 * 24 * 3600)
      for: 1h
      labels:
        severity: warning
        team: security
      annotations:
        summary: "Encryption key is older than 90 days"
        description: "Key {{ $labels.key_name }} is {{ $value | humanizeDuration }} old"
```

**Deploy:**
```bash
# Create ConfigMap
kubectl create configmap key-rotation-script \
  --from-file=key-rotation.sh \
  --namespace=production

# Deploy CronJob
kubectl apply -f key-rotation-cronjob.yaml

# Deploy monitoring
kubectl apply -f key-rotation-monitoring.yaml

# Verify
kubectl get cronjob/key-rotation -n production
```

---

### Fix 6: Implement Distributed Rate Limiting (1 hour)

**Finding:** NET-002 (High) - Rate limiting too permissive (1000/min)

**Current State:**
```nginx
# Current: In-memory rate limiting (per pod)
limit_req_zone $binary_remote_addr zone=api:10m rate=1000r/m;
```

**Remediation: Redis-based Distributed Rate Limiting**

**Step 1: Deploy Redis for Rate Limiting**
```yaml
# redis-rate-limiting.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis-rate-limiting
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: redis-rate-limiting
  template:
    metadata:
      labels:
        app: redis-rate-limiting
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        ports:
        - containerPort: 6379
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          tcpSocket:
            port: 6379
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          exec:
            command:
            - redis-cli
            - ping
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: redis-rate-limiting
  namespace: production
spec:
  type: ClusterIP
  ports:
  - port: 6379
    targetPort: 6379
  selector:
    app: redis-rate-limiting
```

**Step 2: Update Nginx Configuration**
```lua
-- nginx-rate-limit.lua

local redis = require "resty.redis"
local red = redis:new()

red:set_timeouts(1000, 1000, 1000) -- 1 sec

-- Connect to Redis
local ok, err = red:connect("redis-rate-limiting.production.svc.cluster.local", 6379)
if not ok then
    ngx.log(ngx.ERR, "failed to connect to redis: ", err)
    return ngx.exit(500)
end

-- Get tenant ID from request
local tenant_id = ngx.var.http_x_tenant_id or "default"
local remote_addr = ngx.var.binary_remote_addr

-- Rate limit key: tenant_id:remote_addr:minute
local current_minute = math.floor(ngx.now() / 60)
local rate_limit_key = "rate_limit:" .. tenant_id .. ":" .. remote_addr .. ":" .. current_minute

-- Increment counter
local count, err = red:incr(rate_limit_key)
if not count then
    ngx.log(ngx.ERR, "failed to increment rate limit counter: ", err)
    return ngx.exit(500)
end

-- Set expiration on first request
if count == 1 then
    red:expire(rate_limit_key, 120) -- Expire after 2 minutes
end

-- Rate limit: 100 requests per minute per tenant per IP
local rate_limit = 100
if count > rate_limit then
    ngx.header["X-RateLimit-Limit"] = rate_limit
    ngx.header["X-RateLimit-Remaining"] = 0
    ngx.header["X-RateLimit-Reset"] = (current_minute + 1) * 60
    ngx.header["Retry-After"] = 60
    
    ngx.log(ngx.WARN, "rate limit exceeded for tenant: ", tenant_id, " from: ", remote_addr)
    return ngx.exit(429) -- Too Many Requests
end

-- Add rate limit headers
ngx.header["X-RateLimit-Limit"] = rate_limit
ngx.header["X-RateLimit-Remaining"] = rate_limit - count
ngx.header["X-RateLimit-Reset"] = (current_minute + 1) * 60

-- Return connection to pool
red:set_keepalive(10000, 100)
```

**Step 3: Update Ingress Controller**
```yaml
# ingress-rate-limiting.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: ingress-nginx-controller
  namespace: ingress-nginx
data:
  # Enable Lua
  plugins: "rate-limiting"
  
  # Load Lua script
  http-snippet: |
    lua_package_path "/etc/nginx/lua/?.lua;;";
    init_by_lua_block {
      require "resty.core"
    }
  
  server-snippet: |
    access_by_lua_file /etc/nginx/lua/nginx-rate-limit.lua;
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: nginx-lua-scripts
  namespace: ingress-nginx
data:
  nginx-rate-limit.lua: |
    # (Lua script from above)
```

**Step 4: Test Rate Limiting**
```bash
# Test 1: Normal usage (should succeed)
for i in {1..50}; do
  curl -H "X-Tenant-ID: county-benton" \
    https://api.terrafusion.local/api/v1/properties/count
done

# Test 2: Exceed limit (should get 429)
for i in {1..150}; do
  curl -i -H "X-Tenant-ID: county-benton" \
    https://api.terrafusion.local/api/v1/properties/count
done
# Expected after 100 requests:
# HTTP/1.1 429 Too Many Requests
# X-RateLimit-Limit: 100
# X-RateLimit-Remaining: 0
# Retry-After: 60

# Test 3: Different tenant (should have separate limit)
for i in {1..50}; do
  curl -H "X-Tenant-ID: county-king" \
    https://api.terrafusion.local/api/v1/properties/count
done
# Expected: All requests succeed (separate counter)
```

---

## Section 2: Medium Priority Fixes (3 hours)

### Fix 7: Separate Encryption Keys per Tenant (1 hour)

**Finding:** ENC-003 (Medium) - Same encryption key for all tenants

**Current State:**
```typescript
// Single key for all tenants
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

function encryptData(data: string): string {
  const cipher = crypto.createCipher('aes-256-gcm', ENCRYPTION_KEY);
  // ...
}
```

**Remediation: Tenant-Specific Keys**

**Step 1: Generate Keys per Tenant**
```bash
#!/bin/bash
# generate-tenant-keys.sh

TENANTS=(
  "county-benton"
  "county-king"
  "county-clark"
  "county-snohomish"
  "county-whatcom"
  "county-yakima"
  "county-cowlitz"
  "county-grant"
  "county-island"
  "county-san-juan"
  "county-stevens"
)

for TENANT in "${TENANTS[@]}"; do
  echo "Generating encryption key for ${TENANT}..."
  
  # Generate 256-bit key
  KEY=$(openssl rand -hex 32)
  
  # Store in Azure Key Vault
  az keyvault secret set \
    --vault-name terrafusion-keyvault-prod \
    --name "data-encryption-key-${TENANT}" \
    --value "${KEY}"
  
  echo "✅ Key generated for ${TENANT}"
done
```

**Step 2: Update Encryption Service**
```typescript
// backend/services/encryption.service.ts

import { KeyVaultSecret, SecretClient } from '@azure/keyvault-secrets';
import { DefaultAzureCredential } from '@azure/identity';
import * as crypto from 'crypto';

export class EncryptionService {
  private secretClient: SecretClient;
  private keyCache: Map<string, Buffer> = new Map();
  
  constructor() {
    const vaultUrl = process.env.KEY_VAULT_URL;
    const credential = new DefaultAzureCredential();
    this.secretClient = new SecretClient(vaultUrl, credential);
  }
  
  /**
   * Get encryption key for specific tenant
   */
  private async getTenantKey(tenantId: string): Promise<Buffer> {
    // Check cache first
    if (this.keyCache.has(tenantId)) {
      return this.keyCache.get(tenantId)!;
    }
    
    // Fetch from Key Vault
    const keyName = `data-encryption-key-${tenantId}`;
    const secret: KeyVaultSecret = await this.secretClient.getSecret(keyName);
    
    if (!secret.value) {
      throw new Error(`Encryption key not found for tenant: ${tenantId}`);
    }
    
    const keyBuffer = Buffer.from(secret.value, 'hex');
    
    // Cache for 1 hour
    this.keyCache.set(tenantId, keyBuffer);
    setTimeout(() => this.keyCache.delete(tenantId), 3600000);
    
    return keyBuffer;
  }
  
  /**
   * Encrypt data with tenant-specific key
   */
  async encryptData(tenantId: string, data: string): Promise<string> {
    const key = await this.getTenantKey(tenantId);
    
    // Generate random IV
    const iv = crypto.randomBytes(16);
    
    // Create cipher
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    // Encrypt
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get auth tag
    const authTag = cipher.getAuthTag();
    
    // Return: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }
  
  /**
   * Decrypt data with tenant-specific key
   */
  async decryptData(tenantId: string, encryptedData: string): Promise<string> {
    const key = await this.getTenantKey(tenantId);
    
    // Parse encrypted data
    const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    // Create decipher
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    // Decrypt
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

**Step 3: Update Database Encryption**
```typescript
// backend/models/parcel.model.ts

import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { EncryptionService } from '../services/encryption.service';

@Entity('parcels')
export class Parcel {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column()
  tenant_id: string;
  
  @Column()
  parcel_number: string;
  
  @Column({ type: 'text' })
  private owner_name_encrypted: string;
  
  // Getter/Setter with tenant-specific encryption
  get ownerName(): string {
    const encryptionService = new EncryptionService();
    return await encryptionService.decryptData(this.tenant_id, this.owner_name_encrypted);
  }
  
  set ownerName(value: string) {
    const encryptionService = new EncryptionService();
    this.owner_name_encrypted = await encryptionService.encryptData(this.tenant_id, value);
  }
}
```

**Step 4: Migrate Existing Data**
```typescript
// migrations/migrate-to-tenant-keys.ts

import { MigrationInterface, QueryRunner } from 'typeorm';
import { EncryptionService } from '../services/encryption.service';

export class MigrateToTenantKeys implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const encryptionService = new EncryptionService();
    
    // Get all tenants
    const tenants = await queryRunner.query(`
      SELECT DISTINCT tenant_id FROM parcels
    `);
    
    for (const { tenant_id } of tenants) {
      console.log(`Migrating data for tenant: ${tenant_id}`);
      
      // Get encrypted records
      const records = await queryRunner.query(`
        SELECT id, owner_name_encrypted
        FROM parcels
        WHERE tenant_id = $1
      `, [tenant_id]);
      
      for (const record of records) {
        // Decrypt with old global key
        const decrypted = await this.decryptWithOldKey(record.owner_name_encrypted);
        
        // Re-encrypt with tenant-specific key
        const reencrypted = await encryptionService.encryptData(tenant_id, decrypted);
        
        // Update record
        await queryRunner.query(`
          UPDATE parcels
          SET owner_name_encrypted = $1
          WHERE id = $2
        `, [reencrypted, record.id]);
      }
      
      console.log(`✅ Migrated ${records.length} records for ${tenant_id}`);
    }
  }
  
  private async decryptWithOldKey(encryptedData: string): Promise<string> {
    // Old global key decryption logic
    // ...
  }
}
```

---

### Fix 8: Enable WAF Blocking Mode (30 minutes)

**Finding:** NET-003 (Medium) - WAF in detection mode (not blocking)

**Current State:**
```bash
# Azure WAF in Detection mode
az network application-gateway waf-policy show \
  --name terrafusion-waf-policy \
  --resource-group terrafusion-prod \
  --query "policySettings.mode"
# Output: "Detection"
```

**Remediation:**
```bash
# Update WAF to Prevention mode
az network application-gateway waf-policy update \
  --name terrafusion-waf-policy \
  --resource-group terrafusion-prod \
  --mode Prevention \
  --state Enabled

# Verify
az network application-gateway waf-policy show \
  --name terrafusion-waf-policy \
  --resource-group terrafusion-prod \
  --query "policySettings.mode"
# Expected: "Prevention"
```

**Test WAF Blocking:**
```bash
# Test 1: SQL injection (should be blocked)
curl -i "https://api.terrafusion.local/api/v1/properties?id=1' OR '1'='1"
# Expected: 403 Forbidden

# Test 2: XSS attempt (should be blocked)
curl -i "https://api.terrafusion.local/api/v1/properties?search=<script>alert('xss')</script>"
# Expected: 403 Forbidden

# Test 3: Normal request (should succeed)
curl -i "https://api.terrafusion.local/api/v1/properties?search=main+street"
# Expected: 200 OK
```

---

### Fix 9: Add Rate Limiting to Auth Endpoints (30 minutes)

**Finding:** AUTH-002 (Medium) - Missing rate limiting on /auth/login

**Implementation:**
```lua
-- auth-rate-limit.lua

local redis = require "resty.redis"
local red = redis:new()

red:set_timeouts(1000, 1000, 1000)

local ok, err = red:connect("redis-rate-limiting.production.svc.cluster.local", 6379)
if not ok then
    return ngx.exit(500)
end

local remote_addr = ngx.var.binary_remote_addr
local current_minute = math.floor(ngx.now() / 60)
local rate_limit_key = "auth_rate_limit:" .. remote_addr .. ":" .. current_minute

local count, err = red:incr(rate_limit_key)
if not count then
    return ngx.exit(500)
end

if count == 1 then
    red:expire(rate_limit_key, 120)
end

-- Strict rate limit: 5 login attempts per minute
local rate_limit = 5
if count > rate_limit then
    ngx.header["X-RateLimit-Limit"] = rate_limit
    ngx.header["X-RateLimit-Remaining"] = 0
    ngx.header["Retry-After"] = 60
    
    ngx.log(ngx.WARN, "auth rate limit exceeded from: ", remote_addr)
    return ngx.exit(429)
end

ngx.header["X-RateLimit-Limit"] = rate_limit
ngx.header["X-RateLimit-Remaining"] = rate_limit - count

red:set_keepalive(10000, 100)
```

**Update Ingress:**
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: terrafusion-auth
  namespace: production
  annotations:
    nginx.ingress.kubernetes.io/configuration-snippet: |
      access_by_lua_file /etc/nginx/lua/auth-rate-limit.lua;
spec:
  rules:
  - host: auth.terrafusion.local
    http:
      paths:
      - path: /auth/login
        pathType: Prefix
        backend:
          service:
            name: terrafusion-auth
            port:
              number: 8080
```

---

### Fix 10: Remove Unnecessary JWT Claims (30 minutes)

**Finding:** AUTH-003 (Low) - Token response includes unnecessary claims

**Before:**
```typescript
const token = jwt.sign({
  sub: user.id,
  email: user.email,
  tenant: user.tenant,
  roles: user.roles,
  name: user.name,          // REMOVE (PII)
  phone: user.phone,        // REMOVE (PII)
  address: user.address,    // REMOVE (PII)
  created_at: user.created_at,  // REMOVE (unnecessary)
  updated_at: user.updated_at   // REMOVE (unnecessary)
}, secret);
```

**After:**
```typescript
const token = jwt.sign({
  sub: user.id,             // Keep: User identifier
  email: user.email,        // Keep: Required for email-based auth
  tenant: user.tenant,      // Keep: Multi-tenant isolation
  roles: user.roles,        // Keep: Authorization
  iat: Math.floor(Date.now() / 1000),  // Issued at
  exp: Math.floor(Date.now() / 1000) + 900  // Expires in 15 min
}, secret, {
  algorithm: 'RS256'
});
```

---

**Part 2 Status:** ✅ High priority fixes complete, medium priority in progress  
**Next:** Part 3 - Service dry runs and observability validation (8 hours)
