# TerraFusion OS - Cross-Cloud Data Replication Excellence
# Government. Transcended. - Data Sovereignty and Replication Architecture

# Data replication configuration for 39-county redundancy
resource "azurerm_storage_account" "cross_cloud_replication_hub" {
  provider = azurerm.primary

  name                     = "tf${var.environment}crosscloud${random_string.storage_suffix.result}"
  resource_group_name      = azurerm_resource_group.terrafusion_rg.name
  location                = azurerm_resource_group.terrafusion_rg.location
  account_tier             = "Premium"
  account_replication_type = "ZRS"  # Zone-redundant storage for maximum availability
  account_kind             = "StorageV2"

  # Government-grade security settings
  min_tls_version                 = "TLS1_2"
  allow_nested_items_to_be_public = false
  shared_access_key_enabled       = false

  # Advanced threat protection
  queue_encryption_key_type = "Service"
  table_encryption_key_type = "Service"

  blob_properties {
    delete_retention_policy {
      days = var.environment == "championship" ? 365 : 90
    }
    container_delete_retention_policy {
      days = var.environment == "championship" ? 180 : 30
    }
    versioning_enabled       = true
    change_feed_enabled      = true
    change_feed_retention_in_days = 7
  }

  network_rules {
    default_action = "Deny"
    bypass         = ["AzureServices"]

    # Allow cross-cloud replication from AWS GovCloud
    ip_rules = var.enable_cross_cloud_replication ? [
      # AWS GovCloud IP ranges (example - would be actual AWS ranges)
      "52.61.0.0/16",
      "52.222.0.0/16"
    ] : []
  }

  tags = merge(local.common_tags, {
    Name    = "terrafusion-${var.environment}-cross-cloud-hub"
    Purpose = "CROSS_CLOUD_DATA_REPLICATION"
    Tier    = "DATA_SOVEREIGNTY_HUB"
  })
}

resource "random_string" "storage_suffix" {
  length  = 8
  special = false
  upper   = false
}

# Cross-cloud replication container
resource "azurerm_storage_container" "cross_cloud_data" {
  provider = azurerm.primary

  name                  = "cross-cloud-replication"
  storage_account_name  = azurerm_storage_account.cross_cloud_replication_hub.name
  container_access_type = "private"
}

# Data Factory for cross-cloud orchestration
resource "azurerm_data_factory" "cross_cloud_orchestrator" {
  provider = azurerm.primary

  name                = "terrafusion-${var.environment}-cross-cloud-df"
  resource_group_name = azurerm_resource_group.terrafusion_rg.name
  location           = azurerm_resource_group.terrafusion_rg.location

  managed_virtual_network_enabled = true
  public_network_enabled          = false

  identity {
    type = "SystemAssigned"
  }

  tags = merge(local.common_tags, {
    Name    = "terrafusion-${var.environment}-cross-cloud-orchestrator"
    Purpose = "DATA_PIPELINE_ORCHESTRATION"
    Tier    = "DATA_INTEGRATION_EXCELLENCE"
  })
}

# Logic App for cross-cloud data synchronization
resource "azurerm_logic_app_workflow" "cross_cloud_sync" {
  provider = azurerm.primary
  count    = var.enable_cross_cloud_replication ? 1 : 0

  name                = "terrafusion-${var.environment}-cross-cloud-sync"
  resource_group_name = azurerm_resource_group.terrafusion_rg.name
  location           = azurerm_resource_group.terrafusion_rg.location

  workflow_schema    = "https://schema.management.azure.com/providers/Microsoft.Logic/schemas/2016-06-01/workflowdefinition.json#"
  workflow_version   = "1.0.0.0"

  # Workflow definition for cross-cloud synchronization
  workflow_parameters = jsonencode({
    "$connections" = {
      defaultValue = {}
      type        = "Object"
    }
  })

  tags = merge(local.common_tags, {
    Name    = "terrafusion-${var.environment}-cross-cloud-sync"
    Purpose = "AUTOMATED_CROSS_CLOUD_SYNCHRONIZATION"
    Tier    = "WORKFLOW_AUTOMATION"
  })
}

