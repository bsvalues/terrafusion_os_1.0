# TerraFusion Infrastructure Outputs
# Output values for Terraform configuration

# VPC Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = module.vpc.vpc_cidr_block
}

output "vpc_arn" {
  description = "ARN of the VPC"
  value       = module.vpc.vpc_arn
}

output "private_subnets" {
  description = "List of IDs of private subnets"
  value       = module.vpc.private_subnets
}

output "public_subnets" {
  description = "List of IDs of public subnets"
  value       = module.vpc.public_subnets
}

output "database_subnets" {
  description = "List of IDs of database subnets"
  value       = module.vpc.database_subnets
}

output "nat_gateway_ids" {
  description = "List of IDs of the NAT Gateways"
  value       = module.vpc.natgw_ids
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = module.vpc.igw_id
}

# EKS Cluster Outputs
output "eks_cluster_id" {
  description = "Name of the EKS cluster"
  value       = module.eks.cluster_name
}

output "eks_cluster_arn" {
  description = "ARN of the EKS cluster"
  value       = module.eks.cluster_arn
}

output "eks_cluster_endpoint" {
  description = "Endpoint for EKS control plane"
  value       = module.eks.cluster_endpoint
}

output "eks_cluster_version" {
  description = "The Kubernetes version for the EKS cluster"
  value       = module.eks.cluster_version
}

output "eks_cluster_security_group_id" {
  description = "Security group ID attached to the EKS cluster"
  value       = module.eks.cluster_security_group_id
}

output "eks_cluster_certificate_authority_data" {
  description = "Base64 encoded certificate data required to communicate with the cluster"
  value       = module.eks.cluster_certificate_authority_data
  sensitive   = true
}

output "eks_node_group_arns" {
  description = "ARNs of the EKS node groups"
  value       = { for k, v in module.eks.eks_managed_node_groups : k => v.node_group_arn }
}

output "eks_node_group_status" {
  description = "Status of the EKS node groups"
  value       = { for k, v in module.eks.eks_managed_node_groups : k => v.node_group_status }
}

output "eks_oidc_issuer_url" {
  description = "The URL on the EKS cluster for the OpenID Connect identity provider"
  value       = module.eks.cluster_oidc_issuer_url
}

output "eks_oidc_provider_arn" {
  description = "The ARN of the OIDC Provider"
  value       = module.eks.oidc_provider_arn
}

# RDS Database Outputs
output "rds_instance_id" {
  description = "RDS instance ID"
  value       = aws_db_instance.main.identifier
}

output "rds_instance_arn" {
  description = "RDS instance ARN"
  value       = aws_db_instance.main.arn
}

output "rds_instance_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
}

output "rds_instance_port" {
  description = "RDS instance port"
  value       = aws_db_instance.main.port
}

output "rds_instance_address" {
  description = "RDS instance hostname"
  value       = aws_db_instance.main.address
}

output "rds_instance_availability_zone" {
  description = "RDS instance availability zone"
  value       = aws_db_instance.main.availability_zone
}

output "rds_instance_engine" {
  description = "RDS instance engine"
  value       = aws_db_instance.main.engine
}

output "rds_instance_engine_version" {
  description = "RDS instance engine version"
  value       = aws_db_instance.main.engine_version_actual
}

output "rds_db_name" {
  description = "RDS database name"
  value       = aws_db_instance.main.db_name
}

output "rds_username" {
  description = "RDS database username"
  value       = aws_db_instance.main.username
  sensitive   = true
}

# Redis Cluster Outputs
output "redis_cluster_id" {
  description = "Redis cluster ID"
  value       = aws_elasticache_replication_group.main.replication_group_id
}

output "redis_cluster_arn" {
  description = "Redis cluster ARN"
  value       = aws_elasticache_replication_group.main.arn
}

output "redis_primary_endpoint" {
  description = "Redis primary endpoint"
  value       = aws_elasticache_replication_group.main.primary_endpoint_address
}

output "redis_reader_endpoint" {
  description = "Redis reader endpoint"
  value       = aws_elasticache_replication_group.main.reader_endpoint_address
}

output "redis_port" {
  description = "Redis port"
  value       = aws_elasticache_replication_group.main.port
}

# Load Balancer Outputs
output "alb_id" {
  description = "Application Load Balancer ID"
  value       = aws_lb.main.id
}

output "alb_arn" {
  description = "Application Load Balancer ARN"
  value       = aws_lb.main.arn
}

