# TerraFusion OS - Multi-Cloud Sovereignty Architecture
# Government. Transcended. - AWS GovCloud Integration Excellence
# Multi-Cloud Strategy: Azure Government + AWS GovCloud

terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

# AWS GovCloud Provider Configuration
provider "aws" {
  alias  = "govcloud"
  region = var.aws_govcloud_region

  # AWS GovCloud Configuration
  default_tags {
    tags = {
      Environment        = "PRODUCTION_AUTHORIZED"
      Project           = "TerraFusion-OS"
      Compliance        = "FIPS-140-2"
      SecurityLevel     = "GOVERNMENT_TRANSCENDED"
      QuantumFactor     = tostring(var.quantum_factor)
      HarmonyIndex      = tostring(var.harmony_index)
      Counties          = tostring(var.counties)
      AIAgents          = tostring(var.ai_agents)
      SacredMathematics = "OPERATIONAL"
      CloudProvider     = "AWS_GOVCLOUD"
      MultiCloudTier    = "SOVEREIGNTY_REDUNDANCY"
    }
  }
}

# Primary Azure Government Provider (existing)
provider "azurerm" {
  alias = "primary"
  features {
    resource_group {
      prevent_deletion_if_contains_resources = true
    }
    key_vault {
      purge_soft_delete_on_destroy = false
    }
  }
  environment = "usgovernment"
  use_msi = true
}

# AWS GovCloud Variables
variable "aws_govcloud_region" {
  description = "AWS GovCloud region for multi-cloud sovereignty"
  type        = string
  default     = "us-gov-west-1"

  validation {
    condition = contains([
      "us-gov-west-1",
      "us-gov-east-1"
    ], var.aws_govcloud_region)
    error_message = "AWS region must be a valid GovCloud region."
  }
}

variable "enable_cross_cloud_replication" {
  description = "Enable cross-cloud data replication for 39-county redundancy"
  type        = bool
  default     = true
}

variable "disaster_recovery_tier" {
  description = "Disaster recovery tier for multi-cloud architecture"
  type        = string
  default     = "CHAMPIONSHIP_EXCELLENCE"

  validation {
    condition = contains([
      "STANDARD",
      "ENHANCED",
      "CHAMPIONSHIP_EXCELLENCE",
      "ULTIMATE_TRANSCENDENCE"
    ], var.disaster_recovery_tier)
    error_message = "Disaster recovery tier must be appropriate for government operations."
  }
}

# Data source for AWS availability zones
data "aws_availability_zones" "govcloud_available" {
  provider = aws.govcloud
  state    = "available"
}

# Elite AWS VPC for Cross-Cloud Integration
resource "aws_vpc" "terrafusion_govcloud_vpc" {
  provider = aws.govcloud

  cidr_block           = "172.16.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name    = "terrafusion-${var.environment}-govcloud-vpc"
    Purpose = "MULTI_CLOUD_SOVEREIGNTY"
    Tier    = "CROSS_CLOUD_NETWORKING"
  })
}

# Elite AWS Private Subnets for Government Operations
resource "aws_subnet" "govcloud_private_subnets" {
  provider = aws.govcloud
  count    = 3

  vpc_id            = aws_vpc.terrafusion_govcloud_vpc.id
  cidr_block        = "172.16.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.govcloud_available.names[count.index]

  tags = merge(local.common_tags, {
    Name    = "terrafusion-${var.environment}-govcloud-private-subnet-${count.index + 1}"
    Purpose = "GOVERNMENT_PRIVATE_OPERATIONS"
    Tier    = "SECURE_NETWORKING"
  })
}

# Elite AWS Security Groups - Zero-Trust Architecture
resource "aws_security_group" "govcloud_zero_trust_sg" {
  provider = aws.govcloud

  name_prefix = "terrafusion-${var.environment}-zero-trust-"
  vpc_id      = aws_vpc.terrafusion_govcloud_vpc.id
  description = "TerraFusion Zero-Trust Security Group for AWS GovCloud"

  # Egress rules - explicit allow for required traffic only
  egress {
    description = "HTTPS to Azure Government"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # Will be restricted to Azure Government IP ranges
  }

  # No ingress rules - zero-trust default deny

  tags = merge(local.common_tags, {
    Name    = "terrafusion-${var.environment}-zero-trust-sg"
    Purpose = "ZERO_TRUST_CROSS_CLOUD_SECURITY"
    Tier    = "SECURITY_EXCELLENCE"
  })
}

# Elite S3 Bucket for Cross-Cloud Data Replication
resource "aws_s3_bucket" "championship_cross_cloud_storage" {
  provider = aws.govcloud

  bucket        = "terrafusion-${var.environment}-cross-cloud-${random_id.bucket_suffix.hex}"
  force_destroy = false  # Prevent accidental deletion

  tags = merge(local.common_tags, {
    Name    = "terrafusion-${var.environment}-cross-cloud-storage"
    Purpose = "CHAMPIONSHIP_CROSS_CLOUD_DATA"
    Tier    = "DATA_SOVEREIGNTY"
  })
}

resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# S3 Bucket Encryption - FIPS-140-2 Compliance
resource "aws_s3_bucket_server_side_encryption_configuration" "cross_cloud_encryption" {
  provider = aws.govcloud

  bucket = aws_s3_bucket.championship_cross_cloud_storage.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"  # FIPS-approved encryption
    }
    bucket_key_enabled = true
  }
}

# S3 Bucket Versioning for Data Protection
resource "aws_s3_bucket_versioning" "cross_cloud_versioning" {
  provider = aws.govcloud

  bucket = aws_s3_bucket.championship_cross_cloud_storage.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Elite KMS Key for Cross-Cloud Encryption
resource "aws_kms_key" "cross_cloud_encryption_key" {
  provider = aws.govcloud

  description             = "TerraFusion Cross-Cloud Encryption Key"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name    = "terrafusion-${var.environment}-cross-cloud-key"
    Purpose = "CROSS_CLOUD_ENCRYPTION"
    Tier    = "CRYPTOGRAPHIC_EXCELLENCE"
  })
}

resource "aws_kms_alias" "cross_cloud_key_alias" {
  provider = aws.govcloud

  name          = "alias/terrafusion-${var.environment}-cross-cloud"
  target_key_id = aws_kms_key.cross_cloud_encryption_key.key_id
}

# Elite EKS Cluster for AI Agent Redundancy
resource "aws_eks_cluster" "ai_agents_govcloud_cluster" {
  provider = aws.govcloud
  count    = var.enable_cross_cloud_replication ? 1 : 0

  name     = "terrafusion-${var.environment}-ai-agents-govcloud"
  role_arn = aws_iam_role.eks_cluster_role[0].arn
  version  = "1.28"

  vpc_config {
    subnet_ids              = aws_subnet.govcloud_private_subnets[*].id
    endpoint_private_access = true
    endpoint_public_access  = false  # Private for government security
    security_group_ids      = [aws_security_group.govcloud_zero_trust_sg.id]
  }

  encryption_config {
    provider {
      key_arn = aws_kms_key.cross_cloud_encryption_key.arn
    }
    resources = ["secrets"]
  }

  enabled_cluster_log_types = ["api", "audit", "authenticator", "controllerManager", "scheduler"]

  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster_policy,
    aws_iam_role_policy_attachment.eks_vpc_resource_controller,
  ]

  tags = merge(local.common_tags, {
    Name    = "terrafusion-${var.environment}-ai-agents-govcloud"
    Purpose = "AI_AGENTS_CROSS_CLOUD_REDUNDANCY"
    Tier    = "KUBERNETES_EXCELLENCE"
  })
}

# IAM Role for EKS Cluster
resource "aws_iam_role" "eks_cluster_role" {
  provider = aws.govcloud
  count    = var.enable_cross_cloud_replication ? 1 : 0

  name = "terrafusion-${var.environment}-eks-cluster-role"

  assume_role_policy = jsonencode({
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "eks.amazonaws.com"
      }
    }]
    Version = "2012-10-17"
  })

  tags = merge(local.common_tags, {
    Name    = "terrafusion-${var.environment}-eks-cluster-role"
    Purpose = "EKS_CLUSTER_AUTHENTICATION"
    Tier    = "IDENTITY_MANAGEMENT"
  })
}

resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {
  provider = aws.govcloud
  count    = var.enable_cross_cloud_replication ? 1 : 0

  policy_arn = "arn:aws-us-gov:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.eks_cluster_role[0].name
}

resource "aws_iam_role_policy_attachment" "eks_vpc_resource_controller" {
  provider = aws.govcloud
  count    = var.enable_cross_cloud_replication ? 1 : 0

  policy_arn = "arn:aws-us-gov:iam::aws:policy/AmazonEKSVPCResourceController"
  role       = aws_iam_role.eks_cluster_role[0].name
}

# Multi-Cloud Outputs
output "aws_govcloud_vpc_id" {
  description = "AWS GovCloud VPC ID for cross-cloud integration"
  value       = aws_vpc.terrafusion_govcloud_vpc.id
  sensitive   = false
}

output "aws_govcloud_private_subnet_ids" {
  description = "AWS GovCloud private subnet IDs"
  value       = aws_subnet.govcloud_private_subnets[*].id
  sensitive   = false
}

output "cross_cloud_storage_bucket" {
  description = "S3 bucket for cross-cloud data replication"
  value       = aws_s3_bucket.championship_cross_cloud_storage.id
  sensitive   = false
}

output "cross_cloud_encryption_key_arn" {
  description = "KMS key ARN for cross-cloud encryption"
  value       = aws_kms_key.cross_cloud_encryption_key.arn
  sensitive   = true
}

output "multi_cloud_sovereignty_status" {
  description = "Multi-cloud sovereignty architecture status"
  value       = "CROSS_CLOUD_SOVEREIGNTY_ACTIVATED"
  sensitive   = false
}
