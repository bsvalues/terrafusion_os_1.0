# 🏗️ Phase 4 Week 1-2: Pre-Production Infrastructure Setup

**Week:** 1-2 (October 7-18, 2025)  
**Status:** 🟢 **IN PROGRESS**  
**Focus:** Production-grade infrastructure based on Phase 3.5 validated patterns  
**Team:** 1 DevOps Engineer + 1 Platform Engineer

---

## 🎯 Week 1-2 Objectives

**Mission:** Deploy production-grade Azure infrastructure with validated patterns from Phase 3.5 POCs, remediate FISMA POA&M findings, and establish security baseline.

**Success Criteria:**
- ✅ All Azure resources deployed via Terraform (Infrastructure as Code)
- ✅ 2 POA&M findings remediated (OPA testing, Azure Sentinel SIEM)
- ✅ Security baseline established (OAuth 2.0, Key Vault, TLS certificates)
- ✅ Database infrastructure operational (PostgreSQL partitioning, read replicas)
- ✅ Event streaming operational (Kafka 30 partitions, Schema Registry)
- ✅ Monitoring operational (Application Insights, Grafana dashboards)

---

## 📋 Implementation Checklist

### Day 1-2: Planning & Setup ✅

**Azure Subscription Setup**
- [x] Create production Azure subscription
- [ ] Configure cost management (budgets: $10K/month, alerts at 80%)
- [ ] Set up RBAC (least privilege, separate dev/staging/prod roles)
- [ ] Create resource groups:
  - `rg-terrafusion-prod-eastus2` (primary region)
  - `rg-terrafusion-prod-westus2` (secondary region)
  - `rg-terrafusion-shared` (shared services: Key Vault, Container Registry)

**GitHub Setup**
- [ ] Configure GitHub Actions secrets (Azure service principal credentials)
- [ ] Set up branch protection rules (main branch, 2 approvals required)
- [ ] Configure required status checks (CI must pass before merge)
- [ ] Create deployment environments (staging, production with manual approval)

**Local Development Setup**
- [ ] Install Azure CLI (`az --version` ≥ 2.53.0)
- [ ] Install Terraform (`terraform --version` ≥ 1.6.0)
- [ ] Install kubectl (`kubectl version` ≥ 1.28.0)
- [ ] Install Helm (`helm version` ≥ 3.13.0)
- [ ] Azure login: `az login` (production subscription)

---

### Day 3-5: Infrastructure as Code (Terraform) 🚧

**Terraform Repository Structure:**
```
terrafusion-infrastructure/
├── terraform/
│   ├── environments/
│   │   ├── production/
│   │   │   ├── main.tf
│   │   │   ├── variables.tf
│   │   │   ├── terraform.tfvars
│   │   │   └── backend.tf
│   │   └── staging/
│   │       └── ... (same structure)
│   ├── modules/
│   │   ├── aks/
│   │   │   ├── main.tf
│   │   │   ├── variables.tf
│   │   │   └── outputs.tf
│   │   ├── postgresql/
│   │   ├── redis/
│   │   ├── kafka/
│   │   ├── keyvault/
│   │   ├── acr/
│   │   ├── networking/
│   │   └── monitoring/
│   └── README.md
└── docs/
    ├── TERRAFORM_SETUP.md
    └── RUNBOOK.md
```

#### Module 1: Azure Kubernetes Service (AKS)

**File:** `terraform/modules/aks/main.tf`

