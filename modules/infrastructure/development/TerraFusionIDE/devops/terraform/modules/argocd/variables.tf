variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "cluster_name" {
  description = "EKS cluster name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID for security group configuration"
  type        = string
}

variable "domain" {
  description = "Domain name for ArgoCD ingress"
  type        = string
  default     = "terrafusion.local"
}

variable "git_repo_url" {
  description = "Git repository URL for ArgoCD applications"
  type        = string
  default     = "https://github.com/terrafusion/terrafusion-os"
}

variable "git_username" {
  description = "Git username for repository access"
  type        = string
  default     = "terrafusion-bot"
}

variable "git_password" {
  description = "Git password or token for repository access"
  type        = string
  sensitive   = true
  default     = ""
}
