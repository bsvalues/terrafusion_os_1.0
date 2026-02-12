# Terrafusion Cosmic Secrets Management

This directory contains the complete secrets management infrastructure for the Terrafusion Cosmic Platform, providing multiple layers of security for sensitive data.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    External Secret Stores                    │
│  (AWS Secrets Manager, Azure Key Vault, GCP Secret Manager)  │
└─────────────────┬───────────────────────────┬───────────────┘
                  │                           │
                  ▼                           ▼
┌─────────────────────────┐     ┌─────────────────────────────┐
│   External Secrets      │     │      HashiCorp Vault        │
│     Operator            │     │   (Primary Secret Store)     │
└───────────┬─────────────┘     └──────────────┬──────────────┘
            │                                   │
            ▼                                   ▼
┌─────────────────────────┐     ┌─────────────────────────────┐
│   Sealed Secrets        │     │    Vault Agent Injector     │
│   (GitOps Friendly)     │     │   (Sidecar Injection)       │
└─────────────────────────┘     └─────────────────────────────┘
                  │                           │
                  ▼                           ▼
            ┌─────────────────────────────────────┐
            │        Kubernetes Secrets           │
            │    (Encrypted at Rest with KMS)     │
            └─────────────────────────────────────┘
```

## Components

### 1. **HashiCorp Vault**
- Primary secrets management solution
- Dynamic secrets generation
- Encryption as a service
- PKI/TLS certificate management
- Audit logging
- High availability with Consul backend
- Auto-unseal with AWS KMS

### 2. **Consul**
- Storage backend for Vault
- Service discovery
- Health checking
- Distributed key-value store
- High availability clustering

### 3. **Vault Agent Injector**
- Automatic sidecar injection
- Template rendering
- Secret rotation
- Kubernetes native integration

### 4. **Sealed Secrets**
- GitOps-friendly secret management
- Encrypt secrets for storage in Git
- Automatic decryption in cluster
- Public key encryption

### 5. **External Secrets Operator**
- Sync secrets from external stores
- Support for multiple providers
- Automatic secret rotation
- Fine-grained access control

## Quick Start

### Prerequisites

1. **Generate TLS Certificates**:
```bash
# Create certs directory
mkdir -p certs

# Generate CA
openssl req -x509 -new -nodes -key ca.key -sha256 -days 3650 -out ca.crt \
  -subj "/C=US/ST=Cosmic/L=Terrafusion/O=Cosmic Platform/CN=Cosmic CA"

# Generate Vault certificate
openssl req -new -key vault.key -out vault.csr \
  -subj "/C=US/ST=Cosmic/L=Terrafusion/O=Cosmic Platform/CN=*.vault.svc.cluster.local"
openssl x509 -req -in vault.csr -CA ca.crt -CAkey ca.key -CAcreateserial \
  -out vault.crt -days 365 -sha256

# Generate Consul certificate  
openssl req -new -key consul.key -out consul.csr \
  -subj "/C=US/ST=Cosmic/L=Terrafusion/O=Cosmic Platform/CN=*.consul.svc.cluster.local"
openssl x509 -req -in consul.csr -CA ca.crt -CAkey ca.key -CAcreateserial \
  -out consul.crt -days 365 -sha256
```

2. **Create KMS Key** (for auto-unseal):
```bash
aws kms create-key --description "Vault Auto-Unseal Key" \
  --key-policy file://kms-policy.json
```

### Deployment

1. **Deploy the stack**:
```bash
# Set environment variables
export VAULT_KMS_KEY_ID="your-kms-key-id"
export CONSUL_GOSSIP_KEY=$(consul keygen)

# Apply with kustomize
kubectl apply -k .

# Or deploy individually
kubectl apply -f consul.yaml
kubectl apply -f vault.yaml
kubectl apply -f vault-injector.yaml
kubectl apply -f sealed-secrets.yaml
kubectl apply -f external-secrets.yaml
```

2. **Initialize Vault**:
```bash
# Run initialization script
./vault-init.sh