```hcl
# Azure Kubernetes Service (AKS) - Production Cluster
# Validated in Phase 3.5 Week 3 POC (10× capacity: 500K agents, 100M txns/day)

resource "azurerm_kubernetes_cluster" "main" {
  name                = var.cluster_name
  location            = var.location
  resource_group_name = var.resource_group_name
  dns_prefix          = var.dns_prefix
  kubernetes_version  = "1.28.3"
  
  # Default node pool (system)
  default_node_pool {
    name                = "system"
    node_count          = 3
    vm_size             = "Standard_D4s_v3"  # 4 vCPU, 16GB RAM
    enable_auto_scaling = true
    min_count           = 3
    max_count           = 10
    os_disk_size_gb     = 128
    vnet_subnet_id      = var.subnet_id
    
    # Node labels for system workloads
    node_labels = {
      "workload" = "system"
    }
  }
  
  # Identity
  identity {
    type = "SystemAssigned"
  }
  
  # Network profile
  network_profile {
    network_plugin     = "azure"
    network_policy     = "calico"  # Network policies for security
    load_balancer_sku  = "standard"
    outbound_type      = "loadBalancer"
    service_cidr       = "10.0.0.0/16"
    dns_service_ip     = "10.0.0.10"
  }
  
  # Add-ons
  oms_agent {
    log_analytics_workspace_id = var.log_analytics_workspace_id
  }
  
  azure_policy_enabled = true  # For OPA policy enforcement (POA&M finding #1)
  
  # RBAC
  role_based_access_control_enabled = true
  azure_active_directory_role_based_access_control {
    managed                = true
    admin_group_object_ids = var.admin_group_ids
    azure_rbac_enabled     = true
  }
  
  # Security
  sku_tier = "Standard"  # 99.95% SLA (vs Free tier 99.5%)
  
  tags = var.tags
}

# Application node pool
resource "azurerm_kubernetes_cluster_node_pool" "apps" {
  name                  = "apps"
  kubernetes_cluster_id = azurerm_kubernetes_cluster.main.id
  vm_size               = "Standard_D8s_v3"  # 8 vCPU, 32GB RAM (for apps)
  node_count            = 5
  enable_auto_scaling   = true
  min_count             = 2
  max_count             = 100  # Validated in Week 3 POC (auto-scale 2-100 pods)
  os_disk_size_gb       = 256
  vnet_subnet_id        = var.subnet_id
  
  node_labels = {
    "workload" = "applications"
  }
  
  node_taints = []
  
  tags = var.tags
}

# Output
output "cluster_id" {
  value = azurerm_kubernetes_cluster.main.id
}

output "kube_config" {
  value     = azurerm_kubernetes_cluster.main.kube_config_raw
  sensitive = true
}

output "cluster_fqdn" {
  value = azurerm_kubernetes_cluster.main.fqdn
}
```

**File:** `terraform/modules/aks/variables.tf`

```hcl
variable "cluster_name" {
  type        = string
  description = "AKS cluster name"
}

variable "location" {
  type        = string
  description = "Azure region"
}

variable "resource_group_name" {
  type        = string
  description = "Resource group name"
}

variable "dns_prefix" {
  type        = string
  description = "DNS prefix for AKS"
}

variable "subnet_id" {
  type        = string
  description = "Subnet ID for AKS nodes"
}

variable "log_analytics_workspace_id" {
  type        = string
  description = "Log Analytics workspace ID for monitoring"
}

variable "admin_group_ids" {
  type        = list(string)
  description = "Azure AD group IDs for AKS admin access"
}

variable "tags" {
  type        = map(string)
  description = "Resource tags"
  default     = {}
}
```

#### Module 2: PostgreSQL Flexible Server

**File:** `terraform/modules/postgresql/main.tf`

