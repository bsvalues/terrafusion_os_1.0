provider "aws" {
  region = var.region
}

resource "aws_kms_key" "s3" {
  description             = "KMS key for S3 bucket encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  tags                    = var.tags
}

resource "aws_kms_alias" "s3" {
  name          = "alias/${var.prefix}-s3-key"
  target_key_id = aws_kms_key.s3.key_id
}

resource "aws_s3_bucket" "main" {
  bucket = "${var.prefix}-${var.bucket_name}"
  tags   = var.tags
}

resource "aws_s3_bucket_versioning" "main" {
  bucket = aws_s3_bucket.main.id
  versioning_configuration {
    status = var.enable_versioning ? "Enabled" : "Suspended"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "main" {
  bucket = aws_s3_bucket.main.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  rule {
    id     = "transition-to-intelligent-tiering"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "INTELLIGENT_TIERING"
    }

    dynamic "expiration" {
      for_each = var.lifecycle_expiration_days > 0 ? [1] : []
      content {
        days = var.lifecycle_expiration_days
      }
    }

    dynamic "noncurrent_version_expiration" {
      for_each = var.enable_versioning && var.noncurrent_version_expiration_days > 0 ? [1] : []
      content {
        noncurrent_days = var.noncurrent_version_expiration_days
      }
    }
  }
}

resource "aws_s3_bucket_cors_configuration" "main" {
  count = var.enable_cors ? 1 : 0
  
  bucket = aws_s3_bucket.main.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD", "PUT", "POST", "DELETE"]
    allowed_origins = var.cors_allowed_origins
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

resource "aws_s3_bucket_ownership_controls" "main" {
  bucket = aws_s3_bucket.main.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_iam_user" "s3_user" {
  count = var.create_iam_user ? 1 : 0
  
  name = "${var.prefix}-s3-user"
  tags = var.tags
}

resource "aws_iam_access_key" "s3_user" {
  count = var.create_iam_user ? 1 : 0
  
  user = aws_iam_user.s3_user[0].name
}

resource "aws_iam_user_policy" "s3_policy" {
  count = var.create_iam_user ? 1 : 0
  
  name = "${var.prefix}-s3-policy"
  user = aws_iam_user.s3_user[0].name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Effect = "Allow"
        Resource = [
          aws_s3_bucket.main.arn,
          "${aws_s3_bucket.main.arn}/*"
        ]
      },
      {
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Effect = "Allow"
        Resource = aws_kms_key.s3.arn
      }
    ]
  })
}

resource "aws_secretsmanager_secret" "s3_credentials" {
  count       = var.create_iam_user ? 1 : 0
  
  name        = "${var.prefix}/s3/credentials"
  description = "S3 credentials for ${var.prefix}-${var.bucket_name}"
  kms_key_id  = aws_kms_key.s3.arn
  tags        = var.tags
}

resource "aws_secretsmanager_secret_version" "s3_credentials" {
  count      = var.create_iam_user ? 1 : 0
  
  secret_id  = aws_secretsmanager_secret.s3_credentials[0].id
  secret_string = jsonencode({
    access_key = aws_iam_access_key.s3_user[0].id
    secret_key = aws_iam_access_key.s3_user[0].secret
    bucket     = aws_s3_bucket.main.bucket
    region     = var.region
  })
}