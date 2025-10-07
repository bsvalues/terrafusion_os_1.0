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
  description = "DNS prefix for AKS cluster"
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
  default     = []
}

variable "tags" {
  type        = map(string)
  description = "Resource tags"
  default     = {}
}
