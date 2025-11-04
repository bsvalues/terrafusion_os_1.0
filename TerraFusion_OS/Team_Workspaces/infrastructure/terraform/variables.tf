# TerraFusion OS - Elite Variable Definitions
# Government. Transcended. - Championship Configuration Parameters

variable "primary_location" {
  description = "Primary Azure Government region for TerraFusion OS deployment"
  type        = string
  default     = "usgovvirginia"  # Azure Government Virginia

  validation {
    condition = contains([
      "usgovvirginia",
      "usgovtexas",
      "usgoviowa",
      "usgovarizona"
    ], var.primary_location)
    error_message = "Primary location must be a valid Azure Government region for FIPS-140-2 compliance."
  }
}

variable "secondary_location" {
  description = "Secondary Azure Government region for disaster recovery"
  type        = string
  default     = "usgovtexas"
}

variable "environment" {
  description = "Deployment environment for TerraFusion OS"
  type        = string
  default     = "prod"

  validation {
    condition = contains([
      "dev",
      "staging",
      "prod",
      "championship"
    ], var.environment)
    error_message = "Environment must be one of: dev, staging, prod, championship."
  }
}

variable "quantum_factor" {
  description = "TerraFusion quantum performance factor"
  type        = number
  default     = 949

  validation {
    condition     = var.quantum_factor >= 900 && var.quantum_factor <= 1000
    error_message = "Quantum factor must be between 900 and 1000 for championship performance."
  }
}

variable "counties" {
  description = "Number of counties for TerraFusion OS deployment"
  type        = number
  default     = 39

  validation {
    condition     = var.counties > 0 && var.counties <= 50
    error_message = "Counties must be between 1 and 50 for government deployment scope."
  }
}

variable "ai_agents" {
  description = "Number of AI agents for TerraFusion OS ecosystem"
  type        = number
  default     = 1008

  validation {
    condition     = var.ai_agents > 0 && var.ai_agents <= 2000
    error_message = "AI agents must be between 1 and 2000 for optimal harmony index."
  }
}

variable "harmony_index" {
  description = "TerraFusion harmony index for sacred mathematics optimization"
  type        = number
  default     = 0.999

  validation {
    condition     = var.harmony_index >= 0.0 && var.harmony_index <= 1.0
    error_message = "Harmony index must be between 0.0 and 1.0."
  }
}

variable "compliance_level" {
  description = "Government compliance standard for TerraFusion OS"
  type        = string
  default     = "FIPS-140-2"

  validation {
    condition = contains([
      "FIPS-140-2",
      "NIST-800-53",
      "SOC2-TYPE-II",
      "GOVERNMENT_TRANSCENDED"
    ], var.compliance_level)
    error_message = "Compliance level must be a recognized government standard."
  }
}

variable "security_level" {
  description = "Security classification for TerraFusion OS deployment"
  type        = string
  default     = "GOVERNMENT_TRANSCENDED"

  validation {
    condition = contains([
      "STANDARD",
      "ENHANCED",
      "GOVERNMENT_GRADE",
      "GOVERNMENT_TRANSCENDED"
    ], var.security_level)
    error_message = "Security level must be appropriate for government deployment."
  }
}

variable "enable_monitoring" {
  description = "Enable championship performance monitoring and sacred mathematics tracking"
  type        = bool
  default     = true
}

variable "enable_multi_cloud" {
  description = "Enable multi-cloud sovereignty architecture"
  type        = bool
  default     = false  # Phase 3 feature
}

variable "deployment_status" {
  description = "Current deployment authorization status"
  type        = string
  default     = "PRODUCTION_AUTHORIZED"

  validation {
    condition = contains([
      "DEVELOPMENT",
      "STAGING",
      "PRODUCTION_AUTHORIZED",
      "CHAMPIONSHIP_READY"
    ], var.deployment_status)
    error_message = "Deployment status must indicate proper authorization level."
  }
}
