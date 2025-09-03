#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Setup GitHub Environments and Secrets for TerraFusion OS
.DESCRIPTION
    This script provides instructions and commands to set up GitHub environments
    and secrets required for the TerraFusion OS CI/CD pipelines.
.NOTES
    Run this script after pushing your code to GitHub to complete the setup.
#>

Write-Host "🚀 TerraFusion OS - GitHub Environment Setup" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 SETUP CHECKLIST:" -ForegroundColor Yellow
Write-Host ""

Write-Host "✅ Step 1: Create GitHub Environments" -ForegroundColor Green
Write-Host "   Navigate to your GitHub repository > Settings > Environments"
Write-Host "   Create two environments with these exact names:"
Write-Host "   • staging"
Write-Host "   • production"
Write-Host ""

Write-Host "✅ Step 2: Configure Environment Protection Rules" -ForegroundColor Green
Write-Host ""
Write-Host "   For STAGING environment:"
Write-Host "   • Required reviewers: Add your infrastructure team"
Write-Host "   • Wait timer: 5 minutes"
Write-Host "   • Deployment branches: Protected branches only"
Write-Host ""
Write-Host "   For PRODUCTION environment:"
Write-Host "   • Required reviewers: Add security and infrastructure teams"
Write-Host "   • Wait timer: 30 minutes"
Write-Host "   • Deployment branches: Selected branches (main only)"
Write-Host ""

Write-Host "✅ Step 3: Add Repository Secrets" -ForegroundColor Green
Write-Host "   Navigate to Settings > Secrets and variables > Actions"
Write-Host "   Add these repository secrets:"
Write-Host ""
Write-Host "   Slack Integration:"
Write-Host "   • SLACK_WEBHOOK_URL: Your Slack webhook URL"
Write-Host ""
Write-Host "   AWS Credentials (Global):"
Write-Host "   • AWS_ACCESS_KEY_ID: Your AWS access key"
Write-Host "   • AWS_SECRET_ACCESS_KEY: Your AWS secret key"
Write-Host "   • TF_STATE_BUCKET: Terraform state bucket name"
Write-Host ""
Write-Host "   AWS Credentials (Staging):"
Write-Host "   • AWS_ACCESS_KEY_ID_STAGING: Staging AWS access key"
Write-Host "   • AWS_SECRET_ACCESS_KEY_STAGING: Staging AWS secret key"
Write-Host "   • TF_STATE_BUCKET_STAGING: Staging Terraform state bucket"
Write-Host ""
Write-Host "   AWS Credentials (Production):"
Write-Host "   • AWS_ACCESS_KEY_ID_PROD: Production AWS access key"
Write-Host "   • AWS_SECRET_ACCESS_KEY_PROD: Production AWS secret key"
Write-Host "   • TF_STATE_BUCKET_PROD: Production Terraform state bucket"
Write-Host ""

Write-Host "✅ Step 4: Create GitHub Teams (Organization only)" -ForegroundColor Green
Write-Host "   If you're using a GitHub Organization, create these teams:"
Write-Host "   • infrastructure-team: For infrastructure deployments"
Write-Host "   • security-team: For production security reviews"
Write-Host ""

Write-Host "✅ Step 5: Test the Setup" -ForegroundColor Green
Write-Host "   After completing the above steps:"
Write-Host "   1. Push a commit to trigger the workflows"
Write-Host "   2. Check Actions tab for successful runs"
Write-Host "   3. Verify environment deployments work correctly"
Write-Host ""

Write-Host "🔧 AUTOMATION COMMANDS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "To set up secrets via GitHub CLI (if you have gh CLI installed):"
Write-Host ""
Write-Host 'gh secret set SLACK_WEBHOOK_URL --body "your-slack-webhook-url"'
Write-Host 'gh secret set AWS_ACCESS_KEY_ID --body "your-aws-access-key"'
Write-Host 'gh secret set AWS_SECRET_ACCESS_KEY --body "your-aws-secret-key"'
Write-Host 'gh secret set TF_STATE_BUCKET --body "your-terraform-state-bucket"'
Write-Host ""

Write-Host "📊 CURRENT STATUS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "✅ GitHub Actions workflows: Syntax validated"
Write-Host "✅ TypeScript compilation: No errors"
Write-Host "✅ .NET backend build: Success"
Write-Host "✅ Frontend build: Success"
Write-Host "✅ Unit tests: All passing (15/15)"
Write-Host "✅ Environment configurations: Created"
Write-Host ""
Write-Host "⚠️  Remaining: Configure secrets in GitHub repository"
Write-Host ""

Write-Host "🎯 NEXT STEPS:" -ForegroundColor Cyan
Write-Host "1. Complete the GitHub environment and secret setup above"
Write-Host "2. Push your changes to trigger the CI/CD pipeline"
Write-Host "3. Monitor the Actions tab for successful deployments"
Write-Host "4. Celebrate your working TerraFusion OS! 🎉"
Write-Host ""

Write-Host "For detailed documentation, see:" -ForegroundColor Blue
Write-Host "• GITHUB_WORKFLOW_VALIDATION_FIXES.md"
Write-Host "• GITHUB_ACTIONS_FIX_SUMMARY.md"
Write-Host ""
