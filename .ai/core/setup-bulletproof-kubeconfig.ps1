# TerraFusion OS kubeconfig bootstrap (sanitized template mode)
# This script never writes live credential material into the repository.

$ProjectRoot = "c:\Users\bsval\terrafusion_os_1.0"
$KubeconfigPath = Join-Path $ProjectRoot ".ai\core\kubeconfig.yaml"
$AlternativePaths = @(
    $KubeconfigPath,
    (Join-Path $env:USERPROFILE ".kube\config"),
    ".\kubeconfig.yaml",
    (Join-Path $ProjectRoot "kubeconfig.yaml")
)
$RedactionMarkers = @("REDACTED_", "REPLACE_WITH_")

function Write-TerraFusionStep {
    param([string]$Message, [string]$Color = "Cyan")
    Write-Host "[step] $Message" -ForegroundColor $Color
}

function Write-TerraFusionSuccess {
    param([string]$Message)
    Write-Host "[ok] $Message" -ForegroundColor Green
}

function Write-TerraFusionWarning {
    param([string]$Message)
    Write-Host "[warn] $Message" -ForegroundColor Yellow
}

function Write-TerraFusionError {
    param([string]$Message)
    Write-Host "[error] $Message" -ForegroundColor Red
}

function Get-SanitizedKubeconfigTemplate {
@"
# TerraFusion OS sanitized kubeconfig template
# This file is intentionally redacted after public-exposure remediation.
# Provision rotated credentials from a secure source before use.

apiVersion: v1
kind: Config
current-context: terrafusion-bulletproof-context
preferences: {}

clusters:
  - name: terrafusion-bulletproof-cluster
    cluster:
      server: https://REPLACE_WITH_CLUSTER_ENDPOINT:6443
      certificate-authority-data: REDACTED_ROTATE_CA_BEFORE_USE
  - name: terrafusion-local-cluster
    cluster:
      server: https://localhost:6443
      certificate-authority-data: REDACTED_ROTATE_CA_BEFORE_USE

contexts:
  - name: terrafusion-bulletproof-context
    context:
      cluster: terrafusion-bulletproof-cluster
      namespace: terrafusion-system
      user: terrafusion-bulletproof-admin
  - name: terrafusion-monitoring-context
    context:
      cluster: terrafusion-bulletproof-cluster
      namespace: terrafusion-monitoring
      user: terrafusion-monitoring-user
  - name: istio-mesh-context
    context:
      cluster: terrafusion-bulletproof-cluster
      namespace: istio-system
      user: istio-admin

users:
  - name: terrafusion-bulletproof-admin
    user:
      client-certificate-data: REDACTED_ROTATE_CLIENT_CERT_BEFORE_USE
      client-key-data: REDACTED_ROTATE_CLIENT_KEY_BEFORE_USE
  - name: terrafusion-monitoring-user
    user:
      token: REDACTED_ROTATE_MONITORING_TOKEN_BEFORE_USE
  - name: istio-admin
    user:
      token: REDACTED_ROTATE_ISTIO_TOKEN_BEFORE_USE
  - name: terrafusion-developer
    user:
      token: REDACTED_ROTATE_DEVELOPER_TOKEN_BEFORE_USE
"@
}

function Test-BulletproofKubeconfig {
    $validationResults = [ordered]@{
        PathResolved = $false
        ConfigValid = $false
        TemplateOnly = $false
        ContextsFound = 0
        BulletproofContext = $false
        PermissionsValid = $false
        PathForClaudeFlow = ""
    }

    foreach ($candidatePath in $AlternativePaths) {
        if (Test-Path $candidatePath) {
            $validationResults.PathResolved = $true
            $validationResults.PathForClaudeFlow = $candidatePath
            break
        }
    }

    if (-not $validationResults.PathResolved) {
        Write-TerraFusionWarning "No kubeconfig found. A sanitized template will be written."
        return [pscustomobject]$validationResults
    }

    Write-TerraFusionSuccess "Kubeconfig found: $($validationResults.PathForClaudeFlow)"

    try {
        $content = Get-Content $validationResults.PathForClaudeFlow -Raw

        if ($content -match "apiVersion:\s*v1" -and $content -match "kind:\s*Config") {
            $validationResults.ConfigValid = $true
        }

        if ($content -match "terrafusion-bulletproof-context") {
            $validationResults.BulletproofContext = $true
        }

        $validationResults.ContextsFound = ([regex]::Matches($content, "name:\s+.+context")).Count
        $validationResults.PermissionsValid = -not (Get-Item $validationResults.PathForClaudeFlow).IsReadOnly

        foreach ($marker in $RedactionMarkers) {
            if ($content -match [regex]::Escape($marker)) {
                $validationResults.TemplateOnly = $true
                $validationResults.ConfigValid = $false
                Write-TerraFusionWarning "Kubeconfig is a sanitized template, not a live credential bundle."
                break
            }
        }

        if ($validationResults.ContextsFound -gt 0) {
            Write-TerraFusionSuccess "Contexts found: $($validationResults.ContextsFound)"
        }
    } catch {
        Write-TerraFusionError "Failed to inspect kubeconfig: $($_.Exception.Message)"
    }

    return [pscustomobject]$validationResults
}

