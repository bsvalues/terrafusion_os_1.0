# TerraFusionPro Infrastructure as Code

This directory contains Terraform configurations for provisioning and managing the cloud infrastructure required by the TerraFusionPro platform.

## Architecture Overview

The TerraFusionPro infrastructure is built on Azure and consists of:

- Azure Kubernetes Service (AKS) for container orchestration
- Azure Container Registry (ACR) for storing Docker images
- Azure PostgreSQL Flexible Server for database services
- Azure Monitor and Log Analytics for monitoring and logging
- Azure Key Vault for secrets management (production only)
- Virtual Networks and subnets for network isolation

## Directory Structure

- `modules/` - Reusable Terraform modules
  - `kubernetes/` - AKS cluster configuration module
- `environments/` - Environment-specific configurations
  - `dev/` - Development environment
  - `staging/` - Staging environment
  - `prod/` - Production environment

## Prerequisites

1. Terraform v1.0.0 or newer
2. Azure CLI installed and configured
3. Appropriate Azure permissions to create resources

## Usage

### Initialize Terraform

```bash
# Development environment
cd environments/dev
terraform init

# Staging environment
cd environments/staging
terraform init

# Production environment
cd environments/prod
terraform init
```

### Plan and Apply Changes

```bash
# Development environment
cd environments/dev
terraform plan -out=tfplan -var="db_admin_username=admin" -var="db_admin_password=YOUR_PASSWORD"
terraform apply tfplan

# Staging environment
cd environments/staging
terraform plan -out=tfplan -var="db_admin_username=admin" -var="db_admin_password=YOUR_PASSWORD"
terraform apply tfplan

# Production environment
cd environments/prod
terraform plan -out=tfplan -var="db_admin_username=admin" -var="db_admin_password=YOUR_PASSWORD" -var="secondary_location=West US"
terraform apply tfplan
```

## CI/CD Integration

The Terraform configurations are designed to be used with CI/CD pipelines:

1. Store the Terraform state in Azure Storage
2. Use service principals for authentication
3. Use variable files for environment-specific settings

Example configuration for CI/CD pipeline:

```bash
# Configure backend for remote state
terraform init \
  -backend-config="storage_account_name=terrafusionprosatrfstate" \
  -backend-config="container_name=tfstate" \
  -backend-config="key=terraform.tfstate" \
  -backend-config="access_key=$STORAGE_ACCESS_KEY"

# Plan and apply with CI/CD variables
terraform plan -out=tfplan \
  -var="db_admin_username=$DB_USERNAME" \
  -var="db_admin_password=$DB_PASSWORD"

terraform apply tfplan
```

## Accessing Kubernetes

After applying the Terraform configuration, you can access the Kubernetes cluster:

```bash
# Get the kubeconfig
terraform output -raw kube_config > ~/.kube/config

# Verify connection
kubectl get nodes
```

## Managing Database Credentials

Database credentials are managed securely:

1. For development and staging, use Terraform variables
2. For production, use Azure Key Vault to store credentials

## Disaster Recovery

The production environment includes:

1. Zone-redundant PostgreSQL server
2. Multi-region container registry replication
3. Automated backups with 35-day retention

## Monitoring and Alerts

The infrastructure includes:

1. Azure Monitor integration for Kubernetes
2. Log Analytics for centralized logging
3. Application Insights for application monitoring (production)

## Security Considerations

The Terraform configurations implement security best practices:

1. Network isolation with virtual networks
2. Azure Policy integration (production)
3. Azure Active Directory integration for cluster authentication
4. Azure Key Vault for secrets management (production)