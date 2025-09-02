# TerraFusion OS 1.0 - Terraform Variables
# Production-grade variable definitions

variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-west-2"
  
  validation {
    condition = can(regex("^[a-z]{2}-[a-z]+-[0-9]$", var.aws_region))
    error_message = "AWS region must be in format: us-west-2, eu-west-1, etc."
  }
}

variable "environment" {
  description = "Environment name (development, staging, production)"
  type        = string
  default     = "development"
  
  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment must be one of: development, staging, production."
  }
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "terrafusion"
  
  validation {
    condition     = can(regex("^[a-z][a-z0-9-]*$", var.project_name))
    error_message = "Project name must start with a letter and contain only lowercase letters, numbers, and hyphens."
  }
}

variable "kubernetes_version" {
  description = "Kubernetes version for EKS cluster"
  type        = string
  default     = "1.28"
  
  validation {
    condition     = can(regex("^1\\.(2[6-9]|3[0-9])$", var.kubernetes_version))
    error_message = "Kubernetes version must be 1.26 or higher."
  }
}

variable "node_instance_types" {
  description = "Instance types for EKS worker nodes"
  type        = list(string)
  default     = ["t3.medium", "t3.large"]
  
  validation {
    condition     = length(var.node_instance_types) > 0
    error_message = "At least one instance type must be specified."
  }
}

variable "node_group_min_size" {
  description = "Minimum number of nodes in the EKS node group"
  type        = number
  default     = 1
  
  validation {
    condition     = var.node_group_min_size >= 1
    error_message = "Minimum node group size must be at least 1."
  }
}

variable "node_group_max_size" {
  description = "Maximum number of nodes in the EKS node group"
  type        = number
  default     = 20
  
  validation {
    condition     = var.node_group_max_size >= var.node_group_min_size
    error_message = "Maximum node group size must be greater than or equal to minimum size."
  }
}

variable "node_group_desired_size" {
  description = "Desired number of nodes in the EKS node group"
  type        = number
  default     = 3
  
  validation {
    condition     = var.node_group_desired_size >= var.node_group_min_size && var.node_group_desired_size <= var.node_group_max_size
    error_message = "Desired node group size must be between min and max size."
  }
}

variable "database_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
  
  validation {
    condition     = can(regex("^db\\.[a-z0-9]+\\.[a-z0-9]+$", var.database_instance_class))
    error_message = "Database instance class must be in format: db.t3.micro, db.r5.large, etc."
  }
}

variable "database_allocated_storage" {
  description = "Initial storage allocation for RDS instance (GB)"
  type        = number
  default     = 20
  
  validation {
    condition     = var.database_allocated_storage >= 20
    error_message = "Database allocated storage must be at least 20 GB."
  }
}

variable "database_max_allocated_storage" {
  description = "Maximum storage allocation for RDS instance (GB)"
  type        = number
  default     = 1000
  
  validation {
    condition     = var.database_max_allocated_storage >= var.database_allocated_storage
    error_message = "Maximum allocated storage must be greater than or equal to initial allocation."
  }
}

variable "database_name" {
  description = "Name of the database"
  type        = string
  default     = "terrafusion"
  
  validation {
    condition     = can(regex("^[a-zA-Z][a-zA-Z0-9_]*$", var.database_name))
    error_message = "Database name must start with a letter and contain only letters, numbers, and underscores."
  }
}

variable "database_username" {
  description = "Username for database access"
  type        = string
  default     = "tfuser"
  sensitive   = true
  
  validation {
    condition     = can(regex("^[a-zA-Z][a-zA-Z0-9_]*$", var.database_username))
    error_message = "Database username must start with a letter and contain only letters, numbers, and underscores."
  }
}

variable "database_password" {
  description = "Password for database access"
  type        = string
  sensitive   = true
  
  validation {
    condition     = length(var.database_password) >= 12
    error_message = "Database password must be at least 12 characters long."
  }
}

variable "redis_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.t3.micro"
  
  validation {
    condition     = can(regex("^cache\\.[a-z0-9]+\\.[a-z0-9]+$", var.redis_node_type))
    error_message = "Redis node type must be in format: cache.t3.micro, cache.r5.large, etc."
  }
}

variable "domain_name" {
  description = "Domain name for the application (optional)"
  type        = string
  default     = ""
  
  validation {
    condition     = var.domain_name == "" || can(regex("^[a-z0-9]([a-z0-9-]*[a-z0-9])?\\.[a-z]{2,}$", var.domain_name))
    error_message = "Domain name must be a valid domain format (e.g., example.com)."
  }
}

