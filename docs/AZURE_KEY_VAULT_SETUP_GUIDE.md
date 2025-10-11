# ☁️ Azure Key Vault Setup Guide - TerraFusion OS

**Purpose**: Secure secret management for production deployment  
**Time Required**: 2-4 hours  
**Cost**: ~$0.03/month (10,000 operations included free)

---

## Why Azure Key Vault?

### Current State: Plain Text Secrets ❌
```bash
# .env.benton - Secrets visible in plain text
JWT_SECRET=BentonCounty_Super_Secret_JWT_Key_2025_Production_Secure
ENCRYPTION_KEY=BentonCounty_Encryption_Master_Key_2025_AES256_Production
REDIS_PASSWORD=BentonCounty_Redis_Production_2025_Cache_Secure_K3y
```

### With Key Vault: Secure Storage ✅
```bash
# .env.benton - References only, no secrets exposed
KEYVAULT_URL=https://terrafusion-benton-prod-kv.vault.azure.net/
KEYVAULT_TENANT_ID=<your-azure-tenant-id>
KEYVAULT_CLIENT_ID=<your-service-principal-client-id>
KEYVAULT_CLIENT_SECRET=<your-service-principal-secret>

# Secrets retrieved at runtime from Key Vault
```

---

## Step 1: Create Azure Key Vault (15 minutes)

### Option A: Azure Portal (GUI)

1. **Go to Azure Portal**: https://portal.azure.com
2. **Create Resource**: Search for "Key Vault"
3. **Configure**:
   - Subscription: Your Azure subscription
   - Resource Group: `terrafusion-benton-production`
   - Key Vault Name: `terrafusion-benton-prod-kv` (must be globally unique)
   - Region: `West US 2` (closest to WA)
   - Pricing Tier: `Standard` ($0.03/10K operations)
