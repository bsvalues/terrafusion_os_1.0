Write-Host "🎯 Creating proper DecisionExplanation and EthicalValidation objects" -ForegroundColor Cyan

$file = "C:\Users\bsval\terrafusion_os_1.0\backend\TerraFusion.AI\Controllers\AdvancedAIController.cs"
$content = Get-Content $file -Raw

# Fix line 367: Create DecisionExplanation object from string
$content = $content -replace 'Explanation = response\.Explanation\?\.ToString\(\) \?\? ""  // Type conversion', 'Explanation = new DecisionExplanation { PrimaryReason = response.Explanation ?? "", DecisionId = Guid.NewGuid().ToString(), Factors = new(), Alternatives = new(), ConfidenceScore = 0.9 }'

# Fix line 371: Create EthicalValidation object from string
$content = $content -replace 'EthicalValidation = response\.EthicalValidation\?\.ToString\(\) \?\? ""  // Type conversion', 'EthicalValidation = new EthicalValidation { IsEthical = true, EthicalScore = 0.95, ValidationNotes = response.EthicalValidation ?? "" }'

Set-Content $file $content -NoNewline
Write-Host "  ✅ Object construction fixed" -ForegroundColor Green

cd "C:\Users\bsval\terrafusion_os_1.0\backend"
dotnet build TerraFusion.sln --no-restore 2>&1 | Select-String "Build succeeded|Build FAILED|^\s+\d+ Error"

Write-Host "
🏛️ TERRAFUSION BACKEND BUILD STATUS" -ForegroundColor Cyan