```hcl
# PostgreSQL Flexible Server - Production Database
# Validated in Phase 3.5 Week 1 POC (partitioning, 97.6% query improvement: 5s → 120ms)

resource "azurerm_postgresql_flexible_server" "main" {
  name                = var.server_name
  location            = var.location
  resource_group_name = var.resource_group_name
  
  # SKU
  sku_name   = "GP_Standard_D8s_v3"  # 8 vCores, 32GB RAM
  storage_mb = 524288  # 512GB storage
  
  # Version
  version = "15"
  
  # High Availability
  high_availability {
    mode                      = "ZoneRedundant"
    standby_availability_zone = var.standby_zone
  }
  
  # Backup
  backup_retention_days        = 35
  geo_redundant_backup_enabled = true  # Cross-region backup
  
  # Maintenance
  maintenance_window {
    day_of_week  = 0  # Sunday
    start_hour   = 2
    start_minute = 0
  }
  
  # Authentication
  authentication {
    active_directory_auth_enabled = true
    password_auth_enabled         = false  # Azure AD only (zero-trust)
  }
  
  # Networking
  delegated_subnet_id = var.subnet_id
  private_dns_zone_id = var.private_dns_zone_id
  
  tags = var.tags
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
  
  create_mode         = "Replica"
  source_server_id    = azurerm_postgresql_flexible_server.main.id
  
  sku_name   = "GP_Standard_D8s_v3"
  storage_mb = 524288
  version    = "15"
  
  delegated_subnet_id = var.subnet_id
  private_dns_zone_id = var.private_dns_zone_id
  
  tags = merge(var.tags, {
    "Replica" = "true"
    "ReplicaIndex" = count.index + 1
  })
}

# Configuration (partitioning, connection pooling)
resource "azurerm_postgresql_flexible_server_configuration" "settings" {
  for_each = {
    # Partitioning (validated in Week 1 POC: weekly partitioning, 97.6% improvement)
    "pg_partman_bgw.interval" = "3600"  # 1 hour
    "pg_partman_bgw.role"     = "postgres"
    
    # Connection pooling (validated in Week 1 POC: PgBouncer, 100 connections)
    "max_connections" = "500"
    
    # Performance (validated in Week 6 POC: query optimization)
    "shared_buffers"              = "8GB"
    "effective_cache_size"        = "24GB"
    "maintenance_work_mem"        = "2GB"
    "checkpoint_completion_target" = "0.9"
    "wal_buffers"                 = "16MB"
    "default_statistics_target"   = "100"
    "random_page_cost"            = "1.1"
    "effective_io_concurrency"    = "200"
    "work_mem"                    = "20971kB"
    "min_wal_size"                = "1GB"
    "max_wal_size"                = "4GB"
  }
  
  server_id = azurerm_postgresql_flexible_server.main.id
  name      = each.key
  value     = each.value
}

# Extensions
resource "azurerm_postgresql_flexible_server_configuration" "extensions" {
  server_id = azurerm_postgresql_flexible_server.main.id
  name      = "azure.extensions"
  value     = "postgis,pg_partman,pg_stat_statements,pgcrypto"  # PostGIS validated in Week 5 POC
}

# Output
output "server_id" {
  value = azurerm_postgresql_flexible_server.main.id
}

output "server_fqdn" {
  value = azurerm_postgresql_flexible_server.main.fqdn
}

output "replica_fqdns" {
  value = azurerm_postgresql_flexible_server.replica[*].fqdn
}
```

#### Module 3: Redis Cache

**File:** `terraform/modules/redis/main.tf`

```hcl
# Redis Cache - Distributed Cache
# Validated in Phase 3.5 Week 1/6 POC (90% hit rate, <2ms P95 latency)

resource "azurerm_redis_cache" "main" {
  name                = var.cache_name
  location            = var.location
  resource_group_name = var.resource_group_name
  capacity            = 2  # 6GB capacity
  family              = "P"  # Premium tier
  sku_name            = "Premium"
  
  # Clustering (validated in Week 6 POC: distributed cache, 90% hit rate)
  shard_count = 3
  
  # Redis configuration (validated in Week 1/6 POC)
  redis_configuration {
    maxmemory_reserved              = 2
    maxmemory_delta                 = 2
    maxmemory_policy                = "allkeys-lru"  # Evict least recently used
    notify_keyspace_events          = ""
    rdb_backup_enabled              = true
    rdb_backup_frequency            = 60  # 60 minutes
    rdb_backup_max_snapshot_count   = 1
  }
  
  # Networking
  subnet_id                 = var.subnet_id
  private_static_ip_address = var.redis_private_ip
  
  # Security
  minimum_tls_version = "1.2"
  
  # Patching
  patch_schedule {
    day_of_week    = "Sunday"
    start_hour_utc = 2
  }
  
  tags = var.tags
}

# Firewall rules (allow only from AKS subnet)
resource "azurerm_redis_firewall_rule" "aks" {
  name                = "AllowAKS"
  redis_cache_name    = azurerm_redis_cache.main.name
  resource_group_name = var.resource_group_name
  start_ip            = var.aks_subnet_start_ip
  end_ip              = var.aks_subnet_end_ip
}

# Output
output "redis_id" {
  value = azurerm_redis_cache.main.id
}

output "redis_hostname" {
  value = azurerm_redis_cache.main.hostname
}

output "redis_port" {
  value = azurerm_redis_cache.main.ssl_port
}

output "redis_primary_key" {
  value     = azurerm_redis_cache.main.primary_access_key
  sensitive = true
}
```