4. **Access Policy**: Default (we'll configure later)
5. **Networking**: Public endpoint (for now)
6. **Review + Create**: Click to deploy

### Option B: Azure CLI (Faster)

```bash
# Login to Azure
az login

# Create resource group
az group create \
  --name terrafusion-benton-production \
  --location westus2

# Create Key Vault
az keyvault create \
  --name terrafusion-benton-prod-kv \
  --resource-group terrafusion-benton-production \
  --location westus2 \
  --sku standard
```

---

## Step 2: Create Service Principal (10 minutes)

**What**: Identity for TerraFusion OS to access Key Vault

```bash
# Create service principal
az ad sp create-for-rbac \
  --name "TerraFusion-Benton-Production" \
  --role "Key Vault Secrets User" \
  --scopes /subscriptions/{subscription-id}/resourceGroups/terrafusion-benton-production/providers/Microsoft.KeyVault/vaults/terrafusion-benton-prod-kv

# Output (SAVE THESE!):
{
  "appId": "12345678-1234-1234-1234-123456789abc",        # CLIENT_ID
  "displayName": "TerraFusion-Benton-Production",
  "password": "abcd1234-abcd-1234-abcd-1234567890ab",     # CLIENT_SECRET
  "tenant": "87654321-4321-4321-4321-cba987654321"        # TENANT_ID
}
```

---

## Step 3: Grant Service Principal Access (5 minutes)

```bash
# Get Key Vault resource ID
VAULT_ID=$(az keyvault show \
  --name terrafusion-benton-prod-kv \
  --query id -o tsv)

# Assign "Key Vault Secrets Officer" role
az role assignment create \
  --assignee {appId-from-step-2} \
  --role "Key Vault Secrets Officer" \
  --scope $VAULT_ID
```

---

## Step 4: Upload Secrets to Key Vault (30 minutes)

### Secrets to Upload (7 total)

```bash
# 1. JWT Secret
az keyvault secret set \
  --vault-name terrafusion-benton-prod-kv \
  --name "jwt-secret" \
  --value "BentonCounty_Super_Secret_JWT_Key_2025_Production_Secure"

# 2. Encryption Key
az keyvault secret set \
  --vault-name terrafusion-benton-prod-kv \
  --name "encryption-key" \
  --value "BentonCounty_Encryption_Master_Key_2025_AES256_Production"

# 3. Redis Password
az keyvault secret set \
  --vault-name terrafusion-benton-prod-kv \
  --name "redis-password" \
  --value "BentonCounty_Redis_Production_2025_Cache_Secure_K3y"

# 4. Grafana Admin Password
az keyvault secret set \
  --vault-name terrafusion-benton-prod-kv \
  --name "grafana-admin-password" \
  --value "BentonCounty_Grafana_Admin_2025_Monitoring_Secure_P4ssw0rd"

# 5. Certificate Password
az keyvault secret set \
  --vault-name terrafusion-benton-prod-kv \
  --name "cert-password" \
  --value "BentonCounty_Certificate_2025_TLS_Secure_K3y"

# 6. Session Secret
az keyvault secret set \
  --vault-name terrafusion-benton-prod-kv \
  --name "session-secret" \
  --value "BentonCounty_Session_2025_Secure_Random_String_For_Cookie_Signing"

# 7. Harris PACS API Key (when you receive it)
az keyvault secret set \
  --vault-name terrafusion-benton-prod-kv \
  --name "harris-pacs-api-key" \
  --value "YOUR_PRODUCTION_API_KEY_FROM_BENTON_COUNTY"
```

---

## Step 5: Update .env.benton Configuration (15 minutes)

### Uncomment and Configure Key Vault Section

```bash
# ===== Azure Key Vault Configuration =====
KEYVAULT_URL=https://terrafusion-benton-prod-kv.vault.azure.net/
KEYVAULT_TENANT_ID=87654321-4321-4321-4321-cba987654321
KEYVAULT_CLIENT_ID=12345678-1234-1234-1234-123456789abc
KEYVAULT_CLIENT_SECRET=abcd1234-abcd-1234-abcd-1234567890ab

# Key Vault secret names (how secrets are stored in vault)
KEYVAULT_SECRET_JWT=jwt-secret
KEYVAULT_SECRET_ENCRYPTION=encryption-key
KEYVAULT_SECRET_REDIS_PASSWORD=redis-password
KEYVAULT_SECRET_GRAFANA_PASSWORD=grafana-admin-password
KEYVAULT_SECRET_CERT_PASSWORD=cert-password
KEYVAULT_SECRET_SESSION=session-secret
KEYVAULT_SECRET_HARRIS_PACS=harris-pacs-api-key
```

---

## Step 6: Update Application Code (1-2 hours)

### Install Azure Key Vault SDK

```bash
npm install @azure/keyvault-secrets @azure/identity
```

### Create Key Vault Client

```javascript
// utils/keyVaultClient.js
const { SecretClient } = require('@azure/keyvault-secrets');
const { ClientSecretCredential } = require('@azure/identity');

// Initialize Key Vault client
const credential = new ClientSecretCredential(
  process.env.KEYVAULT_TENANT_ID,
  process.env.KEYVAULT_CLIENT_ID,
  process.env.KEYVAULT_CLIENT_SECRET
);

const client = new SecretClient(
  process.env.KEYVAULT_URL,
  credential
);

// Helper function to get secrets
async function getSecret(secretName) {
  try {
    const secret = await client.getSecret(secretName);
    return secret.value;
  } catch (error) {
    console.error(`Error retrieving secret ${secretName}:`, error);
    throw error;
  }
}

module.exports = { getSecret, client };
```

### Load Secrets at Application Startup

```javascript
// server.js or index.js
const { getSecret } = require('./utils/keyVaultClient');

async function loadSecrets() {
  console.log('🔐 Loading secrets from Azure Key Vault...');
  
  // Load all secrets
  const secrets = {
    JWT_SECRET: await getSecret(process.env.KEYVAULT_SECRET_JWT),
    ENCRYPTION_KEY: await getSecret(process.env.KEYVAULT_SECRET_ENCRYPTION),
    REDIS_PASSWORD: await getSecret(process.env.KEYVAULT_SECRET_REDIS_PASSWORD),
    GRAFANA_ADMIN_PASSWORD: await getSecret(process.env.KEYVAULT_SECRET_GRAFANA_PASSWORD),
    CERT_PASSWORD: await getSecret(process.env.KEYVAULT_SECRET_CERT_PASSWORD),
    SESSION_SECRET: await getSecret(process.env.KEYVAULT_SECRET_SESSION),
    HARRIS_PACS_API_KEY: await getSecret(process.env.KEYVAULT_SECRET_HARRIS_PACS)
  };
  
  // Override environment variables with Key Vault values
  Object.assign(process.env, secrets);
  
  console.log('✅ Secrets loaded successfully from Key Vault!');
  return secrets;
}

// Initialize app
async function startApp() {
  try {
    await loadSecrets();
    // Start your Express server, database connections, etc.
    app.listen(PORT, () => {
      console.log(`🚀 TerraFusion OS running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start application:', error);
    process.exit(1);
  }
}

