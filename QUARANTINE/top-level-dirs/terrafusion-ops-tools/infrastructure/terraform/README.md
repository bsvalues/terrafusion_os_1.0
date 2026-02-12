# Terrafusion Infrastructure as Code

This directory contains Terraform configurations for deploying the complete Terrafusion platform infrastructure on AWS.

## 🏗️ Architecture Overview

The infrastructure includes:

- **VPC**: Multi-AZ Virtual Private Cloud with public, private, and database subnets
- **EKS Cluster**: Managed Kubernetes cluster with auto-scaling node groups
- **RDS PostgreSQL**: Highly available database with automated backups
- **ElastiCache Redis**: In-memory caching layer with replication
- **Application Load Balancer**: Internet-facing load balancer with SSL termination
- **S3 Buckets**: Storage for backups, assets, and logs
- **CloudWatch**: Comprehensive monitoring and logging
- **KMS**: Encryption keys for all services
- **SSM Parameter Store**: Secure configuration management

## 📁 File Structure

```
terraform/
├── main.tf                    # Main Terraform configuration
├── variables.tf               # Variable definitions
├── outputs.tf                # Output values
├── terraform.tfvars.example  # Example configuration
├── versions.tf               # Provider version constraints
└── README.md                # This file
```

## 🚀 Quick Start

### Prerequisites

1. **AWS CLI** configured with appropriate credentials
2. **Terraform** >= 1.0 installed
3. **kubectl** for Kubernetes management
4. **helm** for package management

### Initial Setup

1. **Configure AWS credentials:**
   ```bash
   aws configure
   # or use environment variables
   export AWS_ACCESS_KEY_ID="your-access-key"
   export AWS_SECRET_ACCESS_KEY="your-secret-key"
   export AWS_DEFAULT_REGION="us-west-2"
   ```

2. **Create Terraform backend resources:**
   ```bash
   # Create S3 bucket for state
   aws s3 mb s3://terrafusion-terraform-state --region us-west-2
   
   # Enable versioning
   aws s3api put-bucket-versioning \
     --bucket terrafusion-terraform-state \
     --versioning-configuration Status=Enabled
   
   # Create DynamoDB table for state locking
   aws dynamodb create-table \
     --table-name terrafusion-terraform-locks \
     --attribute-definitions AttributeName=LockID,AttributeType=S \
     --key-schema AttributeName=LockID,KeyType=HASH \
     --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
     --region us-west-2
   ```

3. **Configure Terraform variables:**
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars with your specific configuration
   ```

### Deployment

1. **Initialize Terraform:**
   ```bash
   terraform init
   ```

2. **Plan the deployment:**
   ```bash
   terraform plan
   ```

3. **Apply the infrastructure:**
   ```bash
   terraform apply
   ```

4. **Configure kubectl:**
   ```bash
   aws eks update-kubeconfig --region us-west-2 --name terrafusion-production-eks
   ```

## ⚙️ Configuration

### Environment-Specific Configurations

#### Development
```hcl
environment                 = "development"
db_instance_class          = "db.r6g.large"
db_multi_az               = false
eks_node_desired_capacity  = 3
redis_num_cache_clusters   = 2
enable_deletion_protection = false
cost_budget_limit         = 1000
```

#### Staging
```hcl
environment                 = "staging"
db_instance_class          = "db.r6g.large"
db_multi_az               = false
eks_node_desired_capacity  = 3
redis_num_cache_clusters   = 2
enable_deletion_protection = false
cost_budget_limit         = 2000
```

#### Production
```hcl
environment                 = "production"
db_instance_class          = "db.r6g.xlarge"
db_multi_az               = true
eks_node_desired_capacity  = 5
redis_num_cache_clusters   = 3
enable_deletion_protection = true
cost_budget_limit         = 5000
```

### Security Configuration

```hcl
# Encryption
enable_encryption_at_rest    = true
enable_encryption_in_transit = true

# Monitoring and Compliance
enable_guardduty            = true
enable_security_hub         = true
enable_compliance_monitoring = true
enable_waf                  = true

# Enhanced Security
enable_enhanced_monitoring  = true
enable_vpc_flow_logs       = true
```

### Cost Optimization

```hcl
# Use Spot Instances
enable_spot_instances = true

# Use Graviton Instances
enable_graviton_instances = true

# Single NAT Gateway (non-production)
single_nat_gateway = true

# Reduced Log Retention
cloudwatch_log_retention_days = 7

