# TerraFusion Environment Configuration Test Script
param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("Development", "Staging", "Production")]
    [string]$Environment
)

Write-Host "🔐 TerraFusion Secure Configuration Test" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Yellow

# Test configuration file existence
$configFile = "appsettings.$Environment.json"
Write-Host "Testing configuration file: $configFile" -ForegroundColor Green

if (Test-Path $configFile) {
    Write-Host "✅ Configuration file exists" -ForegroundColor Green
    
    try {
        $config = Get-Content $configFile | ConvertFrom-Json
        Write-Host "✅ Configuration file is valid JSON" -ForegroundColor Green
        
        # Check for required sections
        $requiredSections = @("Authentication", "LegacyDatabase", "CrossPlatformVerifier", "AzureKeyVault")
        foreach ($section in $requiredSections) {
            if ($config.$section) {
                Write-Host "✅ $section configuration found" -ForegroundColor Green
            } else {
                Write-Host "❌ $section configuration missing" -ForegroundColor Red
            }
        }
        
        # Check authentication passwords
        if ($config.Authentication) {
            $authFields = @("AdminPassword", "AssessorPassword", "DemoPassword")
            foreach ($field in $authFields) {
                if ($config.Authentication.$field) {
                    if ($config.Authentication.$field -eq "CHANGE_ME_IN_PRODUCTION") {
                        Write-Host "⚠️  $field needs to be changed from default" -ForegroundColor Yellow
                    } else {
                        Write-Host "✅ $field is configured" -ForegroundColor Green
                    }
                } else {
                    Write-Host "❌ $field is missing" -ForegroundColor Red
                }
            }
        }
        
    } catch {
        Write-Host "❌ Error parsing configuration: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Configuration file not found: $configFile" -ForegroundColor Red
}

Write-Host ""
Write-Host "Configuration Summary for ${Environment}:" -ForegroundColor Cyan

switch ($Environment) {
    "Development" {
        Write-Host "- Uses development database and local services" -ForegroundColor White
        Write-Host "- HTTPS not required for local testing" -ForegroundColor White
        Write-Host "- Debug logging enabled" -ForegroundColor White
    }
    "Staging" {
        Write-Host "- Uses staging database with environment variables" -ForegroundColor White
        Write-Host "- HTTPS required" -ForegroundColor White
        Write-Host "- Azure Key Vault integration enabled" -ForegroundColor White
    }
    "Production" {
        Write-Host "- Uses production database with Azure Key Vault secrets" -ForegroundColor White
        Write-Host "- HTTPS required with strict security" -ForegroundColor White
        Write-Host "- Full audit logging and monitoring" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "🎯 Test completed for $Environment environment!" -ForegroundColor Green