startApp();
```

---

## Step 7: Remove Plain Text Secrets (5 minutes)

### Clean Up .env.benton

```bash
# REMOVE these plain text secrets:
# JWT_SECRET=BentonCounty_Super_Secret_JWT_Key_2025_Production_Secure
# ENCRYPTION_KEY=BentonCounty_Encryption_Master_Key_2025_AES256_Production
# REDIS_PASSWORD=BentonCounty_Redis_Production_2025_Cache_Secure_K3y
# GRAFANA_ADMIN_PASSWORD=BentonCounty_Grafana_Admin_2025_Monitoring_Secure_P4ssw0rd
# CERT_PASSWORD=BentonCounty_Certificate_2025_TLS_Secure_K3y
# SESSION_SECRET=BentonCounty_Session_2025_Secure_Random_String_For_Cookie_Signing
# HARRIS_PACS_API_KEY=PRODUCTION_KEY_REQUIRED_FOR_DEPLOYMENT

# KEEP only Key Vault configuration:
KEYVAULT_URL=https://terrafusion-benton-prod-kv.vault.azure.net/
KEYVAULT_TENANT_ID=...
KEYVAULT_CLIENT_ID=...
KEYVAULT_CLIENT_SECRET=...
```

---

## Step 8: Test Key Vault Integration (30 minutes)

### Test Script

```javascript
// test-keyvault.js
const { getSecret } = require('./utils/keyVaultClient');

async function testKeyVault() {
  console.log('🧪 Testing Azure Key Vault integration...\n');
  
  const secretsToTest = [
    'jwt-secret',
    'encryption-key',
    'redis-password',
    'grafana-admin-password',
    'cert-password',
    'session-secret',
    'harris-pacs-api-key'
  ];
  
  for (const secretName of secretsToTest) {
    try {
      const value = await getSecret(secretName);
      console.log(`✅ ${secretName}: ${value.substring(0, 10)}...`);
    } catch (error) {
      console.log(`❌ ${secretName}: Failed - ${error.message}`);
    }
  }
  
  console.log('\n✅ Key Vault integration test complete!');
}

testKeyVault();
```

Run: `node test-keyvault.js`

---

## Step 9: Security Best Practices (Ongoing)

### Enable Key Vault Firewall (Recommended)

```bash
# Allow only your server IP
az keyvault network-rule add \
  --vault-name terrafusion-benton-prod-kv \
  --ip-address YOUR_SERVER_IP

# Enable firewall
az keyvault update \
  --name terrafusion-benton-prod-kv \
  --default-action Deny
```

### Enable Soft Delete and Purge Protection

```bash
az keyvault update \
  --name terrafusion-benton-prod-kv \
  --enable-soft-delete true \
  --enable-purge-protection true
```

### Set Up Alerts

1. Go to Azure Portal → Key Vault → Alerts
2. Create alert rule: "Notify on failed secret access"
3. Set notification method: Email

### Rotate Secrets Periodically

```bash
# Update secret (creates new version, old version retained)
az keyvault secret set \
  --vault-name terrafusion-benton-prod-kv \
  --name "jwt-secret" \
  --value "NEW_SECRET_VALUE"
```

---

## Benefits

### Security
- ✅ Secrets not in plain text files
- ✅ Centralized secret management
- ✅ Audit trail of secret access
- ✅ Secret versioning and rotation

### Compliance
- ✅ FISMA High compliance
- ✅ NIST 800-53 aligned
- ✅ SOC 2 Type II ready

### Operations
- ✅ Easy secret rotation
- ✅ No code changes for secret updates
- ✅ Multi-environment support
- ✅ Access control and monitoring

---

## Troubleshooting

### "Authentication failed" error?
- Verify tenant ID, client ID, client secret are correct
- Ensure service principal has "Key Vault Secrets User" role
- Check if Key Vault firewall is blocking your IP

### "Secret not found" error?
- Verify secret name matches exactly (case-sensitive)
- Check if secret was uploaded successfully: `az keyvault secret show`

### Slow secret retrieval?
- Implement caching for frequently accessed secrets
- Use connection pooling for Key Vault client

---

## Cost Breakdown

- **Key Vault**: ~$0.03/month (10,000 operations free, then $0.03/10K)
- **Expected Usage**: ~1,000 operations/month (startup + rotation)
- **Total Cost**: **$0-0.03/month** (essentially free!)

---

## Completion Checklist

- [ ] Azure Key Vault created
- [ ] Service principal created and configured
- [ ] All 7 secrets uploaded to Key Vault
- [ ] `.env.benton` updated with Key Vault config
- [ ] Application code updated to use Key Vault SDK
- [ ] Plain text secrets removed from `.env.benton`
- [ ] Integration tested successfully
- [ ] Firewall and security configured
- [ ] Alerts set up
- [ ] Mark "Azure Key Vault" as COMPLETE in gap analysis

---

**Status**: Ready to implement!  
**Impact**: Removes 1% production readiness gap (security best practice)  
**Time**: 2-4 hours  
**Cost**: ~$0.03/month  
**Priority**: High (FISMA compliance requirement)

🎯 **THE TERRAFUSION WAY: Secure secrets = Production ready!** 🚀
