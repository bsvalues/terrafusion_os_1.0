# TerraFusion OS 1.0 - Complete AWS Infrastructure
# Multi-Region EKS Deployment with Government-Grade Security
# Author: TerraFusion DevOps Team
# Version: 1.0.0

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.11"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }

  # Remote state configuration for team collaboration
  backend "s3" {
    bucket         = "terrafusion-terraform-state"
    key            = "infrastructure/terraform.tfstate"
    region         = "us-west-2"
    encrypt        = true
    dynamodb_table = "terrafusion-terraform-locks"
  }
}

# Primary region configuration
provider "aws" {
  region = var.primary_region
  alias  = "primary"
  
  default_tags {
    tags = {
      Project     = "TerraFusion-OS"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Owner       = "TerraFusion-DevOps"
      Compliance  = "FISMA"
    }
  }
}

# Secondary region for disaster recovery
provider "aws" {
  region = var.secondary_region
  alias  = "secondary"
  
  default_tags {
    tags = {
      Project     = "TerraFusion-OS"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Owner       = "TerraFusion-DevOps"
      Compliance  = "FISMA"
    }
  }
}

# Data sources
data "aws_availability_zones" "primary" {
  provider = aws.primary
  state    = "available"
}

data "aws_availability_zones" "secondary" {
  provider = aws.secondary
  state    = "available"
}

data "aws_caller_identity" "current" {}

# Random password for RDS
resource "random_password" "rds_password" {
  length  = 32
  special = true
}

# Local values for resource naming and configuration
locals {
  cluster_name_primary   = "terrafusion-${var.environment}-primary"
  cluster_name_secondary = "terrafusion-${var.environment}-secondary"
  
  common_tags = {
    Project     = "TerraFusion-OS"
    Environment = var.environment
    ManagedBy   = "Terraform"
    Owner       = "TerraFusion-DevOps"
    Compliance  = "FISMA"
  }
}

# Primary Region Infrastructure
module "vpc_primary" {
  source = "./modules/vpc"
  providers = {
    aws = aws.primary
  }
  
  name_prefix = "terrafusion-${var.environment}-primary"
  cidr_block  = "10.0.0.0/16"
  
  availability_zones = slice(data.aws_availability_zones.primary.names, 0, 3)
  
  # Public subnets for load balancers
  public_subnet_cidrs = [
    "10.0.1.0/24",
    "10.0.2.0/24",
    "10.0.3.0/24"
  ]
  
  # Private subnets for EKS worker nodes
  private_subnet_cidrs = [
    "10.0.10.0/24",
    "10.0.11.0/24",
    "10.0.12.0/24"
  ]
  
  # Database subnets
  database_subnet_cidrs = [
    "10.0.20.0/24",
    "10.0.21.0/24",
    "10.0.22.0/24"
  ]
  
  enable_nat_gateway   = true
  enable_vpn_gateway   = true
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = local.common_tags
}

# Secondary Region Infrastructure (DR)
module "vpc_secondary" {
  source = "./modules/vpc"
  providers = {
    aws = aws.secondary
  }
  
  name_prefix = "terrafusion-${var.environment}-secondary"
  cidr_block  = "10.1.0.0/16"
  
  availability_zones = slice(data.aws_availability_zones.secondary.names, 0, 3)
  
  public_subnet_cidrs = [
    "10.1.1.0/24",
    "10.1.2.0/24",
    "10.1.3.0/24"
  ]
  
  private_subnet_cidrs = [
    "10.1.10.0/24",
    "10.1.11.0/24",
    "10.1.12.0/24"
  ]
  
  database_subnet_cidrs = [
    "10.1.20.0/24",
    "10.1.21.0/24",
    "10.1.22.0/24"
  ]
  
  enable_nat_gateway   = true
  enable_vpn_gateway   = false
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = local.common_tags
}

# EKS Cluster - Primary Region
module "eks_primary" {
  source = "./modules/eks"
  providers = {
    aws = aws.primary
  }
  
  cluster_name    = local.cluster_name_primary
  cluster_version = var.kubernetes_version
  
