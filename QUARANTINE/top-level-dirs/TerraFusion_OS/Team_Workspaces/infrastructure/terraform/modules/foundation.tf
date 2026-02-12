# TerraFusion OS - Elite Resource Group Module
# Government. Transcended. - Foundation Infrastructure
# Quantum Consciousness: ACTIVATED

resource "azurerm_resource_group" "terrafusion_foundation" {
  name     = "${local.naming_prefix}-${local.environment}-foundation-rg"
  location = var.primary_location

  tags = merge(local.common_tags, {
    Purpose = "FOUNDATION_INFRASTRUCTURE"
    Tier    = "GOVERNMENT_CORE"
  })
}

# Elite Network Security Group for Zero-Trust Architecture
resource "azurerm_network_security_group" "terrafusion_elite_nsg" {
  name                = "${local.naming_prefix}-${local.environment}-elite-nsg"
  location            = azurerm_resource_group.terrafusion_foundation.location
  resource_group_name = azurerm_resource_group.terrafusion_foundation.name

  # Championship Security Rule - Zero Trust Default Deny
  security_rule {
    name                       = "DenyAllInbound"
    priority                   = 4096
    direction                  = "Inbound"
    access                     = "Deny"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  tags = merge(local.common_tags, {
    Purpose = "ZERO_TRUST_SECURITY"
    Tier    = "NETWORK_PROTECTION"
  })
}

# Elite Virtual Network for Multi-Workspace Architecture
resource "azurerm_virtual_network" "terrafusion_elite_vnet" {
  name                = "${local.naming_prefix}-${local.environment}-elite-vnet"
  location            = azurerm_resource_group.terrafusion_foundation.location
  resource_group_name = azurerm_resource_group.terrafusion_foundation.name
  address_space       = ["10.0.0.0/16"]

  tags = merge(local.common_tags, {
    Purpose = "MULTI_WORKSPACE_NETWORKING"
    Tier    = "NETWORK_FOUNDATION"
  })
}

# Elite Subnets for Team Workspace Segregation
resource "azurerm_subnet" "core_teams_subnet" {
  name                 = "core-teams-subnet"
  resource_group_name  = azurerm_resource_group.terrafusion_foundation.name
  virtual_network_name = azurerm_virtual_network.terrafusion_elite_vnet.name
  address_prefixes     = ["10.0.1.0/24"]
}

resource "azurerm_subnet" "platform_teams_subnet" {
  name                 = "platform-teams-subnet"
  resource_group_name  = azurerm_resource_group.terrafusion_foundation.name
  virtual_network_name = azurerm_virtual_network.terrafusion_elite_vnet.name
  address_prefixes     = ["10.0.2.0/24"]
}

resource "azurerm_subnet" "specialized_teams_subnet" {
  name                 = "specialized-teams-subnet"
  resource_group_name  = azurerm_resource_group.terrafusion_foundation.name
  virtual_network_name = azurerm_virtual_network.terrafusion_elite_vnet.name
  address_prefixes     = ["10.0.3.0/24"]
}

# Elite Key Vault for Sacred Mathematics Secrets
resource "azurerm_key_vault" "terrafusion_sacred_vault" {
  name                = "${local.naming_prefix}-${local.environment}-sacred-kv"
  location            = azurerm_resource_group.terrafusion_foundation.location
  resource_group_name = azurerm_resource_group.terrafusion_foundation.name
  tenant_id           = data.azurerm_client_config.current.tenant_id
  sku_name            = "premium"  # Premium for FIPS-140-2 Level 2 compliance

  # Government-Grade Security Configuration
  enabled_for_disk_encryption     = true
  enabled_for_deployment          = true
  enabled_for_template_deployment = true
  purge_protection_enabled        = true
  soft_delete_retention_days      = 30

  # Zero-Trust Network Access
  network_acls {
    default_action = "Deny"
    bypass         = "AzureServices"
  }

  tags = merge(local.common_tags, {
    Purpose = "SACRED_MATHEMATICS_SECRETS"
    Tier    = "SECURITY_VAULT"
  })
}

# Elite Storage Account for Championship Data
resource "azurerm_storage_account" "terrafusion_championship_storage" {
  name                     = "${replace(local.naming_prefix, "-", "")}${local.environment}storage"
  resource_group_name      = azurerm_resource_group.terrafusion_foundation.name
  location                 = azurerm_resource_group.terrafusion_foundation.location
  account_tier             = "Standard"
  account_replication_type = "GRS"  # Geo-redundant for 39 counties

  # Government-Grade Security Configuration
  min_tls_version                = "TLS1_2"
  allow_nested_items_to_be_public = false
  shared_access_key_enabled      = false

  tags = merge(local.common_tags, {
    Purpose = "CHAMPIONSHIP_DATA_STORAGE"
    Tier    = "DATA_FOUNDATION"
  })
}
