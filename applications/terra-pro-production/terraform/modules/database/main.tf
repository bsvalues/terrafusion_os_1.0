resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-${var.environment}-db-subnet-group"
  subnet_ids = var.subnet_ids

  tags = {
    Name        = "${var.project_name}-${var.environment}-db-subnet-group"
    Environment = var.environment
    Project     = var.project_name
    Terraform   = "true"
  }
}

resource "aws_security_group" "db" {
  name        = "${var.project_name}-${var.environment}-db-sg"
  description = "Allow inbound database traffic"
  vpc_id      = var.vpc_id

  ingress {
    description     = "Allow PostgreSQL traffic from app security group"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [var.app_security_group_id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-db-sg"
    Environment = var.environment
    Project     = var.project_name
    Terraform   = "true"
  }
}

resource "aws_db_parameter_group" "main" {
  name   = "${var.project_name}-${var.environment}-pg-${var.postgres_version}"
  family = "postgres${var.postgres_version}"

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  parameter {
    name  = "log_statement"
    value = "ddl"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-pg-${var.postgres_version}"
    Environment = var.environment
    Project     = var.project_name
    Terraform   = "true"
  }
}

resource "aws_db_instance" "main" {
  identifier           = "${var.project_name}-${var.environment}"
  allocated_storage    = var.allocated_storage
  storage_type         = "gp2"
  engine               = "postgres"
  engine_version       = var.postgres_version
  instance_class       = var.instance_class
  db_name              = var.db_name
  username             = var.db_username
  password             = var.db_password
  parameter_group_name = aws_db_parameter_group.main.name
  db_subnet_group_name = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.db.id]
  skip_final_snapshot  = var.environment != "prod" ? true : false
  final_snapshot_identifier = var.environment != "prod" ? null : "${var.project_name}-${var.environment}-final-snapshot-${formatdate("YYYY-MM-DD-hh-mm", timestamp())}"
  backup_retention_period   = var.environment == "prod" ? 7 : 1
  backup_window             = "03:00-06:00"
  maintenance_window        = "Mon:00:00-Mon:03:00"
  multi_az                  = var.environment == "prod" ? true : false
  publicly_accessible       = false
  apply_immediately         = var.environment != "prod" ? true : false
  auto_minor_version_upgrade = true
  deletion_protection       = var.environment == "prod" ? true : false
  storage_encrypted         = true
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  tags = {
    Name        = "${var.project_name}-${var.environment}-db"
    Environment = var.environment
    Project     = var.project_name
    Terraform   = "true"
  }
}