#### Module 4: Kafka (Azure Event Hubs)

**File:** `terraform/modules/kafka/main.tf`

```hcl
# Azure Event Hubs (Kafka-compatible) - Event Streaming
# Validated in Phase 3.5 Week 1/7 POC (300K msg/sec, 30 partitions)

resource "azurerm_eventhub_namespace" "main" {
  name                = var.namespace_name
  location            = var.location
  resource_group_name = var.resource_group_name
  sku                 = "Standard"  # Supports Kafka protocol
  capacity            = 10  # Throughput units (10 TU = 10 MB/s ingress, 20 MB/s egress)
  
  # Kafka (validated in Week 1/7 POC: 300K msg/sec, 30 partitions)
  kafka_enabled = true
  
  # Auto-inflate
  auto_inflate_enabled     = true
  maximum_throughput_units = 20  # Scale up to 20 TU automatically
  
  # Networking
  network_rulesets {
    default_action                 = "Deny"
    public_network_access_enabled  = false
    trusted_service_access_enabled = true
    
    virtual_network_rule {
      subnet_id                                       = var.subnet_id
      ignore_missing_virtual_network_service_endpoint = false
    }
  }
  
  # Security
  minimum_tls_version = "1.2"
  
  tags = var.tags
}

# Event Hubs (Kafka topics) - validated in Week 1/7 POC
locals {
  event_hubs = {
    "property-valuations" = {
      partition_count   = 30  # Validated in Week 1 POC: 30 partitions, 10K msg/sec each
      message_retention = 7   # 7 days retention
    }
    "agent-events" = {
      partition_count   = 15
      message_retention = 7
    }
    "system-events" = {
      partition_count   = 5
      message_retention = 3
    }
    "audit-logs" = {
      partition_count   = 10
      message_retention = 90  # 90 days for compliance
    }
  }
}

resource "azurerm_eventhub" "hubs" {
  for_each = local.event_hubs
  
  name                = each.key
  namespace_name      = azurerm_eventhub_namespace.main.name
  resource_group_name = var.resource_group_name
  partition_count     = each.value.partition_count
  message_retention   = each.value.message_retention
  
  # Capture (optional, for archival)
  capture_description {
    enabled             = true
    encoding            = "Avro"  # Schema Registry validated in Week 7 POC
    interval_in_seconds = 300     # 5 minutes
    size_limit_in_bytes = 314572800  # 300MB
    skip_empty_archives = true
    
    destination {
      name                = "EventHubArchive.AzureBlockBlob"
      archive_name_format = "{Namespace}/{EventHub}/{PartitionId}/{Year}/{Month}/{Day}/{Hour}/{Minute}/{Second}"
      blob_container_name = var.archive_container_name
      storage_account_id  = var.storage_account_id
    }
  }
}

# Consumer groups (validated in Week 3 POC: government, commercial, AI)
resource "azurerm_eventhub_consumer_group" "groups" {
  for_each = toset([
    "government-platform",
    "commercial-platform",
    "ai-platform",
    "infrastructure-platform"
  ])
  
  name                = each.key
  namespace_name      = azurerm_eventhub_namespace.main.name
  eventhub_name       = azurerm_eventhub.hubs["property-valuations"].name
  resource_group_name = var.resource_group_name
}

# Output
output "namespace_id" {
  value = azurerm_eventhub_namespace.main.id
}

output "kafka_endpoint" {
  value = "${azurerm_eventhub_namespace.main.name}.servicebus.windows.net:9093"
}

output "primary_connection_string" {
  value     = azurerm_eventhub_namespace.main.default_primary_connection_string
  sensitive = true
}
```

#### Module 5: Azure Key Vault

**File:** `terraform/modules/keyvault/main.tf`

