/**
 * TerraFusionPro Production Environment Infrastructure
 */

# Configure the Azure provider
provider "azurerm" {
  features {}
}

# Create resource group
resource "azurerm_resource_group" "terrafusionpro" {
  name     = "terrafusionpro-prod-rg"
  location = var.location

  tags = {
    Environment = "Production"
    Application = "TerraFusionPro"
    Terraform   = "true"
  }
}

# Create virtual network
resource "azurerm_virtual_network" "terrafusionpro" {
  name                = "terrafusionpro-prod-vnet"
  address_space       = ["10.3.0.0/16"]
  location            = azurerm_resource_group.terrafusionpro.location
  resource_group_name = azurerm_resource_group.terrafusionpro.name
  
  tags = {
    Environment = "Production"
    Application = "TerraFusionPro"
    Terraform   = "true"
  }
}

# Create subnet for AKS
resource "azurerm_subnet" "aks" {
  name                 = "aks-subnet"
  resource_group_name  = azurerm_resource_group.terrafusionpro.name
  virtual_network_name = azurerm_virtual_network.terrafusionpro.name
  address_prefixes     = ["10.3.0.0/22"]
}

# Create Log Analytics workspace for monitoring
resource "azurerm_log_analytics_workspace" "terrafusionpro" {
  name                = "terrafusionpro-prod-logs"
  location            = azurerm_resource_group.terrafusionpro.location
  resource_group_name = azurerm_resource_group.terrafusionpro.name
  sku                 = "PerGB2018"
  retention_in_days   = 90

  tags = {
    Environment = "Production"
    Application = "TerraFusionPro"
    Terraform   = "true"
  }
}

# Create AKS cluster using the module
module "kubernetes" {
  source = "../../modules/kubernetes"

  cluster_name        = "terrafusionpro-prod-aks"
  location            = azurerm_resource_group.terrafusionpro.location
  resource_group_name = azurerm_resource_group.terrafusionpro.name
  dns_prefix          = "terrafusionpro-prod"
  kubernetes_version  = var.kubernetes_version
  
  node_count       = 5
  node_size        = "Standard_D4s_v3"
  os_disk_size_gb  = 100
  subnet_id        = azurerm_subnet.aks.id
  
  environment      = "prod"
  min_node_count   = 5
  max_node_count   = 20
  
  enable_monitoring = true
  enable_policy     = true
  log_analytics_workspace_id = azurerm_log_analytics_workspace.terrafusionpro.id
  
  service_cidr       = "10.0.0.0/16"
  dns_service_ip     = "10.0.0.10"
  docker_bridge_cidr = "172.17.0.1/16"
}

# Create Azure Container Registry
resource "azurerm_container_registry" "terrafusionpro" {
  name                = "terrafusionproacr"
  resource_group_name = azurerm_resource_group.terrafusionpro.name
  location            = azurerm_resource_group.terrafusionpro.location
  sku                 = "Premium"
  admin_enabled       = true
  
  # Enable geo-replication for high availability
  georeplications {
    location                = var.secondary_location
    zone_redundancy_enabled = true
  }

  tags = {
    Environment = "Production"
    Application = "TerraFusionPro"
    Terraform   = "true"
  }
}

# Grant AKS access to ACR
resource "azurerm_role_assignment" "aks_acr" {
  principal_id                     = module.kubernetes.principal_id
  role_definition_name             = "AcrPull"
  scope                            = azurerm_container_registry.terrafusionpro.id
  skip_service_principal_aad_check = true
}

# Create a PostgreSQL Flexible Server
resource "azurerm_postgresql_flexible_server" "terrafusionpro" {
  name                   = "terrafusionpro-prod-db"
  resource_group_name    = azurerm_resource_group.terrafusionpro.name
  location               = azurerm_resource_group.terrafusionpro.location
  version                = "14"
  administrator_login    = var.db_admin_username
  administrator_password = var.db_admin_password
  zone                   = "1"
  storage_mb             = 131072  # 128 GB
  sku_name               = "GP_Standard_D4s_v3"
  backup_retention_days  = 35

  high_availability {
    mode = "ZoneRedundant"
  }

  maintenance_window {
    day_of_week  = 0
    start_hour   = 2
    start_minute = 0
  }

  tags = {
    Environment = "Production"
    Application = "TerraFusionPro"
    Terraform   = "true"
  }
}

# Create database 
resource "azurerm_postgresql_flexible_server_database" "terrafusionpro" {
  name      = "terrafusionpro"
  server_id = azurerm_postgresql_flexible_server.terrafusionpro.id
  charset   = "UTF8"
  collation = "en_US.utf8"
}

# Create Application Insights for monitoring
resource "azurerm_application_insights" "terrafusionpro" {
  name                = "terrafusionpro-prod-appinsights"
  location            = azurerm_resource_group.terrafusionpro.location
  resource_group_name = azurerm_resource_group.terrafusionpro.name
  application_type    = "web"
  retention_in_days   = 90
  
  tags = {
    Environment = "Production"
    Application = "TerraFusionPro"
    Terraform   = "true"
  }
}

# Create Key Vault for secrets management
resource "azurerm_key_vault" "terrafusionpro" {
  name                        = "terrafusionpro-prod-kv"
  location                    = azurerm_resource_group.terrafusionpro.location
  resource_group_name         = azurerm_resource_group.terrafusionpro.name
  enabled_for_disk_encryption = true
  tenant_id                   = data.azurerm_client_config.current.tenant_id
  soft_delete_retention_days  = 90
  purge_protection_enabled    = true
  sku_name                    = "standard"
  
  tags = {
    Environment = "Production"
    Application = "TerraFusionPro"
    Terraform   = "true"
  }
}

# Get current Azure configuration
data "azurerm_client_config" "current" {}