This PR needs a GitHub OIDC IAM role bootstrapped in AWS to allow `terraform-plan` on `main` to run safely without long-lived secrets.

Quick steps for infra operators:

1. Apply the bootstrap module to create the role

```bash
cd infrastructure/terraform/bootstrap/aws-github-oidc
terraform init
terraform apply -var 'account_id=123456789012' \
  -var 'github_org=YOUR_ORG' -var 'github_repo=YOUR_REPO' \
  -var 'region=us-west-2'
```

2. Copy the output `role_arn` from `terraform apply`.

3. Edit `.github/workflows/infrastructure-cicd.yml` and replace the placeholder

```yaml
role-to-assume: arn:aws:iam::<ACCOUNT_ID>:role/<TerraformGithubOIDCRole>
```

with the real role ARN you just created, e.g.

```yaml
role-to-assume: arn:aws:iam::123456789012:role/TerraformGithubOIDCRole
```

4. Push the change to `main` (or provide the role ARN via a secure secret/organization policy). Once present, the `terraform-plan` job will assume the role via GitHub OIDC and run `terraform plan` on `main` without relying on long-lived AWS keys.

Notes and recommendations:
- The bootstrap module restricts the role to `refs/heads/main` for this repo. If you want the role to be usable from other branches or repos, adjust `variables.github_org`, `variables.github_repo`, and the `StringLike` condition in `main.tf`.
- After creating the role, you may prefer to store the role ARN as a repository or organization secret and reference it in the workflow instead of editing the workflow file directly.
- The `aws_iam_policy` in the module is intentionally minimal; please tighten its permissions to the least privilege needed for your Terraform plans (S3 state read/list, and only the services Terraform needs).

If you'd like, I can post this as an actual comment on the open PR and then watch the workflow runs; say the word and I'll proceed to post and monitor.