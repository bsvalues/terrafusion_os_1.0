resource "aws_eks_cluster" "terrafusion" {
  name     = var.cluster_name
  role_arn = aws_iam_role.cluster.arn
  version  = "1.28"

  vpc_config {
    subnet_ids              = aws_subnet.private[*].id
    endpoint_private_access = true
    endpoint_public_access  = true
    public_access_cidrs     = ["0.0.0.0/0"]
  }

  encryption_config {
    provider {
      key_arn = aws_kms_key.eks.arn
    }
    resources = ["secrets"]
  }

  enabled_cluster_log_types = ["api", "audit", "authenticator", "controllerManager", "scheduler"]

  depends_on = [
    aws_iam_role_policy_attachment.cluster_AmazonEKSClusterPolicy,
  ]
}

resource "aws_eks_node_group" "terrafusion" {
  cluster_name    = aws_eks_cluster.terrafusion.name
  node_group_name = "${var.cluster_name}-nodes"
  node_role_arn   = aws_iam_role.node.arn
  subnet_ids      = aws_subnet.private[*].id

  capacity_type  = "SPOT"
  instance_types = ["c5.xlarge", "c5.2xlarge", "m5.xlarge"]

  scaling_config {
    desired_size = var.node_count
    max_size     = var.node_count * 3
    min_size     = var.node_count
  }

  update_config {
    max_unavailable = 1
  }

  depends_on = [
    aws_iam_role_policy_attachment.node_AmazonEKSWorkerNodePolicy,
    aws_iam_role_policy_attachment.node_AmazonEKS_CNI_Policy,
    aws_iam_role_policy_attachment.node_AmazonEC2ContainerRegistryReadOnly,
  ]
}

resource "aws_rds_cluster" "terrafusion" {
  cluster_identifier      = "${var.cluster_name}-aurora"
  engine                 = "aurora-mysql"
  engine_version         = "8.0.mysql_aurora.3.02.0"
  database_name          = "terrafusion_pro"
  master_username        = "terrafusion"
  master_password        = random_password.db_password.result
  backup_retention_period = 35
  preferred_backup_window = "07:00-09:00"
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.terrafusion.name
  
  storage_encrypted = true
  kms_key_id       = aws_kms_key.rds.arn
  
  enabled_cloudwatch_logs_exports = ["audit", "error", "general", "slowquery"]
  
  global_cluster_identifier = aws_rds_global_cluster.terrafusion.id
  
  depends_on = [aws_rds_global_cluster.terrafusion]
}

resource "aws_rds_global_cluster" "terrafusion" {
  global_cluster_identifier = "terrafusion-global"
  engine                   = "aurora-mysql"
  engine_version           = "8.0.mysql_aurora.3.02.0"
  database_name            = "terrafusion_pro"
  storage_encrypted        = true
}

resource "aws_rds_cluster_instance" "terrafusion" {
  count              = 2
  identifier         = "${var.cluster_name}-aurora-${count.index}"
  cluster_identifier = aws_rds_cluster.terrafusion.id
  instance_class     = var.database_instance_class
  engine             = aws_rds_cluster.terrafusion.engine
  engine_version     = aws_rds_cluster.terrafusion.engine_version
  
  performance_insights_enabled = true
  monitoring_interval         = 60
  monitoring_role_arn        = aws_iam_role.rds_enhanced_monitoring.arn
}

resource "aws_elasticache_replication_group" "terrafusion" {
  replication_group_id       = "${var.cluster_name}-redis"
  description                = "TerraFusion Redis cluster"
  
  node_type                  = "cache.r6g.xlarge"
  port                       = 6379
  parameter_group_name       = "default.redis7"
  
  num_cache_clusters         = 3
  automatic_failover_enabled = true
  multi_az_enabled          = true
  
  subnet_group_name = aws_elasticache_subnet_group.terrafusion.name
  security_group_ids = [aws_security_group.redis.id]
  
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                = random_password.redis_auth.result
  
  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis.name
    destination_type = "cloudwatch-logs"
    log_format       = "text"
    log_type         = "slow-log"
  }
}
