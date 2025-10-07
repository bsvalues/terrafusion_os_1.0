variable "workspace_name" {
  type        = string
  description = "Log Analytics workspace name"
}

variable "app_insights_name" {
  type        = string
  description = "Application Insights name"
}

variable "grafana_name" {
  type        = string
  description = "Grafana dashboard name"
}

variable "location" {
  type        = string
  description = "Azure region"
}

variable "resource_group_name" {
  type        = string
  description = "Resource group name"
}

variable "tags" {
  type        = map(string)
  description = "Resource tags"
  default     = {}
}
