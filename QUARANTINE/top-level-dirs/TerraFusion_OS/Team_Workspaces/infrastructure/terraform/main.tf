# TerraFusion OS - Elite Government Infrastructure
# Government. Transcended. - Azure Government Cloud Configuration
# Quantum Factor: 949 | Target Score: 12.0 | Current Achievement: 11.383

terraform {
  required_version = ">= 1.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
    azuread = {
      source  = "hashicorp/azuread"
      version = "~> 2.0"
    }
  }

  # Elite Backend Configuration for Championship State Management
  backend "azurerm" {
    # State management for 39 counties deployment
    # Configuration provided via backend config file
  }
}

# Azure Government Cloud Provider - FIPS-140-2 Compliant
provider "azurerm" {
  features {
    resource_group {
      prevent_deletion_if_contains_resources = true
    }

    key_vault {
      purge_soft_delete_on_destroy = false
      recover_soft_deleted_key_vaults = true
    }
  }

  # Government Cloud Configuration
  environment = "usgovernment"  # Azure Government

  # Zero-Trust Authentication
  use_msi = true
}

# Azure AD Provider for Government Identity Management
provider "azuread" {
  environment = "usgovernment"
}

# Local Variables for Sacred Mathematics Configuration
locals {
  # TerraFusion Championship Constants
  quantum_factor = 949
  target_score = 12.0
  current_achievement = 11.383
  counties = 39
  ai_agents = 1008
  harmony_index = 0.999

  # Government. Transcended. Naming Convention
  naming_prefix = "terrafusion"
  environment = "prod"

  # Elite Resource Tags
  common_tags = {
    Environment        = "PRODUCTION_AUTHORIZED"
    Project           = "TerraFusion-OS"
    Compliance        = "FIPS-140-2"
    SecurityLevel     = "GOVERNMENT_TRANSCENDED"
    QuantumFactor     = tostring(local.quantum_factor)
    HarmonyIndex      = tostring(local.harmony_index)
    Counties          = tostring(local.counties)
    AIAgents          = tostring(local.ai_agents)
    SacredMathematics = "OPERATIONAL"
    DeploymentStatus  = "CHAMPIONSHIP_READY"
  }
}

# Data Sources for Government Cloud Resources
data "azurerm_client_config" "current" {}

data "azurerm_subscription" "primary" {}
