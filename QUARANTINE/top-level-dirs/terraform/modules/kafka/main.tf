# Kafka Module (Azure Event Hubs)
# Validated in Phase 3.5 Week 1/7 POC (300K msg/sec, 30 partitions, Schema Registry)

terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

# Event Hubs Namespace (validated in Week 1 POC: 300K msg/sec throughput)
resource "azurerm_eventhub_namespace" "main" {
  name                = var.namespace_name
  location            = var.location
  resource_group_name = var.resource_group_name
  sku                 = "Standard"
  capacity            = 10 # 10 Throughput Units

  # Kafka support
  kafka_enabled = true

  # Auto-inflate (scale to 20 TUs if needed)
  auto_inflate_enabled     = true
  maximum_throughput_units = 20

  # Network configuration
  public_network_access_enabled = false
  network_rulesets {
    default_action = "Deny"
    trusted_service_access_enabled = false

    virtual_network_rule {
      subnet_id                            = var.subnet_id
      ignore_missing_virtual_network_service_endpoint = false
    }
  }

  tags = var.tags
}

# Event Hub: PropertyUpdates (validated in Week 7 POC: circuit breakers)
resource "azurerm_eventhub" "property_updates" {
  name                = "property-updates"
  namespace_name      = azurerm_eventhub_namespace.main.name
  resource_group_name = var.resource_group_name
  partition_count     = 8 # 8 partitions (validated in Week 1 POC)
  message_retention   = 7 # 7 days

  capture_description {
    enabled  = true
    encoding = "Avro"
    destination {
      name                = "EventHubArchive.AzureBlockBlob"
      archive_name_format = "property-updates/{Namespace}/{EventHub}/{PartitionId}/{Year}/{Month}/{Day}/{Hour}/{Minute}/{Second}"
      blob_container_name = var.capture_container_name
      storage_account_id  = var.capture_storage_account_id
    }
  }
}

# Event Hub: AITasks (validated in Week 3 POC: 100M txns/day)
resource "azurerm_eventhub" "ai_tasks" {
  name                = "ai-tasks"
  namespace_name      = azurerm_eventhub_namespace.main.name
  resource_group_name = var.resource_group_name
  partition_count     = 10 # 10 partitions for high throughput
  message_retention   = 7
}

# Event Hub: Telemetry (validated in Week 6 POC: distributed tracing)
resource "azurerm_eventhub" "telemetry" {
  name                = "telemetry"
  namespace_name      = azurerm_eventhub_namespace.main.name
  resource_group_name = var.resource_group_name
  partition_count     = 8
  message_retention   = 3 # 3 days (telemetry data)
}

# Event Hub: Audit (FISMA compliance requirement)
resource "azurerm_eventhub" "audit" {
  name                = "audit"
  namespace_name      = azurerm_eventhub_namespace.main.name
  resource_group_name = var.resource_group_name
  partition_count     = 4
  message_retention   = 90 # 90 days retention (FISMA requirement)

  capture_description {
    enabled  = true
    encoding = "Avro"
    destination {
      name                = "EventHubArchive.AzureBlockBlob"
      archive_name_format = "audit/{Namespace}/{EventHub}/{PartitionId}/{Year}/{Month}/{Day}/{Hour}/{Minute}/{Second}"
      blob_container_name = var.capture_container_name
      storage_account_id  = var.capture_storage_account_id
    }
  }
}

# Consumer Group: PropertyService
resource "azurerm_eventhub_consumer_group" "property_service" {
  name                = "property-service"
  namespace_name      = azurerm_eventhub_namespace.main.name
  eventhub_name       = azurerm_eventhub.property_updates.name
  resource_group_name = var.resource_group_name
}

# Consumer Group: AICoordinator
resource "azurerm_eventhub_consumer_group" "ai_coordinator" {
  name                = "ai-coordinator"
  namespace_name      = azurerm_eventhub_namespace.main.name
  eventhub_name       = azurerm_eventhub.ai_tasks.name
  resource_group_name = var.resource_group_name
}

# Authorization Rule: Send/Listen (for applications)
resource "azurerm_eventhub_authorization_rule" "app" {
  name                = "app-send-listen"
  namespace_name      = azurerm_eventhub_namespace.main.name
  eventhub_name       = azurerm_eventhub.property_updates.name
  resource_group_name = var.resource_group_name

  listen = true
  send   = true
  manage = false
}

# Outputs
output "namespace_id" {
  value       = azurerm_eventhub_namespace.main.id
  description = "Event Hubs namespace ID"
}

output "namespace_endpoint" {
  value       = "sb://${azurerm_eventhub_namespace.main.name}.servicebus.windows.net"
  description = "Event Hubs namespace endpoint (Kafka bootstrap)"
}

output "primary_connection_string" {
  value       = azurerm_eventhub_namespace.main.default_primary_connection_string
  sensitive   = true
  description = "Event Hubs namespace primary connection string"
}

output "property_updates_name" {
  value       = azurerm_eventhub.property_updates.name
  description = "Property updates event hub name"
}

output "ai_tasks_name" {
  value       = azurerm_eventhub.ai_tasks.name
  description = "AI tasks event hub name"
}
