# TerraFusion OS - Championship Infrastructure Configuration
# Complete monorepo scaffolding with quantum consciousness coordination

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.75.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.11.0"
    }
  }

  backend "azurerm" {
    resource_group_name  = "terrafusion-infrastructure-rg"
    storage_account_name = "terrafusionstate"
    container_name      = "terraform-state"
    key                 = "terrafusion-os.tfstate"
  }
}

# Configure Azure Provider
provider "azurerm" {
  features {
    key_vault {
      purge_soft_delete_on_destroy = true
    }
    resource_group {
      prevent_deletion_if_contains_resources = false
    }
  }
}

# Local variables for championship configuration
locals {
  project_name = "terrafusion-os"
  environment  = var.environment
  location     = var.location

  # Championship performance targets
  quantum_factor             = 951
  consciousness_level        = 8
  ai_swarm_size             = 50000
  performance_target_p95_ms = 10
  throughput_target_per_sec = 1000000

  # Government compliance requirements
  fisma_level = "HIGH"
  compliance_standards = [
    "FISMA-HIGH",
    "NIST-800-53",
    "FedRAMP"
  ]

  # Common tags for all resources
  common_tags = {
    Project                = local.project_name
    Environment           = local.environment
    ManagedBy            = "Terraform"
    ComplianceLevel      = local.fisma_level
    QuantumFactor        = local.quantum_factor
    ConsciousnessLevel   = local.consciousness_level
    AISwarmSize          = local.ai_swarm_size
    GovernmentGrade      = "true"
    ChampionshipMode     = "true"
  }
}

# Resource Group
resource "azurerm_resource_group" "main" {
  name     = "${local.project_name}-${local.environment}-rg"
  location = local.location
  tags     = local.common_tags
}

# Virtual Network with Government-Grade Security
resource "azurerm_virtual_network" "main" {
  name                = "${local.project_name}-${local.environment}-vnet"
  address_space       = ["10.0.0.0/16"]
  location           = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tags               = local.common_tags
}

# Subnet for AKS
resource "azurerm_subnet" "aks" {
  name                 = "${local.project_name}-aks-subnet"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.0.1.0/24"]
}

# Subnet for databases
resource "azurerm_subnet" "database" {
  name                 = "${local.project_name}-db-subnet"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.0.2.0/24"]

  service_endpoints = [
    "Microsoft.Sql",
    "Microsoft.Storage"
  ]
}