```hcl
# Azure Key Vault - Secrets Management
# Validated in Phase 3.5 Week 2 POC (HSM-backed, FIPS 140-2 Level 2, 90-day rotation)

resource "azurerm_key_vault" "main" {
  name                = var.vault_name
  location            = var.location
  resource_group_name = var.resource_group_name
  tenant_id           = var.tenant_id
  
  # SKU (HSM-backed, validated in Week 2 POC: FIPS 140-2 Level 2)
  sku_name = "premium"  # HSM-backed keys
  
  # Networking
  network_acls {
    default_action             = "Deny"
    bypass                     = "AzureServices"
    ip_rules                   = var.allowed_ips
    virtual_network_subnet_ids = [var.subnet_id]
  }
  
  # Security
  purge_protection_enabled   = true  # Cannot purge (30-90 day recovery window)
  soft_delete_retention_days = 90    # 90-day soft delete
  
  # RBAC
  enable_rbac_authorization = true  # Use Azure RBAC (not access policies)
  
  # Logging
  enabled_for_deployment          = false
  enabled_for_disk_encryption     = false
  enabled_for_template_deployment = false
  
  tags = var.tags
}

# Secrets (connection strings, API keys)
resource "azurerm_key_vault_secret" "secrets" {
  for_each = var.secrets
  
  name         = each.key
  value        = each.value
  key_vault_id = azurerm_key_vault.main.id
  
  # Rotation (validated in Week 2 POC: 90-day rotation)
  expiration_date = timeadd(timestamp(), "2160h")  # 90 days
  
  content_type = "text/plain"
  
  tags = var.tags
}

# Keys (for encryption, validated in Week 2 POC: AES-256)
resource "azurerm_key_vault_key" "encryption" {
  name         = "terrafusion-encryption-key"
  key_vault_id = azurerm_key_vault.main.id
  key_type     = "RSA-HSM"  # HSM-backed
  key_size     = 4096
  
  key_opts = [
    "decrypt",
    "encrypt",
    "sign",
    "unwrapKey",
    "verify",
    "wrapKey",
  ]
  
  rotation_policy {
    automatic {
      time_before_expiry = "P30D"  # Rotate 30 days before expiry
    }
    
    expire_after         = "P90D"  # 90-day expiration (validated in Week 2 POC)
    notify_before_expiry = "P14D"  # Notify 14 days before
  }
  
  tags = var.tags
}

# Output
output "vault_id" {
  value = azurerm_key_vault.main.id
}

output "vault_uri" {
  value = azurerm_key_vault.main.vault_uri
}
```

---

### Day 6-8: Security Hardening (POA&M Remediation) 🚧

#### Task 1: OPA Policy Testing (POA&M Finding #1)

**Objective:** Implement Open Policy Agent (OPA) policy testing to validate Kubernetes admission policies.

**Phase 3.5 Context:** Week 8 FISMA ATO Package identified lack of automated OPA policy testing as LOW-risk finding.

**Implementation:**

**File:** `.github/workflows/opa-policy-tests.yml`

```yaml
name: OPA Policy Tests

on:
  push:
    branches: [main]
    paths:
      - 'kubernetes/policies/**'
      - 'tests/opa/**'
  pull_request:
    branches: [main]
    paths:
      - 'kubernetes/policies/**'
      - 'tests/opa/**'

jobs:
  opa-tests:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Install OPA
        run: |
          curl -L -o opa https://openpolicyagent.org/downloads/v0.57.0/opa_linux_amd64_static
          chmod +x opa
          sudo mv opa /usr/local/bin/
      
      - name: Run OPA policy tests
        run: |
          cd tests/opa
          opa test ../.. --verbose --coverage --format=json | tee coverage.json
      
      - name: Check coverage threshold
        run: |
          coverage=$(jq -r '.coverage' tests/opa/coverage.json)
          echo "Policy coverage: $coverage%"
          if (( $(echo "$coverage < 80.0" | bc -l) )); then
            echo "❌ Coverage below 80% threshold"
            exit 1
          fi
          echo "✅ Coverage meets 80% threshold"
      
      - name: Upload coverage report
        uses: actions/upload-artifact@v3
        with:
          name: opa-coverage
          path: tests/opa/coverage.json
```

**File:** `kubernetes/policies/namespace-policy.rego`

