variable "region" {
  description = "AWS region to deploy the VPC"
  type        = string
  default     = "us-west-2"
}

variable "prefix" {
  description = "Prefix to be added to all resource names"
  type        = string
  default     = "terrafusion"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones to deploy resources"
  type        = list(string)
  default     = ["us-west-2a", "us-west-2b", "us-west-2c"]
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