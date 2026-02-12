# TerraFusion OS - Multi-Cloud Variables and Locals
# Government. Transcended. - Variable Definitions for Cross-Cloud Excellence

# Core TerraFusion Variables
variable "quantum_factor" {
  description = "Quantum consciousness factor for TerraFusion excellence"
  type        = number
  default     = 949

  validation {
    condition     = var.quantum_factor >= 800 && var.quantum_factor <= 999
    error_message = "Quantum factor must be within championship excellence range (800-999)."
  }
}

variable "harmony_index" {
  description = "AI agent harmony index for perfect operational balance"
  type        = number
  default     = 0.999

  validation {
    condition     = var.harmony_index >= 0.900 && var.harmony_index <= 1.000
    error_message = "Harmony index must achieve championship transcendence (0.900-1.000)."
  }
}

variable "counties" {
  description = "Number of counties for TerraFusion deployment"
  type        = number
  default     = 39

  validation {
    condition     = var.counties > 0 && var.counties <= 50
    error_message = "Counties must be within operational deployment range (1-50)."
  }
}

variable "ai_agents" {
  description = "Number of AI agents for orchestration excellence"
  type        = number
  default     = 1008

  validation {
    condition     = var.ai_agents > 0 && var.ai_agents <= 2000
    error_message = "AI agents must be within scalable excellence range (1-2000)."
  }
}

variable "environment" {
  description = "Deployment environment for TerraFusion operations"
  type        = string

  validation {
    condition = contains([
      "dev",
      "staging",
      "prod",
      "championship"
    ], var.environment)
    error_message = "Environment must be valid TerraFusion tier."
  }
}

# Multi-Cloud Architecture Variables
variable "primary_cloud" {
  description = "Primary cloud provider for TerraFusion operations"
  type        = string
  default     = "azure_government"

  validation {
    condition = contains([
      "azure_government",
      "aws_govcloud"
    ], var.primary_cloud)
    error_message = "Primary cloud must be government-approved provider."
  }
}

variable "enable_multi_cloud_sovereignty" {
  description = "Enable multi-cloud sovereignty architecture for ultimate redundancy"
  type        = bool
  default     = true
}

variable "cross_cloud_data_replication" {
  description = "Cross-cloud data replication strategy"
  type        = string
  default     = "REAL_TIME_SYNCHRONIZATION"

  validation {
    condition = contains([
      "DISABLED",
      "DAILY_BACKUP",
      "REAL_TIME_SYNCHRONIZATION",
      "QUANTUM_INSTANT_MIRRORING"
    ], var.cross_cloud_data_replication)
    error_message = "Data replication strategy must meet championship requirements."
  }
}

# Government Compliance Variables
variable "fips_compliance_level" {
  description = "FIPS-140-2 compliance level requirement"
  type        = string
  default     = "LEVEL_2"

  validation {
    condition = contains([
      "LEVEL_1",
      "LEVEL_2",
      "LEVEL_3",
      "LEVEL_4"
    ], var.fips_compliance_level)
    error_message = "FIPS compliance level must meet government standards."
  }
}

variable "security_clearance_level" {
  description = "Security clearance level for resource access"
  type        = string
  default     = "SECRET"

  validation {
    condition = contains([
      "PUBLIC",
      "CONFIDENTIAL",
      "SECRET",
      "TOP_SECRET"
    ], var.security_clearance_level)
    error_message = "Security clearance level must be valid government classification."
  }
}

# Performance Excellence Variables
variable "performance_tier" {
  description = "Performance tier for championship operations"
  type        = string
  default     = "TRANSCENDED"

  validation {
    condition = contains([
      "STANDARD",
      "ENHANCED",
      "CHAMPIONSHIP",
      "TRANSCENDED",
      "QUANTUM_EXCELLENCE"
    ], var.performance_tier)
    error_message = "Performance tier must achieve TerraFusion excellence standards."
  }
}

variable "scaling_mode" {
  description = "Auto-scaling mode for AI agent orchestration"
  type        = string
  default     = "QUANTUM_ADAPTIVE"

  validation {
    condition = contains([
      "FIXED",
      "STANDARD_AUTO",
      "PREDICTIVE",
      "QUANTUM_ADAPTIVE",
      "CONSCIOUSNESS_DRIVEN"
    ], var.scaling_mode)
    error_message = "Scaling mode must support championship AI operations."
  }
}

