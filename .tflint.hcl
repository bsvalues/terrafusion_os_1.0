plugin "aws" {
  enabled = true
  version = "0.33.2"
  source  = "github.com/terraform-linters/tflint-ruleset-aws"
}

config {
  module = true
}

rule "aws_instance_invalid_type" { enabled = true }
rule "terraform_unused_declarations" { enabled = true }
rule "terraform_deprecated_interpolation" { enabled = true }
