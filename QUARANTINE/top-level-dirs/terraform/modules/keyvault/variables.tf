variable "keyvault_name" {
  type        = string
  description = "Key Vault name (must be globally unique)"

  validation {
    condition     = length(var.keyvault_name) >= 3 && length(var.keyvault_name) <= 24
    error_message = "Key Vault name must be between 3 and 24 characters."
  }
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
  description = "Subnet ID for Key Vault private endpoint"
}

variable "aks_kubelet_identity_object_id" {
  type        = string
  description = "AKS kubelet managed identity object ID (for Key Vault access)"
}

variable "postgresql_connection_string" {
  type        = string
  description = "PostgreSQL connection string (stored as secret)"
  sensitive   = true
}

variable "redis_connection_string" {
  type        = string
  description = "Redis connection string (stored as secret)"
  sensitive   = true
}

variable "kafka_connection_string" {
  type        = string
  description = "Kafka (Event Hubs) connection string (stored as secret)"
  sensitive   = true
}

variable "tags" {
  type        = map(string)
  description = "Resource tags"
  default     = {}
}
