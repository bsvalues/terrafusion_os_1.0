# VPC Outputs
output "vpc_id" {
  description = "The ID of the VPC"
  value       = module.vpc.vpc_id
}

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  description = "List of private subnet IDs"
  value       = module.vpc.private_subnet_ids
}

# EKS Outputs
output "eks_cluster_id" {
  description = "The ID of the EKS cluster"
  value       = module.eks.cluster_id
}

output "eks_cluster_endpoint" {
  description = "The endpoint for the EKS cluster API server"
  value       = module.eks.cluster_endpoint
}

output "eks_cluster_security_group_id" {
  description = "Security group ID attached to the EKS cluster"
  value       = module.eks.cluster_security_group_id
}

output "kubectl_config_command" {
  description = "Command to update kubectl config for this cluster"
  value       = module.eks.kubectl_config_command
}

# RDS Outputs
output "db_instance_endpoint" {
  description = "The connection endpoint of the RDS instance"
  value       = module.rds.db_instance_endpoint
}

output "db_instance_name" {
  description = "The database name"
  value       = module.rds.db_instance_name
}

output "db_credentials_secret_arn" {
  description = "The ARN of the Secrets Manager secret storing database credentials"
  value       = module.rds.db_credentials_secret_arn
}

# S3 Outputs
output "attachments_bucket_id" {
  description = "The name of the attachments S3 bucket"
  value       = module.s3_attachments.bucket_id
}

output "attachments_bucket_domain_name" {
  description = "The domain name of the attachments S3 bucket"
  value       = module.s3_attachments.bucket_domain_name
}

output "backups_bucket_id" {
  description = "The name of the backups S3 bucket"
  value       = module.s3_backups.bucket_id
}

output "s3_credentials_secret_arn" {
  description = "The ARN of the Secrets Manager secret storing S3 credentials"
  value       = module.s3_attachments.s3_credentials_secret_arn
}