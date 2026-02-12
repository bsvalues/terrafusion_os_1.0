variable "namespace_name" {
  type        = string
  description = "Event Hubs namespace name"
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
  description = "Subnet ID for Event Hubs private endpoint"
}

variable "capture_storage_account_id" {
  type        = string
  description = "Storage account ID for Event Hubs Capture"
}

variable "capture_container_name" {
  type        = string
  description = "Storage container name for Event Hubs Capture"
  default     = "eventhub-capture"
}

variable "tags" {
  type        = map(string)
  description = "Resource tags"
  default     = {}
}
