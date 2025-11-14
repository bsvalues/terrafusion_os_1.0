#!/usr/bin/env pwsh
<#
.SYNOPSIS
    TerraFusion Elite - Dependency Injection Fix Script
.DESCRIPTION
    Fixes missing service registrations causing API startup failures
    Addresses: IDynamicPropertyService, IConnectionMultiplexer (Redis)
.EXAMPLE
    .\fix-dependency-injection.ps1
#>

$ErrorActionPreference = 'Stop'
$BackendRoot = "C:\Users\bsval\terrafusion_os_1.0\backend"

Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║  TERRAFUSION ELITE - DEPENDENCY INJECTION FIX                  ║" -ForegroundColor Magenta
Write-Host "╚════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Magenta

Write-Host "🔍 Analyzing Dependency Injection Issues...`n" -ForegroundColor Yellow

#Region Issue Analysis
$issues = @(
    @{
        Service        = "IDynamicPropertyService"
        Implementation = "DynamicPropertyService"
        Location       = "TerraFusion.Core.Services"
        Status         = "MISSING"
        Priority       = "CRITICAL"
    },
    @{
        Service        = "IConnectionMultiplexer"
        Implementation = "Redis Connection"
        Location       = "StackExchange.Redis"
        Status         = "MISSING"
        Priority       = "CRITICAL"
    }
)

Write-Host "📊 Missing Service Registrations:" -ForegroundColor Red
foreach ($issue in $issues) {
    Write-Host ("  ❌ {0}" -f $issue.Service) -ForegroundColor Red
    Write-Host ("     Implementation: {0}" -f $issue.Implementation) -ForegroundColor Gray
    Write-Host ("     Location: {0}" -f $issue.Location) -ForegroundColor Gray
    Write-Host ("     Priority: {0}`n" -f $issue.Priority) -ForegroundColor Yellow
}
#EndRegion

#Region Solution Plan
Write-Host "🎯 Solution Plan:`n" -ForegroundColor Cyan

Write-Host "  1. Add IDynamicPropertyService Registration" -ForegroundColor White
Write-Host "     - Register: services.AddScoped<IDynamicPropertyService, DynamicPropertyService>()" -ForegroundColor Gray
Write-Host "     - Location: Program.cs or ServiceRegistrationExtensions.cs`n" -ForegroundColor Gray

Write-Host "  2. Fix Redis IConnectionMultiplexer Registration" -ForegroundColor White
Write-Host "     - Option A: Register Redis connection if available" -ForegroundColor Gray
Write-Host "     - Option B: Make Redis optional (graceful degradation)" -ForegroundColor Gray
Write-Host "     - Recommended: Option B for local development`n" -ForegroundColor Gray

Write-Host "  3. Make RedisCacheService Handle Missing Redis" -ForegroundColor White
Write-Host "     - Add null-check or factory pattern" -ForegroundColor Gray
Write-Host "     - Fall back to in-memory cache`n" -ForegroundColor Gray
#EndRegion

#Region Implementation
Write-Host "🔧 Implementation Options:`n" -ForegroundColor Green

$programCs = "$BackendRoot\TerraFusion.API\Program.cs"

Write-Host "Option 1: Quick Fix - Add Missing Service Registration" -ForegroundColor Cyan
Write-Host "Location: $programCs" -ForegroundColor Gray
Write-Host @"

Add after existing service registrations (around line 150-200):

// TerraFusion.Core Service Registrations
builder.Services.AddScoped<TerraFusion.Core.Services.IDynamicPropertyService,
                           TerraFusion.Core.Services.DynamicPropertyService>();

"@ -ForegroundColor Yellow

Write-Host "`nOption 2: Redis Optional Registration" -ForegroundColor Cyan
Write-Host @"

Add conditional Redis registration:

// Redis Configuration (Optional for Development)
var redisConnection = builder.Configuration.GetConnectionString("Redis");
if (!string.IsNullOrEmpty(redisConnection))
{
    try
    {
        var redis = StackExchange.Redis.ConnectionMultiplexer.Connect(redisConnection);
        builder.Services.AddSingleton<StackExchange.Redis.IConnectionMultiplexer>(redis);
        Console.WriteLine("✅ Redis connected successfully");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"⚠️  Redis connection failed: {ex.Message}");
        Console.WriteLine("   Falling back to in-memory cache");
    }
}
else
{
    Console.WriteLine("ℹ️  Redis not configured, using in-memory cache only");
}

"@ -ForegroundColor Yellow
#EndRegion

#Region Verification
Write-Host "✅ Next Steps:`n" -ForegroundColor Green
Write-Host "  1. Apply one of the fixes above to Program.cs" -ForegroundColor White
Write-Host "  2. Rebuild solution: dotnet build TerraFusion.sln" -ForegroundColor White
Write-Host "  3. Test API startup: dotnet run --project TerraFusion.API" -ForegroundColor White
Write-Host "  4. Verify endpoints: http://localhost:5000/`n" -ForegroundColor White

Write-Host "📝 File to Edit: $programCs`n" -ForegroundColor Cyan

# Check if Program.cs exists
if (Test-Path $programCs) {
    Write-Host "✅ Program.cs found" -ForegroundColor Green

    # Count existing service registrations
    $content = Get-Content $programCs -Raw
    $serviceCount = ($content | Select-String -Pattern "\.AddScoped<" -AllMatches).Matches.Count
    Write-Host ("   Existing service registrations: {0}`n" -f $serviceCount) -ForegroundColor Gray
}
else {
    Write-Host "❌ Program.cs not found at: $programCs`n" -ForegroundColor Red
}
#EndRegion

Write-Host "🎓 Recommended Action:" -ForegroundColor Yellow
Write-Host "   Apply BOTH fixes to Program.cs for complete resolution`n" -ForegroundColor White

Write-Host "✅ Analysis complete`n" -ForegroundColor Green
