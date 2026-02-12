# TerraFusion OS 1.0 - Data Consolidation Script
# Consolidates scattered county data, databases, AI models, and critical components into unified structure

param(
    [string]$SourcePath = "e:\TerraFusion_OS",
    [string]$TargetPath = "e:\TerraFusion_OS_1.0",
    [switch]$DryRun = $false
)

Write-Host "=== TerraFusion OS 1.0 Data Consolidation ===" -ForegroundColor Cyan
Write-Host "Source: $SourcePath" -ForegroundColor Yellow
Write-Host "Target: $TargetPath" -ForegroundColor Yellow
Write-Host "Dry Run: $DryRun" -ForegroundColor Yellow
Write-Host ""

# Create target directories
$directories = @(
    "$TargetPath\counties",
    "$TargetPath\ai-models", 
    "$TargetPath\cost-matrices",
    "$TargetPath\databases",
    "$TargetPath\intelligence"
)

foreach ($dir in $directories) {
    if (-not $DryRun) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    Write-Host "✓ Created directory: $dir" -ForegroundColor Green
}

# County Property Data (94,149 properties)
Write-Host "`n=== Consolidating County Property Data ===" -ForegroundColor Cyan

$propertyDataSources = @(
    "INTELLIGENCE\benton_analysis.json",
    "INTELLIGENCE\benton_extraction.json", 
    "INTELLIGENCE\benton_valuations.json",
    "data\county-intelligence\benton_analysis.json",
    "platforms\championship\DEPLOYMENT\benton_county_20250811_080206\data\benton_county_properties.json",
    "platforms\terrafusion-os-new\src\services\intelligence-service\benton_valuations.json"
)

$consolidatedProperties = @()
$propertyCount = 0

