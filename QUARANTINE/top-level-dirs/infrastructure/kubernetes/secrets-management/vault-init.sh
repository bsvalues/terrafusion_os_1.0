#!/bin/bash
# Vault Initialization Script for TerraFusion Cosmic Platform

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
VAULT_NAMESPACE="vault"
VAULT_ADDR="https://vault.vault.svc.cluster.local:8200"
VAULT_SKIP_VERIFY="true"

echo -e "${GREEN}=== TerraFusion Cosmic Vault Initialization ===${NC}"

# Wait for Vault pods to be ready
echo -e "${YELLOW}Waiting for Vault pods to be ready...${NC}"
kubectl wait --for=condition=ready pod -l app=vault -n $VAULT_NAMESPACE --timeout=300s

# Initialize Vault
echo -e "${YELLOW}Initializing Vault...${NC}"
INIT_OUTPUT=$(kubectl exec -n $VAULT_NAMESPACE vault-0 -- vault operator init -key-shares=5 -key-threshold=3 -format=json)

# Extract unseal keys and root token
UNSEAL_KEY_1=$(echo $INIT_OUTPUT | jq -r '.unseal_keys_b64[0]')
UNSEAL_KEY_2=$(echo $INIT_OUTPUT | jq -r '.unseal_keys_b64[1]')
UNSEAL_KEY_3=$(echo $INIT_OUTPUT | jq -r '.unseal_keys_b64[2]')
UNSEAL_KEY_4=$(echo $INIT_OUTPUT | jq -r '.unseal_keys_b64[3]')
UNSEAL_KEY_5=$(echo $INIT_OUTPUT | jq -r '.unseal_keys_b64[4]')
ROOT_TOKEN=$(echo $INIT_OUTPUT | jq -r '.root_token')

# Save keys securely
echo -e "${YELLOW}Saving unseal keys and root token...${NC}"
cat > vault-keys.json <<EOF
{
  "unseal_keys": [
    "$UNSEAL_KEY_1",
    "$UNSEAL_KEY_2",
    "$UNSEAL_KEY_3",
    "$UNSEAL_KEY_4",
    "$UNSEAL_KEY_5"
  ],
  "root_token": "$ROOT_TOKEN"
}
EOF

echo -e "${RED}IMPORTANT: Save vault-keys.json in a secure location and delete from this system!${NC}"

# Unseal Vault on all replicas
echo -e "${YELLOW}Unsealing Vault instances...${NC}"
for i in 0 1 2; do
  echo -e "Unsealing vault-$i..."
  kubectl exec -n $VAULT_NAMESPACE vault-$i -- vault operator unseal $UNSEAL_KEY_1
  kubectl exec -n $VAULT_NAMESPACE vault-$i -- vault operator unseal $UNSEAL_KEY_2
  kubectl exec -n $VAULT_NAMESPACE vault-$i -- vault operator unseal $UNSEAL_KEY_3
done

# Login with root token
echo -e "${YELLOW}Logging in with root token...${NC}"
kubectl exec -n $VAULT_NAMESPACE vault-0 -- vault login $ROOT_TOKEN

# Enable audit logging
echo -e "${YELLOW}Enabling audit logging...${NC}"
kubectl exec -n $VAULT_NAMESPACE vault-0 -- vault audit enable file file_path=/vault/logs/audit.log

# Enable secret engines
echo -e "${YELLOW}Enabling secret engines...${NC}"
kubectl exec -n $VAULT_NAMESPACE vault-0 -- vault secrets enable -path=cosmic kv-v2
kubectl exec -n $VAULT_NAMESPACE vault-0 -- vault secrets enable -path=neural kv-v2
kubectl exec -n $VAULT_NAMESPACE vault-0 -- vault secrets enable -path=quantum kv-v2
kubectl exec -n $VAULT_NAMESPACE vault-0 -- vault secrets enable -path=consciousness kv-v2
kubectl exec -n $VAULT_NAMESPACE vault-0 -- vault secrets enable -path=holographic kv-v2
kubectl exec -n $VAULT_NAMESPACE vault-0 -- vault secrets enable pki
kubectl exec -n $VAULT_NAMESPACE vault-0 -- vault secrets enable transit

# Configure PKI
echo -e "${YELLOW}Configuring PKI...${NC}"
kubectl exec -n $VAULT_NAMESPACE vault-0 -- vault secrets tune -max-lease-ttl=87600h pki
kubectl exec -n $VAULT_NAMESPACE vault-0 -- vault write pki/root/generate/internal \
  common_name="cosmic.terrafusion.io" \
  ttl=87600h

kubectl exec -n $VAULT_NAMESPACE vault-0 -- vault write pki/config/urls \
  issuing_certificates="https://vault.vault.svc.cluster.local:8200/v1/pki/ca" \
  crl_distribution_points="https://vault.vault.svc.cluster.local:8200/v1/pki/crl"

# Create roles
echo -e "${YELLOW}Creating PKI roles...${NC}"
kubectl exec -n $VAULT_NAMESPACE vault-0 -- vault write pki/roles/cosmic-platform \
  allowed_domains="cosmic.terrafusion.io,terrafusion.cosmic,svc.cluster.local" \
  allow_subdomains=true \
  allow_bare_domains=true \
  allow_localhost=true \
  max_ttl="720h"