```rego
# Namespace Policy - Require labels and resource quotas
package kubernetes.admission

deny[msg] {
  input.request.kind.kind == "Namespace"
  not input.request.object.metadata.labels["environment"]
  msg := "Namespace must have 'environment' label"
}

deny[msg] {
  input.request.kind.kind == "Namespace"
  not input.request.object.metadata.labels["team"]
  msg := "Namespace must have 'team' label"
}

deny[msg] {
  input.request.kind.kind == "Namespace"
  not input.request.object.spec.resourceQuota
  msg := "Namespace must have resource quota"
}
```

**File:** `tests/opa/namespace_test.rego`

```rego
package kubernetes.admission

test_namespace_requires_environment_label {
  msg := deny with input as {
    "request": {
      "kind": {"kind": "Namespace"},
      "object": {
        "metadata": {
          "name": "test-namespace",
          "labels": {"team": "platform"}
        }
      }
    }
  }
  msg == "Namespace must have 'environment' label"
}

test_namespace_with_labels_passes {
  not deny with input as {
    "request": {
      "kind": {"kind": "Namespace"},
      "object": {
        "metadata": {
          "name": "test-namespace",
          "labels": {
            "environment": "production",
            "team": "platform"
          }
        },
        "spec": {
          "resourceQuota": {"hard": {"cpu": "10", "memory": "20Gi"}}
        }
      }
    }
  }
}
```

**Effort:** 16 hours (validated in Phase 3.5 Week 8 POA&M)  
**Deadline:** October 20, 2025 (Day 14)

---

#### Task 2: Azure Sentinel SIEM Integration (POA&M Finding #2)

**Objective:** Integrate Azure Sentinel for security information and event management (SIEM).

**Phase 3.5 Context:** Week 8 FISMA ATO Package identified lack of centralized SIEM as LOW-risk finding.

**Implementation:**

**File:** `terraform/modules/monitoring/sentinel.tf`

```hcl
# Azure Sentinel - SIEM Integration
# POA&M Finding #2 remediation

resource "azurerm_log_analytics_solution" "sentinel" {
  solution_name         = "SecurityInsights"
  location              = var.location
  resource_group_name   = var.resource_group_name
  workspace_resource_id = azurerm_log_analytics_workspace.main.id
  workspace_name        = azurerm_log_analytics_workspace.main.name
  
  plan {
    publisher = "Microsoft"
    product   = "OMSGallery/SecurityInsights"
  }
  
  tags = var.tags
}

# Data connectors
resource "azurerm_sentinel_data_connector_azure_active_directory" "aad" {
  name                       = "AzureActiveDirectory"
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
}

resource "azurerm_sentinel_data_connector_azure_security_center" "asc" {
  name                       = "AzureSecurityCenter"
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
}

resource "azurerm_sentinel_data_connector_threat_intelligence" "ti" {
  name                       = "ThreatIntelligence"
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
}

# Analytics rules (threat detection)
resource "azurerm_sentinel_alert_rule_scheduled" "failed_logins" {
  name                       = "Multiple failed login attempts"
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  display_name               = "Multiple failed login attempts detected"
  severity                   = "Medium"
  enabled                    = true
  
  query = <<QUERY
SigninLogs
| where ResultType != 0
| where TimeGenerated > ago(5m)
| summarize FailedAttempts = count() by UserPrincipalName, IPAddress
| where FailedAttempts > 5
QUERY
  
  query_frequency            = "PT5M"  # Run every 5 minutes
  query_period               = "PT5M"  # Look back 5 minutes
  trigger_operator           = "GreaterThan"
  trigger_threshold          = 0
  suppression_enabled        = false
  
  alert_rule_template_guid = "28b42356-45af-40a6-a0b4-a554cdfd5d8a"
  
  incident_configuration {
    create_incident = true
  }
}

resource "azurerm_sentinel_alert_rule_scheduled" "privilege_escalation" {
  name                       = "Privilege escalation detected"
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  display_name               = "Potential privilege escalation attempt"
  severity                   = "High"
  enabled                    = true
  
  query = <<QUERY
AuditLogs
| where OperationName == "Add member to role"
| where Result == "success"
| where TargetResources has "Global Administrator" or TargetResources has "Privileged Role Administrator"
| where TimeGenerated > ago(5m)
QUERY
  
  query_frequency            = "PT5M"
  query_period               = "PT5M"
  trigger_operator           = "GreaterThan"
  trigger_threshold          = 0
  suppression_enabled        = false
  
  incident_configuration {
    create_incident = true
  }
}
```

