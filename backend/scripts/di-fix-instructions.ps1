#!/usr/bin/env pwsh
<#
.SYNOPSIS
    TerraFusion Elite - Manual DI Fix Instructions
.DESCRIPTION
    Provides exact code to add to Program.cs to fix DI issues
#>

Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║  TERRAFUSION ELITE - DEPENDENCY INJECTION FIX GUIDE            ║" -ForegroundColor Magenta
Write-Host "╚════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Magenta

Write-Host "📝 File to Edit: TerraFusion.API\Program.cs`n" -ForegroundColor Cyan

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray

Write-Host "🔧 FIX #1: Add IDynamicPropertyService Registration" -ForegroundColor Yellow
Write-Host "Location: After line 143 (after LegacyDatabaseService registration)`n" -ForegroundColor Gray

Write-Host "ADD THIS CODE:" -ForegroundColor Green
Write-Host @"
// Register Dynamic Property Service (REQUIRED by HarrisPacsLegacyService)
builder.Services.AddScoped<TerraFusion.Core.Services.IDynamicPropertyService,
                           TerraFusion.Core.Services.DynamicPropertyService>();

"@ -ForegroundColor White

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray

Write-Host "🔧 FIX #2: Add Optional Redis Configuration" -ForegroundColor Yellow
Write-Host "Location: After line ~30 (after builder creation)`n" -ForegroundColor Gray

Write-Host "ADD THIS CODE:" -ForegroundColor Green
Write-Host @"
// Redis Configuration (Optional - graceful degradation)
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
        Console.WriteLine("ℹ️  Redis not configured - using in-memory cache");
    }
}
catch (Exception ex)
{
    Console.WriteLine("⚠️  Redis unavailable: {0} - using in-memory cache", ex.Message);
}

"@ -ForegroundColor White

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray

Write-Host "🎯 After Adding Both Fixes:" -ForegroundColor Cyan
Write-Host "  1. Save Program.cs" -ForegroundColor White
Write-Host "  2. Rebuild: dotnet build TerraFusion.sln --no-restore" -ForegroundColor White
Write-Host "  3. Test API: dotnet run --project TerraFusion.API --no-build`n" -ForegroundColor White

Write-Host "✅ These fixes will resolve ALL dependency injection errors`n" -ForegroundColor Green
