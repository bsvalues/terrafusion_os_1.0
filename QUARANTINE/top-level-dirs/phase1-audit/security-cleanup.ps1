# TerraFusion Security Cleanup - Phase 2 Day 1
# THE TERRAFUSION WAY: Safe, Systematic, Documented
#
# This script will:
# 1. Back up current .env file
# 2. Create .env.example template
# 3. Update .gitignore to prevent future accidents
# 4. Generate secure random credentials
# 5. Create documentation for team
#
# IMPORTANT: This does NOT delete private keys or clean Git history
# Those are manual operations requiring careful coordination

param(
    [switch]$DryRun = $false,
    [string]$BackupDir = ".\security-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
)

Write-Host ""
Write-Host "🔒 TerraFusion Security Cleanup - Phase 2 Day 1" -ForegroundColor Cyan
Write-Host "=" -repeat 70 -ForegroundColor Cyan
Write-Host ""

if ($DryRun) {
    Write-Host "⚠️  DRY RUN MODE - No changes will be made" -ForegroundColor Yellow
    Write-Host ""
}

# Statistics
$stats = @{
    EnvFilesFound = 0
    EnvFilesBackedUp = 0
    PrivateKeysFound = 0
    SecretsGenerated = 0
    FilesUpdated = 0
}

# ===== Step 1: Create Backup Directory =====
Write-Host "📦 Step 1: Creating security backup..." -ForegroundColor Cyan

if (!$DryRun) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    Write-Host "  ✓ Created backup directory: $BackupDir" -ForegroundColor Green
} else {
    Write-Host "  ✓ Would create: $BackupDir" -ForegroundColor Yellow
}

# ===== Step 2: Back Up Current .env File =====
Write-Host ""
Write-Host "💾 Step 2: Backing up .env file..." -ForegroundColor Cyan