output "alb_dns_name" {
  description = "Application Load Balancer DNS name"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Application Load Balancer hosted zone ID"
  value       = aws_lb.main.zone_id
}

output "alb_security_group_id" {
  description = "Application Load Balancer security group ID"
  value       = aws_security_group.alb.id
}

# S3 Bucket Outputs
output "s3_backup_bucket_id" {
  description = "S3 backup bucket ID"
  value       = aws_s3_bucket.backups.id
}

output "s3_backup_bucket_arn" {
  description = "S3 backup bucket ARN"
  value       = aws_s3_bucket.backups.arn
}

output "s3_backup_bucket_domain_name" {
  description = "S3 backup bucket domain name"
  value       = aws_s3_bucket.backups.bucket_domain_name
}

output "s3_assets_bucket_id" {
  description = "S3 assets bucket ID"
  value       = aws_s3_bucket.assets.id
}

output "s3_assets_bucket_arn" {
  description = "S3 assets bucket ARN"
  value       = aws_s3_bucket.assets.arn
}

output "s3_assets_bucket_domain_name" {
  description = "S3 assets bucket domain name"
  value       = aws_s3_bucket.assets.bucket_domain_name
}

output "s3_alb_logs_bucket_id" {
  description = "S3 ALB logs bucket ID"
  value       = aws_s3_bucket.alb_logs.id
}

# KMS Key Outputs
output "kms_key_eks_id" {
  description = "EKS KMS Key ID"
  value       = aws_kms_key.eks.key_id
}

output "kms_key_eks_arn" {
  description = "EKS KMS Key ARN"
  value       = aws_kms_key.eks.arn
}

output "kms_key_rds_id" {
  description = "RDS KMS Key ID"
  value       = aws_kms_key.rds.key_id
}

output "kms_key_rds_arn" {
  description = "RDS KMS Key ARN"
  value       = aws_kms_key.rds.arn
}

output "kms_key_redis_id" {
  description = "Redis KMS Key ID"
  value       = aws_kms_key.redis.key_id
}

output "kms_key_redis_arn" {
  description = "Redis KMS Key ARN"
  value       = aws_kms_key.redis.arn
}

output "kms_key_s3_id" {
  description = "S3 KMS Key ID"
  value       = aws_kms_key.s3.key_id
}

output "kms_key_s3_arn" {
  description = "S3 KMS Key ARN"
  value       = aws_kms_key.s3.arn
}

output "kms_key_cloudwatch_id" {
  description = "CloudWatch KMS Key ID"
  value       = aws_kms_key.cloudwatch.key_id
}

output "kms_key_cloudwatch_arn" {
  description = "CloudWatch KMS Key ARN"
  value       = aws_kms_key.cloudwatch.arn
}

output "kms_key_ssm_id" {
  description = "SSM KMS Key ID"
  value       = aws_kms_key.ssm.key_id
}

output "kms_key_ssm_arn" {
  description = "SSM KMS Key ARN"
  value       = aws_kms_key.ssm.arn
}

# CloudWatch Outputs
output "cloudwatch_dashboard_url" {
  description = "CloudWatch Dashboard URL"
  value       = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}

output "cloudwatch_log_group_eks_name" {
  description = "EKS CloudWatch Log Group name"
  value       = aws_cloudwatch_log_group.eks_cluster.name
}

output "cloudwatch_log_group_redis_name" {
  description = "Redis CloudWatch Log Group name"
  value       = aws_cloudwatch_log_group.redis_slow.name
}

# SSM Parameter Store Outputs
output "ssm_parameter_db_password_name" {
  description = "SSM Parameter name for database password"
  value       = aws_ssm_parameter.db_password.name
}

output "ssm_parameter_redis_auth_name" {
  description = "SSM Parameter name for Redis auth token"
  value       = aws_ssm_parameter.redis_auth.name
}

output "ssm_parameter_db_connection_string_name" {
  description = "SSM Parameter name for database connection string"
  value       = aws_ssm_parameter.db_connection_string.name
}

# Security Group Outputs
output "security_group_rds_id" {
  description = "RDS security group ID"
  value       = aws_security_group.rds.id
}

output "security_group_redis_id" {
  description = "Redis security group ID"
  value       = aws_security_group.redis.id
}

output "security_group_eks_nodes_id" {
  description = "EKS nodes security group ID"
  value       = aws_security_group.eks_nodes.id
}

# Connection Information Outputs
output "database_connection_info" {
  description = "Database connection information"
  value = {
    endpoint = aws_db_instance.main.endpoint
    port     = aws_db_instance.main.port
    database = aws_db_instance.main.db_name
    username = aws_db_instance.main.username
  }
  sensitive = true
}