# Event Grid for cross-cloud event coordination
resource "azurerm_eventgrid_topic" "cross_cloud_events" {
  provider = azurerm.primary

  name                = "terrafusion-${var.environment}-cross-cloud-events"
  resource_group_name = azurerm_resource_group.terrafusion_rg.name
  location           = azurerm_resource_group.terrafusion_rg.location

  public_network_access_enabled = false

  identity {
    type = "SystemAssigned"
  }

  tags = merge(local.common_tags, {
    Name    = "terrafusion-${var.environment}-cross-cloud-events"
    Purpose = "CROSS_CLOUD_EVENT_COORDINATION"
    Tier    = "EVENT_DRIVEN_EXCELLENCE"
  })
}

# Private endpoint for secure cross-cloud communication
resource "azurerm_private_endpoint" "cross_cloud_storage_endpoint" {
  provider = azurerm.primary

  name                = "terrafusion-${var.environment}-cross-cloud-pe"
  resource_group_name = azurerm_resource_group.terrafusion_rg.name
  location           = azurerm_resource_group.terrafusion_rg.location
  subnet_id          = azurerm_subnet.private_subnet.id

  private_service_connection {
    name                           = "cross-cloud-storage-connection"
    private_connection_resource_id = azurerm_storage_account.cross_cloud_replication_hub.id
    is_manual_connection          = false
    subresource_names             = ["blob"]
  }

  private_dns_zone_group {
    name                 = "cross-cloud-dns-zone-group"
    private_dns_zone_ids = [azurerm_private_dns_zone.storage_dns_zone.id]
  }

  tags = merge(local.common_tags, {
    Name    = "terrafusion-${var.environment}-cross-cloud-endpoint"
    Purpose = "SECURE_CROSS_CLOUD_CONNECTIVITY"
    Tier    = "PRIVATE_NETWORKING"
  })
}

# Private DNS zone for cross-cloud resolution
resource "azurerm_private_dns_zone" "storage_dns_zone" {
  provider = azurerm.primary

  name                = "privatelink.blob.core.usgovcloudapi.net"
  resource_group_name = azurerm_resource_group.terrafusion_rg.name

  tags = merge(local.common_tags, {
    Name    = "terrafusion-${var.environment}-storage-dns-zone"
    Purpose = "PRIVATE_DNS_RESOLUTION"
    Tier    = "DNS_EXCELLENCE"
  })
}

# Link DNS zone to virtual network
resource "azurerm_private_dns_zone_virtual_network_link" "storage_dns_link" {
  provider = azurerm.primary

  name                  = "terrafusion-${var.environment}-storage-dns-link"
  resource_group_name   = azurerm_resource_group.terrafusion_rg.name
  private_dns_zone_name = azurerm_private_dns_zone.storage_dns_zone.name
  virtual_network_id    = azurerm_virtual_network.terrafusion_vnet.id
  registration_enabled  = true

  tags = merge(local.common_tags, {
    Name    = "terrafusion-${var.environment}-storage-dns-link"
    Purpose = "DNS_NETWORK_INTEGRATION"
    Tier    = "NETWORK_DNS_BINDING"
  })
}

# Cross-cloud backup vault
resource "azurerm_recovery_services_vault" "cross_cloud_backup_vault" {
  provider = azurerm.primary

  name                = "terrafusion-${var.environment}-cross-cloud-vault"
  resource_group_name = azurerm_resource_group.terrafusion_rg.name
  location           = azurerm_resource_group.terrafusion_rg.location
  sku                = "Standard"
  storage_mode_type  = "ZoneRedundant"

  cross_region_restore_enabled = var.environment == "prod" || var.environment == "championship"

  encryption {
    key_id                            = azurerm_key_vault_key.cross_cloud_encryption_key.id
    infrastructure_encryption_enabled = true
  }

  tags = merge(local.common_tags, {
    Name    = "terrafusion-${var.environment}-cross-cloud-vault"
    Purpose = "CROSS_CLOUD_BACKUP_EXCELLENCE"
    Tier    = "DATA_PROTECTION"
  })
}

