# TerraFusion OS - Production Infrastructure
# Phase 4: Production Deployment (October 2025)
# Validated patterns from Phase 3.5 Enhanced POC

terraform {
  required_version = ">= 1.6.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.80"
    }
  }

  backend "azurerm" {
    resource_group_name  = "rg-terrafusion-tfstate"
    storage_account_name = "tfterrafusiontfstate"
    container_name       = "tfstate"
    key                  = "production.terraform.tfstate"
  }
}

provider "azurerm" {
  features {
    key_vault {
      purge_soft_delete_on_destroy    = false
      recover_soft_deleted_key_vaults = true
    }
    resource_group {
      prevent_deletion_if_contains_resources = true
    }
  }
}

# Data sources
data "azurerm_client_config" "current" {}

# Resource Groups
resource "azurerm_resource_group" "primary" {
  name     = "rg-terrafusion-prod-eastus2"
  location = "East US 2"

  tags = local.tags
}

resource "azurerm_resource_group" "shared" {
  name     = "rg-terrafusion-shared"
  location = "East US 2"

  tags = local.tags
}

# Locals
locals {
  environment = "production"
  tags = {
    Environment = "Production"
    Project     = "TerraFusion OS"
    ManagedBy   = "Terraform"
    Phase       = "Phase 4"
    CostCenter  = "Infrastructure"
  }
}

# Networking Module
module "networking" {
  source = "../../modules/networking"

  vnet_name           = "vnet-terrafusion-prod"
  location            = azurerm_resource_group.primary.location
  resource_group_name = azurerm_resource_group.primary.name

  tags = local.tags
}

# Monitoring Module (must be created before AKS)
module "monitoring" {
  source = "../../modules/monitoring"

  workspace_name      = "log-terrafusion-prod"
  app_insights_name   = "appi-terrafusion-prod"
  grafana_name        = "grafana-terrafusion-prod"
  location            = azurerm_resource_group.primary.location
  resource_group_name = azurerm_resource_group.primary.name

  tags = local.tags
}

# AKS Module
module "aks" {
  source = "../../modules/aks"

  cluster_name               = "aks-terrafusion-prod"
  location                   = azurerm_resource_group.primary.location
  resource_group_name        = azurerm_resource_group.primary.name
  dns_prefix                 = "terrafusion-prod"
  subnet_id                  = module.networking.aks_subnet_id
  log_analytics_workspace_id = module.monitoring.workspace_id
  admin_group_ids            = var.aks_admin_group_ids

  tags = local.tags

  depends_on = [
    module.networking,
    module.monitoring
  ]
}

# PostgreSQL Module
module "postgresql" {
  source = "../../modules/postgresql"

  server_name         = "psql-terrafusion-prod"
  location            = azurerm_resource_group.primary.location
  resource_group_name = azurerm_resource_group.primary.name
  subnet_id           = module.networking.postgresql_subnet_id
  private_dns_zone_id = module.networking.postgresql_private_dns_zone_id
  standby_zone        = "2"
  replica_count       = 3 # Validated in Week 3 POC

  tags = local.tags

  depends_on = [module.networking]
}

# Redis Module (to be created)
# module "redis" {
#   source = "../../modules/redis"
#   ...
# }

# Kafka Module (to be created)
# module "kafka" {
#   source = "../../modules/kafka"
#   ...
# }

# Key Vault Module (to be created)
# module "keyvault" {
#   source = "../../modules/keyvault"
#   ...
# }

# Outputs
output "resource_group_name" {
  value       = azurerm_resource_group.primary.name
  description = "Primary resource group name"
}

output "aks_cluster_name" {
  value       = module.aks.cluster_name
  description = "AKS cluster name"
}

output "aks_cluster_fqdn" {
  value       = module.aks.cluster_fqdn
  description = "AKS cluster FQDN"
}

output "postgresql_fqdn" {
  value       = module.postgresql.server_fqdn
  description = "PostgreSQL server FQDN"
  sensitive   = true
}

output "log_analytics_workspace_id" {
  value       = module.monitoring.workspace_id
  description = "Log Analytics workspace ID"
}