foreach ($source in $propertyDataSources) {
    $fullPath = Join-Path $SourcePath $source
    if (Test-Path $fullPath) {
        Write-Host "  Processing: $source" -ForegroundColor Yellow
        try {
            $data = Get-Content $fullPath -Raw | ConvertFrom-Json
            if ($data -is [array]) {
                $consolidatedProperties += $data
                $propertyCount += $data.Count
            } else {
                $consolidatedProperties += $data
                $propertyCount += 1
            }
            Write-Host "    ✓ Added $($data.Count) properties" -ForegroundColor Green
        } catch {
            Write-Host "    ✗ Failed to parse JSON: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "    ⚠ Not found: $fullPath" -ForegroundColor Yellow
    }
}

# Save consolidated property data
$targetPropertyFile = "$TargetPath\counties\benton_county_properties.json"
if (-not $DryRun) {
    $consolidatedProperties | ConvertTo-Json -Depth 10 | Out-File $targetPropertyFile -Encoding UTF8
}
Write-Host "✓ Consolidated $propertyCount properties to: $targetPropertyFile" -ForegroundColor Green

# Cost Matrix Data
Write-Host "`n=== Consolidating Cost Matrix Data ===" -ForegroundColor Cyan

$costMatrixSources = @(
    "platforms\championship\ARCHIVE\legacy\unified_costforge\benton_cost_matrix_live.json",
    "platforms\championship\ARCHIVE\legacy\unified_costforge\benton_cost_matrix_proper.json",
    "platforms\championship\ARCHIVE\legacy\unified_costforge\benton_matrix_exact_identifiers.json"
)

foreach ($source in $costMatrixSources) {
    $fullPath = Join-Path $SourcePath $source
    if (Test-Path $fullPath) {
        $fileName = Split-Path $source -Leaf
        $targetFile = "$TargetPath\cost-matrices\$fileName"
        
        if (-not $DryRun) {
            Copy-Item $fullPath $targetFile -Force
        }
        Write-Host "✓ Copied: $fileName" -ForegroundColor Green
    } else {
        Write-Host "⚠ Not found: $source" -ForegroundColor Yellow
    }
}

# Database Files
Write-Host "`n=== Consolidating Database Files ===" -ForegroundColor Cyan

$databaseSources = @(
    "platforms\championship\ARCHIVE\legacy\data\terrafusion_real.db",
    "platforms\championship\ARCHIVE\legacy\data\terrafusion_production.db",
    "platforms\championship\ARCHIVE\legacy\data\real_pacs.db",
    "platforms\TerraFusion_Remix_Clean\data\democratic_health.db"
)

foreach ($source in $databaseSources) {
    $fullPath = Join-Path $SourcePath $source
    if (Test-Path $fullPath) {
        $fileName = Split-Path $source -Leaf
        $targetFile = "$TargetPath\databases\$fileName"
        
        if (-not $DryRun) {
            Copy-Item $fullPath $targetFile -Force
        }
        $fileSize = (Get-Item $fullPath).Length / 1MB
        Write-Host "✓ Copied: $fileName ($([math]::Round($fileSize, 2)) MB)" -ForegroundColor Green
    } else {
        Write-Host "⚠ Not found: $source" -ForegroundColor Yellow
    }
}

# Intelligence Data
Write-Host "`n=== Consolidating Intelligence Data ===" -ForegroundColor Cyan

$intelligencePath = Join-Path $SourcePath "INTELLIGENCE"
if (Test-Path $intelligencePath) {
    $intelligenceFiles = Get-ChildItem $intelligencePath -Filter "*.json"
    foreach ($file in $intelligenceFiles) {
        $targetFile = "$TargetPath\intelligence\$($file.Name)"
        if (-not $DryRun) {
            Copy-Item $file.FullName $targetFile -Force
        }
        Write-Host "✓ Copied: $($file.Name)" -ForegroundColor Green
    }
}

# AI Models Placeholder
Write-Host "`n=== Preparing AI Models Directory ===" -ForegroundColor Cyan
$aiModelsReadme = @"
# AI Models Directory

This directory will contain the 147 AI models from the AI Command Brain system.

## Model Categories:
- Property Valuation Models (CostForge AI)
- Predictive Analytics Models
- Neural Intelligence Networks
- Government Operations Models

## Migration Status:
- [ ] CostForge AI Models (from Rust backend)
- [ ] Neural Network Models
- [ ] Predictive Analytics Models
- [ ] Government Operations Models

Note: AI models will be migrated from the existing Rust backend during Phase 2.
"@

if (-not $DryRun) {
    $aiModelsReadme | Out-File "$TargetPath\ai-models\README.md" -Encoding UTF8
}
Write-Host "✓ Created AI models directory structure" -ForegroundColor Green

# Summary Report
Write-Host "`n=== Migration Summary ===" -ForegroundColor Cyan
Write-Host "✓ Property Data: $propertyCount properties consolidated" -ForegroundColor Green
Write-Host "✓ Cost Matrices: Multiple matrices consolidated" -ForegroundColor Green
Write-Host "✓ Databases: Legacy databases preserved" -ForegroundColor Green
Write-Host "✓ Intelligence: County intelligence data migrated" -ForegroundColor Green
Write-Host "✓ AI Models: Directory structure prepared" -ForegroundColor Green

if ($DryRun) {
    Write-Host "`n⚠ DRY RUN COMPLETED - No files were actually copied" -ForegroundColor Yellow
    Write-Host "Run without -DryRun to perform actual migration" -ForegroundColor Yellow
} else {
    # AI Swarm Components Migration
    Write-Host "`n=== AI Swarm Components Migration ===" -ForegroundColor Cyan

    $aiSwarmSource = "$SourcePath\AI_SWARM"
    $aiSwarmTarget = "$TargetPath\data\ai-swarm"

    if (Test-Path $aiSwarmSource) {
        Write-Host "Migrating AI Swarm components..." -ForegroundColor Green
        
        if (-not $DryRun) {
            New-Item -ItemType Directory -Path $aiSwarmTarget -Force | Out-Null
            Copy-Item "$aiSwarmSource\*" -Destination $aiSwarmTarget -Recurse -Force
        }
        
        $swarmItemCount = (Get-ChildItem $aiSwarmSource -Recurse).Count
        Write-Host "  ✓ Migrated $swarmItemCount AI Swarm items" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ AI Swarm directory not found at $aiSwarmSource" -ForegroundColor Yellow
    }

    # Swarm Deployment Migration
    Write-Host "`n=== Swarm Deployment Migration ===" -ForegroundColor Cyan

    $swarmDeploySource = "$SourcePath\swarm-deployment"
    $swarmDeployTarget = "$TargetPath\deployment\swarm"

    if (Test-Path $swarmDeploySource) {
        Write-Host "Migrating swarm deployment configurations..." -ForegroundColor Green
        
        if (-not $DryRun) {
            New-Item -ItemType Directory -Path $swarmDeployTarget -Force | Out-Null
            Copy-Item "$swarmDeploySource\*" -Destination $swarmDeployTarget -Recurse -Force
        }
        
        $deployItemCount = (Get-ChildItem $swarmDeploySource -Recurse).Count
        Write-Host "  ✓ Migrated $deployItemCount swarm deployment items" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Swarm deployment directory not found at $swarmDeploySource" -ForegroundColor Yellow
    }

    # Demo Scripts Migration
    Write-Host "`n=== Demo Scripts Migration ===" -ForegroundColor Cyan

    $demoScriptsSource = "$SourcePath\DEMO_SCRIPTS"
    $demoScriptsTarget = "$TargetPath\docs\demos"

    if (Test-Path $demoScriptsSource) {
        Write-Host "Migrating demo scripts..." -ForegroundColor Green
        
        if (-not $DryRun) {
            New-Item -ItemType Directory -Path $demoScriptsTarget -Force | Out-Null
            Copy-Item "$demoScriptsSource\*" -Destination $demoScriptsTarget -Recurse -Force
        }
        
        $demoCount = (Get-ChildItem $demoScriptsSource -File).Count
        Write-Host "  ✓ Migrated $demoCount demo scripts" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Demo scripts directory not found at $demoScriptsSource" -ForegroundColor Yellow
    }

    Write-Host "`n🏁 DATA CONSOLIDATION COMPLETED" -ForegroundColor Cyan
    Write-Host "All county data consolidated into: $TargetPath" -ForegroundColor Green
}