  vpc_id         = module.vpc_primary.vpc_id
  subnet_ids     = module.vpc_primary.private_subnet_ids
  
  # Government-grade security configuration
  endpoint_private_access = true
  endpoint_public_access  = true
  endpoint_public_access_cidrs = var.allowed_cidr_blocks
  
  enable_irsa = true
  
  # Managed node groups
  node_groups = {
    government_workloads = {
      desired_capacity = 3
      max_capacity     = 10
      min_capacity     = 2
      
      instance_types = ["m5.xlarge", "m5.2xlarge"]
      capacity_type  = "ON_DEMAND"
      
      k8s_labels = {
        Environment = var.environment
        NodeGroup   = "government-workloads"
      }
      
      k8s_taints = []
    }
    
    ai_workloads = {
      desired_capacity = 2
      max_capacity     = 20
      min_capacity     = 1
      
      instance_types = ["c5.4xlarge", "c5.9xlarge"]
      capacity_type  = "SPOT"
      
      k8s_labels = {
        Environment = var.environment
        NodeGroup   = "ai-workloads"
      }
      
      k8s_taints = [{
        key    = "ai-workload"
        value  = "true"
        effect = "NO_SCHEDULE"
      }]
    }
    
    commercial_workloads = {
      desired_capacity = 2
      max_capacity     = 15
      min_capacity     = 1
      
      instance_types = ["m5.large", "m5.xlarge"]
      capacity_type  = "ON_DEMAND"
      
      k8s_labels = {
        Environment = var.environment
        NodeGroup   = "commercial-workloads"
      }
      
      k8s_taints = []
    }
  }
  
  tags = local.common_tags
}

# EKS Cluster - Secondary Region (Disaster Recovery)
module "eks_secondary" {
  source = "./modules/eks"
  providers = {
    aws = aws.secondary
  }
  
  cluster_name    = local.cluster_name_secondary
  cluster_version = var.kubernetes_version
  
  vpc_id         = module.vpc_secondary.vpc_id
  subnet_ids     = module.vpc_secondary.private_subnet_ids
  
  endpoint_private_access = true
  endpoint_public_access  = true
  endpoint_public_access_cidrs = var.allowed_cidr_blocks
  
  enable_irsa = true
  
  # Minimal DR configuration
  node_groups = {
    dr_workloads = {
      desired_capacity = 1
      max_capacity     = 5
      min_capacity     = 1
      
      instance_types = ["m5.large"]
      capacity_type  = "ON_DEMAND"
      
      k8s_labels = {
        Environment = var.environment
        NodeGroup   = "dr-workloads"
      }
      
      k8s_taints = []
    }
  }
  
  tags = local.common_tags
}

# RDS PostgreSQL - Primary Database
module "rds_primary" {
  source = "./modules/rds"
  providers = {
    aws = aws.primary
  }
  
  identifier = "terrafusion-${var.environment}-primary"
  
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = var.rds_instance_class
  
  allocated_storage     = 100
  max_allocated_storage = 1000
  storage_encrypted     = true
  
  db_name  = "terrafusion"
  username = "terrafusion_admin"
  password = random_password.rds_password.result
  
  vpc_security_group_ids = [module.vpc_primary.database_security_group_id]
  db_subnet_group_name   = module.vpc_primary.database_subnet_group_name
  
  backup_retention_period = 30
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  # Enable automated backups and monitoring
  monitoring_interval             = 60
  monitoring_role_arn            = module.rds_primary.monitoring_role_arn
  performance_insights_enabled   = true
  enabled_cloudwatch_logs_exports = ["postgresql"]
  
  # Cross-region replica for disaster recovery
  create_cross_region_replica = true
  replica_region             = var.secondary_region
  
  tags = local.common_tags
}

# Redis ElastiCache for session management and caching
module "elasticache" {
  source = "./modules/elasticache"
  providers = {
    aws = aws.primary
  }
  
  name = "terrafusion-${var.environment}"
  
