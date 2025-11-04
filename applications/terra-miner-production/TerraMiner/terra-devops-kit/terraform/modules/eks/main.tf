/**
 * # EKS Module
 * 
 * This module creates an Amazon EKS cluster with managed node groups for the TerraMiner data intelligence platform.
 * It includes node groups optimized for different workload types (application, data processing, ML).
 */

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 18.0"

  cluster_name    = "terraminer-${var.environment}-eks"
  cluster_version = var.kubernetes_version

  vpc_id     = var.vpc_id
  subnet_ids = var.private_subnet_ids

  # EKS Managed Node Group defaults
  eks_managed_node_group_defaults = {
    ami_type       = "AL2_x86_64"
    instance_types = ["t3.medium"]
    
    attach_cluster_primary_security_group = true
    
    # Needed for proper CNI setup
    iam_role_additional_policies = [
      "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
    ]
  }

  # Node groups for different workload types
  eks_managed_node_groups = {
    # Application workers for API and web services
    app = {
      name           = "terraminer-app"
      instance_types = var.app_instance_types
      min_size       = var.app_min_size
      max_size       = var.app_max_size
      desired_size   = var.app_desired_size

      labels = {
        workload-type = "application"
      }

      tags = merge(
        var.common_tags,
        {
          "k8s-node-type" = "application"
        }
      )
    }

    # Data processing workers for ETL and data pipeline workloads
    data = {
      name           = "terraminer-data"
      instance_types = var.data_instance_types
      min_size       = var.data_min_size
      max_size       = var.data_max_size
      desired_size   = var.data_desired_size

      labels = {
        workload-type = "data-processing"
      }

      taints = [{
        key    = "workload"
        value  = "data-processing"
        effect = "NO_SCHEDULE"
      }]

      tags = merge(
        var.common_tags,
        {
          "k8s-node-type" = "data-processing"
        }
      )
    }
    
    # ML workers for machine learning workloads
    ml = {
      name           = "terraminer-ml"
      instance_types = var.ml_instance_types
      min_size       = var.ml_min_size
      max_size       = var.ml_max_size
      desired_size   = var.ml_desired_size
      
      labels = {
        workload-type = "ml"
      }
      
      taints = [{
        key    = "workload"
        value  = "ml"
        effect = "NO_SCHEDULE"
      }]
      
      tags = merge(
        var.common_tags,
        {
          "k8s-node-type" = "ml"
        }
      )
    }
  }

  # Enable OIDC provider for service accounts (required for IRSA)
  cluster_identity_providers = [
    {
      name = "oidc-provider"
      type = "oidc"
    }
  ]

  # IAM roles for service accounts (IRSA)
  node_security_group_additional_rules = {
    ingress_self_all = {
      description = "Node to node all ports/protocols"
      protocol    = "-1"
      from_port   = 0
      to_port     = 0
      type        = "ingress"
      self        = true
    }
    egress_all = {
      description = "Node all egress"
      protocol    = "-1"
      from_port   = 0
      to_port     = 0
      type        = "egress"
      cidr_blocks = ["0.0.0.0/0"]
    }
  }

  # Enable CloudWatch logging
  cluster_enabled_log_types = ["api", "audit", "authenticator", "controllerManager", "scheduler"]
  
  # Configure addon management
  cluster_addons = {
    coredns = {
      resolve_conflicts = "OVERWRITE"
    }
    kube-proxy = {
      resolve_conflicts = "OVERWRITE"
    }
    vpc-cni = {
      resolve_conflicts = "OVERWRITE"
    }
    aws-ebs-csi-driver = {
      resolve_conflicts = "OVERWRITE"
    }
  }

  # Tags for all resources
  tags = merge(
    var.common_tags,
    {
      "terraform-module" = "eks"
      "environment"      = var.environment
    }
  )
}

# Create IAM roles for service accounts
module "iam_assumable_role_admin" {
  source                        = "terraform-aws-modules/iam/aws//modules/iam-assumable-role-with-oidc"
  version                       = "~> 4.0"
  create_role                   = true
  role_name                     = "terraminer-${var.environment}-eks-admin"
  provider_url                  = replace(module.eks.cluster_oidc_issuer_url, "https://", "")
  role_policy_arns              = ["arn:aws:iam::aws:policy/AdministratorAccess"]
  oidc_fully_qualified_subjects = ["system:serviceaccount:kube-system:admin-user"]
}

# Create IAM role for external-dns
module "external_dns_irsa_role" {
  source                        = "terraform-aws-modules/iam/aws//modules/iam-assumable-role-with-oidc"
  version                       = "~> 4.0"
  create_role                   = true
  role_name                     = "terraminer-${var.environment}-external-dns"
  provider_url                  = replace(module.eks.cluster_oidc_issuer_url, "https://", "")
  role_policy_arns              = [aws_iam_policy.external_dns.arn]
  oidc_fully_qualified_subjects = ["system:serviceaccount:kube-system:external-dns"]
}

# Create IAM policy for external-dns
resource "aws_iam_policy" "external_dns" {
  name        = "terraminer-${var.environment}-external-dns"
  description = "Policy for ExternalDNS"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "route53:ChangeResourceRecordSets"
        ]
        Effect   = "Allow"
        Resource = "arn:aws:route53:::hostedzone/*"
      },
      {
        Action = [
          "route53:ListHostedZones",
          "route53:ListResourceRecordSets"
        ]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}

# Create IAM role for ALB Ingress Controller
module "alb_ingress_irsa_role" {
  source                        = "terraform-aws-modules/iam/aws//modules/iam-assumable-role-with-oidc"
  version                       = "~> 4.0"
  create_role                   = true
  role_name                     = "terraminer-${var.environment}-alb-ingress"
  provider_url                  = replace(module.eks.cluster_oidc_issuer_url, "https://", "")
  role_policy_arns              = ["arn:aws:iam::aws:policy/AmazonEKSLoadBalancerControllerPolicy"]
  oidc_fully_qualified_subjects = ["system:serviceaccount:kube-system:aws-load-balancer-controller"]
}

# Create IAM role for cluster autoscaler
module "cluster_autoscaler_irsa_role" {
  source                        = "terraform-aws-modules/iam/aws//modules/iam-assumable-role-with-oidc"
  version                       = "~> 4.0"
  create_role                   = true
  role_name                     = "terraminer-${var.environment}-cluster-autoscaler"
  provider_url                  = replace(module.eks.cluster_oidc_issuer_url, "https://", "")
  role_policy_arns              = [aws_iam_policy.cluster_autoscaler.arn]
  oidc_fully_qualified_subjects = ["system:serviceaccount:kube-system:cluster-autoscaler"]
}

# Create IAM policy for cluster autoscaler
resource "aws_iam_policy" "cluster_autoscaler" {
  name        = "terraminer-${var.environment}-cluster-autoscaler"
  description = "Policy for Cluster Autoscaler"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "autoscaling:DescribeAutoScalingGroups",
          "autoscaling:DescribeAutoScalingInstances",
          "autoscaling:DescribeLaunchConfigurations",
          "autoscaling:DescribeTags",
          "autoscaling:SetDesiredCapacity",
          "autoscaling:TerminateInstanceInAutoScalingGroup",
          "ec2:DescribeLaunchTemplateVersions",
          "ec2:DescribeInstanceTypes"
        ]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}