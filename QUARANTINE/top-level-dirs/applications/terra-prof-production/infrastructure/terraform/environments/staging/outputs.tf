/**
 * Outputs for TerraFusionPro Staging Environment
 */

output "resource_group_name" {
  description = "Name of the resource group"
  value       = azurerm_resource_group.terrafusionpro.name
}

output "kubernetes_cluster_name" {
  description = "Name of the AKS cluster"
  value       = module.kubernetes.cluster_name
}

output "kubernetes_cluster_id" {
  description = "ID of the AKS cluster"
  value       = module.kubernetes.cluster_id
}

output "kubernetes_host" {
  description = "Kubernetes cluster server host"
  value       = module.kubernetes.host
  sensitive   = true
}

output "kube_config" {
  description = "Kubernetes configuration for connecting to the cluster"
  value       = module.kubernetes.kube_config
  sensitive   = true
}

output "acr_login_server" {
  description = "Login server for Azure Container Registry"
  value       = azurerm_container_registry.terrafusionpro.login_server
}

output "acr_admin_username" {
  description = "Admin username for Azure Container Registry"
  value       = azurerm_container_registry.terrafusionpro.admin_username
  sensitive   = true
}

output "acr_admin_password" {
  description = "Admin password for Azure Container Registry"
  value       = azurerm_container_registry.terrafusionpro.admin_password
  sensitive   = true
}

output "postgresql_server_name" {
  description = "PostgreSQL server name"
  value       = azurerm_postgresql_flexible_server.terrafusionpro.name
}

output "postgresql_server_fqdn" {
  description = "PostgreSQL server FQDN"
  value       = azurerm_postgresql_flexible_server.terrafusionpro.fqdn
}

output "database_name" {
  description = "PostgreSQL database name"
  value       = azurerm_postgresql_flexible_server_database.terrafusionpro.name
}

output "database_connection_string" {
  description = "PostgreSQL connection string"
  value       = "postgresql://${var.db_admin_username}:${var.db_admin_password}@${azurerm_postgresql_flexible_server.terrafusionpro.fqdn}:5432/${azurerm_postgresql_flexible_server_database.terrafusionpro.name}"
  sensitive   = true
}