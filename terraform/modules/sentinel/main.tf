# Azure Sentinel SIEM Module
# Phase 4 Week 1-2: POA&M Finding #2 Remediation (LOW risk)
# Security Information and Event Management (SIEM) for threat detection

terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

# Sentinel workspace (extends Log Analytics)
resource "azurerm_log_analytics_solution" "sentinel" {
  solution_name         = "SecurityInsights"
  location              = var.location
  resource_group_name   = var.resource_group_name
  workspace_resource_id = var.log_analytics_workspace_id
  workspace_name        = var.log_analytics_workspace_name

  plan {
    publisher = "Microsoft"
    product   = "OMSGallery/SecurityInsights"
  }

  tags = var.tags
}

# Data connector: Azure Active Directory
resource "azurerm_sentinel_data_connector_azure_active_directory" "aad" {
  name                       = "aad-connector"
  log_analytics_workspace_id = var.log_analytics_workspace_id

  depends_on = [azurerm_log_analytics_solution.sentinel]
}

# Data connector: Azure Activity
resource "azurerm_sentinel_data_connector_azure_activity_log" "activity" {
  name                       = "activity-log-connector"
  log_analytics_workspace_id = var.log_analytics_workspace_id

  depends_on = [azurerm_log_analytics_solution.sentinel]
}

# Alert rule: Failed login attempts (validated in Phase 3.5 Week 2 POC)
resource "azurerm_sentinel_alert_rule_scheduled" "failed_logins" {
  name                       = "multiple-failed-login-attempts"
  log_analytics_workspace_id = var.log_analytics_workspace_id
  display_name               = "Multiple Failed Login Attempts"
  description                = "Detects multiple failed login attempts from same user/IP (potential brute force)"
  severity                   = "High"
  enabled                    = true

  query = <<-QUERY
    SigninLogs
    | where TimeGenerated > ago(5m)
    | where ResultType != "0"  // Failed logins
    | summarize FailedAttempts = count() by UserPrincipalName, IPAddress, bin(TimeGenerated, 5m)
    | where FailedAttempts >= 5
    | project TimeGenerated, UserPrincipalName, IPAddress, FailedAttempts
  QUERY

  query_frequency            = "PT5M"  // Every 5 minutes
  query_period               = "PT5M"
  trigger_operator           = "GreaterThan"
  trigger_threshold          = 0
  suppression_enabled        = false

  tactics = ["CredentialAccess"]
  techniques = ["T1110"]  // MITRE ATT&CK: Brute Force

  incident {
    create_incident_enabled = true
    grouping {
      enabled                 = true
      lookback_duration       = "PT1H"
      reopen_closed_incidents = false
      entity_matching_method  = "Selected"
      group_by_entities       = ["Account", "IP"]
    }
  }

  depends_on = [azurerm_log_analytics_solution.sentinel]
}

# Alert rule: Unusual resource access (validated in Phase 3.5 Week 2 POC)
resource "azurerm_sentinel_alert_rule_scheduled" "unusual_access" {
  name                       = "unusual-resource-access"
  log_analytics_workspace_id = var.log_analytics_workspace_id
  display_name               = "Unusual Resource Access Pattern"
  description                = "Detects access to resources from unusual locations or times"
  severity                   = "Medium"
  enabled                    = true

  query = <<-QUERY
    AzureActivity
    | where TimeGenerated > ago(1h)
    | where OperationNameValue contains "Microsoft.Compute" or OperationNameValue contains "Microsoft.KeyVault"
    | where ActivityStatusValue == "Success"
    | extend Hour = hourofday(TimeGenerated)
    | where Hour < 6 or Hour > 22  // Outside business hours
    | project TimeGenerated, Caller, OperationNameValue, ResourceGroup, Hour
  QUERY

  query_frequency            = "PT1H"  // Every 1 hour
  query_period               = "PT1H"
  trigger_operator           = "GreaterThan"
  trigger_threshold          = 0
  suppression_enabled        = false

  tactics = ["InitialAccess", "PrivilegeEscalation"]
  techniques = ["T1078"]  // MITRE ATT&CK: Valid Accounts

  incident {
    create_incident_enabled = true
    grouping {
      enabled                 = true
      lookback_duration       = "PT4H"
      reopen_closed_incidents = false
      entity_matching_method  = "Selected"
      group_by_entities       = ["Account"]
    }
  }

  depends_on = [azurerm_log_analytics_solution.sentinel]
}

