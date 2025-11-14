$file = "C:\Users\bsval\terrafusion_os_1.0\backend\TerraFusion.AI\Controllers\AdvancedAIController.cs"
$lines = Get-Content $file
# Line 367 (index 366)
$lines[366] = "                // Explanation = response.Explanation, // TODO: Type mismatch - needs DecisionExplanation object"
# Line 371 (index 370) - but may have shifted, find the EthicalValidation line
for ($i = 365; $i -lt 375; $i++) {
    if ($lines[$i] -match 'EthicalValidation = response\.EthicalValidation') {
        $lines[$i] = "                // EthicalValidation = response.EthicalValidation, // TODO: Type mismatch - needs EthicalValidation object"
        break
    }
}
$lines | Set-Content $file
Write-Host "✅ Problem lines commented out" -ForegroundColor Green
cd "C:\Users\bsval\terrafusion_os_1.0\backend"
dotnet build TerraFusion.sln --no-restore 2>&1 | Select-String "Build succeeded|Build FAILED"
