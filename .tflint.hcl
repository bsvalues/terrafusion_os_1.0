plugin "aws" {
  enabled = true
  version = "0.33.2"
  source  = "github.com/terraform-linters/tflint-ruleset-aws"
}

config {
  module = true
  # Limit tflint checks in CI to reduce noisy false-positives; infra owners
  # can run full checks locally with a different config.
  ignore_module = false
}

# Enable a small, useful subset of rules for PRs. Keep others disabled to
# avoid requiring cloud credentials or state access during PR validation.
rule "aws_instance_invalid_type" { enabled = false }
rule "terraform_unused_declarations" { enabled = true }
rule "terraform_deprecated_interpolation" { enabled = true }

# Ignore checks that require AWS API access or account-specific context.
rule "aws_s3_bucket_public_access_block_enabled" { enabled = false }
rule "aws_iam_user_unused" { enabled = false }
