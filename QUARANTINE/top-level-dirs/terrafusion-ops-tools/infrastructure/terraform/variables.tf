# TerraFusion Infrastructure Variables
# Variable definitions for Terraform configuration

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "terrafusion"
  
  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.project_name))
    error_message = "Project name must contain only lowercase letters, numbers, and hyphens."
  }
}

variable "environment" {
  description = "Environment name (development, staging, production)"
  type        = string
  
  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment must be one of: development, staging, production."
  }
}

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-west-2"
  
  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.aws_region))
    error_message = "AWS region must be a valid region identifier."
  }
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
  
  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "VPC CIDR must be a valid IPv4 CIDR block."
  }
}

# Database Configuration Variables
variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = ""
  
  validation {
    condition = var.db_instance_class == "" || can(regex("^db\\.[a-z0-9]+\\.[a-z0-9]+$", var.db_instance_class))
    error_message = "Database instance class must be a valid RDS instance type."
  }
}

variable "db_allocated_storage" {
  description = "Initial allocated storage for RDS instance (GB)"
  type        = number
  default     = 100
  
  validation {
    condition     = var.db_allocated_storage >= 20 && var.db_allocated_storage <= 65536
    error_message = "Database allocated storage must be between 20 and 65536 GB."
  }
}

variable "db_backup_retention_period" {
  description = "Number of days to retain automated backups"
  type        = number
  default     = 7
  
  validation {
    condition     = var.db_backup_retention_period >= 0 && var.db_backup_retention_period <= 35
    error_message = "Backup retention period must be between 0 and 35 days."
  }
}

variable "db_multi_az" {
  description = "Enable Multi-AZ deployment for RDS"
  type        = bool
  default     = false
}

variable "db_performance_insights_enabled" {
  description = "Enable Performance Insights for RDS"
  type        = bool
  default     = true
}

# EKS Configuration Variables
variable "eks_cluster_version" {
  description = "Kubernetes version for EKS cluster"
  type        = string
  default     = "1.28"
  
  validation {
    condition     = can(regex("^1\\.[0-9]+$", var.eks_cluster_version))
    error_message = "EKS cluster version must be in format 1.XX."
  }
}

variable "eks_node_instance_types" {
  description = "EC2 instance types for EKS worker nodes"
  type        = list(string)
  default     = ["m6i.large"]
  
  validation {
    condition     = length(var.eks_node_instance_types) > 0
    error_message = "At least one instance type must be specified."
  }
}

variable "eks_node_desired_capacity" {
  description = "Desired number of worker nodes"
  type        = number
  default     = 3
  
  validation {
    condition     = var.eks_node_desired_capacity >= 1 && var.eks_node_desired_capacity <= 100
    error_message = "Node desired capacity must be between 1 and 100."
  }
}

variable "eks_node_max_capacity" {
  description = "Maximum number of worker nodes"
  type        = number
  default     = 10
  
  validation {
    condition     = var.eks_node_max_capacity >= 1 && var.eks_node_max_capacity <= 100
    error_message = "Node maximum capacity must be between 1 and 100."
  }
}

variable "eks_node_min_capacity" {
  description = "Minimum number of worker nodes"
  type        = number
  default     = 1
  
  validation {
    condition     = var.eks_node_min_capacity >= 0 && var.eks_node_min_capacity <= 100
    error_message = "Node minimum capacity must be between 0 and 100."
  }
}

# Redis Configuration Variables
variable "redis_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = ""
  
  validation {
    condition = var.redis_node_type == "" || can(regex("^cache\\.[a-z0-9]+\\.[a-z0-9]+$", var.redis_node_type))
    error_message = "Redis node type must be a valid ElastiCache node type."
  }
}

variable "redis_num_cache_clusters" {
  description = "Number of cache clusters in Redis replication group"
  type        = number
  default     = 2
  
  validation {
    condition     = var.redis_num_cache_clusters >= 1 && var.redis_num_cache_clusters <= 6
    error_message = "Number of Redis cache clusters must be between 1 and 6."
  }
}

variable "redis_snapshot_retention_limit" {
  description = "Number of days to retain Redis snapshots"
  type        = number
  default     = 1
  
  validation {
    condition     = var.redis_snapshot_retention_limit >= 0 && var.redis_snapshot_retention_limit <= 35
    error_message = "Redis snapshot retention limit must be between 0 and 35 days."
  }
}

# Security Configuration Variables
variable "enable_deletion_protection" {
  description = "Enable deletion protection for critical resources"
  type        = bool
  default     = false
}

variable "enable_encryption_at_rest" {
  description = "Enable encryption at rest for all applicable services"
  type        = bool
  default     = true
}

