/**
 * Variables for TerraFusionPro Production Environment
 */

variable "location" {
  description = "Azure primary region to deploy resources"
  type        = string
  default     = "East US"
}

variable "secondary_location" {
  description = "Azure secondary region for redundancy"
  type        = string
  default     = "West US"
}

variable "kubernetes_version" {
  description = "Kubernetes version to use"
  type        = string
  default     = "1.24.0"
}

variable "db_admin_username" {
  description = "PostgreSQL admin username"
  type        = string
  sensitive   = true
}

variable "db_admin_password" {
  description = "PostgreSQL admin password"
  type        = string
  sensitive   = true
}