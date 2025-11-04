terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
  }
  
  backend "s3" {
    bucket = "terrafusion-terraform-state"
    key    = "infrastructure/terraform.tfstate"
    region = "us-west-2"
  }
}

provider "aws" {
  region = var.aws_region
}

provider "google" {
  project = var.gcp_project_id
  region  = var.gcp_region
}

provider "azurerm" {
  features {}
}

module "aws_infrastructure" {
  source = "./modules/aws"
  
  environment = var.environment
  region      = var.aws_region
  
  cluster_name = "terrafusion-${var.environment}-aws"
  node_count   = var.aws_node_count
  
  database_instance_class = var.aws_db_instance_class
  database_allocated_storage = var.aws_db_allocated_storage
}

module "gcp_infrastructure" {
  source = "./modules/gcp"
  
  environment = var.environment
  region      = var.gcp_region
  project_id  = var.gcp_project_id
  
  cluster_name = "terrafusion-${var.environment}-gcp"
  node_count   = var.gcp_node_count
}

module "azure_infrastructure" {
  source = "./modules/azure"
  
  environment = var.environment
  location    = var.azure_location
  
  cluster_name = "terrafusion-${var.environment}-azure"
  node_count   = var.azure_node_count
}

module "global_load_balancer" {
  source = "./modules/global-lb"
  
  aws_cluster_endpoint   = module.aws_infrastructure.cluster_endpoint
  gcp_cluster_endpoint   = module.gcp_infrastructure.cluster_endpoint
  azure_cluster_endpoint = module.azure_infrastructure.cluster_endpoint
}
