variable "server_name" {
  type        = string
  description = "PostgreSQL server name"
}

variable "location" {
  type        = string
  description = "Azure region"
}

variable "resource_group_name" {
  type        = string
  description = "Resource group name"
}

variable "subnet_id" {
  type        = string
  description = "Delegated subnet ID for PostgreSQL"
}

variable "private_dns_zone_id" {
  type        = string
  description = "Private DNS zone ID for PostgreSQL"
}

variable "standby_zone" {
  type        = string
  description = "Availability zone for standby server"
  default     = "2"
}

variable "replica_count" {
  type        = number
  description = "Number of read replicas (validated in Week 3 POC: 3 replicas)"
  default     = 3
}

variable "tags" {
  type        = map(string)
  description = "Resource tags"
  default     = {}
}