# Backup policy for cross-cloud data
resource "azurerm_backup_policy_vm" "cross_cloud_backup_policy" {
  provider = azurerm.primary

  name                = "terrafusion-${var.environment}-cross-cloud-backup-policy"
  resource_group_name = azurerm_resource_group.terrafusion_rg.name
  recovery_vault_name = azurerm_recovery_services_vault.cross_cloud_backup_vault.name

  timezone = "UTC"

  backup {
    frequency = var.environment == "championship" ? "Hourly" : "Daily"
    time      = "23:00"
  }

  retention_daily {
    count = local.disaster_recovery_config.rpo_minutes <= 15 ? 30 : 7
  }

  retention_weekly {
    count    = var.environment == "championship" ? 52 : 12
    weekdays = ["Sunday"]
  }

  retention_monthly {
    count    = var.environment == "championship" ? 120 : 24
    weekdays = ["Sunday"]
    weeks    = ["First"]
  }

  retention_yearly {
    count    = var.environment == "championship" ? 10 : 3
    weekdays = ["Sunday"]
    weeks    = ["First"]
    months   = ["January"]
  }
}

# Function App for cross-cloud data processing
resource "azurerm_linux_function_app" "cross_cloud_processor" {
  provider = azurerm.primary
  count    = var.enable_cross_cloud_replication ? 1 : 0

  name                = "terrafusion-${var.environment}-cross-cloud-func"
  resource_group_name = azurerm_resource_group.terrafusion_rg.name
  location           = azurerm_resource_group.terrafusion_rg.location
  service_plan_id     = azurerm_service_plan.function_service_plan[0].id

  storage_account_name       = azurerm_storage_account.cross_cloud_replication_hub.name
  storage_account_access_key = azurerm_storage_account.cross_cloud_replication_hub.primary_access_key

  https_only                    = true
  public_network_access_enabled = false

  site_config {
    always_on = true

    application_stack {
      python_version = "3.11"
    }

    app_service_logs {
      disk_quota_mb         = 35
      retention_period_days = 7
    }
  }

  app_settings = {
    "FUNCTIONS_WORKER_RUNTIME"     = "python"
    "CROSS_CLOUD_REPLICATION_MODE" = var.cross_cloud_data_replication
    "AWS_GOVCLOUD_ENABLED"         = tostring(var.enable_cross_cloud_replication)
    "QUANTUM_FACTOR"               = tostring(var.quantum_factor)
    "HARMONY_INDEX"               = tostring(var.harmony_index)
    "COUNTIES_TARGET"             = tostring(var.counties)
    "AI_AGENTS_COUNT"             = tostring(var.ai_agents)
  }

  identity {
    type = "SystemAssigned"
  }

  tags = merge(local.common_tags, {
    Name    = "terrafusion-${var.environment}-cross-cloud-processor"
    Purpose = "CROSS_CLOUD_DATA_PROCESSING"
    Tier    = "SERVERLESS_EXCELLENCE"
  })
}

# Service plan for function apps
resource "azurerm_service_plan" "function_service_plan" {
  provider = azurerm.primary
  count    = var.enable_cross_cloud_replication ? 1 : 0

  name                = "terrafusion-${var.environment}-func-plan"
  resource_group_name = azurerm_resource_group.terrafusion_rg.name
  location           = azurerm_resource_group.terrafusion_rg.location
  os_type             = "Linux"
  sku_name            = var.environment == "championship" ? "P3v3" : "P1v3"

  tags = merge(local.common_tags, {
    Name    = "terrafusion-${var.environment}-function-service-plan"
    Purpose = "SERVERLESS_COMPUTE_PLATFORM"
    Tier    = "COMPUTE_EXCELLENCE"
  })
}

# Outputs for cross-cloud integration
output "cross_cloud_storage_account_name" {
  description = "Cross-cloud replication storage account name"
  value       = azurerm_storage_account.cross_cloud_replication_hub.name
  sensitive   = false
}

output "cross_cloud_data_factory_name" {
  description = "Cross-cloud data orchestration factory name"
  value       = azurerm_data_factory.cross_cloud_orchestrator.name
  sensitive   = false
}

output "cross_cloud_backup_vault_name" {
  description = "Cross-cloud backup vault name"
  value       = azurerm_recovery_services_vault.cross_cloud_backup_vault.name
  sensitive   = false
}

output "cross_cloud_replication_status" {
  description = "Cross-cloud data replication configuration status"
  value = {
    enabled                = var.enable_cross_cloud_replication
    replication_strategy   = var.cross_cloud_data_replication
    backup_frequency       = local.disaster_recovery_config.backup_frequency
    rpo_minutes           = local.disaster_recovery_config.rpo_minutes
    rto_minutes           = local.disaster_recovery_config.rto_minutes
    counties_coverage     = var.counties
    transcendence_status  = "DATA_SOVEREIGNTY_TRANSCENDED"
  }
  sensitive = false
}
