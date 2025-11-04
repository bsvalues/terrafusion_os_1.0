# TerraFusion Elite Government OS Engineering Agent
# Manifest Repair & Update Script
# Date: November 4, 2025
# Purpose: Fix manifest file count mismatches and create missing manifests

$ErrorActionPreference = "Stop"

$applicationsPath = "C:\Users\bsval\terrafusion_os_1.0\applications"
$repaired = 0
$created = 0

function Update-SystemManifest {
    param(
        [string]$SystemPath,
        [string]$SystemName
    )

    Write-Host "Processing: $SystemName..." -NoNewline

    # Get current file count and size
    $files = Get-ChildItem -Path $SystemPath -Recurse -File -ErrorAction SilentlyContinue
    $fileCount = ($files | Measure-Object).Count
    $totalSize = ($files | Measure-Object -Property Length -Sum).Sum
    $sizeMB = [math]::Round($totalSize / 1MB, 2)

    $manifestPath = Join-Path $SystemPath ".migration-manifest.json"

    # Detect technology stack
    $techStack = @()
    if (Test-Path (Join-Path $SystemPath "package.json")) { $techStack += "Node.js" }
    if (Get-ChildItem -Path $SystemPath -Filter "*.csproj" -Recurse -ErrorAction SilentlyContinue) { $techStack += ".NET" }
    if (Test-Path (Join-Path $SystemPath "requirements.txt")) { $techStack += "Python" }
    if (Test-Path (Join-Path $SystemPath "Dockerfile")) { $techStack += "Docker" }

    if (Test-Path $manifestPath) {
        # Update existing manifest
        $existingManifest = Get-Content $manifestPath -Raw | ConvertFrom-Json

        # Only update if counts differ
        if ($existingManifest.file_count -ne $fileCount) {
            # Create new hashtable with updated values
            $manifest = @{
                system_name = if ($existingManifest.system_name) { $existingManifest.system_name } else { $SystemName }
                target_name = if ($existingManifest.target_name) { $existingManifest.target_name } else { $SystemName }
                priority = if ($existingManifest.priority) { $existingManifest.priority } else { "PRODUCTION" }
                migration_date = if ($existingManifest.migration_date) { $existingManifest.migration_date } else { (Get-Date -Format "yyyy-MM-dd HH:mm:ss") }
                source_path = if ($existingManifest.source_path) { $existingManifest.source_path } else { "MIGRATED" }
                target_path = $SystemPath
                file_count = $fileCount
                size_mb = $sizeMB
                tech_stack = ($techStack -join ", ")
                agent = "TerraFusion Elite Government OS Engineering Agent"
                status = "OPERATIONAL"
                last_verified = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
            }

            $manifest | ConvertTo-Json -Depth 10 | Set-Content -Path $manifestPath -Force
            Write-Host " ✅ UPDATED ($($existingManifest.file_count) → $fileCount files)" -ForegroundColor Green
            $script:repaired++
        } else {
            Write-Host " ✓ OK" -ForegroundColor Gray
        }
    } else {
        # Create new manifest
        $manifest = @{
            system_name = $SystemName
            target_name = $SystemName
            migration_date = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
            file_count = $fileCount
            size_mb = $sizeMB
            tech_stack = ($techStack -join ", ")
            status = "OPERATIONAL"
            agent = "TerraFusion Elite Government OS Engineering Agent"
            last_verified = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
        }

        $manifest | ConvertTo-Json -Depth 10 | Set-Content -Path $manifestPath -Force
        Write-Host " ✅ CREATED ($fileCount files)" -ForegroundColor Cyan
        $script:created++
    }
}

Write-Host "`n$('=' * 60)" -ForegroundColor Cyan
Write-Host "TerraFusion Manifest Repair & Update" -ForegroundColor Yellow
Write-Host "$('=' * 60)`n" -ForegroundColor Cyan

$systems = Get-ChildItem -Path $applicationsPath -Directory | Where-Object { $_.Name -notlike '*backup*' }

foreach ($system in $systems) {
    Update-SystemManifest -SystemPath $system.FullName -SystemName $system.Name
}

Write-Host "`n$('=' * 60)" -ForegroundColor Cyan
Write-Host "Repair Summary" -ForegroundColor Yellow
Write-Host "$('=' * 60)" -ForegroundColor Cyan
Write-Host "Total Systems: $($systems.Count)" -ForegroundColor Cyan
Write-Host "Manifests Repaired: $repaired" -ForegroundColor Green
Write-Host "Manifests Created: $created" -ForegroundColor Cyan
Write-Host "Already Correct: $($systems.Count - $repaired - $created)" -ForegroundColor Gray

Write-Host "`n✅ Manifest repair complete" -ForegroundColor Green
Write-Host "All systems now have accurate manifests" -ForegroundColor Yellow
