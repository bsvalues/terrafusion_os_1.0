# Azure Kubernetes Service (AKS) Module
# Validated in Phase 3.5 Week 3 POC (10× capacity: 500K agents, 100M txns/day)

terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

resource "azurerm_kubernetes_cluster" "main" {
  name                = var.cluster_name
  location            = var.location
  resource_group_name = var.resource_group_name
  dns_prefix          = var.dns_prefix
  kubernetes_version  = "1.28.3"
  sku_tier            = "Standard" # 99.95% SLA

  # Default node pool (system workloads)
  default_node_pool {
    name                = "system"
    node_count          = 3
    vm_size             = "Standard_D4s_v3" # 4 vCPU, 16GB RAM
    enable_auto_scaling = true
    min_count           = 3
    max_count           = 10
    os_disk_size_gb     = 128
    vnet_subnet_id      = var.subnet_id
    type                = "VirtualMachineScaleSets"

    node_labels = {
      "workload" = "system"
      "pool"     = "system"
    }

    upgrade_settings {
      max_surge = "33%"
    }
  }

  # System-assigned managed identity
  identity {
    type = "SystemAssigned"
  }

  # Network profile (Azure CNI with Calico network policy)
  network_profile {
    network_plugin     = "azure"
    network_policy     = "calico" # Validated in Week 2 POC (security)
    load_balancer_sku  = "standard"
    outbound_type      = "loadBalancer"
    service_cidr       = "10.1.0.0/16"
    dns_service_ip     = "10.1.0.10"
  }

  # Azure Monitor integration
  oms_agent {
    log_analytics_workspace_id = var.log_analytics_workspace_id
  }

  # Azure Policy (for OPA enforcement - POA&M finding #1)
  azure_policy_enabled = true

  # RBAC with Azure AD integration
  role_based_access_control_enabled = true
  azure_active_directory_role_based_access_control {
    managed                = true
    admin_group_object_ids = var.admin_group_ids
    azure_rbac_enabled     = true
  }

  # Maintenance window
  maintenance_window {
    allowed {
      day   = "Sunday"
      hours = [2, 3, 4]
    }
  }

  tags = var.tags

  lifecycle {
    ignore_changes = [
      default_node_pool[0].node_count
    ]
  }
}

# Application node pool (validated in Week 3 POC: auto-scale 2-100 pods)
resource "azurerm_kubernetes_cluster_node_pool" "apps" {
  name                  = "apps"
  kubernetes_cluster_id = azurerm_kubernetes_cluster.main.id
  vm_size               = "Standard_D8s_v3" # 8 vCPU, 32GB RAM
  node_count            = 5
  enable_auto_scaling   = true
  min_count             = 2
  max_count             = 100 # Validated in Week 3 POC
  os_disk_size_gb       = 256
  vnet_subnet_id        = var.subnet_id

  node_labels = {
    "workload" = "applications"
    "pool"     = "apps"
  }

  upgrade_settings {
    max_surge = "33%"
  }

  tags = var.tags

  lifecycle {
    ignore_changes = [
      node_count
    ]
  }
}

# Outputs
output "cluster_id" {
  value       = azurerm_kubernetes_cluster.main.id
  description = "AKS cluster ID"
}

output "cluster_name" {
  value       = azurerm_kubernetes_cluster.main.name
  description = "AKS cluster name"
}

output "kube_config" {
  value       = azurerm_kubernetes_cluster.main.kube_config_raw
  sensitive   = true
  description = "Kubernetes configuration"
}

output "cluster_fqdn" {
  value       = azurerm_kubernetes_cluster.main.fqdn
  description = "AKS cluster FQDN"
}

output "kubelet_identity" {
  value       = azurerm_kubernetes_cluster.main.kubelet_identity[0].object_id
  description = "Kubelet managed identity object ID"
}
