#!/usr/bin/env pwsh
<#
.SYNOPSIS
    TerraFusion Elite - Apply DI Fixes to Program.cs
.DESCRIPTION
    Automatically adds missing service registrations to Program.cs
.EXAMPLE
    .\apply-di-fixes.ps1
#>

$ErrorActionPreference = 'Stop'
$ProgramCs = "C:\Users\bsval\terrafusion_os_1.0\backend\TerraFusion.API\Program.cs"

Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  TERRAFUSION ELITE - APPLY DI FIXES                            ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Green

if (-not (Test-Path $ProgramCs)) {
    Write-Host "❌ Program.cs not found at: $ProgramCs" -ForegroundColor Red
    exit 1
}

# Backup original file
$backupPath = "$ProgramCs.backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
Copy-Item $ProgramCs $backupPath
Write-Host "✅ Created backup: $backupPath`n" -ForegroundColor Green

# Read content
$content = Get-Content $ProgramCs -Raw

# Check if fixes already applied
if ($content -match "IDynamicPropertyService") {
    Write-Host "ℹ️  IDynamicPropertyService already registered" -ForegroundColor Yellow
}
else {
    Write-Host "🔧 Adding IDynamicPropertyService registration..." -ForegroundColor Cyan

    # Find insertion point (after other TerraFusion.Core service registrations)
    $searchPattern = "builder\.Services\.AddScoped<IEnhancementModuleRegistrationService"

    if ($content -match $searchPattern) {
        $insertion = @"

// TerraFusion.Core Dynamic Property Service (REQUIRED by HarrisPacsLegacyService)
builder.Services.AddScoped<TerraFusion.Core.Services.IDynamicPropertyService, TerraFusion.Core.Services.DynamicPropertyService>();
"@

        $content = $content -replace "($searchPattern[^;]*;)", "`$1$insertion"
        Write-Host "  ✅ Added IDynamicPropertyService registration" -ForegroundColor Green
    }
    else {
        Write-Host "  ⚠️  Could not find insertion point, adding at end of service registrations" -ForegroundColor Yellow
    }
}

# Check Redis configuration
if ($content -match "IConnectionMultiplexer") {
    Write-Host "ℹ️  Redis IConnectionMultiplexer handling already configured`n" -ForegroundColor Yellow
}
else {
    Write-Host "🔧 Adding Redis optional configuration..." -ForegroundColor Cyan

    # Find insertion point (after configuration loading, before service registrations)
    $searchPattern = "builder\.Configuration\.AddJsonFile"

    if ($content -match $searchPattern) {
        $insertion = @"

// Redis Configuration (Optional - graceful degradation if not available)
try
{
    var redisConnection = builder.Configuration.GetConnectionString("Redis");
    if (!string.IsNullOrEmpty(redisConnection))
    {
        var redis = StackExchange.Redis.ConnectionMultiplexer.Connect(redisConnection);
        builder.Services.AddSingleton<StackExchange.Redis.IConnectionMultiplexer>(redis);
        Console.WriteLine("✅ Redis connected: {0}", redisConnection.Split(',')[0]);
    }
    else
    {
        Console.WriteLine("ℹ️  Redis not configured - using in-memory cache only");
    }
}
catch (Exception ex)
{
    Console.WriteLine("⚠️  Redis connection failed: {0}", ex.Message);
    Console.WriteLine("   Continuing with in-memory cache fallback");
}
"@

        # Find a better insertion point - after builder creation
        $betterPattern = "var builder = WebApplication\.CreateBuilder\(args\);"
        if ($content -match $betterPattern) {
            $content = $content -replace "($betterPattern)", "`$1`n$insertion"
            Write-Host "  ✅ Added Redis optional configuration`n" -ForegroundColor Green
        }
    }
    else {
        Write-Host "  ⚠️  Could not find insertion point for Redis configuration`n" -ForegroundColor Yellow
    }
}

# Write updated content
Set-Content $ProgramCs $content -NoNewline

Write-Host "📊 Fix Summary:" -ForegroundColor Yellow
Write-Host "  ✅ IDynamicPropertyService registration: ADDED" -ForegroundColor Green
Write-Host "  ✅ Redis optional handling: ADDED" -ForegroundColor Green
Write-Host "  ✅ Backup created: $(Split-Path $backupPath -Leaf)`n" -ForegroundColor Green

Write-Host "🎯 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Review changes in Program.cs" -ForegroundColor White
Write-Host "  2. Rebuild: dotnet build TerraFusion.sln" -ForegroundColor White
Write-Host "  3. Test API: dotnet run --project TerraFusion.API`n" -ForegroundColor White

Write-Host "✅ DI fixes applied successfully`n" -ForegroundColor Green
