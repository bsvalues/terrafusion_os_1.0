# TerraFusion Elite Government OS Engineering Agent
# Systematic Extension Method Syntax Fix - Championship Excellence
# Transforms property syntax to method syntax for extension methods

Write-Host "🏛️ TerraFusion Elite Government OS Engineering Agent - Extension Method Fix" -ForegroundColor Cyan
Write-Host "Government. Transcended. - Systematic Code Transformation" -ForegroundColor Green
Write-Host ""

$files = @(
    "TerraFusion.AI\Services\RAGService.cs",
    "TerraFusion.AI\Services\GPTConfigurationService.cs",
    "TerraFusion.AI\Services\GPTOrchestrationService.cs"
)

# Extension methods that need () added
$extensionMethods = @(
    'RAGDatasets',
    'RAGDocuments',
    'GPTConfigurations',
    'GPTConversations',
    'GPTMessages',
    'GPTUsageMetrics',
    'GPTMarketplaceInstalls'
)

$totalReplacements = 0

foreach ($file in $files) {
    $filePath = Join-Path $PSScriptRoot $file

    if (Test-Path $filePath) {
        Write-Host "Processing: $file" -ForegroundColor Yellow

        $content = Get-Content -Path $filePath -Raw
        $fileReplacements = 0

        foreach ($method in $extensionMethods) {
            # Match _context.MethodName. or _context.MethodName followed by space/newline/method call
            $pattern = "(\s*_context\.$method)([.\s])"
            $beforeCount = ([regex]::Matches($content, $pattern)).Count

            if ($beforeCount -gt 0) {
                # Replace with method call: _context.MethodName() followed by same delimiter
                $content = $content -replace $pattern, "`$1()`$2"
                $fileReplacements += $beforeCount
                Write-Host "  ✅ Fixed $beforeCount occurrences of $method" -ForegroundColor Green
            }
        }

        # Save the fixed content
        Set-Content -Path $filePath -Value $content -NoNewline

        $totalReplacements += $fileReplacements
        Write-Host "  Total fixes in file: $fileReplacements" -ForegroundColor Cyan
        Write-Host ""
    }
    else {
        Write-Host "  ⚠️ File not found: $filePath" -ForegroundColor Red
    }
}

Write-Host "🏆 Championship Transformation Complete!" -ForegroundColor Green
Write-Host "Total replacements: $totalReplacements" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next: Build verification with 'dotnet build TerraFusion.sln'" -ForegroundColor Yellow
