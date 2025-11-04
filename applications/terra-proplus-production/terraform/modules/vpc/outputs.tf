output "vpc_id" {
  description = "The ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "List of private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "default_security_group_id" {
  description = "The ID of the default security group"
  value       = aws_security_group.default.id
}

output "availability_zones" {
  description = "List of availability zones used"
  value       = var.availability_zones
}

output "nat_gateway_ips" {
  description = "List of Elastic IPs used for NAT Gateways"
  value       = aws_eip.nat[*].public_ip
}