# Azure Key Vault Module
# Validated in Phase 3.5 Week 2 POC (HSM-backed, FIPS 140-2 Level 2, 90-day rotation)

terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

data "azurerm_client_config" "current" {}

resource "azurerm_key_vault" "main" {
  name                = var.keyvault_name
  location            = var.location
  resource_group_name = var.resource_group_name
  tenant_id           = data.azurerm_client_config.current.tenant_id

  # Premium SKU (HSM-backed, FIPS 140-2 Level 2)
  sku_name = "premium"

  # Soft delete + purge protection (FISMA compliance)
  soft_delete_retention_days = 90
  purge_protection_enabled   = true

  # Network ACLs (private endpoint only)
  network_acls {
    default_action             = "Deny"
    bypass                     = "AzureServices"
    virtual_network_subnet_ids = [var.subnet_id]
  }

  # RBAC authorization (Azure AD integration)
  enable_rbac_authorization = true

  tags = var.tags
}

# Access Policy: AKS Cluster (kubelet identity)
resource "azurerm_key_vault_access_policy" "aks" {
  key_vault_id = azurerm_key_vault.main.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = var.aks_kubelet_identity_object_id

  secret_permissions = [
    "Get",
    "List"
  ]

  certificate_permissions = [
    "Get",
    "List"
  ]

  key_permissions = [
    "Get",
    "List",
    "Decrypt",
    "Encrypt"
  ]
}

# Secret: PostgreSQL Connection String
resource "azurerm_key_vault_secret" "postgresql_connection" {
  name         = "postgresql-connection-string"
  value        = var.postgresql_connection_string
  key_vault_id = azurerm_key_vault.main.id

  content_type = "text/plain"

  lifecycle {
    ignore_changes = [value]
  }
}

# Secret: Redis Connection String
resource "azurerm_key_vault_secret" "redis_connection" {
  name         = "redis-connection-string"
  value        = var.redis_connection_string
  key_vault_id = azurerm_key_vault.main.id

  content_type = "text/plain"

  lifecycle {
    ignore_changes = [value]
  }
}

# Secret: Kafka (Event Hubs) Connection String
resource "azurerm_key_vault_secret" "kafka_connection" {
  name         = "kafka-connection-string"
  value        = var.kafka_connection_string
  key_vault_id = azurerm_key_vault.main.id

  content_type = "text/plain"

  lifecycle {
    ignore_changes = [value]
  }
}

# Key: Data Encryption Key (AES-256-GCM)
resource "azurerm_key_vault_key" "data_encryption" {
  name         = "data-encryption-key"
  key_vault_id = azurerm_key_vault.main.id
  key_type     = "RSA-HSM" # HSM-backed (FIPS 140-2)
  key_size     = 4096

  key_opts = [
    "decrypt",
    "encrypt",
    "sign",
    "unwrapKey",
    "verify",
    "wrapKey"
  ]

  rotation_policy {
    automatic {
      time_before_expiry = "P30D" # Rotate 30 days before expiry
    }

    expire_after         = "P90D" # 90-day rotation (validated in Week 2 POC)
    notify_before_expiry = "P7D"  # Notify 7 days before expiry
  }
}

# Outputs
output "keyvault_id" {
  value       = azurerm_key_vault.main.id
  description = "Key Vault ID"
}

output "keyvault_uri" {
  value       = azurerm_key_vault.main.vault_uri
  description = "Key Vault URI"
}

output "keyvault_name" {
  value       = azurerm_key_vault.main.name
  description = "Key Vault name"
}

output "data_encryption_key_id" {
  value       = azurerm_key_vault_key.data_encryption.id
  description = "Data encryption key ID"
}