function New-BulletproofKubeconfig {
    param([string]$OutputPath)

    $directory = Split-Path $OutputPath -Parent
    if (-not (Test-Path $directory)) {
        New-Item -ItemType Directory -Path $directory -Force | Out-Null
    }

    try {
        Set-Content -Path $OutputPath -Value (Get-SanitizedKubeconfigTemplate) -Encoding UTF8
        Write-TerraFusionSuccess "Sanitized kubeconfig template written: $OutputPath"
        return $true
    } catch {
        Write-TerraFusionError "Failed to write sanitized kubeconfig template: $($_.Exception.Message)"
        return $false
    }
}

function Set-ClaudeFlowEnvironment {
    param([string]$ResolvedKubeconfigPath)

    $env:KUBECONFIG = $ResolvedKubeconfigPath
    [System.Environment]::SetEnvironmentVariable("KUBECONFIG", $ResolvedKubeconfigPath, "User")
    $env:TERRAFUSION_BULLETPROOF_MODE = "true"
    $env:TERRAFUSION_SERVICE_MESH_ENABLED = "true"
    $env:TERRAFUSION_KUBERNETES_CONTEXT = "terrafusion-bulletproof-context"
    $env:TERRAFUSION_NAMESPACE = "terrafusion-system"

    Write-TerraFusionSuccess "KUBECONFIG environment variable set to: $ResolvedKubeconfigPath"
}

function New-ClaudeFlowPathResolver {
    $resolverContent = @"
// TerraFusion OS kubeconfig path resolver
// Generated by setup-bulletproof-kubeconfig.ps1

export const BULLETPROOF_KUBECONFIG_PATHS = {
  primary: '$($KubeconfigPath.Replace('\', '\\'))',
  alternatives: [
    '$((Join-Path $env:USERPROFILE ".kube\config").Replace('\', '\\'))',
    './kubeconfig.yaml',
    '$((Join-Path $ProjectRoot "kubeconfig.yaml").Replace('\', '\\'))',
    process.env.KUBECONFIG || ''
  ].filter(Boolean),

  resolve(): string {
    const fs = require('fs');

    if (fs.existsSync(this.primary)) {
      return this.primary;
    }

    for (const altPath of this.alternatives) {
      if (altPath && fs.existsSync(altPath)) {
        return altPath;
      }
    }

    return this.primary;
  },

  validate(configPath: string): boolean {
    try {
      const fs = require('fs');
      const content = fs.readFileSync(configPath, 'utf8');
      return content.includes('apiVersion: v1') &&
             content.includes('kind: Config') &&
             content.includes('terrafusion-bulletproof-context') &&
             !content.includes('REDACTED_') &&
             !content.includes('REPLACE_WITH_');
    } catch {
      return false;
    }
  }
};

export const getKubeconfigPath = () => BULLETPROOF_KUBECONFIG_PATHS.resolve();
export const validateKubeconfig = (path: string) => BULLETPROOF_KUBECONFIG_PATHS.validate(path);
"@

    $resolverPath = Join-Path $ProjectRoot ".ai\core\KubeconfigPathResolver.ts"

    try {
        Set-Content -Path $resolverPath -Value $resolverContent -Encoding UTF8
        Write-TerraFusionSuccess "Path resolver generated: $resolverPath"
    } catch {
        Write-TerraFusionWarning "Failed to generate path resolver: $($_.Exception.Message)"
    }
}

Write-TerraFusionStep "Validating kubeconfig state..."
$validationResults = Test-BulletproofKubeconfig

if ($validationResults.PathResolved -and $validationResults.ConfigValid -and $validationResults.BulletproofContext) {
    Write-TerraFusionSuccess "Live kubeconfig detected. No repository redaction changes required."
    Set-ClaudeFlowEnvironment -ResolvedKubeconfigPath $validationResults.PathForClaudeFlow
    New-ClaudeFlowPathResolver
    exit 0
}

$templateWritten = New-BulletproofKubeconfig -OutputPath $KubeconfigPath
New-ClaudeFlowPathResolver

if (-not $templateWritten) {
    exit 1
}

Write-TerraFusionWarning "A sanitized template was written to the repository path."
Write-TerraFusionError "Provision a rotated kubeconfig from a secure source before running cluster automation."
exit 1
