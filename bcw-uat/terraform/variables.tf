# TerraFusion OS UAT Variables
# Benton County Washington government deployment

# =============================================================================
# ENVIRONMENT CONFIGURATION
# =============================================================================

variable "aws_region" {
  description = "AWS region for Benton County UAT deployment"
  type        = string
  default     = "us-west-2"
  
  validation {
    condition = contains([
      "us-west-2",  # Primary: Oregon (closest to Washington)
      "us-west-1",  # Secondary: N. California
      "us-east-1"   # Tertiary: N. Virginia
    ], var.aws_region)
    error_message = "Region must be suitable for government workloads."
  }
}

variable "stack_name" {
  description = "Stack name for all TerraFusion resources"
  type        = string
  default     = "terrafusion-bcw-uat"
  
  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.stack_name))
    error_message = "Stack name must be lowercase alphanumeric with hyphens."
  }
}

variable "environment" {
  description = "Environment identifier"
  type        = string
  default     = "uat"
  
  validation {
    condition = contains([
      "dev",
      "qa", 
      "uat",
      "staging",
      "prod"
    ], var.environment)
    error_message = "Environment must be a valid deployment stage."
  }
}

# =============================================================================
# NETWORKING CONFIGURATION
# =============================================================================

variable "vpc_cidr" {
  description = "CIDR block for TerraFusion VPC"
  type        = string
  default     = "10.60.0.0/16"
  
  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "VPC CIDR must be a valid IPv4 CIDR block."
  }
}

variable "availability_zones" {
  description = "Availability zones for high availability deployment"
  type        = list(string)
  default     = ["us-west-2a", "us-west-2b", "us-west-2c"]
  
  validation {
    condition     = length(var.availability_zones) >= 2
    error_message = "At least 2 availability zones required for government HA."
  }
}

# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================

variable "db_instance_class" {
  description = "RDS instance class for PostGIS database"
  type        = string
  default     = "db.r6g.xlarge"
  
  validation {
    condition = contains([
      "db.r6g.large",    # 2 vCPU, 16 GB RAM
      "db.r6g.xlarge",   # 4 vCPU, 32 GB RAM (recommended)
      "db.r6g.2xlarge",  # 8 vCPU, 64 GB RAM
      "db.r6g.4xlarge"   # 16 vCPU, 128 GB RAM
    ], var.db_instance_class)
    error_message = "Database instance must be suitable for spatial workloads."
  }
}

variable "db_allocated_storage" {
  description = "Allocated storage for database (GB)"
  type        = number
  default     = 500
  
  validation {
    condition     = var.db_allocated_storage >= 100 && var.db_allocated_storage <= 65536
    error_message = "Database storage must be between 100 GB and 65,536 GB."
  }
}

variable "db_backup_retention_days" {
  description = "Database backup retention period"
  type        = number
  default     = 30
  
  validation {
    condition     = var.db_backup_retention_days >= 7 && var.db_backup_retention_days <= 35
    error_message = "Backup retention must be between 7 and 35 days for government compliance."
  }
}

# =============================================================================
# RUST PERFORMANCE ENGINE CONFIGURATION
# =============================================================================

variable "rust_engine_cpu_units" {
  description = "CPU units for Rust Performance Engine (256 = 0.25 vCPU)"
  type        = number
  default     = 2048  # 2 vCPU for elite performance
  
  validation {
    condition     = var.rust_engine_cpu_units >= 1024 && var.rust_engine_cpu_units <= 4096
    error_message = "Rust engine requires 1-4 vCPU for optimal performance."
  }
}

variable "rust_engine_memory_mb" {
  description = "Memory for Rust Performance Engine (MB)"
  type        = number
  default     = 4096  # 4 GB for 50,000 agents
  
  validation {
    condition     = var.rust_engine_memory_mb >= 2048 && var.rust_engine_memory_mb <= 8192
    error_message = "Rust engine requires 2-8 GB memory for agent coordination."
  }
}

variable "rust_engine_desired_count" {
  description = "Desired number of Rust engine instances"
  type        = number
  default     = 3
  
  validation {
    condition     = var.rust_engine_desired_count >= 2 && var.rust_engine_desired_count <= 10
    error_message = "Rust engine instances must be between 2 and 10 for HA."
  }
}

# =============================================================================
# AI COORDINATION CONFIGURATION
# =============================================================================

variable "ai_supreme_commander_agents" {
  description = "Number of Supreme Commander AI agents"
  type        = number
  default     = 1
  
  validation {
    condition     = var.ai_supreme_commander_agents == 1
    error_message = "Exactly 1 Supreme Commander required for coordination."
  }
}

