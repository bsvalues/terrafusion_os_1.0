variable "location" {
  type        = string
  description = "Azure region"
}

variable "resource_group_name" {
  type        = string
  description = "Resource group name"
}

variable "log_analytics_workspace_id" {
  type        = string
  description = "Log Analytics workspace ID"
}

variable "log_analytics_workspace_name" {
  type        = string
  description = "Log Analytics workspace name"
}

variable "tags" {
  type        = map(string)
  description = "Resource tags"
  default     = {}
}