# Or manually initialize
kubectl exec -n vault vault-0 -- vault operator init \
  -key-shares=5 \
  -key-threshold=3
```

3. **Unseal Vault** (if not using auto-unseal):
```bash
# Unseal each instance
for i in 0 1 2; do
  kubectl exec -n vault vault-$i -- vault operator unseal $UNSEAL_KEY_1
  kubectl exec -n vault vault-$i -- vault operator unseal $UNSEAL_KEY_2
  kubectl exec -n vault vault-$i -- vault operator unseal $UNSEAL_KEY_3
done
```

## Usage

### Vault CLI

```bash
# Port-forward to Vault
kubectl port-forward -n vault svc/vault 8200:8200

# Set environment
export VAULT_ADDR=https://localhost:8200
export VAULT_TOKEN=<your-token>

# Write a secret
vault kv put cosmic/myapp/config \
  api_key="cosmic-api-key" \
  db_password="super-secret"

# Read a secret
vault kv get cosmic/myapp/config
```

### Kubernetes Integration

1. **Using Vault Agent Injector**:
```yaml
apiVersion: v1
kind: Pod
metadata:
  annotations:
    vault.hashicorp.com/agent-inject: "true"
    vault.hashicorp.com/role: "cosmic-app"
    vault.hashicorp.com/agent-inject-secret-config: "cosmic/data/myapp/config"
spec:
  serviceAccountName: cosmic-app
  containers:
  - name: app
    image: myapp:latest
```

2. **Using External Secrets**:
```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: app-secrets
spec:
  secretStoreRef:
    name: vault-backend
  target:
    name: app-secrets
  data:
  - secretKey: api_key
    remoteRef:
      key: cosmic/data/myapp/config
      property: api_key
```

3. **Using Sealed Secrets**:
```bash
# Create a secret
echo -n "mypassword" | kubectl create secret generic mysecret \
  --dry-run=client --from-file=password=/dev/stdin -o yaml \
  | kubeseal -o yaml > mysealedsecret.yaml

# Apply sealed secret
kubectl apply -f mysealedsecret.yaml
```

## Secret Engines

### KV v2 (Key-Value)
```bash
# Enable KV engine
vault secrets enable -path=cosmic kv-v2

# Write versioned secrets
vault kv put cosmic/app/config key=value

# Read specific version
vault kv get -version=2 cosmic/app/config
```

### Transit (Encryption as a Service)
```bash
# Enable transit engine
vault secrets enable transit

# Create encryption key
vault write -f transit/keys/myapp

# Encrypt data
vault write transit/encrypt/myapp plaintext=$(base64 <<< "my secret data")

# Decrypt data
vault write transit/decrypt/myapp ciphertext=$CIPHERTEXT
```

### PKI (Certificate Management)
```bash
# Enable PKI engine
vault secrets enable pki

# Generate root CA
vault write pki/root/generate/internal \
  common_name="cosmic.terrafusion.io" \
  ttl=87600h

# Create role
vault write pki/roles/web-servers \
  allowed_domains="terrafusion.cosmic" \
  allow_subdomains=true \
  max_ttl="720h"

# Generate certificate
vault write pki/issue/web-servers \
  common_name="app.terrafusion.cosmic"
```

### Database (Dynamic Credentials)
```bash
# Enable database engine
vault secrets enable database

# Configure PostgreSQL
vault write database/config/postgresql \
  plugin_name=postgresql-database-plugin \
  connection_url="postgresql://{{username}}:{{password}}@postgres:5432/cosmic" \
  allowed_roles="readonly" \
  username="vault" \
  password="vault-password"

# Create role
vault write database/roles/readonly \
  db_name=postgresql \
  creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; \
    GRANT SELECT ON ALL TABLES IN SCHEMA public TO \"{{name}}\";" \
  default_ttl="1h" \
  max_ttl="24h"
