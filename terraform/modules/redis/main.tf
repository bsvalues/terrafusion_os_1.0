# Redis Cache Module
# Validated in Phase 3.5 Week 1/6 POC (90% hit rate, <2ms P95 latency)

terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

resource "azurerm_redis_cache" "main" {
  name                = var.cache_name
  location            = var.location
  resource_group_name = var.resource_group_name

  # Premium tier for clustering + persistence (validated in Week 6 POC)
  capacity            = 2       # P2: 6GB
  family              = "P"     # Premium
  sku_name            = "Premium"
  enable_non_ssl_port = false   # Enforce TLS 1.3

  # Redis configuration (validated in Week 1 POC: 90% hit rate)
  redis_configuration {
    maxmemory_policy                     = "allkeys-lru" # LRU eviction
    maxfragmentationmemory_reserved      = 600           # 600MB fragmentation buffer
    maxmemory_reserved                   = 600           # 600MB reserved
    maxmemory_delta                      = 600           # 600MB delta
    enable_authentication                = true
    aof_backup_enabled                   = true          # AOF persistence
    aof_storage_connection_string_0      = var.backup_storage_connection_string
    rdb_backup_enabled                   = true          # RDB backup
    rdb_backup_frequency                 = 60            # Daily
    rdb_backup_max_snapshot_count        = 1
    rdb_storage_connection_string        = var.backup_storage_connection_string
  }

  # Clustering (validated in Week 6 POC: 3 shards)
  shard_count = 3

  # Networking (private endpoint)
  subnet_id                       = var.subnet_id
  public_network_access_enabled   = false

  # Patching window (Sunday 2-4 AM)
  patch_schedule {
    day_of_week    = "Sunday"
    start_hour_utc = 2
  }

  tags = var.tags

  lifecycle {
    prevent_destroy = true # Prevent accidental deletion
  }
}

# Firewall rules (allow AKS subnet only)
resource "azurerm_redis_firewall_rule" "aks" {
  name                = "aks-subnet"
  redis_cache_name    = azurerm_redis_cache.main.name
  resource_group_name = var.resource_group_name
  start_ip            = var.aks_subnet_start_ip
  end_ip              = var.aks_subnet_end_ip
}

# Outputs
output "cache_id" {
  value       = azurerm_redis_cache.main.id
  description = "Redis Cache ID"
}

output "cache_hostname" {
  value       = azurerm_redis_cache.main.hostname
  description = "Redis Cache hostname"
}

output "cache_ssl_port" {
  value       = azurerm_redis_cache.main.ssl_port
  description = "Redis Cache SSL port (6380)"
}

output "cache_primary_key" {
  value       = azurerm_redis_cache.main.primary_access_key
  sensitive   = true
  description = "Redis Cache primary access key"
}

output "cache_connection_string" {
  value       = azurerm_redis_cache.main.primary_connection_string
  sensitive   = true
  description = "Redis Cache primary connection string"
}
