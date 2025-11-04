terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }

  backend "s3" {
    bucket = "terrafusion-terraform-state"
    key    = "terraform.tfstate"
    region = "us-west-2"
    dynamodb_table = "terraform-lock"
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC and networking
module "vpc" {
  source = "./modules/vpc"

  environment   = var.environment
  vpc_cidr      = var.vpc_cidr
  azs           = var.availability_zones
  project_name  = var.project_name
}

# Database resources
module "database" {
  source = "./modules/database"

  environment     = var.environment
  vpc_id          = module.vpc.vpc_id
  subnet_ids      = module.vpc.private_subnet_ids
  postgres_version = var.postgres_version
  instance_class  = var.db_instance_class
  db_name         = var.db_name
  db_username     = var.db_username
  db_password     = var.db_password
}

# ECS Cluster for containerized applications
module "ecs" {
  source = "./modules/ecs"

  environment    = var.environment
  vpc_id         = module.vpc.vpc_id
  subnet_ids     = module.vpc.private_subnet_ids
  public_subnets = module.vpc.public_subnet_ids
  project_name   = var.project_name
  ecr_repo_name  = "${var.project_name}-${var.environment}"
  container_image = var.container_image
  container_port = var.container_port
  db_endpoint    = module.database.db_endpoint
  db_name        = var.db_name
  db_username    = var.db_username
  db_password    = var.db_password
}

# Monitoring and logging
module "monitoring" {
  source = "./modules/monitoring"

  environment    = var.environment
  vpc_id         = module.vpc.vpc_id
  subnet_ids     = module.vpc.private_subnet_ids
  project_name   = var.project_name
  ecs_cluster_arn = module.ecs.cluster_arn
  ecs_service_name = module.ecs.service_name
  alarm_email    = var.alarm_email
}

# Application deployment
module "application" {
  source = "./modules/application"

  environment    = var.environment
  vpc_id         = module.vpc.vpc_id
  public_subnets = module.vpc.public_subnet_ids
  ecs_cluster_name = module.ecs.cluster_name
  ecs_service_name = module.ecs.service_name
  project_name   = var.project_name
  container_port = var.container_port
  domain_name    = var.domain_name
  certificate_arn = var.certificate_arn
}