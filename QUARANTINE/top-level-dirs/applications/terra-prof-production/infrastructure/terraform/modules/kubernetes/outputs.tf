/**
 * Outputs for TerraFusionPro Kubernetes Cluster Module
 */

output "kube_config" {
  description = "Kubernetes configuration for connecting to the cluster"
  value       = azurerm_kubernetes_cluster.terrafusionpro.kube_config_raw
  sensitive   = true
}

output "host" {
  description = "Kubernetes cluster server host"
  value       = azurerm_kubernetes_cluster.terrafusionpro.kube_config.0.host
  sensitive   = true
}

output "client_certificate" {
  description = "Base64 encoded public certificate used by clients to authenticate to the Kubernetes cluster"
  value       = azurerm_kubernetes_cluster.terrafusionpro.kube_config.0.client_certificate
  sensitive   = true
}

output "client_key" {
  description = "Base64 encoded private key used by clients to authenticate to the Kubernetes cluster"
  value       = azurerm_kubernetes_cluster.terrafusionpro.kube_config.0.client_key
  sensitive   = true
}

output "cluster_ca_certificate" {
  description = "Base64 encoded public CA certificate used as the root of trust for the Kubernetes cluster"
  value       = azurerm_kubernetes_cluster.terrafusionpro.kube_config.0.cluster_ca_certificate
  sensitive   = true
}

output "cluster_id" {
  description = "ID of the Kubernetes cluster"
  value       = azurerm_kubernetes_cluster.terrafusionpro.id
}

output "cluster_name" {
  description = "Name of the Kubernetes cluster"
  value       = azurerm_kubernetes_cluster.terrafusionpro.name
}

output "resource_group_name" {
  description = "Name of the resource group containing the Kubernetes cluster"
  value       = azurerm_kubernetes_cluster.terrafusionpro.resource_group_name
}

output "location" {
  description = "Azure region of the Kubernetes cluster"
  value       = azurerm_kubernetes_cluster.terrafusionpro.location
}

output "node_resource_group" {
  description = "Auto-generated resource group which contains the resources for this managed Kubernetes cluster"
  value       = azurerm_kubernetes_cluster.terrafusionpro.node_resource_group
}

output "kubernetes_version" {
  description = "Current Kubernetes version"
  value       = azurerm_kubernetes_cluster.terrafusionpro.kubernetes_version
}

output "principal_id" {
  description = "Principal ID of the system assigned identity of the Kubernetes cluster"
  value       = azurerm_kubernetes_cluster.terrafusionpro.identity[0].principal_id
}