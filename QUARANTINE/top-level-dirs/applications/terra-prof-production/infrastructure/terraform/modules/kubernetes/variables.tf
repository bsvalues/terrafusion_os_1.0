/**
 * Variables for TerraFusionPro Kubernetes Cluster Module
 */

variable "cluster_name" {
  description = "Name of the Kubernetes cluster"
  type        = string
}

variable "location" {
  description = "Azure region to deploy the cluster"
  type        = string
}

variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
}

variable "dns_prefix" {
  description = "DNS prefix for the cluster"
  type        = string
}

variable "kubernetes_version" {
  description = "Kubernetes version to use"
  type        = string
  default     = "1.24.0"
}

variable "node_count" {
  description = "Initial number of nodes in the cluster"
  type        = number
  default     = 3
}

variable "node_size" {
  description = "Size of the nodes (VM size in Azure)"
  type        = string
  default     = "Standard_D2s_v3"
}

variable "os_disk_size_gb" {
  description = "OS disk size for cluster nodes (in GB)"
  type        = number
  default     = 50
}

variable "subnet_id" {
  description = "ID of the subnet where to deploy the cluster"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "min_node_count" {
  description = "Minimum number of nodes in the cluster when scaling down"
  type        = number
  default     = 1
}

variable "max_node_count" {
  description = "Maximum number of nodes in the cluster when scaling up"
  type        = number
  default     = 10
}

variable "enable_monitoring" {
  description = "Enable Azure Monitor for the cluster"
  type        = bool
  default     = true
}

variable "log_analytics_workspace_id" {
  description = "ID of the Log Analytics workspace for monitoring"
  type        = string
  default     = ""
}

variable "enable_policy" {
  description = "Enable Azure Policy for the cluster"
  type        = bool
  default     = false
}

variable "admin_group_object_ids" {
  description = "List of Azure AD group object IDs for cluster administrators"
  type        = list(string)
  default     = []
}

variable "service_cidr" {
  description = "The CIDR for Kubernetes services"
  type        = string
  default     = "10.0.0.0/16"
}

variable "dns_service_ip" {
  description = "IP address within the Kubernetes service address range used by cluster service discovery"
  type        = string
  default     = "10.0.0.10"
}

variable "docker_bridge_cidr" {
  description = "CIDR for the Docker bridge network"
  type        = string
  default     = "172.17.0.1/16"
}