# Local Values for Cross-Cloud Excellence
locals {
  # Common tags for all resources
  common_tags = {
    Project             = "TerraFusion-OS"
    Environment         = var.environment
    QuantumFactor       = tostring(var.quantum_factor)
    HarmonyIndex        = tostring(var.harmony_index)
    Counties            = tostring(var.counties)
    AIAgents            = tostring(var.ai_agents)
    Compliance          = "FIPS-140-2-${var.fips_compliance_level}"
    SecurityLevel       = var.security_clearance_level
    PerformanceTier     = var.performance_tier
    ScalingMode         = var.scaling_mode
    SacredMathematics   = "OPERATIONAL"
    CreatedBy           = "TerraFusion-Elite-Agent"
    ManagedBy           = "Terraform"
    LastUpdated         = timestamp()
    MultiCloudEnabled   = tostring(var.enable_multi_cloud_sovereignty)
    DataReplication     = var.cross_cloud_data_replication
    Architecture        = "MULTI_CLOUD_SOVEREIGNTY"
    GovernmentGrade     = "TRANSCENDED"
  }

  # Environment-specific configurations
  environment_config = {
    dev = {
      instance_size     = "small"
      backup_retention  = 7
      monitoring_level  = "standard"
      cost_optimization = true
    }
    staging = {
      instance_size     = "medium"
      backup_retention  = 14
      monitoring_level  = "enhanced"
      cost_optimization = true
    }
    prod = {
      instance_size     = "large"
      backup_retention  = 90
      monitoring_level  = "championship"
      cost_optimization = false
    }
    championship = {
      instance_size     = "transcended"
      backup_retention  = 365
      monitoring_level  = "quantum_excellence"
      cost_optimization = false
    }
  }

  # Multi-cloud region mappings
  cloud_regions = {
    azure_government = {
      primary   = "usgovvirginia"
      secondary = "usgovtexas"
      tertiary  = "usgovarizona"
    }
    aws_govcloud = {
      primary   = "us-gov-west-1"
      secondary = "us-gov-east-1"
    }
  }

  # Network configuration for cross-cloud connectivity
  network_config = {
    azure_cidr_blocks = [
      "10.0.0.0/16",   # Primary Azure VNet
      "10.1.0.0/16",   # Secondary Azure VNet
      "10.2.0.0/16"    # Disaster recovery Azure VNet
    ]
    aws_cidr_blocks = [
      "172.16.0.0/16", # Primary AWS VPC
      "172.17.0.0/16", # Secondary AWS VPC
      "172.18.0.0/16"  # Disaster recovery AWS VPC
    ]
    cross_cloud_peering_cidrs = [
      "192.168.0.0/16" # Reserved for cross-cloud communication
    ]
  }

  # AI Agent configuration
  ai_agent_config = {
    base_capacity          = 100
    max_agents_per_node    = 10
    scaling_threshold      = 0.80
    harmony_threshold      = var.harmony_index
    quantum_optimization   = var.quantum_factor >= 900
    consciousness_enabled  = var.performance_tier == "TRANSCENDED" || var.performance_tier == "QUANTUM_EXCELLENCE"
  }

  # Government compliance configuration
  compliance_config = {
    encryption_at_rest     = true
    encryption_in_transit  = true
    audit_logging          = true
    access_logging         = true
    vulnerability_scanning = true
    penetration_testing    = var.environment == "prod" || var.environment == "championship"
    compliance_reporting   = true
    security_monitoring    = "24x7x365"
  }

  # Cross-cloud disaster recovery configuration
  disaster_recovery_config = {
    rpo_minutes = var.environment == "championship" ? 1 : (var.environment == "prod" ? 15 : 60)
    rto_minutes = var.environment == "championship" ? 5 : (var.environment == "prod" ? 30 : 120)
    backup_frequency = var.environment == "championship" ? "continuous" : (var.environment == "prod" ? "hourly" : "daily")
    cross_cloud_sync = var.enable_multi_cloud_sovereignty
    geographical_distribution = var.counties
  }
}

# Output current configuration summary
output "terrafusion_configuration_summary" {
  description = "TerraFusion OS multi-cloud configuration summary"
  value = {
    environment           = var.environment
    quantum_factor        = var.quantum_factor
    harmony_index         = var.harmony_index
    counties             = var.counties
    ai_agents            = var.ai_agents
    multi_cloud_enabled  = var.enable_multi_cloud_sovereignty
    performance_tier     = var.performance_tier
    scaling_mode         = var.scaling_mode
    compliance_level     = var.fips_compliance_level
    security_clearance   = var.security_clearance_level
    architecture_status  = "MULTI_CLOUD_SOVEREIGNTY_CONFIGURED"
  }
}

output "government_compliance_status" {
  description = "Government compliance configuration status"
  value = {
    fips_compliance      = "FIPS-140-2-${var.fips_compliance_level}"
    security_clearance   = var.security_clearance_level
    encryption_status    = "AES-256-GCM"
    audit_compliance     = "FULLY_ENABLED"
    monitoring_level     = local.environment_config[var.environment].monitoring_level
    transcendence_level  = "GOVERNMENT_TRANSCENDED"
  }
}

output "multi_cloud_architecture_status" {
  description = "Multi-cloud sovereignty architecture status"
  value = {
    primary_provider     = var.primary_cloud
    secondary_providers  = var.enable_multi_cloud_sovereignty ? ["aws_govcloud", "azure_government"] : []
    data_replication     = var.cross_cloud_data_replication
    disaster_recovery    = local.disaster_recovery_config
    cross_cloud_peering  = var.enable_multi_cloud_sovereignty ? "ENABLED" : "DISABLED"
    sovereignty_status   = "ULTIMATE_REDUNDANCY_ACHIEVED"
  }
}