```

## Policies

### Example Policies

1. **Application Policy**:
```hcl
path "cosmic/data/{{identity.entity.aliases.auth_kubernetes_*.metadata.service_account_namespace}}/*" {
  capabilities = ["read", "list"]
}

path "transit/encrypt/{{identity.entity.aliases.auth_kubernetes_*.metadata.service_account_namespace}}" {
  capabilities = ["update"]
}

path "transit/decrypt/{{identity.entity.aliases.auth_kubernetes_*.metadata.service_account_namespace}}" {
  capabilities = ["update"]
}
```

2. **Admin Policy**:
```hcl
path "*" {
  capabilities = ["create", "read", "update", "delete", "list", "sudo"]
}
```

## Security Best Practices

1. **Least Privilege**: Grant minimal required permissions
2. **Audit Everything**: Enable audit logging for all operations
3. **Rotate Regularly**: Implement automatic secret rotation
4. **Use Dynamic Secrets**: Prefer dynamic over static secrets
5. **Encrypt in Transit**: Always use TLS for communication
6. **Separate Environments**: Use different namespaces/paths per environment
7. **Backup Securely**: Encrypt backups and store separately

## Monitoring

### Metrics
- Vault exposes metrics at `/v1/sys/metrics`
- Consul exposes metrics at `/v1/agent/metrics`
- Configure Prometheus scraping

### Alerts
- Vault sealed status
- Certificate expiration
- High error rates
- Audit log failures
- Storage backend issues

## Backup and Recovery

### Vault Backup
```bash
# Consul snapshot (includes Vault data)
consul snapshot save backup.snap

# Restore from snapshot
consul snapshot restore backup.snap
```

### Disaster Recovery
1. **Multi-region replication**
2. **Regular automated backups**
3. **Documented recovery procedures**
4. **Regular DR testing**

## Troubleshooting

### Common Issues

1. **Vault is sealed**:
```bash
vault operator unseal $UNSEAL_KEY
```

2. **Permission denied**:
```bash
# Check token capabilities
vault token capabilities $TOKEN path/to/secret

# Review audit logs
kubectl logs -n vault vault-0 | grep AUDIT
```

3. **Consul cluster issues**:
```bash
# Check cluster members
consul members

# Force leave
consul force-leave node-name
```

## Advanced Features

### Auto-unseal with KMS
```hcl
seal "awskms" {
  region     = "us-east-1"
  kms_key_id = "alias/vault-unseal"
}
```

### Performance Replication
```bash
# Enable on primary
vault write -f sys/replication/performance/primary/enable

# Generate secondary token
vault write sys/replication/performance/primary/secondary-token id=secondary

# Enable on secondary
vault write sys/replication/performance/secondary/enable token=$TOKEN
```

### Namespaces (Enterprise)
```bash
# Create namespace
vault namespace create engineering

# Use namespace
vault secrets enable -namespace=engineering kv-v2
```

## Integration Examples

### GitOps with Sealed Secrets
```yaml
# Encrypt in CI/CD
cat secret.yaml | kubeseal --controller-namespace sealed-secrets -o yaml

# Commit to Git
git add sealedsecret.yaml
git commit -m "Add encrypted secret"
```

### Multi-cloud with External Secrets
```yaml
# AWS Secrets Manager
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: aws-secrets
spec:
  provider:
    aws:
      service: SecretsManager
      region: us-east-1

# Azure Key Vault
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: azure-keyvault
spec:
  provider:
    azurekv:
      vaultUrl: https://myvault.vault.azure.net
```

## Support

For issues:
- Check Vault logs: `kubectl logs -n vault vault-0`
- Review audit logs: `kubectl exec -n vault vault-0 -- cat /vault/logs/audit.log`
- Consul UI: `kubectl port-forward -n vault svc/consul-ui 8500:8500`
- Contact Cosmic Security team

🌌 Securing the secrets of the Cosmic Platform! 🌌