# AWS GitHub OIDC Role Bootstrap

## Usage
```bash
cd infrastructure/terraform/bootstrap/aws-github-oidc
terraform init
terraform apply -var 'account_id=123456789012' \
  -var 'github_org=YOUR_ORG' -var 'github_repo=YOUR_REPO' \
  -var 'region=us-west-2'
```

Copy the `role_arn` output into:
`.github/workflows/infrastructure-cicd.yml` → `role-to-assume: <role_arn>`.
