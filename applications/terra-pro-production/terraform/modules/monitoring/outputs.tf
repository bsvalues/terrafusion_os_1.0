output "monitoring_security_group_id" {
  description = "The ID of the security group for monitoring services"
  value       = aws_security_group.monitoring.id
}

output "cloudwatch_log_group_name" {
  description = "The name of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.ecs_logs.name
}

output "cloudwatch_log_group_arn" {
  description = "The ARN of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.ecs_logs.arn
}

output "sns_topic_arn" {
  description = "The ARN of the SNS topic for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "prometheus_metrics_bucket" {
  description = "The S3 bucket name for storing Prometheus metrics"
  value       = aws_s3_bucket.prometheus_metrics.bucket
}

output "prometheus_metrics_bucket_arn" {
  description = "The ARN of the S3 bucket for storing Prometheus metrics"
  value       = aws_s3_bucket.prometheus_metrics.arn
}