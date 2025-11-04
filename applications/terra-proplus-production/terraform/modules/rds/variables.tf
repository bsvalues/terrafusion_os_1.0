variable "region" {
  description = "AWS region to deploy the RDS instance"
  type        = string
  default     = "us-west-2"
}

variable "prefix" {
  description = "Prefix to be added to all resource names"
  type        = string
  default     = "terrafusion"
}

variable "vpc_id" {
  description = "VPC ID where the RDS instance will be deployed"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs for the RDS instance"
  type        = list(string)
}

variable "eks_security_group_id" {
  description = "Security group ID for EKS to allow access to RDS"
  type        = string
}

variable "allocated_storage" {
  description = "Allocated storage in GB for the RDS instance"
  type        = number
  default     = 50
}

variable "max_allocated_storage" {
  description = "Maximum allocated storage in GB for auto-scaling"
  type        = number
  default     = 500
}

variable "instance_class" {
  description = "Instance class for the RDS instance"
  type        = string
  default     = "db.t3.medium"
}

variable "db_name" {
  description = "Name of the database to create"
  type        = string
  default     = "terrafusion"
}

variable "db_username" {
  description = "Username for the master DB user"
  type        = string
  default     = "terrafusion"
  sensitive   = true
}

variable "db_password" {
  description = "Password for the master DB user"
  type        = string
  sensitive   = true
}

variable "multi_az" {
  description = "Whether to enable multi-AZ deployment for high availability"
  type        = bool
  default     = true
}

variable "backup_retention_period" {
  description = "Number of days to retain backups"
  type        = number
  default     = 30
}

variable "skip_final_snapshot" {
  description = "Whether to skip final snapshot when deleting the DB instance"
  type        = bool
  default     = false
}

variable "deletion_protection" {
  description = "Whether to enable deletion protection"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Map of tags to apply to all resources"
  type        = map(string)
  default     = {
    Environment = "production"
    Project     = "TerraFusion"
    ManagedBy   = "terraform"
  }
}