# Enable auth methods
echo -e "${YELLOW}Enabling auth methods...${NC}"
kubectl exec -n $VAULT_NAMESPACE vault-0 -- vault auth enable kubernetes
kubectl exec -n $VAULT_NAMESPACE vault-0 -- vault auth enable jwt

# Configure Kubernetes auth
echo -e "${YELLOW}Configuring Kubernetes auth...${NC}"
kubectl exec -n $VAULT_NAMESPACE vault-0 -- vault write auth/kubernetes/config \
  kubernetes_host="https://kubernetes.default.svc:443" \
  kubernetes_ca_cert=@/var/run/secrets/kubernetes.io/serviceaccount/ca.crt \
  token_reviewer_jwt=@/var/run/secrets/kubernetes.io/serviceaccount/token

# Apply policies
echo -e "${YELLOW}Applying policies...${NC}"
for policy in cosmic-admin cosmic-operator cosmic-app neural-network quantum-storage consciousness-service; do
  kubectl exec -n $VAULT_NAMESPACE vault-0 -- vault policy write $policy /vault/policies/${policy}.hcl
done

# Create Kubernetes auth roles
echo -e "${YELLOW}Creating Kubernetes auth roles...${NC}"

# Cosmic App Role
kubectl exec -n $VAULT_NAMESPACE vault-0 -- vault write auth/kubernetes/role/cosmic-app \
  bound_service_account_names=cosmic-app,default \
  bound_service_account_namespaces=terrafusion-cosmic,default \
  policies=cosmic-app \
  ttl=24h

# Neural Network Role
kubectl exec -n $VAULT_NAMESPACE vault-0 -- vault write auth/kubernetes/role/neural-network \
  bound_service_account_names=neural-network \
  bound_service_account_namespaces=terrafusion-cosmic \
  policies=neural-network \
  ttl=8h

# Quantum Storage Role
kubectl exec -n $VAULT_NAMESPACE vault-0 -- vault write auth/kubernetes/role/quantum-storage \
  bound_service_account_names=quantum-storage \
  bound_service_account_namespaces=terrafusion-cosmic \
  policies=quantum-storage \
  ttl=8h

# Populate initial secrets
echo -e "${YELLOW}Populating initial secrets...${NC}"

# Database credentials
kubectl exec -n $VAULT_NAMESPACE vault-0 -- vault kv put cosmic/database/config \
  url="postgresql://cosmic-db.terrafusion.cosmic:5432/cosmic" \
  username="cosmic_user" \
  password="$(openssl rand -base64 32)"

# Neural network keys
kubectl exec -n $VAULT_NAMESPACE vault-0 -- vault kv put neural/models \
  private_key="$(openssl genpkey -algorithm RSA -out /dev/stdout 2>/dev/null | base64 -w0)" \
  public_key="$(openssl rsa -pubout -in /dev/stdin -out /dev/stdout 2>/dev/null | base64 -w0)" \
  encryption_key="$(openssl rand -base64 32)"

# Quantum entanglement keys
for i in {1..11}; do
  kubectl exec -n $VAULT_NAMESPACE vault-0 -- vault kv put quantum/keys/dimension$i \
    key="$(openssl rand -base64 64)" \
    coherence_factor="0.$(shuf -i 80-99 -n 1)" \
    entanglement_state="superposition"
done

# Enable transit encryption
echo -e "${YELLOW}Configuring transit encryption...${NC}"
kubectl exec -n $VAULT_NAMESPACE vault-0 -- vault write -f transit/keys/cosmic-encryption
kubectl exec -n $VAULT_NAMESPACE vault-0 -- vault write -f transit/keys/neural-cipher
kubectl exec -n $VAULT_NAMESPACE vault-0 -- vault write -f transit/keys/quantum-tunnel

# Create emergency break-glass token
echo -e "${YELLOW}Creating emergency break-glass token...${NC}"
EMERGENCY_TOKEN=$(kubectl exec -n $VAULT_NAMESPACE vault-0 -- vault token create \
  -policy=cosmic-admin \
  -ttl=87600h \
  -display-name="emergency-break-glass" \
  -format=json | jq -r '.auth.client_token')

echo -e "${YELLOW}Emergency break-glass token: ${RED}$EMERGENCY_TOKEN${NC}"

# Enable response wrapping for sensitive operations
echo -e "${YELLOW}Configuring response wrapping...${NC}"
kubectl exec -n $VAULT_NAMESPACE vault-0 -- vault write sys/wrapping/lookup

# Health check
echo -e "${YELLOW}Performing health check...${NC}"
HEALTH=$(kubectl exec -n $VAULT_NAMESPACE vault-0 -- vault status -format=json)
if [ $(echo $HEALTH | jq -r '.initialized') == "true" ] && [ $(echo $HEALTH | jq -r '.sealed') == "false" ]; then
  echo -e "${GREEN}✓ Vault is initialized and unsealed${NC}"
else
  echo -e "${RED}✗ Vault health check failed${NC}"
  exit 1
fi

echo -e "${GREEN}=== Vault initialization complete! ===${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Securely store vault-keys.json and delete from this system"
echo "2. Configure backup procedures for Vault data"
echo "3. Set up monitoring and alerting"
echo "4. Rotate root token and create admin tokens"
echo "5. Configure auto-unseal with cloud KMS"
echo ""
echo -e "${GREEN}Vault is ready for the Cosmic Platform! 🌌${NC}"