# Module Dependency Analysis Script for TerraFusion OS 1.0
# Analyzes import statements across all modules to understand dependencies

Write-Host "`n═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  MODULE DEPENDENCY ANALYSIS - TerraFusion OS 1.0" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

$analysisResults = @{
    PythonImports = @()
    TypeScriptImports = @()
    CSharpReferences = @()
    RustDependencies = @()
}

# Analyze Python imports
Write-Host "📊 Analyzing Python imports..." -ForegroundColor Yellow
$pythonFiles = Get-ChildItem modules -Recurse -Filter "*.py" -ErrorAction SilentlyContinue
$pythonImportPattern = '^(import |from [\w\.]+\s+import)'
$analysisResults.PythonImports = $pythonFiles | 
    ForEach-Object {
        $file = $_
        Get-Content $file.FullName -ErrorAction SilentlyContinue | 
            Where-Object { $_ -match $pythonImportPattern } |
            ForEach-Object {
                [PSCustomObject]@{
                    File = $file.FullName.Replace($PWD.Path, ".")
                    Import = $_ -replace '^\s+', ''
                }
            }
    }

Write-Host "  Found $($analysisResults.PythonImports.Count) Python imports" -ForegroundColor Gray

# Analyze TypeScript/JavaScript imports
Write-Host "📊 Analyzing TypeScript/JavaScript imports..." -ForegroundColor Yellow
$tsFiles = Get-ChildItem modules -Recurse -Include "*.ts","*.tsx","*.js","*.jsx" -ErrorAction SilentlyContinue
$tsImportPattern = '^(import |export .* from)'
$analysisResults.TypeScriptImports = $tsFiles | 
    ForEach-Object {
        $file = $_
        Get-Content $file.FullName -ErrorAction SilentlyContinue | 
            Where-Object { $_ -match $tsImportPattern } |
            ForEach-Object {
                [PSCustomObject]@{
                    File = $file.FullName.Replace($PWD.Path, ".")
                    Import = $_ -replace '^\s+', ''
                }
            }
    }

Write-Host "  Found $($analysisResults.TypeScriptImports.Count) TypeScript/JS imports" -ForegroundColor Gray

# Analyze C# project references
Write-Host "📊 Analyzing C# project references..." -ForegroundColor Yellow
$csprojFiles = Get-ChildItem modules -Recurse -Filter "*.csproj" -ErrorAction SilentlyContinue
$analysisResults.CSharpReferences = $csprojFiles | 
    ForEach-Object {
        $file = $_
        Get-Content $file.FullName -ErrorAction SilentlyContinue | 
            Where-Object { $_ -match '<ProjectReference|<PackageReference' } |
            ForEach-Object {
                [PSCustomObject]@{
                    File = $file.FullName.Replace($PWD.Path, ".")
                    Reference = $_ -replace '^\s+', '' -replace '<', '' -replace '/>', ''
                }
            }
    }

Write-Host "  Found $($analysisResults.CSharpReferences.Count) C# references" -ForegroundColor Gray

# Analyze Rust dependencies (Cargo.toml)
Write-Host "📊 Analyzing Rust dependencies..." -ForegroundColor Yellow
$cargoFiles = Get-ChildItem modules -Recurse -Filter "Cargo.toml" -ErrorAction SilentlyContinue
$analysisResults.RustDependencies = $cargoFiles | 
    ForEach-Object {
        $file = $_
        $inDependencies = $false
        Get-Content $file.FullName -ErrorAction SilentlyContinue | 
            ForEach-Object {
                if ($_ -match '^\[dependencies\]') { $inDependencies = $true }
                elseif ($_ -match '^\[') { $inDependencies = $false }
                elseif ($inDependencies -and $_ -match '^\s*\w+\s*=') {
                    [PSCustomObject]@{
                        File = $file.FullName.Replace($PWD.Path, ".")
                        Dependency = $_ -replace '^\s+', ''
                    }
                }
            }
    }

Write-Host "  Found $($analysisResults.RustDependencies.Count) Rust dependencies" -ForegroundColor Gray

# Analyze cross-module imports
Write-Host "`n📈 Cross-Module Import Analysis..." -ForegroundColor Yellow
Write-Host "`nTop 20 Most Common Python Imports:`n" -ForegroundColor Green
$analysisResults.PythonImports | 
    Where-Object { $_.Import -match 'from (modules|terrafusion|tf_)' } |
    Group-Object Import | 
    Sort-Object Count -Descending | 
    Select-Object -First 20 Count, Name |
    Format-Table -AutoSize

Write-Host "`nTop 20 Most Common TypeScript Imports:`n" -ForegroundColor Green
$analysisResults.TypeScriptImports | 
    Where-Object { $_.Import -match '@terrafusion|@tf/|\.\./' } |
    Group-Object Import | 
    Sort-Object Count -Descending | 
    Select-Object -First 20 Count, Name |
    Format-Table -AutoSize

# Module-to-Module dependency matrix
Write-Host "`n📊 Module Dependency Matrix..." -ForegroundColor Yellow
$moduleNames = @(
    "government-core",
    "commercial",
    "ai-systems",
    "infrastructure",
    "specialized",
    "shock-and-awe"
)

$dependencyMatrix = @()
foreach ($source in $moduleNames) {
    $row = [PSCustomObject]@{
        SourceModule = $source
    }
    
    foreach ($target in $moduleNames) {
        if ($source -ne $target) {
            # Count imports from source that reference target
            $count = ($analysisResults.PythonImports + $analysisResults.TypeScriptImports) | 
                Where-Object { 
                    $_.File -match "modules/$source/" -and 
                    $_.Import -match "modules.$target|@terrafusion/$target"
                } | 
                Measure-Object | 
                Select-Object -ExpandProperty Count
            
            $row | Add-Member -NotePropertyName $target -NotePropertyValue $count
        }
    }
    
    $dependencyMatrix += $row
}

$dependencyMatrix | Format-Table -AutoSize

# Export results
Write-Host "`n💾 Exporting analysis results..." -ForegroundColor Yellow
$outputPath = "PHASE_3_DEPENDENCY_ANALYSIS_RESULTS.json"
$analysisResults | ConvertTo-Json -Depth 10 | Out-File $outputPath
Write-Host "  Results exported to: $outputPath" -ForegroundColor Green

Write-Host "`n✅ Dependency analysis complete!`n" -ForegroundColor Green
