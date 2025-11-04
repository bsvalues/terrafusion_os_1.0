# TerraMiner DevOps Kit

This repository contains the complete DevOps implementation for the TerraMiner data intelligence platform, designed to run on AWS infrastructure using EKS (Elastic Kubernetes Service).

## Overview

The TerraMiner platform is a comprehensive real estate data intelligence system that combines ETL pipelines, data warehousing, statistical analysis tools, and machine learning capabilities. This DevOps kit provides all the infrastructure as code, deployment pipelines, and monitoring solutions necessary to deploy and maintain the platform.

## Kit Contents

This DevOps kit is organized into the following components:

```
terra-devops-kit/
├── terraform/                # IaC for AWS infrastructure
│   ├── modules/              # Reusable Terraform modules
│   ├── environments/         # Environment-specific configurations
│   └── README.md             # Terraform documentation
├── kubernetes/               # Kubernetes manifests
│   ├── argocd/               # ArgoCD configurations
│   ├── monitoring/           # Monitoring stack configurations
│   └── README.md             # Kubernetes documentation
├── helm/                     # Helm charts for application components
│   ├── api-gateway/          # API Gateway service chart
│   ├── data-processor/       # Data processing service chart
│   ├── ml-service/           # Machine learning service chart
│   └── README.md             # Helm documentation
├── ci-cd/                    # CI/CD configurations
│   ├── github-actions/       # GitHub Actions workflows
│   └── README.md             # CI/CD documentation
├── docker/                   # Dockerfile templates for services
│   ├── api-gateway/          # API Gateway Dockerfile
│   ├── data-processor/       # Data Processor Dockerfile
│   ├── ml-service/           # ML Service Dockerfile
│   └── README.md             # Docker documentation
├── docs/                     # Documentation
│   ├── architecture/         # Architecture diagrams and documents
│   ├── runbooks/             # Operational runbooks
│   └── security/             # Security documentation
└── README.md                 # Main documentation
```

## Technology Stack

The DevOps implementation is based on the following technologies:

- **Infrastructure:** AWS (EKS, RDS, Redshift, S3, VPC)
- **Infrastructure as Code:** Terraform
- **Container Orchestration:** Kubernetes (EKS)
- **CI/CD:** GitHub Actions + ArgoCD
- **Monitoring:** Prometheus + Grafana
- **Logging:** FluentBit → Loki
- **Secret Management:** HashiCorp Vault, AWS Secrets Manager
- **Containerization:** Docker

## Getting Started

### Prerequisites

- AWS CLI configured with appropriate permissions
- Terraform (v1.0.0 or newer)
- kubectl (compatible with your target EKS version)
- Helm (v3.0.0 or newer)
- Docker

### Deployment Steps

#### 1. Set up Infrastructure

```bash
# Initialize Terraform
cd terraform/environments/production
terraform init

# Plan the deployment
terraform plan -out=tfplan

# Apply the changes
terraform apply tfplan
```

#### 2. Configure kubectl

```bash
aws eks update-kubeconfig --name terraminer-production-eks --region us-west-2
```

#### 3. Deploy ArgoCD

```bash
# Install ArgoCD
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Apply ArgoCD configurations
kubectl apply -f kubernetes/argocd/projects/
kubectl apply -f kubernetes/argocd/applications/
```

#### 4. Set up Monitoring

```bash
# Install monitoring stack
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
helm install monitoring prometheus-community/kube-prometheus-stack -f kubernetes/monitoring/prometheus-values.yaml -n monitoring --create-namespace
```

#### 5. CI/CD Setup

- Add the required secrets to your GitHub repository:
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
  - `ECR_REPOSITORY`
  - `ARGOCD_SERVER`
  - `ARGOCD_USERNAME`
  - `ARGOCD_PASSWORD`

## Architecture

![TerraMiner Architecture Diagram](docs/architecture/terraminer-architecture.png)

The architecture follows a multi-tier approach:

1. **Frontend Tier:** API Gateway service that handles external requests
2. **Application Tier:** Business logic and service composition
3. **Data Processing Tier:** ETL pipelines and data transformation
4. **Data Storage Tier:** Databases (PostgreSQL, Redshift) and object storage (S3)
5. **ML Tier:** Machine learning model training and inference services

## Operations

Detailed operational runbooks are provided in the `docs/runbooks` directory, covering:

- Deployment procedures
- Scaling operations
- Backup and restore procedures
- Disaster recovery
- Monitoring alerts and response procedures

## Security

Security documentation, including:

- Network security policies
- Secret management procedures
- Compliance documentation
- Security audit procedures

Can be found in the `docs/security` directory.

## Contact

For questions or support, please contact the TerraMiner DevOps team.