variable "cache_name" {
  type        = string
  description = "Redis Cache name"
}

variable "location" {
  type        = string
  description = "Azure region"
}

variable "resource_group_name" {
  type        = string
  description = "Resource group name"
}

variable "subnet_id" {
  type        = string
  description = "Subnet ID for Redis private endpoint"
}

variable "backup_storage_connection_string" {
  type        = string
  description = "Storage account connection string for Redis backups"
  sensitive   = true
}

variable "aks_subnet_start_ip" {
  type        = string
  description = "AKS subnet start IP (for firewall rule)"
  default     = "10.0.1.0"
}

variable "aks_subnet_end_ip" {
  type        = string
  description = "AKS subnet end IP (for firewall rule)"
  default     = "10.0.1.255"
}

variable "tags" {
  type        = map(string)
  description = "Resource tags"
  default     = {}
}
