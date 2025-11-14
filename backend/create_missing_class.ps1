# Create missing WorkflowExecutionResult class
Write-Host "🎯 Creating missing WorkflowExecutionResult class..." -ForegroundColor Cyan

$modelsPath = "C:\Users\bsval\terrafusion_os_1.0\backend\TerraFusion.AI\Models"
if (-not (Test-Path $modelsPath)) {
    New-Item -ItemType Directory -Path $modelsPath -Force | Out-Null
}

$workflowResultFile = Join-Path $modelsPath "WorkflowExecutionResult.cs"

$classContent = @'
namespace TerraFusion.AI.Models;

/// <summary>
/// Result of AI Swarm workflow execution
/// </summary>
public class WorkflowExecutionResult
{
    public string WorkflowId { get; set; } = string.Empty;
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public Dictionary<string, object> Results { get; set; } = new();
    public DateTime ExecutionTime { get; set; } = DateTime.UtcNow;
    public TimeSpan Duration { get; set; }
    public List<string> Errors { get; set; } = new();
}
'@

Set-Content $workflowResultFile $classContent -NoNewline
Write-Host "  ✅ WorkflowExecutionResult class created" -ForegroundColor Green

# Revert interface to use WorkflowExecutionResult
$interfaceFile = "C:\Users\bsval\terrafusion_os_1.0\backend\TerraFusion.AI\Interfaces\IAISwarmOrchestrator.cs"
$content = Get-Content $interfaceFile -Raw
$content = $content -replace 'Task<object>', 'Task<WorkflowExecutionResult>'

# Add using statement if needed
if ($content -notmatch 'using TerraFusion\.AI\.Models;') {
    $content = $content -replace '(namespace TerraFusion\.AI\.Interfaces)', "using TerraFusion.AI.Models;

$1"
}

Set-Content $interfaceFile $content -NoNewline
Write-Host "  ✅ Interface restored with correct type" -ForegroundColor Green

# Add using to implementation
$implFile = "C:\Users\bsval\terrafusion_os_1.0\backend\TerraFusion.AI\Services\AISwarmOrchestrator.cs"
$implContent = Get-Content $implFile -Raw
if ($implContent -notmatch 'using TerraFusion\.AI\.Models;') {
    $implContent = $implContent -replace '(namespace TerraFusion\.AI\.Services)', "using TerraFusion.AI.Models;

$1"
    Set-Content $implFile $implContent -NoNewline
    Write-Host "  ✅ Implementation updated with using statement" -ForegroundColor Green
}

# Final build
cd "C:\Users\bsval\terrafusion_os_1.0\backend"
Write-Host "
🔨 Building complete solution..." -ForegroundColor Cyan
dotnet build TerraFusion.sln --no-restore 2>&1 | Select-String "Build succeeded|Build FAILED|^\s+\d+ Error"
