Write-Host "🔄 STRATEGY PIVOT: Fixing Root Cause" -ForegroundColor Cyan
cd "C:\Users\bsval\terrafusion_os_1.0\backend\TerraFusion.API"

# Restore disabled files
Get-ChildItem -Recurse -Filter "*.disabled" | ForEach-Object {
    $newName = $_.FullName -replace '\.disabled$', ''
    Move-Item $_.FullName $newName -Force
    Write-Host "  ✅ Restored $($_.Name)" -ForegroundColor Green
}

cd ..

# Check what SyncResult actually looks like
Write-Host "
📊 Finding SyncResult definition..." -ForegroundColor Yellow
Select-String -Path "TerraFusion.API\**\*.cs" -Pattern "class SyncResult|record SyncResult" | Select-Object -First 3

Write-Host "
🔧 Creating proper SyncResult if missing..." -ForegroundColor Yellow
# SyncResult should have Success, Message, and SyncOperations properties
$modelFile = "TerraFusion.API\Models\SyncResult.cs"
if (-not (Test-Path $modelFile)) {
    $content = @'
namespace TerraFusion.API.Models;

public class SyncResult
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<SyncOperation> SyncOperations { get; set; } = new();
    public DateTime SyncTimestamp { get; set; } = DateTime.UtcNow;
    public int RecordsProcessed { get; set; }
}

public class SyncOperation
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string OperationType { get; set; } = string.Empty;
}
'@
    Set-Content $modelFile $content -NoNewline
    Write-Host "  ✅ SyncResult class created" -ForegroundColor Green
}

Write-Host "
🔨 Building..." -ForegroundColor Cyan
dotnet build TerraFusion.API\TerraFusion.API.csproj --no-restore 2>&1 | Select-String "Build succeeded|Build FAILED"