variable "enable_encryption_in_transit" {
  description = "Enable encryption in transit for all applicable services"
  type        = bool
  default     = true
}

variable "enable_enhanced_monitoring" {
  description = "Enable enhanced monitoring for RDS and other services"
  type        = bool
  default     = true
}

# CloudWatch Configuration Variables
variable "cloudwatch_log_retention_days" {
  description = "Number of days to retain CloudWatch logs"
  type        = number
  default     = 14
  
  validation {
    condition = contains([1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653], var.cloudwatch_log_retention_days)
    error_message = "CloudWatch log retention days must be a valid retention period."
  }
}

variable "enable_cloudwatch_insights" {
  description = "Enable CloudWatch Container Insights"
  type        = bool
  default     = true
}

# S3 Configuration Variables
variable "s3_versioning_enabled" {
  description = "Enable versioning for S3 buckets"
  type        = bool
  default     = true
}

variable "s3_lifecycle_transition_days" {
  description = "Number of days before transitioning objects to IA storage"
  type        = number
  default     = 30
  
  validation {
    condition     = var.s3_lifecycle_transition_days >= 1
    error_message = "S3 lifecycle transition days must be at least 1."
  }
}

variable "s3_backup_retention_years" {
  description = "Number of years to retain backup objects"
  type        = number
  default     = 7
  
  validation {
    condition     = var.s3_backup_retention_years >= 1 && var.s3_backup_retention_years <= 10
    error_message = "S3 backup retention must be between 1 and 10 years."
  }
}

# Network Configuration Variables
variable "enable_nat_gateway" {
  description = "Enable NAT Gateway for private subnets"
  type        = bool
  default     = true
}

variable "single_nat_gateway" {
  description = "Use a single NAT Gateway instead of one per AZ"
  type        = bool
  default     = false
}

variable "enable_vpc_flow_logs" {
  description = "Enable VPC Flow Logs"
  type        = bool
  default     = true
}

variable "enable_dns_hostnames" {
  description = "Enable DNS hostnames in VPC"
  type        = bool
  default     = true
}

variable "enable_dns_support" {
  description = "Enable DNS support in VPC"
  type        = bool
  default     = true
}

# Application Load Balancer Variables
variable "alb_enable_deletion_protection" {
  description = "Enable deletion protection for ALB"
  type        = bool
  default     = false
}

variable "alb_enable_access_logs" {
  description = "Enable access logs for ALB"
  type        = bool
  default     = true
}

variable "alb_idle_timeout" {
  description = "ALB idle timeout in seconds"
  type        = number
  default     = 60
  
  validation {
    condition     = var.alb_idle_timeout >= 1 && var.alb_idle_timeout <= 4000
    error_message = "ALB idle timeout must be between 1 and 4000 seconds."
  }
}

# Domain and SSL Configuration
variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = ""
}

variable "certificate_arn" {
  description = "ARN of SSL certificate for HTTPS"
  type        = string
  default     = ""
}

variable "enable_http_redirect" {
  description = "Redirect HTTP traffic to HTTPS"
  type        = bool
  default     = true
}

# Backup Configuration Variables
variable "backup_schedule_expression" {
  description = "Cron expression for backup schedule"
  type        = string
  default     = "cron(0 2 * * ? *)"  # Daily at 2 AM UTC
  
  validation {
    condition     = can(regex("^(rate\\(|cron\\()", var.backup_schedule_expression))
    error_message = "Backup schedule must be a valid cron or rate expression."
  }
}

variable "backup_delete_after_days" {
  description = "Number of days after which to delete backups"
  type        = number
  default     = 30
  
  validation {
    condition     = var.backup_delete_after_days >= 1 && var.backup_delete_after_days <= 3653
    error_message = "Backup retention must be between 1 and 3653 days."
  }
}

# Monitoring and Alerting Variables
variable "enable_detailed_monitoring" {
  description = "Enable detailed monitoring for EC2 instances"
  type        = bool
  default     = true
}

variable "sns_notifications_email" {
  description = "Email address for SNS notifications"
  type        = string
  default     = ""
  
  validation {
    condition = var.sns_notifications_email == "" || can(regex("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", var.sns_notifications_email))
    error_message = "SNS notification email must be a valid email address."
  }
}

variable "cpu_utilization_threshold" {
  description = "CPU utilization threshold for alerts (percentage)"
  type        = number
  default     = 80
  
  validation {
    condition     = var.cpu_utilization_threshold >= 1 && var.cpu_utilization_threshold <= 100
    error_message = "CPU utilization threshold must be between 1 and 100."
  }
}

