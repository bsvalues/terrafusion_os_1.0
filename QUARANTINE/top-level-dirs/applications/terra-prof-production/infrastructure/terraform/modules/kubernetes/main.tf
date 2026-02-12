/**
 * TerraFusionPro Kubernetes Cluster Module
 *
 * This module provisions a Kubernetes cluster on the target cloud provider
 * with the necessary configuration for running the TerraFusionPro platform.
 */

# Variables are defined in variables.tf
# Outputs are defined in outputs.tf

# Create a Kubernetes cluster
resource "azurerm_kubernetes_cluster" "terrafusionpro" {
  name                = var.cluster_name
  location            = var.location
  resource_group_name = var.resource_group_name
  dns_prefix          = var.dns_prefix
  kubernetes_version  = var.kubernetes_version

  default_node_pool {
    name                = "default"
    node_count          = var.node_count
    vm_size             = var.node_size
    os_disk_size_gb     = var.os_disk_size_gb
    vnet_subnet_id      = var.subnet_id
    enable_auto_scaling = true
    min_count           = var.min_node_count
    max_count           = var.max_node_count
    
    tags = {
      Environment = var.environment
      Application = "TerraFusionPro"
    }
  }

  identity {
    type = "SystemAssigned"
  }

  addon_profile {
    http_application_routing {
      enabled = false
    }

    oms_agent {
      enabled                    = var.enable_monitoring
      log_analytics_workspace_id = var.log_analytics_workspace_id
    }

    azure_policy {
      enabled = var.enable_policy
    }
  }

  network_profile {
    network_plugin     = "azure"
    load_balancer_sku  = "Standard"
    network_policy     = "calico"
    service_cidr       = var.service_cidr
    dns_service_ip     = var.dns_service_ip
    docker_bridge_cidr = var.docker_bridge_cidr
  }

  role_based_access_control {
    enabled = true

    azure_active_directory {
      managed                = true
      admin_group_object_ids = var.admin_group_object_ids
    }
  }

  tags = {
    Environment = var.environment
    Application = "TerraFusionPro"
    Terraform   = "true"
  }
}