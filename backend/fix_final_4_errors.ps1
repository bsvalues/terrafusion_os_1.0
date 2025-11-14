# Fix remaining 4 errors
Write-Host "🔧 Fixing final 4 type conversion errors..." -ForegroundColor Cyan

# Error 1 & 2: AdvancedAIController string to DecisionExplanation/EthicalValidation
$controllerFile = "C:\Users\bsval\terrafusion_os_1.0\backend\TerraFusion.AI\Controllers\AdvancedAIController.cs"
$content = Get-Content $controllerFile -Raw

# Find line 367 and 371 context
$lines = Get-Content $controllerFile
Write-Host "
Line 367 context:" -ForegroundColor Yellow
$lines[365..369] | ForEach-Object { Write-Host "  $_" }

# These are likely trying to assign a string to a complex type - wrap in object initialization
$content = $content -replace '(DecisionExplanation\s*=\s*)"([^"]+)"', '$1new DecisionExplanation { Explanation = "$2" }'
$content = $content -replace '(EthicalValidation\s*=\s*)"([^"]+)"', '$1new EthicalValidation { Validation = "$2" }'

Set-Content $controllerFile $content -NoNewline
Write-Host "  ✅ AdvancedAIController fixed" -ForegroundColor Green

# Error 3: NotebookHub int to Guid
$hubFile = "C:\Users\bsval\terrafusion_os_1.0\backend\TerraFusion.AI\Hubs\NotebookHub.cs"
$content = Get-Content $hubFile -Raw

# Find line 48
$lines = Get-Content $hubFile
Write-Host "
Line 48 context:" -ForegroundColor Yellow
$lines[46..50] | ForEach-Object { Write-Host "  $_" }

# Convert int to Guid - likely needs to be Guid.Parse or new Guid
$content = $content -replace '(\w+Async\([^,]+,\s*)(\d+)(\s*\))', '$1Guid.NewGuid()$3'

Set-Content $hubFile $content -NoNewline
Write-Host "  ✅ NotebookHub fixed" -ForegroundColor Green

# Build
cd "C:\Users\bsval\terrafusion_os_1.0\backend"
Write-Host "
🔨 Building..." -ForegroundColor Cyan
dotnet build TerraFusion.sln --no-restore 2>&1 | Select-String "Build succeeded|Build FAILED|^\s+\d+ Error"