variable "ai_field_general_agents" {
  description = "Number of Field General AI agents"
  type        = number
  default     = 8
  
  validation {
    condition     = var.ai_field_general_agents >= 4 && var.ai_field_general_agents <= 16
    error_message = "Field Generals must be between 4 and 16 for optimal coordination."
  }
}

variable "ai_operational_agents" {
  description = "Number of operational AI agents"
  type        = number
  default     = 999  # Total with commanders = 1,008
  
  validation {
    condition     = var.ai_operational_agents >= 500 && var.ai_operational_agents <= 2000
    error_message = "Operational agents must be between 500 and 2,000."
  }
}

variable "rust_performance_agents" {
  description = "Number of Rust performance agents"
  type        = number
  default     = 50000
  
  validation {
    condition     = var.rust_performance_agents >= 10000 && var.rust_performance_agents <= 100000
    error_message = "Rust agents must be between 10,000 and 100,000."
  }
}

# =============================================================================
# SECURITY CONFIGURATION
# =============================================================================

variable "enable_tls" {
  description = "Enable TLS encryption for all services"
  type        = bool
  default     = true
  
  validation {
    condition     = var.enable_tls == true
    error_message = "TLS must be enabled for government workloads."
  }
}

variable "government_domain" {
  description = "Government domain for TLS certificates"
  type        = string
  default     = "benton.wa.gov"
  
  validation {
    condition     = can(regex("\\.(gov|mil)$", var.government_domain))
    error_message = "Domain must be a valid government domain (.gov or .mil)."
  }
}

variable "data_classification" {
  description = "Data classification level"
  type        = string
  default     = "sensitive"
  
  validation {
    condition = contains([
      "public",
      "internal", 
      "sensitive",
      "restricted",
      "confidential"
    ], var.data_classification)
    error_message = "Must be valid government data classification."
  }
}

# =============================================================================
# KUBERNETES CONFIGURATION
# =============================================================================

variable "kubernetes_version" {
  description = "Kubernetes cluster version"
  type        = string
  default     = "1.28"
  
  validation {
    condition = contains([
      "1.26",
      "1.27", 
      "1.28",
      "1.29"
    ], var.kubernetes_version)
    error_message = "Kubernetes version must be supported."
  }
}

variable "node_groups" {
  description = "EKS node group configurations"
  type = map(object({
    instance_types = list(string)
    desired_size   = number
    max_size       = number
    min_size       = number
    labels         = map(string)
  }))
  
  default = {
    api_servers = {
      instance_types = ["c5.xlarge"]
      desired_size   = 3
      max_size       = 6
      min_size       = 3
      labels = {
        "terrafusion.io/workload" = "api"
      }
    }
    
    ai_coordination = {
      instance_types = ["r5.2xlarge"]
      desired_size   = 2
      max_size       = 4
      min_size       = 2
      labels = {
        "terrafusion.io/workload" = "ai-coordination"
      }
    }
    
    modules = {
      instance_types = ["c5.large"]
      desired_size   = 4
      max_size       = 8
      min_size       = 2
      labels = {
        "terrafusion.io/workload" = "modules"
      }
    }
  }
}

# =============================================================================
# BENTON COUNTY SPECIFIC
# =============================================================================

variable "benton_county_parcel_count" {
  description = "Number of Benton County parcels"
  type        = number
  default     = 89247
  
  validation {
    condition     = var.benton_county_parcel_count > 0
    error_message = "Parcel count must be positive."
  }
}

variable "government_contact_email" {
  description = "Contact email for government deployment"
  type        = string
  default     = "it@co.benton.wa.us"
  
  validation {
    condition     = can(regex("@.*\\.(gov|mil)$", var.government_contact_email))
    error_message = "Contact must be government email address."
  }
}

# =============================================================================
# COST OPTIMIZATION
# =============================================================================

variable "enable_spot_instances" {
  description = "Enable spot instances for cost optimization"
  type        = bool
  default     = false  # Disabled for government stability
}

variable "enable_auto_scaling" {
  description = "Enable auto scaling for dynamic workloads"
  type        = bool
  default     = true
}

# =============================================================================
# MONITORING & COMPLIANCE
# =============================================================================

variable "enable_detailed_monitoring" {
  description = "Enable detailed CloudWatch monitoring"
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "CloudWatch log retention period"
  type        = number
  default     = 90  # Government compliance
  
  validation {
    condition     = var.log_retention_days >= 30
    error_message = "Government workloads require minimum 30 days log retention."
  }
}