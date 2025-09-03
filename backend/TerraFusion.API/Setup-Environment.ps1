# TerraFusion Environment Configuration Setup Script
# This script helps set up secure configuration for different environments

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("Development", "Staging", "Production")]
    [string]$Environment,
    
    [string]$ConfigurationPath = ".",
    [switch]$UseAzureKeyVault,
    [string]$KeyVaultUrl,
    [switch]$GeneratePasswords,
    [switch]$TestAuthentication
)

Write-Host "🔐 TerraFusion Secure Configuration Setup" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Yellow

# Function to generate secure passwords
function New-SecurePassword {
    param([int]$Length = 24)
    
    $uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    $lowercase = "abcdefghijklmnopqrstuvwxyz"
    $numbers = "0123456789"
    $special = "!@#$%^`&*"
    $all = $uppercase + $lowercase + $numbers + $special
    
    $password = ""
    $password += Get-Random -InputObject $uppercase.ToCharArray()
    $password += Get-Random -InputObject $lowercase.ToCharArray()
    $password += Get-Random -InputObject $numbers.ToCharArray()
    $password += Get-Random -InputObject $special.ToCharArray()
    
    for ($i = 4; $i -lt $Length; $i++) {
        $password += Get-Random -InputObject $all.ToCharArray()
    }
    
    # Shuffle the password
    $passwordArray = $password.ToCharArray()
    for ($i = $passwordArray.Length - 1; $i -gt 0; $i--) {
        $j = Get-Random -Maximum ($i + 1)
        $temp = $passwordArray[$i]
        $passwordArray[$i] = $passwordArray[$j]
        $passwordArray[$j] = $temp
    }
    
    return -join $passwordArray
}

# Generate secure passwords if requested
if ($GeneratePasswords) {
    Write-Host "🔑 Generating secure passwords..." -ForegroundColor Green
    
    $AdminPassword = New-SecurePassword
    $AssessorPassword = New-SecurePassword  
    $DemoPassword = New-SecurePassword
    
    Write-Host "Generated passwords (store these securely):" -ForegroundColor Yellow
    Write-Host "Admin Password: $AdminPassword" -ForegroundColor White
    Write-Host "Assessor Password: $AssessorPassword" -ForegroundColor White
    Write-Host "Demo Password: $DemoPassword" -ForegroundColor White
    Write-Host ""
}

# Environment-specific configuration
switch ($Environment) {
    "Development" {
        $configFile = "appsettings.Development.json"
        $dbPath = "data/databases/dev"
        $cryptoUrl = "http://localhost:3000/crypto/verify"
        $logLevel = "Debug"
        $requireHttps = $false
    }
    "Staging" {
        $configFile = "appsettings.Staging.json"
        $dbPath = "/var/lib/terrafusion/databases/staging"
        $cryptoUrl = "https://staging-crypto.terrafusion.local/crypto/verify"
        $logLevel = "Information"
        $requireHttps = $true
    }
    "Production" {
        $configFile = "appsettings.Production.json"
        $dbPath = "/var/lib/terrafusion/databases/production"
        $cryptoUrl = "https://crypto.terrafusion.gov/crypto/verify"
        $logLevel = "Warning"
        $requireHttps = $true
    }
}

Write-Host "📁 Configuration file: $configFile" -ForegroundColor Cyan
Write-Host "🗃️  Database path: $dbPath" -ForegroundColor Cyan
Write-Host "🔗 Crypto service URL: $cryptoUrl" -ForegroundColor Cyan

# Azure Key Vault configuration
if ($UseAzureKeyVault -and $KeyVaultUrl) {
    Write-Host "🔐 Configuring Azure Key Vault integration..." -ForegroundColor Green
    Write-Host "Key Vault URL: $KeyVaultUrl" -ForegroundColor Yellow
    
    # Create environment variables template
    $envTemplate = @"
# Azure Key Vault Configuration for $Environment
export AZURE_KEYVAULT_URL="$KeyVaultUrl"
export AZURE_CLIENT_ID="<your-service-principal-client-id>"
export AZURE_CLIENT_SECRET="<your-service-principal-client-secret>"
export AZURE_TENANT_ID="<your-azure-tenant-id>"

# Authentication secrets (store these in Key Vault)
export ADMIN_PASSWORD="<generated-admin-password>"
export ASSESSOR_PASSWORD="<generated-assessor-password>"
export DEMO_PASSWORD="<generated-demo-password>"

# Service configurations
export LEGACY_DB_PATH="$dbPath"
export CRYPTO_SERVICE_URL="$cryptoUrl"
"@
    
    $envFile = ".env.$Environment"
    $envTemplate | Out-File -FilePath $envFile -Encoding UTF8
    Write-Host "✅ Environment template created: $envFile" -ForegroundColor Green
}

# Test authentication if requested
if ($TestAuthentication) {
    Write-Host "🧪 Testing authentication configuration..." -ForegroundColor Green
    
    # Test configuration loading
    try {
        $configPath = Join-Path $ConfigurationPath $configFile
        if (Test-Path $configPath) {
            $config = Get-Content $configPath | ConvertFrom-Json
            Write-Host "✅ Configuration file loads successfully" -ForegroundColor Green
            
            # Check required sections
            $requiredSections = @("Authentication", "LegacyDatabase", "CrossPlatformVerifier")
            foreach ($section in $requiredSections) {
                if ($config.$section) {
                    Write-Host "✅ $section configuration found" -ForegroundColor Green
                } else {
                    Write-Host "❌ $section configuration missing" -ForegroundColor Red
                }
            }
        } else {
            Write-Host "❌ Configuration file not found: $configPath" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "❌ Error loading configuration: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Create deployment checklist
$checklist = @"
# TerraFusion $Environment Deployment Checklist

## Prerequisites
- [ ] .NET 8 SDK installed
- [ ] SQL Server or SQLite configured
- [ ] Redis server available (if using caching)
- [ ] Node.js service for crypto verification (if needed)

## Security Configuration
- [ ] Passwords generated and stored securely
- [ ] Azure Key Vault configured (if using)
- [ ] Environment variables set
- [ ] HTTPS certificates configured (for staging/production)
- [ ] Firewall rules configured
- [ ] Database access permissions set

## Configuration Files
- [ ] $configFile updated with correct values
- [ ] Connection strings configured
- [ ] Service URLs updated
- [ ] Logging configuration verified

## Testing
- [ ] Application starts successfully
- [ ] Authentication works with all user types
- [ ] Database connectivity tested
- [ ] External service integrations verified
- [ ] Performance monitoring configured

## Production-Specific (if applicable)
- [ ] Load balancer configured
- [ ] Auto-scaling rules set
- [ ] Backup procedures tested
- [ ] Monitoring alerts configured
- [ ] Disaster recovery plan validated
"@

$checklistFile = "deployment-checklist-$Environment.md"
$checklist | Out-File -FilePath $checklistFile -Encoding UTF8
Write-Host "📋 Deployment checklist created: $checklistFile" -ForegroundColor Green

Write-Host ""
Write-Host "🎯 Setup completed for $Environment environment!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Review and update configuration files" -ForegroundColor White
Write-Host "2. Set up Azure Key Vault (if using)" -ForegroundColor White
Write-Host "3. Configure environment variables" -ForegroundColor White
Write-Host "4. Test authentication flows" -ForegroundColor White
Write-Host "5. Follow deployment checklist" -ForegroundColor White