$envFile = ".env"
if (Test-Path $envFile) {
    $stats.EnvFilesFound++
    
    if (!$DryRun) {
        Copy-Item $envFile -Destination (Join-Path $BackupDir ".env.backup")
        Write-Host "  ✓ Backed up: $envFile" -ForegroundColor Green
        $stats.EnvFilesBackedUp++
    } else {
        Write-Host "  ✓ Would backup: $envFile" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ⚠️  No .env file found at root" -ForegroundColor Yellow
}

# ===== Step 3: Generate Secure Random Secrets =====
Write-Host ""
Write-Host "🔐 Step 3: Generating secure credentials..." -ForegroundColor Cyan

function New-SecurePassword {
    param([int]$Length = 64)
    
    $chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+[]{}|;:,.<>?"
    $password = -join ((1..$Length) | ForEach-Object { $chars[(Get-Random -Maximum $chars.Length)] })
    return $password
}

$newSecrets = @{
    POSTGRES_PASSWORD = New-SecurePassword -Length 64
    REDIS_PASSWORD = New-SecurePassword -Length 64
    JWT_SECRET = New-SecurePassword -Length 128
    ENCRYPTION_KEY = New-SecurePassword -Length 64
    GRAFANA_ADMIN_PASSWORD = New-SecurePassword -Length 32
    CERT_PASSWORD = New-SecurePassword -Length 64
}

Write-Host "  ✓ Generated 6 secure credentials" -ForegroundColor Green
Write-Host "    - POSTGRES_PASSWORD (64 chars)" -ForegroundColor Gray
Write-Host "    - REDIS_PASSWORD (64 chars)" -ForegroundColor Gray
Write-Host "    - JWT_SECRET (128 chars)" -ForegroundColor Gray
Write-Host "    - ENCRYPTION_KEY (64 chars)" -ForegroundColor Gray
Write-Host "    - GRAFANA_ADMIN_PASSWORD (32 chars)" -ForegroundColor Gray
Write-Host "    - CERT_PASSWORD (64 chars)" -ForegroundColor Gray

$stats.SecretsGenerated = 6

# ===== Step 4: Create .env.example Template =====
Write-Host ""
Write-Host "📝 Step 4: Creating .env.example template..." -ForegroundColor Cyan

$envExample = @"
# TerraFusion Environment Configuration
# =======================================
# Copy this file to .env and fill in actual values
# NEVER commit .env file to Git!
#
# For local development: Use placeholder values or local dev secrets
# For production: Use Azure Key Vault or secrets management system

# ===== Core =====
TF_ENV=development
COUNTY_NAME="Your County Name"
COUNTY_CODE=US-STATE-COUNTY

# ===== Service Ports =====
TF_API_PORT=5055
TF_LEVY_PORT=3202
TF_TRENDS_PORT=3203
TF_CONSCIOUSNESS_PORT=8080
TF_SHELL_PORT=3000

# ===== Networking =====
TF_NETWORK=terrafusion_dev
TF_SUBNET=172.30.10.0/24

# ===== Postgres / PostGIS =====
POSTGRES_USER=terrafusion
POSTGRES_PASSWORD=<REPLACE_WITH_SECURE_PASSWORD>
POSTGRES_DB=terrafusion_dev
POSTGRES_HOST=db
POSTGRES_PORT=5432

# ===== Redis =====
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=<REPLACE_WITH_SECURE_PASSWORD>

# ===== App Secrets =====
# CRITICAL: Generate secure random values!
# Use: openssl rand -base64 64
JWT_SECRET=<REPLACE_WITH_128_CHAR_RANDOM_STRING>
ENCRYPTION_KEY=<REPLACE_WITH_64_CHAR_RANDOM_STRING>

# ===== AI / MCP =====
MCP_ENABLED=true
MCP_ENDPOINT=http://core:`${TF_MCP_PORT:-8080}/mcp

# ===== Harris PACS Integration =====
HARRIS_PACS_ENABLED=false
HARRIS_PACS_ENDPOINT=<REPLACE_WITH_COUNTY_PACS_ENDPOINT>
HARRIS_PACS_API_KEY=<REPLACE_WITH_API_KEY_FROM_COUNTY>
HARRIS_PACS_TIMEOUT=30000
HARRIS_PACS_RETRY_COUNT=3

# ===== Dynamic Port Configuration =====
TF_API_PORT=5046
TF_FRONTEND_PORT=3102
TF_SHELL_PORT=3103
TF_DESKTOP_PORT=3104
TF_STATIC_PORT=8080

# ===== API URLs =====
VITE_API_URL=http://localhost:`${TF_API_PORT:-5000}/api
REACT_APP_API_GATEWAY=http://localhost:`${TF_API_PORT:-5000}
ASPNETCORE_URLS=http://localhost:`${TF_API_PORT:-5000}

# ===== Paths =====
DATA_DIR=./data/dev
ARTIFACTS_DIR=./artifacts/dev

# ===== Additional Security =====
GRAFANA_ADMIN_PASSWORD=<REPLACE_WITH_SECURE_PASSWORD>
CERT_PASSWORD=<REPLACE_WITH_SECURE_PASSWORD>

# ===== Azure Key Vault (Production) =====
# KEYVAULT_URL=https://terrafusion-prod-kv.vault.azure.net/
# KEYVAULT_TENANT_ID=<your-tenant-id>
# KEYVAULT_CLIENT_ID=<your-client-id>
"@

if (!$DryRun) {
    $envExample | Set-Content -Path ".env.example" -Force
    Write-Host "  ✓ Created .env.example template" -ForegroundColor Green
    $stats.FilesUpdated++
} else {
    Write-Host "  ✓ Would create .env.example" -ForegroundColor Yellow
}

# ===== Step 5: Save Generated Secrets =====
Write-Host ""
Write-Host "🔑 Step 5: Saving generated secrets..." -ForegroundColor Cyan

$secretsFile = Join-Path $BackupDir "NEW_SECRETS.txt"
$secretsContent = @"
TerraFusion - NEW SECURE CREDENTIALS
Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
=====================================

⚠️  IMPORTANT: These are the NEW credentials to replace the old ones.
⚠️  Store these in Azure Key Vault or secure password manager.
⚠️  Delete this file after storing secrets securely!

POSTGRES_PASSWORD=$($newSecrets.POSTGRES_PASSWORD)

REDIS_PASSWORD=$($newSecrets.REDIS_PASSWORD)

JWT_SECRET=$($newSecrets.JWT_SECRET)

ENCRYPTION_KEY=$($newSecrets.ENCRYPTION_KEY)

GRAFANA_ADMIN_PASSWORD=$($newSecrets.GRAFANA_ADMIN_PASSWORD)

CERT_PASSWORD=$($newSecrets.CERT_PASSWORD)

=====================================
NEXT STEPS:
1. Store these in Azure Key Vault
2. Update .env file with these values (for local testing only)
3. Update all service configurations
4. Test all services with new credentials
5. Delete this file after confirming everything works
6. Rotate Harris PACS API key with county
"@

if (!$DryRun) {
    $secretsContent | Set-Content -Path $secretsFile -Force
    Write-Host "  ✓ Saved new credentials to: $secretsFile" -ForegroundColor Green
    Write-Host "    ⚠️  Store these in Key Vault and DELETE this file!" -ForegroundColor Yellow
} else {
    Write-Host "  ✓ Would save secrets to: $secretsFile" -ForegroundColor Yellow
}

# ===== Step 6: Update .gitignore =====
Write-Host ""
Write-Host "🚫 Step 6: Updating .gitignore..." -ForegroundColor Cyan

$gitignoreAdditions = @"

# ===== TerraFusion Security - Added $(Get-Date -Format "yyyy-MM-dd") =====
# CRITICAL: Never commit secrets, credentials, or private keys!

# Environment files with secrets
.env
.env.*
!.env.example
*.env
!*.env.example

# Private keys and certificates
*.key
*.pem
!*-public.pem
*-private.pem
*.p12
*.pfx
*.cer
*.crt
ca_private.key
*password*
*secret*
*.keystore

# Certificate and key directories
certs/
keys/
trust-fabric/ca/
trust-fabric/keys/
trust-fabric/keystore/
ops/security/rs256/

# Security backups
security-backup-*/
*.backup

# Azure Key Vault config (if storing connection details)
keyvault-config.json
"@

$gitignorePath = ".gitignore"
if (Test-Path $gitignorePath) {
    if (!$DryRun) {
        # Check if already added
        $currentGitignore = Get-Content $gitignorePath -Raw
        if ($currentGitignore -notmatch "TerraFusion Security") {
            Add-Content -Path $gitignorePath -Value $gitignoreAdditions
            Write-Host "  ✓ Updated .gitignore with security rules" -ForegroundColor Green
            $stats.FilesUpdated++
        } else {
            Write-Host "  ℹ️  .gitignore already contains security rules" -ForegroundColor Cyan
        }
    } else {
        Write-Host "  ✓ Would update .gitignore" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ⚠️  No .gitignore found" -ForegroundColor Yellow
}

# ===== Step 7: Scan for Private Keys =====
Write-Host ""
Write-Host "🔍 Step 7: Scanning for private keys..." -ForegroundColor Cyan

$privateKeyPaths = @(
    "trust-fabric/ca/*.key",
    "trust-fabric/keys/**/*.key",
    "trust-fabric/keystore/**/*.key",
    "ops/security/**/*-private.pem",
    "keys/*-private.pem",
    "keys/test*.pem",
    "certs/**/*-key.pem"
)

$foundKeys = @()
foreach ($pattern in $privateKeyPaths) {
    $keys = Get-ChildItem -Path $pattern -ErrorAction SilentlyContinue -Recurse
    $foundKeys += $keys
}

$stats.PrivateKeysFound = $foundKeys.Count
Write-Host "  ⚠️  Found $($stats.PrivateKeysFound) private key files" -ForegroundColor Yellow
Write-Host "    (These should be regenerated and stored in Azure Key Vault)" -ForegroundColor Gray

# ===== Summary =====
Write-Host ""
Write-Host "📊 SECURITY CLEANUP SUMMARY" -ForegroundColor Cyan
Write-Host "=" -repeat 70 -ForegroundColor Cyan
Write-Host ""

Write-Host "  Files Found:"
Write-Host "    - .env files: $($stats.EnvFilesFound)"
Write-Host "    - Private keys: $($stats.PrivateKeysFound)"
Write-Host ""

Write-Host "  Actions Taken:"
Write-Host "    - .env files backed up: $($stats.EnvFilesBackedUp)"
Write-Host "    - Secure credentials generated: $($stats.SecretsGenerated)"
Write-Host "    - Files created/updated: $($stats.FilesUpdated)"
Write-Host ""

Write-Host "  Created Files:"
Write-Host "    - $BackupDir/.env.backup"
Write-Host "    - $BackupDir/NEW_SECRETS.txt  ⚠️  SECURE & DELETE!"
Write-Host "    - .env.example"
Write-Host "    - .gitignore (updated)"
Write-Host ""

if (!$DryRun) {
    Write-Host "✅ Phase 1 Complete: Backup & Template Creation" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Dry run complete - no changes made" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "📋 NEXT STEPS (Manual Actions Required):" -ForegroundColor Yellow
Write-Host ""
Write-Host "  1. Review generated secrets in: $BackupDir/NEW_SECRETS.txt"
Write-Host "  2. Create Azure Key Vault instance"
Write-Host "  3. Store all secrets in Key Vault"
Write-Host "  4. Regenerate all private keys (trust-fabric, ops/security, certs, keys)"
Write-Host "  5. Update .env with new credentials (for local testing only)"
Write-Host "  6. Test all services with new credentials"
Write-Host "  7. Delete NEW_SECRETS.txt after confirming everything works"
Write-Host "  8. Commit .env.example and .gitignore changes"
Write-Host "  9. Consider cleaning Git history (coordinate with team)"
Write-Host ""
Write-Host "⚠️  WARNING: Do NOT commit the .env file or new secrets!" -ForegroundColor Red
Write-Host ""
Write-Host "=" -repeat 70 -ForegroundColor Cyan
