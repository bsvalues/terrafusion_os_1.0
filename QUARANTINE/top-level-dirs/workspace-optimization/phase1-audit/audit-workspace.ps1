# TerraFusion Workspace Deep-Dive Audit Script
# Phase 1.2: Complete Workspace Inventory
# "THE TERRAFUSION WAY - We know everything we touch"

param(
    [string]$WorkspacePath = "C:\Users\bsval\terrafusion_os_1.0",
    [string]$OutputPath = "C:\Users\bsval\terrafusion_os_1.0\workspace-optimization\phase1-audit"
)

Write-Host "🌟 TerraFusion Workspace Deep-Dive Audit" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Initialize audit results
$auditResults = @{
    Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    WorkspacePath = $WorkspacePath
    Directories = @()
    Statistics = @{
        TotalDirectories = 0
        TotalFiles = 0
        TotalSize = 0
        CodeFiles = 0
        DocumentationFiles = 0
        ConfigFiles = 0
        TestFiles = 0
    }
}

# Get all top-level directories (excluding .git and node_modules)
$directories = Get-ChildItem -Path $WorkspacePath -Directory | 
    Where-Object { $_.Name -notmatch '^(node_modules|\.git|\.venv|__pycache__|obj|bin|\.pytest_cache)$' } |
    Sort-Object Name

Write-Host "📁 Found $($directories.Count) top-level directories to audit" -ForegroundColor Green
Write-Host ""

foreach ($dir in $directories) {
    Write-Host "🔍 Auditing: $($dir.Name)" -ForegroundColor Yellow
    
    $dirInfo = @{
        Name = $dir.Name
        FullPath = $dir.FullName
        Created = $dir.CreationTime
        Modified = $dir.LastWriteTime
        Files = @()
        Subdirectories = @()
        Statistics = @{
            FileCount = 0
            Size = 0
            FileTypes = @{}
        }
    }
    
    try {
        # Get all files in this directory (recursive, but limited depth for performance)
        $files = Get-ChildItem -Path $dir.FullName -File -Recurse -ErrorAction SilentlyContinue |
            Where-Object { $_.Directory.FullName -notmatch '(node_modules|\.git|\.venv|__pycache__|obj|bin)' } |
            Select-Object -First 1000  # Limit to prevent huge directories from hanging
        
        $dirInfo.Statistics.FileCount = $files.Count
        $dirInfo.Statistics.Size = ($files | Measure-Object -Property Length -Sum).Sum
        
        # Categorize file types
        $files | Group-Object Extension | ForEach-Object {
            $extension = if ($_.Name) { $_.Name } else { "(no extension)" }
            $dirInfo.Statistics.FileTypes[$extension] = $_.Count
        }
        
        # Get subdirectory count
        $subdirs = Get-ChildItem -Path $dir.FullName -Directory -ErrorAction SilentlyContinue |
            Where-Object { $_.Name -notmatch '^(node_modules|\.git|\.venv|__pycache__|obj|bin)$' }
        $dirInfo.Subdirectories = $subdirs | Select-Object -First 20 | ForEach-Object { $_.Name }
        
        # Sample some files (first 10)
        $dirInfo.Files = $files | Select-Object -First 10 | ForEach-Object {
            @{
                Name = $_.Name
                Extension = $_.Extension
                Size = $_.Length
                Modified = $_.LastWriteTime
            }
        }
        
        # Update global statistics
        $auditResults.Statistics.TotalFiles += $dirInfo.Statistics.FileCount
        $auditResults.Statistics.TotalSize += $dirInfo.Statistics.Size
        
        # Categorize by common file types
        foreach ($ext in $dirInfo.Statistics.FileTypes.Keys) {
            switch -Regex ($ext) {
                '\.(cs|ts|tsx|js|jsx|py|rs|go)$' { $auditResults.Statistics.CodeFiles += $dirInfo.Statistics.FileTypes[$ext] }
                '\.(md|txt|pdf|doc|docx)$' { $auditResults.Statistics.DocumentationFiles += $dirInfo.Statistics.FileTypes[$ext] }
                '\.(json|yml|yaml|toml|xml|config|ini)$' { $auditResults.Statistics.ConfigFiles += $dirInfo.Statistics.FileTypes[$ext] }
                '\.(test\.|spec\.|\.test|\.spec)' { $auditResults.Statistics.TestFiles += $dirInfo.Statistics.FileTypes[$ext] }
            }
        }
        
        Write-Host "  ✅ $($dirInfo.Statistics.FileCount) files, $([math]::Round($dirInfo.Statistics.Size / 1MB, 2)) MB" -ForegroundColor Gray
    }
    catch {
        Write-Host "  ⚠️  Error auditing directory: $_" -ForegroundColor Red
        $dirInfo.Error = $_.Exception.Message
    }
    
    $auditResults.Directories += $dirInfo
    $auditResults.Statistics.TotalDirectories++
}

Write-Host ""
Write-Host "📊 Audit Complete!" -ForegroundColor Green
Write-Host "==================" -ForegroundColor Green
Write-Host "Total Directories: $($auditResults.Statistics.TotalDirectories)" -ForegroundColor Cyan
Write-Host "Total Files: $($auditResults.Statistics.TotalFiles)" -ForegroundColor Cyan
Write-Host "Total Size: $([math]::Round($auditResults.Statistics.TotalSize / 1GB, 2)) GB" -ForegroundColor Cyan
Write-Host "Code Files: $($auditResults.Statistics.CodeFiles)" -ForegroundColor Cyan
Write-Host "Documentation Files: $($auditResults.Statistics.DocumentationFiles)" -ForegroundColor Cyan
Write-Host "Config Files: $($auditResults.Statistics.ConfigFiles)" -ForegroundColor Cyan
Write-Host ""

# Export results
$jsonPath = Join-Path $OutputPath "workspace_audit.json"
$csvPath = Join-Path $OutputPath "workspace_audit_summary.csv"

$auditResults | ConvertTo-Json -Depth 10 | Out-File -FilePath $jsonPath -Encoding UTF8
Write-Host "✅ JSON audit saved to: $jsonPath" -ForegroundColor Green

# Create CSV summary
$csvData = $auditResults.Directories | ForEach-Object {
    [PSCustomObject]@{
        Directory = $_.Name
        FileCount = $_.Statistics.FileCount
        'Size (MB)' = [math]::Round($_.Statistics.Size / 1MB, 2)
        Subdirectories = $_.Subdirectories.Count
        TopFileTypes = ($_.Statistics.FileTypes.Keys | Select-Object -First 5) -join ', '
    }
}
$csvData | Export-Csv -Path $csvPath -NoTypeInformation
Write-Host "✅ CSV summary saved to: $csvPath" -ForegroundColor Green

Write-Host ""
Write-Host "🎯 THE TERRAFUSION WAY - We now know everything in this workspace!" -ForegroundColor Magenta