output "redis_connection_info" {
  description = "Redis connection information"
  value = {
    primary_endpoint = aws_elasticache_replication_group.main.primary_endpoint_address
    reader_endpoint  = aws_elasticache_replication_group.main.reader_endpoint_address
    port            = aws_elasticache_replication_group.main.port
  }
}

# Kubernetes Configuration Outputs
output "kubeconfig_command" {
  description = "Command to configure kubectl"
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${module.eks.cluster_name}"
}

output "kubectl_config" {
  description = "kubectl configuration for the EKS cluster"
  value = {
    cluster_name = module.eks.cluster_name
    endpoint     = module.eks.cluster_endpoint
    region       = var.aws_region
  }
}

# Environment Information Outputs
output "environment_info" {
  description = "Environment configuration information"
  value = {
    project_name = var.project_name
    environment  = var.environment
    aws_region   = var.aws_region
    vpc_cidr     = var.vpc_cidr
  }
}

output "resource_tags" {
  description = "Common resource tags applied to all resources"
  value = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
    Owner       = "DevOps"
  }
}

# Monitoring and Logging Outputs
output "monitoring_endpoints" {
  description = "Monitoring and logging endpoints"
  value = {
    cloudwatch_dashboard = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
    eks_logs            = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#logsV2:log-groups/log-group/${replace(aws_cloudwatch_log_group.eks_cluster.name, "/", "$252F")}"
    redis_logs          = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#logsV2:log-groups/log-group/${replace(aws_cloudwatch_log_group.redis_slow.name, "/", "$252F")}"
  }
}

# Cost and Billing Outputs
output "cost_allocation_tags" {
  description = "Tags for cost allocation and billing"
  value = {
    Project     = var.project_name
    Environment = var.environment
    CostCenter  = var.cost_center != "" ? var.cost_center : "default"
    Owner       = var.owner
  }
}

# Backup and Recovery Outputs
output "backup_resources" {
  description = "Backup and recovery resource information"
  value = {
    s3_backup_bucket     = aws_s3_bucket.backups.id
    rds_backup_retention = aws_db_instance.main.backup_retention_period
    redis_snapshots      = aws_elasticache_replication_group.main.snapshot_retention_limit
  }
}

# Network Security Outputs
output "network_security_info" {
  description = "Network security configuration"
  value = {
    vpc_id                    = module.vpc.vpc_id
    private_subnet_count      = length(module.vpc.private_subnets)
    public_subnet_count       = length(module.vpc.public_subnets)
    nat_gateway_count         = length(module.vpc.natgw_ids)
    flow_logs_enabled         = true
    security_groups_created   = 4
  }
}

# Application Endpoints Outputs (will be populated after application deployment)
output "application_endpoints" {
  description = "Application endpoint information"
  value = {
    load_balancer_dns = aws_lb.main.dns_name
    # These will be populated after Kubernetes services are deployed:
    # api_endpoint      = "https://${aws_lb.main.dns_name}/api"
    # frontend_endpoint = "https://${aws_lb.main.dns_name}"
    # health_check      = "https://${aws_lb.main.dns_name}/health"
  }
}

# Disaster Recovery Outputs
output "disaster_recovery_info" {
  description = "Disaster recovery configuration"
  value = {
    multi_az_database      = aws_db_instance.main.multi_az
    redis_num_replicas     = aws_elasticache_replication_group.main.num_cache_clusters - 1
    backup_bucket_region   = aws_s3_bucket.backups.region
    cross_region_replication = var.enable_cross_region_backup
  }
}

# Compliance and Security Status Outputs
output "security_compliance_status" {
  description = "Security and compliance configuration status"
  value = {
    encryption_at_rest_enabled    = var.enable_encryption_at_rest
    encryption_in_transit_enabled = var.enable_encryption_in_transit
    kms_keys_created             = 6
    vpc_flow_logs_enabled        = var.enable_vpc_flow_logs
    enhanced_monitoring_enabled   = var.enable_enhanced_monitoring
    deletion_protection_enabled   = var.enable_deletion_protection
  }
}

# Output for external integrations
output "terraform_state_info" {
  description = "Terraform state information for external integrations"
  value = {
    state_bucket = "terrafusion-terraform-state"
    state_key    = "infrastructure/terraform.tfstate"
    region       = var.aws_region
    lock_table   = "terrafusion-terraform-locks"
  }
}