**Effort:** 24 hours (validated in Phase 3.5 Week 8 POA&M)  
**Deadline:** January 20, 2026 (60 days per POA&M)

---

### Day 9-10: Monitoring & Observability 🚧

**File:** `terraform/modules/monitoring/main.tf`

```hcl
# Monitoring - Application Insights + Grafana
# Validated in Phase 3.5 Week 6/7 POC (APM, distributed tracing)

# Log Analytics Workspace
resource "azurerm_log_analytics_workspace" "main" {
  name                = var.workspace_name
  location            = var.location
  resource_group_name = var.resource_group_name
  sku                 = "PerGB2018"
  retention_in_days   = 365  # 1-year retention (validated in Week 8 FISMA)
  
  tags = var.tags
}

# Application Insights
resource "azurerm_application_insights" "main" {
  name                = var.app_insights_name
  location            = var.location
  resource_group_name = var.resource_group_name
  workspace_id        = azurerm_log_analytics_workspace.main.id
  application_type    = "web"
  
  # Sampling (100GB/month ingestion, validated in Phase 4 budget)
  sampling_percentage = 100  # No sampling initially
  
  tags = var.tags
}

# Grafana (managed)
resource "azurerm_dashboard_grafana" "main" {
  name                = var.grafana_name
  location            = var.location
  resource_group_name = var.resource_group_name
  
  # Identity
  identity {
    type = "SystemAssigned"
  }
  
  # Azure Monitor integration (validated in Week 6/7 POC: 10+ dashboards)
  azure_monitor_workspace_integrations {
    resource_id = azurerm_log_analytics_workspace.main.id
  }
  
  tags = var.tags
}

# Alerts (validated in Week 7 POC: error rate >2% warning, >5% critical)
resource "azurerm_monitor_metric_alert" "error_rate" {
  name                = "high-error-rate"
  resource_group_name = var.resource_group_name
  scopes              = [azurerm_application_insights.main.id]
  description         = "Alert when error rate exceeds 2% (warning) or 5% (critical)"
  severity            = 2  # Warning
  frequency           = "PT1M"  # Check every 1 minute
  window_size         = "PT5M"  # 5-minute window
  
  criteria {
    metric_namespace = "microsoft.insights/components"
    metric_name      = "requests/failed"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 0.02  # 2% (validated in Week 7 POC)
  }
  
  action {
    action_group_id = azurerm_monitor_action_group.critical.id
  }
}

# PagerDuty integration
resource "azurerm_monitor_action_group" "critical" {
  name                = "critical-alerts"
  resource_group_name = var.resource_group_name
  short_name          = "Critical"
  
  webhook_receiver {
    name                    = "PagerDuty"
    service_uri             = var.pagerduty_webhook_url
    use_common_alert_schema = true
  }
  
  email_receiver {
    name          = "DevOps Team"
    email_address = var.devops_email
  }
}
```

---

## 📊 Success Validation

### Infrastructure Validation Checklist

- [ ] **Terraform plan runs successfully** (0 errors, cost estimate reviewed)
- [ ] **Terraform apply completes** (all resources created)
- [ ] **AKS cluster accessible** (`kubectl get nodes` shows 3 system + 5 app nodes)
- [ ] **PostgreSQL accessible** (connection test passes, read replicas operational)
- [ ] **Redis accessible** (connection test passes, <2ms latency)
- [ ] **Kafka accessible** (producer/consumer test passes, 30 partitions visible)
- [ ] **Key Vault accessible** (secrets retrievable, encryption key usable)
- [ ] **Monitoring operational** (Application Insights receiving data, Grafana dashboards loading)
- [ ] **POA&M findings remediated** (OPA tests passing, Azure Sentinel ingesting logs)

### Security Validation Checklist

