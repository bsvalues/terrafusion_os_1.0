# TerraFusion OS - Development Environment Configuration
# Government. Transcended. - Development Excellence
# Environment: Development | Security Level: ENHANCED

# Development Environment Variables
quantum_factor = 850  # Reduced for development testing
harmony_index = 0.950  # Development optimization target
counties = 5  # Limited scope for development
ai_agents = 100  # Development agent capacity
compliance_level = "ENHANCED"
security_level = "ENHANCED"
deployment_status = "DEVELOPMENT"

# Azure Government Development Region
primary_location = "usgovvirginia"
secondary_location = "usgovtexas"
environment = "dev"

# Development-Specific Configuration
enable_monitoring = true
enable_multi_cloud = false  # Disabled for development

# Development Resource Sizing
resource_sizing = {
  vm_size = "Standard_B2s"  # Cost-optimized for development
  storage_replication = "LRS"  # Local redundancy for development
  key_vault_sku = "standard"  # Standard SKU for development testing
}

# Development Networking
network_config = {
  vnet_address_space = "10.10.0.0/16"  # Development network range
  subnet_prefixes = {
    core_teams = "10.10.1.0/24"
    platform_teams = "10.10.2.0/24"
    specialized_teams = "10.10.3.0/24"
  }
}

# Development Tags
custom_tags = {
  Purpose = "DEVELOPMENT_ENVIRONMENT"
  CostCenter = "ENGINEERING_R_AND_D"
  AutoShutdown = "enabled"
  BackupRequired = "false"
}
