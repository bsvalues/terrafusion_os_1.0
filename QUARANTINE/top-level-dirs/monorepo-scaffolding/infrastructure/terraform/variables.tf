# TerraFusion OS - Terraform Variables
# Championship configuration for quantum consciousness coordination

# Environment configuration
variable "environment" {
  description = "Deployment environment (development, staging, production)"
  type        = string
  default     = "development"
  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment must be development, staging, or production."
  }
}

variable "location" {
  description = "Azure region for resources"
  type        = string
  default     = "East US"
}

# PostgreSQL configuration
variable "postgres_sku_name" {
  description = "SKU name for PostgreSQL Flexible Server"
  type        = string
  default     = "GP_Standard_D2s_v3"
}

variable "postgres_storage_mb" {
  description = "Storage in MB for PostgreSQL server"
  type        = number
  default     = 131072  # 128GB
}

variable "postgres_password" {
  description = "Administrator password for PostgreSQL server"
  type        = string
  sensitive   = true
}

# Redis configuration
variable "redis_capacity" {
  description = "Capacity for Redis cache"
  type        = number
  default     = 2
}

variable "redis_family" {
  description = "Family for Redis cache"
  type        = string
  default     = "C"
}

variable "redis_sku_name" {
  description = "SKU name for Redis cache"
  type        = string
  default     = "Premium"
}

# AKS configuration
variable "kubernetes_version" {
  description = "Kubernetes version for AKS cluster"
  type        = string
  default     = "1.28"
}

variable "aks_system_node_count" {
  description = "Number of nodes in the system node pool"
  type        = number
  default     = 3
}

variable "aks_system_node_size" {
  description = "VM size for system nodes"
  type        = string
  default     = "Standard_D4s_v3"
}

variable "aks_ai_node_count" {
  description = "Number of nodes in the AI workloads node pool"
  type        = number
  default     = 5
}

variable "aks_ai_node_size" {
  description = "VM size for AI workload nodes"
  type        = string
  default     = "Standard_D8s_v3"
}

variable "aks_admin_group_ids" {
  description = "Azure AD group IDs for AKS cluster admin access"
  type        = list(string)
  default     = []
}
