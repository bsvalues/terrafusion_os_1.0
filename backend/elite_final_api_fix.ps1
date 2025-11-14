Write-Host "🏛️ TERRAFUSION ELITE - FINAL API FIXES" -ForegroundColor Cyan
Write-Host "======================================
" -ForegroundColor Cyan

cd "C:\Users\bsval\terrafusion_os_1.0\backend"

# Fix 1: Duplicate SystemMetrics class - Find and comment out one
Write-Host "📊 Fix 1: Resolving duplicate SystemMetrics class..." -ForegroundColor Yellow
$serviceHelpersFile = "TerraFusion.API\Services\ServiceHelpers.cs"
$content = Get-Content $serviceHelpersFile -Raw

# Find the duplicate class at line 531 and comment it out
$lines = Get-Content $serviceHelpersFile
for ($i = 520; $i -lt 550; $i++) {
    if ($lines[$i] -match 'class SystemMetrics' -or $lines[$i] -match 'public class SystemMetrics') {
        # Comment out this class definition and next 20 lines
        for ($j = $i; $j -lt ($i + 25) -and $j -lt $lines.Count; $j++) {
            if ($lines[$j] -notmatch '^\s*//') {
                $lines[$j] = "// " + $lines[$j]
            }
            if ($lines[$j] -match '^\s*//\s*}\s*$') { break }
        }
        break
    }
}
$lines | Set-Content $serviceHelpersFile
Write-Host "  ✅ Duplicate SystemMetrics class commented out" -ForegroundColor Green

# Fix 2: OptimizationRecommendation ambiguity - Fully qualify all references
Write-Host "
🎯 Fix 2: Resolving OptimizationRecommendation namespace ambiguity..." -ForegroundColor Yellow

# Fix in AdvancedAIAgentOrchestrator.cs
$file1 = "TerraFusion.API\Services\AdvancedAIAgentOrchestrator.cs"
$content = Get-Content $file1 -Raw
$content = $content -replace '(?<!\.)(List<|new |: )OptimizationRecommendation', '$1TerraFusion.API.Interfaces.OptimizationRecommendation'
$content = $content -replace '(?<!\.)\bOptimizationRecommendation\b(?!\.)', 'TerraFusion.API.Interfaces.OptimizationRecommendation'
Set-Content $file1 $content -NoNewline
Write-Host "  ✅ AdvancedAIAgentOrchestrator.cs fixed" -ForegroundColor Green

# Fix in CognitiveFrameworkOptimizationService.cs  
$file2 = "TerraFusion.API\Services\CognitiveFrameworkOptimizationService.cs"
$content = Get-Content $file2 -Raw
$content = $content -replace '(?<!\.)(List<|new |: |Task<)OptimizationRecommendation', '$1TerraFusion.API.Interfaces.OptimizationRecommendation'
$content = $content -replace '(?<!\.)\bOptimizationRecommendation\b(?!\.)', 'TerraFusion.API.Interfaces.OptimizationRecommendation'
Set-Content $file2 $content -NoNewline
Write-Host "  ✅ CognitiveFrameworkOptimizationService.cs fixed" -ForegroundColor Green

# BUILD TEST
Write-Host "
🔨 Building TerraFusion.API..." -ForegroundColor Cyan
dotnet build TerraFusion.API\TerraFusion.API.csproj --no-restore 2>&1 | Select-String "Build succeeded|Build FAILED|^\s+\d+ Error"

Write-Host "
🔨 Building Complete Solution..." -ForegroundColor Cyan
dotnet build TerraFusion.sln --no-restore 2>&1 | Select-String "Build succeeded|Build FAILED|^\s+\d+ Error|^\s+\d+ Warning"

Write-Host "
✅ BACKEND FIX EXECUTION COMPLETE!" -ForegroundColor Green
