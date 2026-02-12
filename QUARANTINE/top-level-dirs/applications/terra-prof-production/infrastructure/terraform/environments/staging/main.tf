/**
 * TerraFusionPro Staging Environment Infrastructure
 */

# Configure the Azure provider
provider "azurerm" {
  features {}
}

# Create resource group
resource "azurerm_resource_group" "terrafusionpro" {
  name     = "terrafusionpro-staging-rg"
  location = var.location

  tags = {
    Environment = "Staging"
    Application = "TerraFusionPro"
    Terraform   = "true"
  }
}

# Create virtual network
resource "azurerm_virtual_network" "terrafusionpro" {
  name                = "terrafusionpro-staging-vnet"
  address_space       = ["10.2.0.0/16"]
  location            = azurerm_resource_group.terrafusionpro.location
  resource_group_name = azurerm_resource_group.terrafusionpro.name
  
  tags = {
    Environment = "Staging"
    Application = "TerraFusionPro"
    Terraform   = "true"
  }
}

# Create subnet for AKS
resource "azurerm_subnet" "aks" {
  name                 = "aks-subnet"
  resource_group_name  = azurerm_resource_group.terrafusionpro.name
  virtual_network_name = azurerm_virtual_network.terrafusionpro.name
  address_prefixes     = ["10.2.0.0/22"]
}

# Create Log Analytics workspace for monitoring
resource "azurerm_log_analytics_workspace" "terrafusionpro" {
  name                = "terrafusionpro-staging-logs"
  location            = azurerm_resource_group.terrafusionpro.location
  resource_group_name = azurerm_resource_group.terrafusionpro.name
  sku                 = "PerGB2018"
  retention_in_days   = 30

  tags = {
    Environment = "Staging"
    Application = "TerraFusionPro"
    Terraform   = "true"
  }
}

# Create AKS cluster using the module
module "kubernetes" {
  source = "../../modules/kubernetes"

  cluster_name        = "terrafusionpro-staging-aks"
  location            = azurerm_resource_group.terrafusionpro.location
  resource_group_name = azurerm_resource_group.terrafusionpro.name
  dns_prefix          = "terrafusionpro-staging"
  kubernetes_version  = var.kubernetes_version
  
  node_count       = 3
  node_size        = "Standard_D2s_v3"
  os_disk_size_gb  = 50
  subnet_id        = azurerm_subnet.aks.id
  
  environment      = "staging"
  min_node_count   = 3
  max_node_count   = 6
  
  enable_monitoring = true
  log_analytics_workspace_id = azurerm_log_analytics_workspace.terrafusionpro.id
  
  service_cidr       = "10.0.0.0/16"
  dns_service_ip     = "10.0.0.10"
  docker_bridge_cidr = "172.17.0.1/16"
}

# Create Azure Container Registry
resource "azurerm_container_registry" "terrafusionpro" {
  name                = "terrafusionprostagingacr"
  resource_group_name = azurerm_resource_group.terrafusionpro.name
  location            = azurerm_resource_group.terrafusionpro.location
  sku                 = "Standard"
  admin_enabled       = true

  tags = {
    Environment = "Staging"
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
  name                   = "terrafusionpro-staging-db"
  resource_group_name    = azurerm_resource_group.terrafusionpro.name
  location               = azurerm_resource_group.terrafusionpro.location
  version                = "14"
  administrator_login    = var.db_admin_username
  administrator_password = var.db_admin_password
  zone                   = "1"
  storage_mb             = 65536  # 64 GB
  sku_name               = "GP_Standard_D2s_v3"
  backup_retention_days  = 7

  high_availability {
    mode = "ZoneRedundant"
  }

  tags = {
    Environment = "Staging"
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