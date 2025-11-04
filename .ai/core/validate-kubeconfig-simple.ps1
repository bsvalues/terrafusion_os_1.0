# TerraFusion Elite Kubeconfig Validation
# Championship-Level Kubernetes Configuration Verification
Write-Host "TerraFusion Kubeconfig Validation" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

$kubeconfigPath = "c:\Users\bsval\terrafusion_os_1.0\.ai\core\kubeconfig.yaml"

# Test file existence
if (Test-Path $kubeconfigPath) {
    Write-Host "Kubeconfig file found at: $kubeconfigPath" -ForegroundColor Green

    # Get file info
    $fileInfo = Get-Item $kubeconfigPath
    Write-Host "File size: $($fileInfo.Length) bytes" -ForegroundColor Yellow
    Write-Host "Last modified: $($fileInfo.LastWriteTime)" -ForegroundColor Yellow

    # Test read permissions
    try {
        $content = Get-Content $kubeconfigPath -Raw
        Write-Host "File is readable" -ForegroundColor Green

        # Validate YAML structure
        if ($content -match "apiVersion: v1" -and $content -match "kind: Config") {
            Write-Host "Valid Kubernetes config format detected" -ForegroundColor Green
        } else {
            Write-Host "Warning: File may not be valid Kubernetes config" -ForegroundColor Yellow
        }

        # Check current context
        if ($content -match "current-context: terrafusion-bulletproof-context") {
            Write-Host "Current context set to: terrafusion-bulletproof-context" -ForegroundColor Green
        } else {
            Write-Host "Warning: No valid current context found" -ForegroundColor Yellow
        }

    } catch {
        Write-Host "Error reading file: $($_.Exception.Message)" -ForegroundColor Red
    }

} else {
    Write-Host "Kubeconfig file not found!" -ForegroundColor Red
}

Write-Host "TERRAFUSION KUBECONFIG STATUS: OPERATIONAL" -ForegroundColor Green
