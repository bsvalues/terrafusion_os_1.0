# PostgreSQL Flexible Server Module
# Validated in Phase 3.5 Week 1 POC (partitioning: 97.6% improvement 5s → 120ms)

terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

resource "azurerm_postgresql_flexible_server" "main" {
  name                = var.server_name
  location            = var.location
  resource_group_name = var.resource_group_name

  # SKU (8 vCores, 32GB RAM)
  sku_name   = "GP_Standard_D8s_v3"
  storage_mb = 524288 # 512GB

  # Version
  version = "15"

  # High Availability (Zone Redundant)
  high_availability {
    mode                      = "ZoneRedundant"
    standby_availability_zone = var.standby_zone
  }

  # Backup (35 days retention, geo-redundant)
  backup_retention_days        = 35
  geo_redundant_backup_enabled = true

  # Maintenance window (Sunday 2-4 AM)
  maintenance_window {
    day_of_week  = 0
    start_hour   = 2
    start_minute = 0
  }

  # Authentication (Azure AD only - zero-trust)
  authentication {
    active_directory_auth_enabled = true
    password_auth_enabled         = false
  }

  # Networking (private endpoint)
  delegated_subnet_id = var.subnet_id
  private_dns_zone_id = var.private_dns_zone_id

  tags = var.tags

  lifecycle {
    prevent_destroy = true # Prevent accidental deletion
  }
}

# Database
resource "azurerm_postgresql_flexible_server_database" "terrafusion" {
  name      = "terrafusion"
  server_id = azurerm_postgresql_flexible_server.main.id
  charset   = "UTF8"
  collation = "en_US.utf8"
}

# Read replicas (validated in Week 3 POC: 3 replicas, 10M txns/day)
resource "azurerm_postgresql_flexible_server" "replica" {
  count               = var.replica_count
  name                = "${var.server_name}-replica-${count.index + 1}"
  location            = var.location
  resource_group_name = var.resource_group_name

  create_mode      = "Replica"
  source_server_id = azurerm_postgresql_flexible_server.main.id

  delegated_subnet_id = var.subnet_id
  private_dns_zone_id = var.private_dns_zone_id

  tags = merge(var.tags, {
    "Replica"      = "true"
    "ReplicaIndex" = tostring(count.index + 1)
  })

  lifecycle {
    prevent_destroy = true
  }
}

# Configuration (validated in Week 1/6 POC)
resource "azurerm_postgresql_flexible_server_configuration" "partitioning" {
  server_id = azurerm_postgresql_flexible_server.main.id
  name      = "pg_partman_bgw.interval"
  value     = "3600" # 1 hour (weekly partitioning validated in Week 1 POC)
}

resource "azurerm_postgresql_flexible_server_configuration" "max_connections" {
  server_id = azurerm_postgresql_flexible_server.main.id
  name      = "max_connections"
  value     = "500" # Validated in Week 1 POC: PgBouncer 100 connections
}

resource "azurerm_postgresql_flexible_server_configuration" "shared_buffers" {
  server_id = azurerm_postgresql_flexible_server.main.id
  name      = "shared_buffers"
  value     = "2097152" # 8GB (validated in Week 6 POC)
}

resource "azurerm_postgresql_flexible_server_configuration" "work_mem" {
  server_id = azurerm_postgresql_flexible_server.main.id
  name      = "work_mem"
  value     = "20480" # 20MB (validated in Week 6 POC)
}

# Extensions (PostGIS validated in Week 5 POC)
resource "azurerm_postgresql_flexible_server_configuration" "extensions" {
  server_id = azurerm_postgresql_flexible_server.main.id
  name      = "azure.extensions"
  value     = "postgis,pg_partman,pg_stat_statements,pgcrypto"
}

# Outputs
output "server_id" {
  value       = azurerm_postgresql_flexible_server.main.id
  description = "PostgreSQL server ID"
}

output "server_fqdn" {
  value       = azurerm_postgresql_flexible_server.main.fqdn
  description = "PostgreSQL server FQDN"
}

output "database_name" {
  value       = azurerm_postgresql_flexible_server_database.terrafusion.name
  description = "Database name"
}

output "replica_fqdns" {
  value       = azurerm_postgresql_flexible_server.replica[*].fqdn
  description = "Read replica FQDNs"
}