# Lifecycle Policies
s3_lifecycle_transition_days = 7
```

## 🔐 Security Features

### Encryption
- **At Rest**: All data encrypted using AWS KMS
- **In Transit**: TLS/SSL for all connections
- **Key Management**: Dedicated KMS keys per service

### Network Security
- **VPC**: Isolated network environment
- **Security Groups**: Service-specific access rules
- **Private Subnets**: Application and database isolation
- **NAT Gateways**: Secure outbound internet access

### Access Control
- **IAM Roles**: Least-privilege service access
- **IRSA**: Pod-level service account mapping
- **Parameter Store**: Encrypted secret management

## 📊 Monitoring and Observability

### CloudWatch
- **Metrics**: Comprehensive infrastructure metrics
- **Logs**: Centralized log aggregation
- **Dashboards**: Pre-configured monitoring dashboards
- **Alarms**: Automated alerting on thresholds

### Application Monitoring
- **Container Insights**: EKS cluster monitoring
- **Performance Insights**: Database performance monitoring
- **Enhanced Monitoring**: Detailed RDS metrics

## 🔄 Backup and Disaster Recovery

### Automated Backups
- **RDS**: Automated daily backups with point-in-time recovery
- **Redis**: Daily snapshots with configurable retention
- **S3**: Cross-region replication for critical data

### Disaster Recovery
- **Multi-AZ**: Database and cache high availability
- **Cross-Region**: Optional backup replication
- **Infrastructure as Code**: Rapid environment recreation

## 💰 Cost Management

### Built-in Cost Controls
- **Budgets**: Automated cost alerts
- **Anomaly Detection**: Unusual spend notifications
- **Resource Tagging**: Comprehensive cost allocation
- **Lifecycle Policies**: Automatic data archival

### Optimization Features
- **Spot Instances**: Up to 90% cost savings for non-critical workloads
- **Graviton Instances**: Better price/performance ratio
- **Storage Optimization**: Intelligent S3 storage classes

## 🔧 Advanced Configuration

### Auto Scaling
```hcl
enable_auto_scaling        = true
auto_scaling_target_cpu    = 70
auto_scaling_target_memory = 75

# Spot instance configuration
enable_spot_instances = true
```

### High Availability
```hcl
# Multi-AZ database
db_multi_az = true

# Multiple cache nodes
redis_num_cache_clusters = 3

# Multiple NAT Gateways
single_nat_gateway = false
```

### Development Features
```hcl
enable_development_tools  = true
enable_load_testing      = true
enable_canary_deployments = true
```

## 📋 Outputs

After successful deployment, Terraform provides:

### Connection Information
- EKS cluster endpoint and configuration
- RDS database connection details
- Redis cache endpoints
- Load balancer DNS name

### Resource Identifiers
- VPC and subnet IDs
- Security group IDs
- S3 bucket names
- KMS key ARNs

### Monitoring Links
- CloudWatch dashboard URLs
- Log group names
- Metric namespaces

## 🧪 Testing

### Infrastructure Testing
```bash
# Validate Terraform configuration
terraform validate

# Check for security issues
terraform plan | grep -i security

# Test connectivity
kubectl get nodes
psql -h <rds_endpoint> -U terrafusion_user -d terrafusion
```

### Application Testing
```bash
# Deploy test application
kubectl apply -f test-app.yaml

# Run health checks
./scripts/health-check.sh

# Load testing
./scripts/performance-test.sh
```

## 🔄 Updates and Maintenance

### Terraform Updates
```bash
# Update providers
terraform init -upgrade

# Plan changes
terraform plan

# Apply updates
terraform apply
```

### Infrastructure Updates
```bash
# Update EKS cluster
terraform apply -target=module.eks

# Update database
terraform apply -target=aws_db_instance.main

# Rolling node updates
kubectl get nodes
```

## 🚨 Troubleshooting

### Common Issues

#### State Lock Issues
```bash
# Force unlock (use carefully)
terraform force-unlock <LOCK_ID>
```

#### EKS Access Issues
```bash
# Update kubeconfig
aws eks update-kubeconfig --region us-west-2 --name <cluster-name>

# Check IAM permissions
aws sts get-caller-identity
```

#### Database Connection Issues
```bash
# Check security groups
aws ec2 describe-security-groups --group-ids <sg-id>

# Test connectivity
telnet <rds-endpoint> 5432
```

### Debug Mode
```bash
# Enable debug logging
export TF_LOG=DEBUG
terraform apply
```

## 📚 Additional Resources

### AWS Documentation
- [EKS Best Practices](https://aws.github.io/aws-eks-best-practices/)
- [RDS Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_BestPractices.html)
- [VPC Best Practices](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-best-practices.html)

### Terraform Documentation
- [AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Terraform Best Practices](https://www.terraform.io/docs/cloud/guides/recommended-practices/index.html)

### Community Resources
- [Terraform AWS Modules](https://github.com/terraform-aws-modules)
- [EKS Workshop](https://www.eksworkshop.com/)

## 🤝 Contributing

1. **Plan Changes**: Always run `terraform plan` before applying
2. **Test Locally**: Use `terraform validate` and `terraform fmt`
3. **Document Changes**: Update this README for significant changes
4. **Security Review**: Ensure all changes follow security best practices

## 📞 Support

For infrastructure issues:
- **Email**: devops@terrafusion.com
- **Slack**: #infrastructure
- **On-call**: Via PagerDuty integration

For emergencies:
- **Incident Response**: Use incident management system
- **Escalation**: Follow defined escalation procedures