# TerraFusion OS - Benton County UAT Infrastructure
# Production-parity government-grade cloud infrastructure

terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
  
  backend "s3" {
    # Configure your state backend
    bucket = "terrafusion-terraform-state"
    key    = "bcw-uat/terraform.tfstate"
    region = "us-west-2"
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "TerraFusion-OS"
      Environment = "UAT"
      County      = "Benton-Washington"
      Owner       = "Government-Technology"
      Compliance  = "FISMA-NIST"
    }
  }
}

# =============================================================================
# NETWORKING FOUNDATION
# =============================================================================

module "networking" {
  source = "./modules/networking"
  
  name     = var.stack_name
  vpc_cidr = var.vpc_cidr
  
  # Government-grade security zones
  availability_zones = ["us-west-2a", "us-west-2b", "us-west-2c"]
  
  tags = {
    "terrafusion:security-zone" = "government"
    "terrafusion:compliance"    = "fisma"
  }
}

# =============================================================================
# DATABASE (PostGIS for Benton County Parcels)
# =============================================================================

module "postgres" {
  source = "./modules/aws-postgres"
  
  name                   = var.stack_name
  vpc_id                 = module.networking.vpc_id
  subnets                = module.networking.private_subnet_ids
  instance_class         = var.db_instance_class
  allocated_storage_gb   = 500  # 89,247 parcels + historical data
  engine_version         = "15.6"
  
  # Government-grade availability
  multi_az               = true
  deletion_protection    = true
  backup_retention_days  = 30
  performance_insights   = true
  
  # Security
  storage_encrypted      = true
  kms_key_id            = aws_kms_key.terrafusion_key.arn
  
  tags = {
    "terrafusion:data-classification" = "sensitive"
    "terrafusion:parcel-count"       = "89247"
  }
}

# =============================================================================
# OBJECT STORAGE (Documents, Maps, AI Models)
# =============================================================================

module "object_store" {
  source = "./modules/object-store"
  
  name        = var.stack_name
  object_lock = true
  
  # Government compliance
  versioning_enabled = true
  lifecycle_rules    = true
  
  tags = {
    "terrafusion:purpose" = "government-documents"
    "terrafusion:retention" = "7-years"
  }
}

# =============================================================================
# RUST PERFORMANCE ENGINE INFRASTRUCTURE
# =============================================================================

module "rust_performance_engine" {
  source = "./modules/rust-performance"
  
  name           = var.stack_name
  vpc_id         = module.networking.vpc_id
  subnets        = module.networking.private_subnet_ids
  
  # Elite performance configuration
  cpu_units      = 2048  # 2 vCPU for sub-10ms responses
  memory_mb      = 4096  # 4GB for 50,000 agents
  desired_count  = 3     # High availability
  
  # gRPC TLS configuration
  tls_enabled    = true
  cert_arn       = aws_acm_certificate.terrafusion_cert.arn
  
  tags = {
    "terrafusion:engine-type"   = "elite-rust"
    "terrafusion:agent-count"   = "50000"
    "terrafusion:performance"   = "sub-10ms"
  }
}

# =============================================================================
# AI COORDINATION INFRASTRUCTURE
# =============================================================================

module "ai_coordination" {
  source = "./modules/ai-coordination"
  
  name           = var.stack_name
  vpc_id         = module.networking.vpc_id
  subnets        = module.networking.private_subnet_ids
  
  # AI agent configuration
  supreme_commander_agents = 1
  field_general_agents     = 8
  operational_agents       = 999  # Total 1,008 agents
  
  # Redis for agent coordination
  redis_node_type    = "cache.r7g.large"
  redis_num_replicas = 2
  
  # NATS for message coordination
  nats_enabled = true
  
  tags = {
    "terrafusion:ai-architecture" = "supreme-commander"
    "terrafusion:agent-total"     = "1008"
  }
}

# =============================================================================
# KUBERNETES CLUSTER (EKS)
# =============================================================================

module "kubernetes" {
  source = "./modules/eks-cluster"
  
  cluster_name    = "${var.stack_name}-cluster"
  cluster_version = "1.28"
  
  vpc_id          = module.networking.vpc_id
  subnet_ids      = module.networking.private_subnet_ids
  
  # Node groups for different workloads
  node_groups = {
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
      instance_types = ["r5.2xlarge"]  # Memory-optimized for AI
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
  
  tags = {
    "terrafusion:cluster-purpose" = "government-uat"
  }
}

# =============================================================================
# SECURITY & COMPLIANCE
# =============================================================================

# KMS Key for encryption
resource "aws_kms_key" "terrafusion_key" {
  description             = "TerraFusion OS Benton County UAT encryption key"
  deletion_window_in_days = 30
  
  tags = {
    Name = "${var.stack_name}-kms-key"
    "terrafusion:purpose" = "government-encryption"
  }
}

resource "aws_kms_alias" "terrafusion_key_alias" {
  name          = "alias/${var.stack_name}-terrafusion"
  target_key_id = aws_kms_key.terrafusion_key.key_id
}

# TLS Certificate for government domains
resource "aws_acm_certificate" "terrafusion_cert" {
  domain_name       = "*.benton.wa.gov"
  validation_method = "DNS"
  
  subject_alternative_names = [
    "terrafusion-uat.benton.wa.gov",
    "api-uat.benton.wa.gov",
    "marketplace-uat.benton.wa.gov"
  ]
  
  lifecycle {
    create_before_destroy = true
  }
  
  tags = {
    Name = "${var.stack_name}-tls-cert"
    "terrafusion:purpose" = "government-tls"
  }
}

# =============================================================================
# OUTPUTS
# =============================================================================

output "vpc_id" {
  description = "VPC ID for TerraFusion OS UAT"
  value       = module.networking.vpc_id
}

output "database_endpoint" {
  description = "PostGIS database endpoint"
  value       = module.postgres.endpoint
  sensitive   = true
}

output "database_port" {
  description = "Database port"
  value       = module.postgres.port
}

output "bucket_name" {
  description = "S3 bucket for government documents"
  value       = module.object_store.bucket
}

output "rust_engine_endpoint" {
  description = "Rust Performance Engine gRPC endpoint"
  value       = module.rust_performance_engine.grpc_endpoint
}

output "kubernetes_cluster_name" {
  description = "EKS cluster name"
  value       = module.kubernetes.cluster_name
}

output "kubernetes_cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = module.kubernetes.cluster_endpoint
}

output "ai_coordination_redis_endpoint" {
  description = "Redis endpoint for AI coordination"
  value       = module.ai_coordination.redis_endpoint
  sensitive   = true
}

output "kms_key_arn" {
  description = "KMS key ARN for encryption"
  value       = aws_kms_key.terrafusion_key.arn
}

output "tls_certificate_arn" {
  description = "ACM certificate ARN for TLS"
  value       = aws_acm_certificate.terrafusion_cert.arn
}