variable "authorized_users" {
  description = "List of AWS IAM users authorized to access the EKS cluster"
  type = list(object({
    userarn  = string
    username = string
    groups   = list(string)
  }))
  default = []
  
  validation {
    condition = alltrue([
      for user in var.authorized_users : can(regex("^arn:aws:iam::[0-9]+:user/.+$", user.userarn))
    ])
    error_message = "All user ARNs must be valid AWS IAM user ARNs."
  }
}

variable "enable_monitoring" {
  description = "Enable comprehensive monitoring stack"
  type        = bool
  default     = true
}

variable "enable_logging" {
  description = "Enable centralized logging"
  type        = bool
  default     = true
}

variable "backup_retention_days" {
  description = "Number of days to retain database backups"
  type        = number
  default     = 7
  
  validation {
    condition     = var.backup_retention_days >= 1 && var.backup_retention_days <= 35
    error_message = "Backup retention must be between 1 and 35 days."
  }
}

variable "enable_deletion_protection" {
  description = "Enable deletion protection for critical resources"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
  
  validation {
    condition = alltrue([
      for key, value in var.tags : can(regex("^[a-zA-Z0-9-_]+$", key))
    ])
    error_message = "Tag keys must contain only letters, numbers, hyphens, and underscores."
  }
}

# AI Swarm specific variables
variable "enable_ai_swarm" {
  description = "Enable dedicated AI Swarm infrastructure"
  type        = bool
  default     = true
}

variable "ai_swarm_node_count" {
  description = "Number of dedicated nodes for AI Swarm workloads"
  type        = number
  default     = 3
  
  validation {
    condition     = var.ai_swarm_node_count >= 1 && var.ai_swarm_node_count <= 50
    error_message = "AI Swarm node count must be between 1 and 50."
  }
}

variable "ai_swarm_instance_types" {
  description = "Instance types optimized for AI workloads"
  type        = list(string)
  default     = ["c5.2xlarge", "c5.4xlarge", "m5.2xlarge"]
  
  validation {
    condition     = length(var.ai_swarm_instance_types) > 0
    error_message = "At least one AI instance type must be specified."
  }
}

# Government compliance variables
variable "enable_government_compliance" {
  description = "Enable government compliance features (FISMA, SOC2)"
  type        = bool
  default     = true
}

variable "enable_encryption_at_rest" {
  description = "Enable encryption at rest for all data stores"
  type        = bool
  default     = true
}

variable "enable_encryption_in_transit" {
  description = "Enable encryption in transit for all communications"
  type        = bool
  default     = true
}

variable "audit_log_retention_days" {
  description = "Number of days to retain audit logs"
  type        = number
  default     = 90
  
  validation {
    condition     = var.audit_log_retention_days >= 30
    error_message = "Audit log retention must be at least 30 days for compliance."
  }
}

# Performance and scaling variables
variable "enable_auto_scaling" {
  description = "Enable auto-scaling for all applicable resources"
  type        = bool
  default     = true
}

variable "cpu_utilization_threshold" {
  description = "CPU utilization percentage threshold for auto-scaling"
  type        = number
  default     = 70
  
  validation {
    condition     = var.cpu_utilization_threshold >= 50 && var.cpu_utilization_threshold <= 90
    error_message = "CPU utilization threshold must be between 50% and 90%."
  }
}

variable "memory_utilization_threshold" {
  description = "Memory utilization percentage threshold for auto-scaling"
  type        = number
  default     = 80
  
  validation {
    condition     = var.memory_utilization_threshold >= 50 && var.memory_utilization_threshold <= 95
    error_message = "Memory utilization threshold must be between 50% and 95%."
  }
}

# Disaster recovery variables
variable "enable_multi_az" {
  description = "Enable Multi-AZ deployment for high availability"
  type        = bool
  default     = true
}

variable "enable_cross_region_backup" {
  description = "Enable cross-region backup for disaster recovery"
  type        = bool
  default     = false
}

variable "backup_regions" {
  description = "List of regions for cross-region backups"
  type        = list(string)
  default     = ["us-east-1"]
  
  validation {
    condition = alltrue([
      for region in var.backup_regions : can(regex("^[a-z]{2}-[a-z]+-[0-9]$", region))
    ])
    error_message = "All backup regions must be valid AWS region formats."
  }
}