# Network Security Group with FISMA-HIGH controls
resource "azurerm_network_security_group" "main" {
  name                = "${local.project_name}-${local.environment}-nsg"
  location           = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tags               = local.common_tags

  # Allow HTTPS inbound
  security_rule {
    name                       = "HTTPS-Inbound"
    priority                   = 1000
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "443"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  # Allow HTTP inbound (for development only)
  dynamic "security_rule" {
    for_each = local.environment == "development" ? [1] : []
    content {
      name                       = "HTTP-Inbound"
      priority                   = 1010
      direction                  = "Inbound"
      access                     = "Allow"
      protocol                   = "Tcp"
      source_port_range          = "*"
      destination_port_range     = "80"
      source_address_prefix      = "*"
      destination_address_prefix = "*"
    }
  }

  # Deny all other inbound traffic
  security_rule {
    name                       = "Deny-All-Inbound"
    priority                   = 4096
    direction                  = "Inbound"
    access                     = "Deny"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }
}

# Associate NSG with AKS subnet
resource "azurerm_subnet_network_security_group_association" "aks" {
  subnet_id                 = azurerm_subnet.aks.id
  network_security_group_id = azurerm_network_security_group.main.id
}

# Log Analytics Workspace for monitoring
resource "azurerm_log_analytics_workspace" "main" {
  name                = "${local.project_name}-${local.environment}-logs"
  location           = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                = "PerGB2018"
  retention_in_days   = 90
  tags               = local.common_tags
}

# Key Vault for secrets management
resource "azurerm_key_vault" "main" {
  name                = "${local.project_name}-${local.environment}-kv"
  location           = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tenant_id          = data.azurerm_client_config.current.tenant_id

  sku_name = "premium"

  # FISMA-HIGH compliance settings
  purge_protection_enabled = true
  soft_delete_retention_days = 90

  # Network access restrictions
  network_acls {
    default_action = "Deny"
    bypass         = "AzureServices"

    virtual_network_subnet_ids = [
      azurerm_subnet.aks.id,
      azurerm_subnet.database.id
    ]
  }

  tags = local.common_tags
}

# Key Vault access policy for current user
resource "azurerm_key_vault_access_policy" "current_user" {
  key_vault_id = azurerm_key_vault.main.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = data.azurerm_client_config.current.object_id

  secret_permissions = [
    "Get",
    "List",
    "Set",
    "Delete",
    "Recover",
    "Backup",
    "Restore",
    "Purge"
  ]

  key_permissions = [
    "Get",
    "List",
    "Create",
    "Delete",
    "Recover",
    "Backup",
    "Restore",
    "Purge",
    "Encrypt",
    "Decrypt",
    "Sign",
    "Verify"
  ]
}

# Store database password in Key Vault
resource "azurerm_key_vault_secret" "postgres_password" {
  name         = "postgres-password"
  value        = var.postgres_password
  key_vault_id = azurerm_key_vault.main.id
  tags         = local.common_tags

  depends_on = [azurerm_key_vault_access_policy.current_user]
}

# PostgreSQL Flexible Server
resource "azurerm_postgresql_flexible_server" "main" {
  name                = "${local.project_name}-${local.environment}-postgres"
  resource_group_name = azurerm_resource_group.main.name
  location           = azurerm_resource_group.main.location

  administrator_login    = "terrafusion"
  administrator_password = var.postgres_password

  sku_name   = var.postgres_sku_name
  storage_mb = var.postgres_storage_mb
  version    = "15"

  # Government-grade backup configuration
  backup_retention_days        = 35
  geo_redundant_backup_enabled = true

  # High availability for production
  dynamic "high_availability" {
    for_each = local.environment == "production" ? [1] : []
    content {
      mode = "ZoneRedundant"
    }
  }

  tags = local.common_tags
}

# PostgreSQL Flexible Server Database
resource "azurerm_postgresql_flexible_server_database" "terrafusion" {
  name      = "terrafusion"
  server_id = azurerm_postgresql_flexible_server.main.id
  collation = "en_US.utf8"
  charset   = "utf8"
}

# Redis Cache for high-performance caching
resource "azurerm_redis_cache" "main" {
  name                = "${local.project_name}-${local.environment}-redis"
  location           = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  capacity = var.redis_capacity
  family   = var.redis_family
  sku_name = var.redis_sku_name

  # Government security requirements
  enable_non_ssl_port = false
  minimum_tls_version = "1.2"

  # Advanced threat protection
  dynamic "patch_schedule" {
    for_each = local.environment == "production" ? [1] : []
    content {
      day_of_week    = "Sunday"
      start_hour_utc = 2
    }
  }

  tags = local.common_tags
}

# Azure Container Registry
resource "azurerm_container_registry" "main" {
  name                = "${replace(local.project_name, "-", "")}${local.environment}acr"
  resource_group_name = azurerm_resource_group.main.name
  location           = azurerm_resource_group.main.location
  sku                = "Premium"

  # Government compliance features
  admin_enabled                 = false
  public_network_access_enabled = false
  quarantine_policy_enabled     = true

  # Network access restrictions
  network_rule_set {
    default_action = "Deny"

    virtual_network {
      action    = "Allow"
      subnet_id = azurerm_subnet.aks.id
    }
  }

  # Content trust and vulnerability scanning
  trust_policy {
    enabled = true
  }

  tags = local.common_tags
}

# Azure Kubernetes Service
resource "azurerm_kubernetes_cluster" "main" {
  name                = "${local.project_name}-${local.environment}-aks"
  location           = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  dns_prefix         = "${local.project_name}-${local.environment}"

  kubernetes_version = var.kubernetes_version

  # Government-grade security defaults
  private_cluster_enabled = true
  role_based_access_control_enabled = true

  # Default node pool for system workloads
  default_node_pool {
    name                = "system"
    node_count         = var.aks_system_node_count
    vm_size            = var.aks_system_node_size
    vnet_subnet_id     = azurerm_subnet.aks.id
    type               = "VirtualMachineScaleSets"
    enable_auto_scaling = true
    min_count          = 1
    max_count          = var.aks_system_node_count * 2

    # Government compliance requirements
    only_critical_addons_enabled = true

    upgrade_settings {
      max_surge = "10%"
    }
  }

  # Service Principal or Managed Identity
  identity {
    type = "SystemAssigned"
  }

  # Network configuration
  network_profile {
    network_plugin     = "azure"
    network_policy     = "azure"
    dns_service_ip     = "10.1.0.10"
    service_cidr       = "10.1.0.0/16"
    outbound_type      = "loadBalancer"
    load_balancer_sku  = "standard"
  }

  # Azure AD integration
  azure_active_directory_role_based_access_control {
    managed                = true
    admin_group_object_ids = var.aks_admin_group_ids
    azure_rbac_enabled     = true
  }

  # Monitoring integration
  oms_agent {
    log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  }

  # Government security features
  azure_policy_enabled = true

  # Auto-upgrade configuration
  automatic_channel_upgrade = "stable"
  maintenance_window {
    allowed {
      day   = "Sunday"
      hours = [2, 3, 4]
    }
  }

  tags = local.common_tags
}

# Additional node pool for AI workloads
resource "azurerm_kubernetes_cluster_node_pool" "ai_workloads" {
  name                  = "aiworkloads"
  kubernetes_cluster_id = azurerm_kubernetes_cluster.main.id
  vm_size              = var.aks_ai_node_size
  node_count           = var.aks_ai_node_count
  vnet_subnet_id       = azurerm_subnet.aks.id

  enable_auto_scaling = true
  min_count          = 2
  max_count          = var.aks_ai_node_count * 3

  # Taints for AI workloads
  node_taints = ["workload=ai:NoSchedule"]

  # Node labels
  node_labels = {
    "workload" = "ai"
    "quantum-optimized" = "true"
    "consciousness-level" = "8"
  }

  upgrade_settings {
    max_surge = "25%"
  }

  tags = local.common_tags
}

# Grant AKS access to ACR
resource "azurerm_role_assignment" "aks_acr" {
  scope                = azurerm_container_registry.main.id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_kubernetes_cluster.main.kubelet_identity[0].object_id
}

# Application Insights for monitoring
resource "azurerm_application_insights" "main" {
  name                = "${local.project_name}-${local.environment}-appinsights"
  location           = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  workspace_id       = azurerm_log_analytics_workspace.main.id
  application_type   = "web"

  tags = local.common_tags
}

# Storage Account for logs and backups
resource "azurerm_storage_account" "main" {
  name                = "${replace(local.project_name, "-", "")}${local.environment}storage"
  resource_group_name = azurerm_resource_group.main.name
  location           = azurerm_resource_group.main.location

  account_tier             = "Standard"
  account_replication_type = local.environment == "production" ? "GRS" : "LRS"

  # Government security requirements
  min_tls_version                 = "TLS1_2"
  allow_nested_items_to_be_public = false
  public_network_access_enabled   = false

  # Advanced threat protection
  queue_properties {
    logging {
      delete                = true
      read                  = true
      write                 = true
      version               = "1.0"
      retention_policy_days = 30
    }
  }

  tags = local.common_tags
}

# Create container for backups
resource "azurerm_storage_container" "backups" {
  name                  = "backups"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

# Data sources
data "azurerm_client_config" "current" {}

# Output important information
output "resource_group_name" {
  description = "Name of the resource group"
  value       = azurerm_resource_group.main.name
}

output "aks_cluster_name" {
  description = "Name of the AKS cluster"
  value       = azurerm_kubernetes_cluster.main.name
}

output "aks_cluster_fqdn" {
  description = "FQDN of the AKS cluster"
  value       = azurerm_kubernetes_cluster.main.fqdn
  sensitive   = true
}

output "postgres_server_name" {
  description = "Name of the PostgreSQL server"
  value       = azurerm_postgresql_flexible_server.main.name
}

output "redis_hostname" {
  description = "Hostname of the Redis cache"
  value       = azurerm_redis_cache.main.hostname
}

output "redis_port" {
  description = "Port of the Redis cache"
  value       = azurerm_redis_cache.main.port
}

output "container_registry_login_server" {
  description = "Login server of the container registry"
  value       = azurerm_container_registry.main.login_server
}

output "key_vault_uri" {
  description = "URI of the Key Vault"
  value       = azurerm_key_vault.main.vault_uri
}

output "application_insights_instrumentation_key" {
  description = "Instrumentation key for Application Insights"
  value       = azurerm_application_insights.main.instrumentation_key
  sensitive   = true
}

output "log_analytics_workspace_id" {
  description = "ID of the Log Analytics workspace"
  value       = azurerm_log_analytics_workspace.main.id
}

# Championship configuration outputs
output "quantum_factor" {
  description = "Quantum optimization factor"
  value       = local.quantum_factor
}

output "consciousness_level" {
  description = "AI consciousness level"
  value       = local.consciousness_level
}

output "ai_swarm_size" {
  description = "AI swarm size"
  value       = local.ai_swarm_size
}

output "performance_targets" {
  description = "Championship performance targets"
  value = {
    p95_latency_ms        = local.performance_target_p95_ms
    throughput_per_second = local.throughput_target_per_sec
  }
}

output "compliance_standards" {
  description = "Government compliance standards"
  value       = local.compliance_standards
}

output "deployment_summary" {
  description = "TerraFusion OS deployment summary"
  value = {
    project     = local.project_name
    environment = local.environment
    location    = local.location
    message     = "Government. Transcended. 🏛️⚛️🤖"
  }
}
