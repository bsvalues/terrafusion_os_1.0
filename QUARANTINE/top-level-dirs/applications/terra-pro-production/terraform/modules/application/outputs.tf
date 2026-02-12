output "alb_dns_name" {
  description = "The DNS name of the load balancer"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "The zone ID of the load balancer"
  value       = aws_lb.main.zone_id
}

output "target_group_arn" {
  description = "The ARN of the target group"
  value       = aws_lb_target_group.main.arn
}

output "alb_security_group_id" {
  description = "The ID of the security group for the load balancer"
  value       = aws_security_group.alb.id
}

output "cloudfront_distribution_id" {
  description = "The ID of the CloudFront distribution"
  value       = var.enable_cdn ? aws_cloudfront_distribution.main[0].id : null
}

output "cloudfront_domain_name" {
  description = "The domain name of the CloudFront distribution"
  value       = var.enable_cdn ? aws_cloudfront_distribution.main[0].domain_name : null
}

output "application_url" {
  description = "The URL of the application"
  value       = var.domain_name != "" ? "https://${var.domain_name}" : "https://${aws_lb.main.dns_name}"
}

output "alb_logs_bucket" {
  description = "The name of the S3 bucket for ALB access logs"
  value       = aws_s3_bucket.alb_logs.bucket
}