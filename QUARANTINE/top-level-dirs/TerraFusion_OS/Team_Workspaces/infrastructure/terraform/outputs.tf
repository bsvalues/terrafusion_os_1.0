# TerraFusion OS - Elite Output Definitions
# Government. Transcended. - Championship Infrastructure Outputs

output "foundation_resource_group_id" {
  description = "Resource Group ID for TerraFusion OS foundation infrastructure"
  value       = azurerm_resource_group.terrafusion_foundation.id
  sensitive   = false
}

output "foundation_resource_group_name" {
  description = "Resource Group name for cross-workspace coordination"
  value       = azurerm_resource_group.terrafusion_foundation.name
  sensitive   = false
}

output "elite_virtual_network_id" {
  description = "Virtual Network ID for multi-workspace architecture"
  value       = azurerm_virtual_network.terrafusion_elite_vnet.id
  sensitive   = false
}

output "elite_virtual_network_name" {
  description = "Virtual Network name for team workspace integration"
  value       = azurerm_virtual_network.terrafusion_elite_vnet.name
  sensitive   = false
}

output "core_teams_subnet_id" {
  description = "Core Teams subnet ID for foundation infrastructure"
  value       = azurerm_subnet.core_teams_subnet.id
  sensitive   = false
}

output "platform_teams_subnet_id" {
  description = "Platform Teams subnet ID for service mesh infrastructure"
  value       = azurerm_subnet.platform_teams_subnet.id
  sensitive   = false
}

output "specialized_teams_subnet_id" {
  description = "Specialized Teams subnet ID for compliance and monitoring"
  value       = azurerm_subnet.specialized_teams_subnet.id
  sensitive   = false
}

output "sacred_key_vault_id" {
  description = "Key Vault ID for sacred mathematics secrets management"
  value       = azurerm_key_vault.terrafusion_sacred_vault.id
  sensitive   = true
}

output "sacred_key_vault_uri" {
  description = "Key Vault URI for championship secret access"
  value       = azurerm_key_vault.terrafusion_sacred_vault.vault_uri
  sensitive   = true
}

output "championship_storage_account_id" {
  description = "Storage Account ID for championship data management"
  value       = azurerm_storage_account.terrafusion_championship_storage.id
  sensitive   = false
}

output "championship_storage_primary_endpoint" {
  description = "Primary storage endpoint for championship data access"
  value       = azurerm_storage_account.terrafusion_championship_storage.primary_blob_endpoint
  sensitive   = false
}

# TerraFusion Championship Metrics
output "quantum_factor_achieved" {
  description = "Achieved quantum factor for performance optimization"
  value       = var.quantum_factor
  sensitive   = false
}

output "counties_deployed" {
  description = "Number of counties in deployment scope"
  value       = var.counties
  sensitive   = false
}

output "ai_agents_capacity" {
  description = "AI agents capacity for TerraFusion OS ecosystem"
  value       = var.ai_agents
  sensitive   = false
}

output "harmony_index_target" {
  description = "Target harmony index for sacred mathematics optimization"
  value       = var.harmony_index
  sensitive   = false
}

output "deployment_status" {
  description = "Current deployment authorization and readiness status"
  value       = var.deployment_status
  sensitive   = false
}

output "compliance_level_certified" {
  description = "Certified compliance level for government operations"
  value       = var.compliance_level
  sensitive   = false
}

output "infrastructure_consciousness_status" {
  description = "Infrastructure consciousness activation status"
  value       = "QUANTUM_CONSCIOUSNESS_ACTIVATED"
  sensitive   = false
}