variable "memory_utilization_threshold" {
  description = "Memory utilization threshold for alerts (percentage)"
  type        = number
  default     = 85
  
  validation {
    condition     = var.memory_utilization_threshold >= 1 && var.memory_utilization_threshold <= 100
    error_message = "Memory utilization threshold must be between 1 and 100."
  }
}

# Cost Management Variables
variable "enable_cost_anomaly_detection" {
  description = "Enable AWS Cost Anomaly Detection"
  type        = bool
  default     = true
}

variable "cost_budget_limit" {
  description = "Monthly cost budget limit in USD"
  type        = number
  default     = 1000
  
  validation {
    condition     = var.cost_budget_limit >= 1
    error_message = "Cost budget limit must be at least $1."
  }
}

variable "cost_budget_threshold_percentage" {
  description = "Budget threshold percentage for alerts"
  type        = number
  default     = 80
  
  validation {
    condition     = var.cost_budget_threshold_percentage >= 1 && var.cost_budget_threshold_percentage <= 100
    error_message = "Cost budget threshold must be between 1 and 100 percent."
  }
}

# Disaster Recovery Variables
variable "enable_cross_region_backup" {
  description = "Enable cross-region backup for disaster recovery"
  type        = bool
  default     = false
}

variable "backup_region" {
  description = "AWS region for disaster recovery backups"
  type        = string
  default     = "us-east-1"
  
  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.backup_region))
    error_message = "Backup region must be a valid AWS region identifier."
  }
}

# Auto Scaling Variables
variable "enable_auto_scaling" {
  description = "Enable auto scaling for EKS node groups"
  type        = bool
  default     = true
}

variable "auto_scaling_target_cpu" {
  description = "Target CPU utilization for auto scaling"
  type        = number
  default     = 70
  
  validation {
    condition     = var.auto_scaling_target_cpu >= 1 && var.auto_scaling_target_cpu <= 100
    error_message = "Auto scaling target CPU must be between 1 and 100 percent."
  }
}

variable "auto_scaling_target_memory" {
  description = "Target memory utilization for auto scaling"
  type        = number
  default     = 75
  
  validation {
    condition     = var.auto_scaling_target_memory >= 1 && var.auto_scaling_target_memory <= 100
    error_message = "Auto scaling target memory must be between 1 and 100 percent."
  }
}

# Feature Flags
variable "enable_spot_instances" {
  description = "Enable spot instances for cost optimization"
  type        = bool
  default     = false
}

variable "enable_graviton_instances" {
  description = "Enable ARM-based Graviton instances for better price/performance"
  type        = bool
  default     = true
}

variable "enable_container_insights" {
  description = "Enable CloudWatch Container Insights"
  type        = bool
  default     = true
}

variable "enable_service_mesh" {
  description = "Enable service mesh (Istio/App Mesh)"
  type        = bool
  default     = false
}

# Development and Testing Variables
variable "enable_development_tools" {
  description = "Enable development and debugging tools"
  type        = bool
  default     = false
}

variable "enable_load_testing" {
  description = "Enable load testing infrastructure"
  type        = bool
  default     = false
}

variable "enable_canary_deployments" {
  description = "Enable canary deployment capabilities"
  type        = bool
  default     = true
}

# Compliance and Security Variables
variable "enable_compliance_monitoring" {
  description = "Enable AWS Config and compliance monitoring"
  type        = bool
  default     = true
}

variable "enable_security_hub" {
  description = "Enable AWS Security Hub"
  type        = bool
  default     = true
}

variable "enable_guardduty" {
  description = "Enable AWS GuardDuty threat detection"
  type        = bool
  default     = true
}

variable "enable_waf" {
  description = "Enable AWS WAF for application protection"
  type        = bool
  default     = true
}

# Tags Variables
variable "additional_tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
  
  validation {
    condition = alltrue([
      for k, v in var.additional_tags : can(regex("^[a-zA-Z0-9+-=._:/@\\s]+$", k)) && can(regex("^[a-zA-Z0-9+-=._:/@\\s]*$", v))
    ])
    error_message = "Tag keys and values must contain only valid AWS tag characters."
  }
}

variable "cost_center" {
  description = "Cost center for resource billing"
  type        = string
  default     = ""
}

variable "owner" {
  description = "Owner of the resources"
  type        = string
  default     = "DevOps"
}

variable "contact_email" {
  description = "Contact email for the resources"
  type        = string
  default     = ""
  
  validation {
    condition = var.contact_email == "" || can(regex("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", var.contact_email))
    error_message = "Contact email must be a valid email address."
  }
}