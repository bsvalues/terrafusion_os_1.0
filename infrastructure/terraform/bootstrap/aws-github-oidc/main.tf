terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
}

provider "aws" {
  region = var.region
}

data "aws_iam_openid_connect_provider" "github" {
  arn = "arn:aws:iam::${var.account_id}:oidc-provider/token.actions.githubusercontent.com"
}

resource "aws_iam_role" "github_oidc_role" {
  name = var.role_name

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect    = "Allow",
      Principal = { Federated = data.aws_iam_openid_connect_provider.github.arn },
      Action    = "sts:AssumeRoleWithWebIdentity",
      Condition = {
        StringEquals = {
          "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
        },
        StringLike = {
          # limit to pushes on main in this repo
          "token.actions.githubusercontent.com:sub" = "repo:${var.github_org}/${var.github_repo}:ref:refs/heads/main"
        }
      }
    }]
  })
}

# Minimal policy; replace with least-priv you need for plan/apply
data "aws_iam_policy_document" "policy" {
  statement {
    sid     = "ReadStateAndPlanCore"
    effect  = "Allow"
    actions = [
      "s3:GetObject", "s3:ListBucket",
      "sts:GetCallerIdentity",
      "ec2:Describe*",
      "iam:List*",
      "iam:Get*"
    ]
    resources = ["*"]
  }
}

resource "aws_iam_policy" "github_oidc_policy" {
  name   = "${var.role_name}-policy"
  policy = data.aws_iam_policy_document.policy.json
}

resource "aws_iam_role_policy_attachment" "attach" {
  role       = aws_iam_role.github_oidc_role.name
  policy_arn = aws_iam_policy.github_oidc_policy.arn
}

output "role_arn" {
  value = aws_iam_role.github_oidc_role.arn
}
