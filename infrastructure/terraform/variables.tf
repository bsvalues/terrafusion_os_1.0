# TerraFusion OS 1.0 - Terraform Variables
# Configuration for multi-region AWS deployment

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "production"

  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be one of: dev, staging, production."
  }
}

variable "primary_region" {
  description = "Primary AWS region for main deployment"
  type        = string
  default     = "us-west-2"
}

variable "secondary_region" {
  description = "Secondary AWS region for disaster recovery"
  type        = string
  default     = "us-east-1"
}

variable "kubernetes_version" {
  description = "Kubernetes version for EKS clusters"
  type        = string
  default     = "1.28"
}

variable "rds_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.r6g.xlarge"
}

variable "allowed_cidr_blocks" {
  description = "CIDR blocks allowed to access EKS API server"
  type        = list(string)
  default     = ["0.0.0.0/0"] # Restrict this in production
}

variable "enable_monitoring" {
  description = "Enable comprehensive monitoring stack"
  type        = bool
  default     = true
}

variable "enable_backup" {
  description = "Enable automated backup solutions"
  type        = bool
  default     = true
}

variable "compliance_mode" {
  description = "Enable FISMA/FedRAMP compliance configurations"
  type        = bool
  default     = true
}

variable "ai_agent_count" {
  description = "Number of AI agents to provision resources for"
  type        = number
  default     = 1008
}

variable "module_count" {
  description = "Expected number of TerraFusion modules"
  type        = number
  default     = 39
}

variable "tags" {
  description = "Additional tags for all resources"
  type        = map(string)
  default = {
    Project    = "TerraFusion-OS"
    Version    = "1.0.0"
    ManagedBy  = "Terraform"
    Compliance = "FISMA"
  }
}