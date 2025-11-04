output "bucket_id" {
  description = "The name of the bucket"
  value       = aws_s3_bucket.main.id
}

output "bucket_arn" {
  description = "The ARN of the bucket"
  value       = aws_s3_bucket.main.arn
}

output "bucket_domain_name" {
  description = "The domain name of the bucket"
  value       = aws_s3_bucket.main.bucket_domain_name
}

output "bucket_regional_domain_name" {
  description = "The regional domain name of the bucket"
  value       = aws_s3_bucket.main.bucket_regional_domain_name
}

output "kms_key_id" {
  description = "The ID of the KMS key used for encryption"
  value       = aws_kms_key.s3.id
}

output "kms_key_arn" {
  description = "The ARN of the KMS key used for encryption"
  value       = aws_kms_key.s3.arn
}

output "iam_user_name" {
  description = "The name of the IAM user with access to the bucket"
  value       = var.create_iam_user ? aws_iam_user.s3_user[0].name : null
}

output "iam_user_arn" {
  description = "The ARN of the IAM user with access to the bucket"
  value       = var.create_iam_user ? aws_iam_user.s3_user[0].arn : null
}

output "iam_access_key_id" {
  description = "The access key ID of the IAM user"
  value       = var.create_iam_user ? aws_iam_access_key.s3_user[0].id : null
  sensitive   = true
}

output "s3_credentials_secret_arn" {
  description = "The ARN of the Secrets Manager secret storing S3 credentials"
  value       = var.create_iam_user ? aws_secretsmanager_secret.s3_credentials[0].arn : null
}