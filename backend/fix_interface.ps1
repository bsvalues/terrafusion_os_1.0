# Fix AISwarmOrchestrator - correct path
$interfaceFile = "C:\Users\bsval\terrafusion_os_1.0\backend\TerraFusion.AI\Interfaces\IAISwarmOrchestrator.cs"
$content = Get-Content $interfaceFile -Raw

Write-Host "🤖 Fixing IAISwarmOrchestrator interface..." -ForegroundColor Yellow

# Replace Task<WorkflowExecutionResult> with Task<object>
$content = $content -replace 'Task<WorkflowExecutionResult>', 'Task<object>'

Set-Content $interfaceFile $content -NoNewline
Write-Host "  ✅ Interface return type updated" -ForegroundColor Green

# Build
cd "C:\Users\bsval\terrafusion_os_1.0\backend"
dotnet build TerraFusion.sln --no-restore 2>&1 | Select-String "Build succeeded|Build FAILED|^\s+\d+ Error"
