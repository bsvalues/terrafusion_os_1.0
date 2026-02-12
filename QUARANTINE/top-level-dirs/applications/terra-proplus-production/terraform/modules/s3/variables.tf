variable "region" {
  description = "AWS region to deploy the S3 bucket"
  type        = string
  default     = "us-west-2"
}

variable "prefix" {
  description = "Prefix to be added to all resource names"
  type        = string
  default     = "terrafusion"
}

variable "bucket_name" {
  description = "The name of the S3 bucket (will be prefixed with the prefix)"
  type        = string
}

variable "enable_versioning" {
  description = "Whether to enable versioning for the S3 bucket"
  type        = bool
  default     = true
}

variable "lifecycle_expiration_days" {
  description = "Number of days after which objects should be deleted (0 to disable)"
  type        = number
  default     = 0
}

variable "noncurrent_version_expiration_days" {
  description = "Number of days after which noncurrent versions should be deleted (0 to disable)"
  type        = number
  default     = 90
}

variable "enable_cors" {
  description = "Whether to enable CORS for the S3 bucket"
  type        = bool
  default     = false
}

variable "cors_allowed_origins" {
  description = "List of allowed origins for CORS"
  type        = list(string)
  default     = ["*"]
}

variable "create_iam_user" {
  description = "Whether to create an IAM user with access to the bucket"
  type        = bool
  default     = false
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