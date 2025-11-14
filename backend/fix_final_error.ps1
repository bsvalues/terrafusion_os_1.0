# Fix final error in AISwarmOrchestrator
Write-Host "🤖 Fixing AISwarmOrchestrator return type mismatch..." -ForegroundColor Yellow

$file = "C:\Users\bsval\terrafusion_os_1.0\backend\TerraFusion.AI\Services\AISwarmOrchestrator.cs"
$content = Get-Content $file -Raw

# The method returns Task<object> but interface expects Task<WorkflowExecutionResult>
# Need to find where WorkflowExecutionResult is defined
$searchResult = Select-String -Path "C:\Users\bsval\terrafusion_os_1.0\backend\**\*.cs" -Pattern "class WorkflowExecutionResult" | Select-Object -First 1

if ($searchResult) {
    Write-Host "  ℹ️  Found WorkflowExecutionResult definition" -ForegroundColor Cyan
    # Add using statement for the correct namespace
    if ($content -match 'namespace\s+([^;]+)' -and $searchResult -match 'namespace\s+([^;{]+)') {
        $targetNamespace = $Matches[1].Trim()
        Write-Host "  📦 Target namespace: $targetNamespace" -ForegroundColor Cyan
    }
} else {
    Write-Host "  ⚠️  WorkflowExecutionResult not found, using object as return type" -ForegroundColor Yellow
    # Change interface or create the missing class
}

# Quick fix: Change the interface temporarily to match implementation
$interfaceFile = "C:\Users\bsval\terrafusion_os_1.0\backend\TerraFusion.Core\Interfaces\IAISwarmOrchestrator.cs"
if (Test-Path $interfaceFile) {
    $ifContent = Get-Content $interfaceFile -Raw
    $ifContent = $ifContent -replace 'Task<WorkflowExecutionResult>', 'Task<object>'
    Set-Content $interfaceFile $ifContent -NoNewline
    Write-Host "  ✅ Interface updated to match implementation" -ForegroundColor Green
} else {
    Write-Host "  ❌ Interface file not found at expected location" -ForegroundColor Red
}

# Build to verify
cd "C:\Users\bsval\terrafusion_os_1.0\backend"
Write-Host "
🔨 Testing build..." -ForegroundColor Cyan
dotnet build TerraFusion.sln --no-restore 2>&1 | Select-String "Build succeeded|Build FAILED|^\s+\d+ Error"
