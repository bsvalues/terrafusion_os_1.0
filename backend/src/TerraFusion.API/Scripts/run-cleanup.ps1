#!/usr/bin/env pwsh

Write-Host "🔧 TerraFusion Database Cleanup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

$scriptContent = @'
using Microsoft.Data.Sqlite;
using System;
using System.IO;

var dbPath = "terrafusion.db";

if (!File.Exists(dbPath))
{
    Console.WriteLine("❌ Database not found at: " + Path.GetFullPath(dbPath));
    return 1;
}

var backupPath = $"terrafusion_backup_{DateTime.Now:yyyyMMdd_HHmmss}.db";
File.Copy(dbPath, backupPath, true);
Console.WriteLine($"✅ Backup created: {backupPath}");

try
{
    using var connection = new SqliteConnection($"Data Source={dbPath}");
    connection.Open();
    
    // Remove duplicate modules
    using (var cmd = connection.CreateCommand())
    {
        cmd.CommandText = @"
            DELETE FROM Modules 
            WHERE rowid NOT IN (
                SELECT MIN(rowid) 
                FROM Modules 
                GROUP BY Name
            )";
        var deletedDuplicates = cmd.ExecuteNonQuery();
        Console.WriteLine($"✅ Removed {deletedDuplicates} duplicate modules");
    }
    
    // Show current count
    using (var cmd = connection.CreateCommand())
    {
        cmd.CommandText = "SELECT COUNT(DISTINCT Name) FROM Modules";
        var uniqueCount = Convert.ToInt32(cmd.ExecuteScalar());
        Console.WriteLine($"📊 Database now has {uniqueCount} unique modules");
    }
    
    // Clean up orphaned entries
    using (var cmd = connection.CreateCommand())
    {
        cmd.CommandText = @"
            DELETE FROM Modules 
            WHERE Name NOT IN (
                'government-edition', 'costforge-ai-champion', 'terra-collections',
                'terra-levy', 'terra-insight', 'ai-command-brain', 'ai-swarm',
                'ai-advanced', 'testing-suite', 'development', 'commercial-suite',
                'marketplace-champion', 'gispro', 'TerraFusion-PublicRecords',
                'property-workbench', 'commercial', 'costforge-ai-desktop',
                'costforge-ai-enhanced', 'government-edition-enhanced',
                'shock-and-awe', 'terra-agent', 'terra-agent-champion',
                'terra-flow', 'terra-flow-champion', 'terra-fusion-assessor',
                'terra-fusion-dashboard', 'terra-fusion-sync', 'terra-miner',
                'TerraFusion_DevOps_Championship', 'TerraFusion_Record',
                'unified-system', 'web-audit-tracker'
            )";
        var deletedOrphans = cmd.ExecuteNonQuery();
        if (deletedOrphans > 0)
        {
            Console.WriteLine($"✅ Removed {deletedOrphans} invalid modules");
        }
    }
    
    // Optimize database
    using (var cmd = connection.CreateCommand())
    {
        cmd.CommandText = "VACUUM";
        cmd.ExecuteNonQuery();
        Console.WriteLine("✅ Database optimized");
    }
    
    Console.WriteLine("");
    Console.WriteLine("✨ Database cleanup complete!");
    return 0;
}
catch (Exception ex)
{
    Console.WriteLine($"❌ Error: {ex.Message}");
    return 1;
}
'@

# Save the script temporarily
$tempScript = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), "cleanup.csx")
$scriptContent | Out-File -FilePath $tempScript -Encoding UTF8

# Run the cleanup script
Push-Location $PSScriptRoot/..
try {
    dotnet script eval $tempScript 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  Trying alternative method..." -ForegroundColor Yellow
        dotnet run --project Scripts/CleanupRunner.csproj 2>$null
    }
}
finally {
    Pop-Location
    if (Test-Path $tempScript) {
        Remove-Item $tempScript -Force
    }
}

Write-Host ""
Write-Host "💡 Restart the API to apply changes:" -ForegroundColor Cyan
Write-Host "   cd backend" -ForegroundColor Gray
Write-Host "   dotnet run --project TerraFusion.API" -ForegroundColor Gray