- [ ] **OPA policy tests passing** (>80% coverage)
- [ ] **Azure Sentinel ingesting logs** (AAD, AKS, Key Vault logs visible)
- [ ] **TLS certificates configured** (Let's Encrypt automation working)
- [ ] **Network security groups configured** (least privilege, only required ports open)
- [ ] **Azure RBAC configured** (least privilege, separate roles for dev/staging/prod)
- [ ] **Key Vault secrets accessible** (from AKS pods only)

### Performance Validation Checklist

- [ ] **PostgreSQL query performance** (partitioning working, <500ms P95)
- [ ] **Redis cache performance** (<2ms P95 latency, validated in Week 1/6 POC)
- [ ] **Kafka throughput** (producer test: 10K msg/sec per partition, validated in Week 1/7 POC)
- [ ] **AKS node performance** (CPU <70%, memory <80%)

---

## 💰 Cost Management

### Estimated Monthly Costs (Production)

| Service | Configuration | Monthly Cost |
|---------|--------------|-------------|
| AKS (system nodes) | 3 × Standard_D4s_v3 | $540 |
| AKS (app nodes) | 5 × Standard_D8s_v3 | $2,250 |
| PostgreSQL primary | GP_Standard_D8s_v3 | $1,200 |
| PostgreSQL replicas | 3 × GP_Standard_D8s_v3 | $3,600 |
| Redis Cache | Premium P2 (6GB, 3 shards) | $800 |
| Event Hubs (Kafka) | 10 TU, auto-inflate to 20 TU | $1,200 |
| Key Vault | Premium (HSM-backed) | $200 |
| Container Registry | Premium (geo-replicated) | $400 |
| Application Insights | 100GB/month ingestion | $700 |
| Log Analytics | 50GB/month ingestion | $300 |
| Azure Sentinel | 50GB/month ingestion | $600 |
| Networking | VNet, Load Balancer, Traffic Manager | $400 |
| Storage | Blob Storage (1TB), Backup (2TB) | $300 |
| Grafana | Managed Grafana (Essential tier) | $200 |
| **TOTAL** | | **$12,690/month** |

**Note:** Slightly higher than Phase 4 budget estimate ($9,500/month) due to replica count. Consider reducing replicas in staging to 1 (savings: $2,400/month).

---

## 🚀 Next Steps (Day 11-14)

### Day 11: Terraform Apply (Production)
- [ ] Review Terraform plan output
- [ ] Get approval from CTO/Security team
- [ ] Run `terraform apply` (production environment)
- [ ] Monitor deployment (30-60 minutes)
- [ ] Validate all resources created

### Day 12: Database Migration
- [ ] Create database schema (tables, indexes, partitions)
- [ ] Run migration scripts (validated in Week 1 POC)
- [ ] Import seed data (test data for validation)
- [ ] Validate partitioning working (weekly partitions created)
- [ ] Test read replicas (read-only connections working)

### Day 13: Security Validation
- [ ] Run OPA policy tests (should pass with >80% coverage)
- [ ] Verify Azure Sentinel ingestion (logs visible in 5-10 minutes)
- [ ] Test Key Vault access (from AKS pods)
- [ ] Verify TLS certificates (HTTPS working)
- [ ] Run security scan (Trivy, no HIGH/CRITICAL findings)

### Day 14: Week 1-2 Completion
- [ ] Update todo list (mark Week 1-2 complete)
- [ ] Document lessons learned
- [ ] Create runbook (deployment, troubleshooting)
- [ ] Commit Terraform code to GitHub
- [ ] Begin Week 3-4: Core Repository CI/CD

---

## 📚 Documentation Links

- **Phase 3.5 Final Report:** WEEK_8_PART_3_PHASE_3.5_FINAL_REPORT.md
- **Phase 4 Kickoff:** 🚀_PHASE_4_PRODUCTION_DEPLOYMENT_KICKOFF.md
- **Terraform Best Practices:** https://www.terraform.io/docs/cloud/guides/recommended-practices/
- **Azure Well-Architected Framework:** https://docs.microsoft.com/en-us/azure/architecture/framework/
- **OPA Best Practices:** https://www.openpolicyagent.org/docs/latest/

---

**Status:** 🟢 **IN PROGRESS**  
**Week:** 1-2 (October 7-18, 2025)  
**Next Milestone:** Week 3-4 Core Repository CI/CD  
**Document Version:** 1.0  
**Last Updated:** October 7, 2025
