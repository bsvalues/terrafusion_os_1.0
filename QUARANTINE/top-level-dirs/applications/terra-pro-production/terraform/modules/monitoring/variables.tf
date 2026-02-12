variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC where resources will be deployed"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs where monitoring services will be deployed"
  type        = list(string)
}

variable "ecs_cluster_name" {
  description = "Name of the ECS cluster to monitor"
  type        = string
  default     = null
}

variable "ecs_cluster_arn" {
  description = "ARN of the ECS cluster to monitor"
  type        = string
  default     = null
}

variable "ecs_service_name" {
  description = "Name of the ECS service to monitor"
  type        = string
  default     = null
}

variable "alarm_email" {
  description = "Email address for CloudWatch alarms notifications"
  type        = string
}