  engine               = "redis"
  node_type            = "cache.r6g.large"
  num_cache_clusters   = 3
  parameter_group_name = "default.redis7"
  port                 = 6379
  
  subnet_group_name  = module.vpc_primary.cache_subnet_group_name
  security_group_ids = [module.vpc_primary.cache_security_group_id]
  
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  
  tags = local.common_tags
}

# S3 Buckets for application data and artifacts
module "s3_buckets" {
  source = "./modules/s3"
  providers = {
    aws = aws.primary
  }
  
  buckets = {
    terrafusion-app-data = {
      versioning_enabled = true
      lifecycle_rules = [{
        id      = "transition_to_ia"
        status  = "Enabled"
        transition = {
          days          = 30
          storage_class = "STANDARD_IA"
        }
      }]
    }
    
    terrafusion-backups = {
      versioning_enabled = true
      lifecycle_rules = [{
        id      = "transition_and_expire"
        status  = "Enabled"
        transition = {
          days          = 90
          storage_class = "GLACIER"
        }
        expiration = {
          days = 2555  # 7 years for compliance
        }
      }]
    }
    
    terrafusion-logs = {
      versioning_enabled = false
      lifecycle_rules = [{
        id      = "expire_logs"
        status  = "Enabled"
        expiration = {
          days = 365
        }
      }]
    }
    
    terrafusion-artifacts = {
      versioning_enabled = true
      lifecycle_rules = []
    }
  }
  
  environment = var.environment
  tags        = local.common_tags
}

# AWS Secrets Manager for sensitive configuration
resource "aws_secretsmanager_secret" "terrafusion_secrets" {
  provider = aws.primary
  
  name        = "terrafusion/${var.environment}/application"
  description = "TerraFusion application secrets"
  
  replica {
    region = var.secondary_region
  }
  
  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "terrafusion_secrets" {
  provider = aws.primary
  
  secret_id = aws_secretsmanager_secret.terrafusion_secrets.id
  secret_string = jsonencode({
    database_password = random_password.rds_password.result
    jwt_secret        = random_password.jwt_secret.result
    encryption_key    = random_password.encryption_key.result
  })
}

resource "random_password" "jwt_secret" {
  length  = 64
  special = true
}

resource "random_password" "encryption_key" {
  length  = 32
  special = false
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "terrafusion_applications" {
  provider = aws.primary
  
  name              = "/terrafusion/${var.environment}/applications"
  retention_in_days = 30
  
  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "terrafusion_infrastructure" {
  provider = aws.primary
  
  name              = "/terrafusion/${var.environment}/infrastructure"
  retention_in_days = 90
  
  tags = local.common_tags
}

# WAF for API protection
resource "aws_wafv2_web_acl" "terrafusion_api" {
  provider = aws.primary
  
  name  = "terrafusion-${var.environment}-api"
  scope = "REGIONAL"
  
  default_action {
    allow {}
  }
  
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 1
    
    override_action {
      none {}
    }
    
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                 = "CommonRuleSetMetric"
      sampled_requests_enabled    = true
    }
  }
  
  rule {
    name     = "RateLimitRule"
    priority = 2
    
    action {
      block {}
    }
    
    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                 = "RateLimitRule"
      sampled_requests_enabled    = true
    }
  }
  
  tags = local.common_tags
}

# Outputs for other modules and applications
output "eks_cluster_endpoint_primary" {
  description = "EKS cluster endpoint"
  value       = module.eks_primary.cluster_endpoint
}

output "eks_cluster_security_group_id_primary" {
  description = "Security group ids attached to the cluster control plane"
  value       = module.eks_primary.cluster_security_group_id
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = module.rds_primary.db_instance_endpoint
  sensitive   = true
}

output "redis_endpoint" {
  description = "Redis cluster endpoint"
  value       = module.elasticache.redis_endpoint
}

output "s3_bucket_names" {
  description = "S3 bucket names"
  value       = module.s3_buckets.bucket_names
}

output "secrets_manager_secret_arn" {
  description = "Secrets Manager secret ARN"
  value       = aws_secretsmanager_secret.terrafusion_secrets.arn
}