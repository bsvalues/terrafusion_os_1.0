# Production Environment Variables

variable "aks_admin_group_ids" {
  type        = list(string)
  description = "Azure AD group IDs for AKS admin access"
  default     = []
}

variable "allowed_ip_ranges" {
  type        = list(string)
  description = "Allowed IP ranges for management access"
  default     = []
}