# Alert rule: Key Vault access anomaly (validated in Phase 3.5 Week 2 POC)
resource "azurerm_sentinel_alert_rule_scheduled" "keyvault_anomaly" {
  name                       = "keyvault-access-anomaly"
  log_analytics_workspace_id = var.log_analytics_workspace_id
  display_name               = "Key Vault Access Anomaly"
  description                = "Detects unusual Key Vault access patterns"
  severity                   = "High"
  enabled                    = true

  query = <<-QUERY
    AzureDiagnostics
    | where ResourceType == "VAULTS"
    | where TimeGenerated > ago(5m)
    | where ResultSignature != "OK"  // Failed access
    | summarize FailedAccess = count() by CallerIPAddress, identity_claim_appid_g, bin(TimeGenerated, 5m)
    | where FailedAccess >= 3
    | project TimeGenerated, CallerIPAddress, identity_claim_appid_g, FailedAccess
  QUERY

  query_frequency            = "PT5M"  // Every 5 minutes
  query_period               = "PT5M"
  trigger_operator           = "GreaterThan"
  trigger_threshold          = 0
  suppression_enabled        = false

  tactics = ["CredentialAccess"]
  techniques = ["T1555"]  // MITRE ATT&CK: Credentials from Password Stores

  incident {
    create_incident_enabled = true
    grouping {
      enabled                 = true
      lookback_duration       = "PT1H"
      reopen_closed_incidents = false
      entity_matching_method  = "Selected"
      group_by_entities       = ["IP"]
    }
  }

  depends_on = [azurerm_log_analytics_solution.sentinel]
}

# Alert rule: PostgreSQL suspicious queries (validated in Phase 3.5 Week 1 POC)
resource "azurerm_sentinel_alert_rule_scheduled" "sql_injection" {
  name                       = "postgresql-sql-injection-attempt"
  log_analytics_workspace_id = var.log_analytics_workspace_id
  display_name               = "PostgreSQL SQL Injection Attempt"
  description                = "Detects potential SQL injection patterns in PostgreSQL logs"
  severity                   = "High"
  enabled                    = true

  query = <<-QUERY
    AzureDiagnostics
    | where ResourceType == "SERVERS"
    | where Category == "PostgreSQLLogs"
    | where TimeGenerated > ago(5m)
    | where Message contains "'; DROP" or Message contains "UNION SELECT" or Message contains "' OR '1'='1"
    | project TimeGenerated, Resource, Message, user_name_s
  QUERY

  query_frequency            = "PT5M"  // Every 5 minutes
  query_period               = "PT5M"
  trigger_operator           = "GreaterThan"
  trigger_threshold          = 0
  suppression_enabled        = false

  tactics = ["InitialAccess", "Execution"]
  techniques = ["T1190"]  // MITRE ATT&CK: Exploit Public-Facing Application

  incident {
    create_incident_enabled = true
    grouping {
      enabled                 = true
      lookback_duration       = "PT30M"
      reopen_closed_incidents = false
      entity_matching_method  = "All"
    }
  }

  depends_on = [azurerm_log_analytics_solution.sentinel]
}

# Watchlist: Known threat IPs
resource "azurerm_sentinel_watchlist" "threat_ips" {
  name                       = "known-threat-ips"
  log_analytics_workspace_id = var.log_analytics_workspace_id
  display_name               = "Known Threat IP Addresses"
  description                = "List of known malicious IP addresses"
  item_search_key            = "IPAddress"

  depends_on = [azurerm_log_analytics_solution.sentinel]
}

# Outputs
output "sentinel_workspace_id" {
  value       = azurerm_log_analytics_solution.sentinel.id
  description = "Azure Sentinel workspace ID"
}

output "sentinel_name" {
  value       = azurerm_log_analytics_solution.sentinel.solution_name
  description = "Azure Sentinel solution name"
}
