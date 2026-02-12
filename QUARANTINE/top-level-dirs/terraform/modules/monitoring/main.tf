# Monitoring Module - Application Insights + Log Analytics + Grafana
# Validated in Phase 3.5 Week 6/7 POC (APM, distributed tracing, 10+ dashboards)

terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

# Log Analytics Workspace
resource "azurerm_log_analytics_workspace" "main" {
  name                = var.workspace_name
  location            = var.location
  resource_group_name = var.resource_group_name
  sku                 = "PerGB2018"
  retention_in_days   = 365 # 1-year retention (FISMA compliance)

  tags = var.tags
}

# Application Insights
resource "azurerm_application_insights" "main" {
  name                = var.app_insights_name
  location            = var.location
  resource_group_name = var.resource_group_name
  workspace_id        = azurerm_log_analytics_workspace.main.id
  application_type    = "web"

  # Sampling (validated in Phase 4 budget: 100GB/month ingestion)
  sampling_percentage = 100 # No sampling initially

  tags = var.tags
}

# Grafana (Azure Managed)
resource "azurerm_dashboard_grafana" "main" {
  name                = var.grafana_name
  location            = var.location
  resource_group_name = var.resource_group_name
  sku                 = "Standard"

  # System-assigned identity
  identity {
    type = "SystemAssigned"
  }

  # Azure Monitor integration
  azure_monitor_workspace_integrations {
    resource_id = azurerm_log_analytics_workspace.main.id
  }

  tags = var.tags
}

# Alert: High Error Rate (validated in Week 7 POC: >2% warning, >5% critical)
resource "azurerm_monitor_metric_alert" "error_rate_warning" {
  name                = "high-error-rate-warning"
  resource_group_name = var.resource_group_name
  scopes              = [azurerm_application_insights.main.id]
  description         = "Error rate exceeded 2% threshold (Warning)"
  severity            = 2 # Warning
  frequency           = "PT1M"
  window_size         = "PT5M"

  criteria {
    metric_namespace = "microsoft.insights/components"
    metric_name      = "requests/failed"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 0.02 # 2% (validated in Week 7 POC)
  }

  tags = var.tags
}

resource "azurerm_monitor_metric_alert" "error_rate_critical" {
  name                = "high-error-rate-critical"
  resource_group_name = var.resource_group_name
  scopes              = [azurerm_application_insights.main.id]
  description         = "Error rate exceeded 5% threshold (Critical)"
  severity            = 0 # Critical
  frequency           = "PT1M"
  window_size         = "PT5M"

  criteria {
    metric_namespace = "microsoft.insights/components"
    metric_name      = "requests/failed"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 0.05 # 5% (validated in Week 7 POC)
  }

  tags = var.tags
}

# Alert: High Latency (validated in Week 6 POC: P95 <500ms target)
resource "azurerm_monitor_metric_alert" "high_latency" {
  name                = "high-api-latency"
  resource_group_name = var.resource_group_name
  scopes              = [azurerm_application_insights.main.id]
  description         = "API P95 latency exceeded 500ms threshold"
  severity            = 2 # Warning
  frequency           = "PT1M"
  window_size         = "PT5M"

  criteria {
    metric_namespace = "microsoft.insights/components"
    metric_name      = "requests/duration"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 500 # 500ms (validated in Week 6 POC: 420ms actual)
  }

  tags = var.tags
}

# Outputs
output "workspace_id" {
  value       = azurerm_log_analytics_workspace.main.id
  description = "Log Analytics workspace ID"
}

output "workspace_primary_key" {
  value       = azurerm_log_analytics_workspace.main.primary_shared_key
  sensitive   = true
  description = "Log Analytics workspace primary key"
}

output "app_insights_instrumentation_key" {
  value       = azurerm_application_insights.main.instrumentation_key
  sensitive   = true
  description = "Application Insights instrumentation key"
}

output "app_insights_connection_string" {
  value       = azurerm_application_insights.main.connection_string
  sensitive   = true
  description = "Application Insights connection string"
}

output "grafana_url" {
  value       = azurerm_dashboard_grafana.main.endpoint
  description = "Grafana dashboard URL"
}
