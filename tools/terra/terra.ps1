Param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$Command,

    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Args
)

# Resolve repo root (tools/terra/terra.ps1 -> tools/terra -> tools -> repo root)
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot  = Resolve-Path "$ScriptDir/../.."

function Invoke-Backend {
    param(
        [string[]]$Args
    )

    $backendScript = Join-Path $RepoRoot "backend/scripts/start-api.ps1"

    if (-not (Test-Path $backendScript)) {
        Write-Host "[terra] ❌ Backend script not found at $backendScript" -ForegroundColor Red
        exit 1
    }

    Write-Host "[terra] ▶ Running backend via $backendScript" -ForegroundColor Cyan
    & $backendScript @Args
    exit $LASTEXITCODE
}

function Invoke-Frontend {
    param(
        [string[]]$Args
    )

    $frontendScript = Join-Path $RepoRoot "frontend/scripts/command-center.ps1"

    if (-not (Test-Path $frontendScript)) {
        Write-Host "[terra] ❌ Frontend script not found at $frontendScript" -ForegroundColor Red
        exit 1
    }

    Write-Host "[terra] ▶ Running frontend via $frontendScript" -ForegroundColor Cyan
    & $frontendScript @Args
    exit $LASTEXITCODE
}

function Test-Backend {
    Write-Host "`n[terra:doctor] 🔍 Backend checks" -ForegroundColor Yellow

    $slnPath = Join-Path $RepoRoot "backend/TerraFusion.sln"

    if (-not (Test-Path $slnPath)) {
        Write-Host "[terra:doctor] ❌ Solution not found at $slnPath" -ForegroundColor Red
        return $false
    }

    Write-Host "[terra:doctor] ✅ Found solution: $slnPath" -ForegroundColor Green

    Push-Location (Join-Path $RepoRoot "backend")
    try {
        Write-Host "[terra:doctor] ▶ dotnet build TerraFusion.sln -c Release --no-restore" -ForegroundColor Cyan
        & dotnet build "TerraFusion.sln" -c Release --no-restore
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[terra:doctor] ❌ Backend build failed (exit $LASTEXITCODE)" -ForegroundColor Red
            return $false
        }

        Write-Host "[terra:doctor] ✅ Backend build succeeded" -ForegroundColor Green
        return $true
    }
    finally {
        Pop-Location
    }
}

function Test-Frontend {
    Write-Host "`n[terra:doctor] 🔍 Frontend checks" -ForegroundColor Yellow

    $frontendRoot = Join-Path $RepoRoot "frontend"
    $commandCenter = Join-Path $RepoRoot "frontend/scripts/command-center.ps1"
    $osShell = Join-Path $RepoRoot "frontend/apps/os-shell"

    $ok = $true

    if (-not (Test-Path $frontendRoot)) {
        Write-Host "[terra:doctor] ❌ Frontend root not found at $frontendRoot" -ForegroundColor Red
        return $false
    } else {
        Write-Host "[terra:doctor] ✅ Frontend root present: $frontendRoot" -ForegroundColor Green
    }

    if (-not (Test-Path $commandCenter)) {
        Write-Host "[terra:doctor] ❌ command-center script missing at $commandCenter" -ForegroundColor Red
        $ok = $false
    } else {
        Write-Host "[terra:doctor] ✅ command-center script present" -ForegroundColor Green
    }

    if (-not (Test-Path $osShell)) {
        Write-Host "[terra:doctor] ❌ os-shell app missing at $osShell" -ForegroundColor Red
        $ok = $false
    } else {
        Write-Host "[terra:doctor] ✅ os-shell app present" -ForegroundColor Green
    }

    # Optional: light frontend build check if pnpm + package.json exist
    if ($ok) {
        $pnpm = Get-Command pnpm -ErrorAction SilentlyContinue
        $pkg  = Join-Path $frontendRoot "package.json"

        if ($pnpm -and (Test-Path $pkg)) {
            Push-Location $frontendRoot
            try {
                Write-Host "[terra:doctor] ▶ pnpm run build (frontend)" -ForegroundColor Cyan
                & pnpm run build
                if ($LASTEXITCODE -ne 0) {
                    Write-Host "[terra:doctor] ❌ Frontend build failed (exit $LASTEXITCODE)" -ForegroundColor Red
                    return $false
                }

                Write-Host "[terra:doctor] ✅ Frontend build succeeded" -ForegroundColor Green
            }
            finally {
                Pop-Location
            }
        }
        else {
            Write-Host "[terra:doctor] ⚠ Skipping frontend build (pnpm or package.json not found)" -ForegroundColor DarkYellow
        }
    }

    return $ok
}

function Invoke-Doctor {
    Write-Host "[terra:doctor] Running TerraFusion OS health checks..." -ForegroundColor Cyan

    $backendOk  = Test-Backend
    $frontendOk = Test-Frontend

    if ($backendOk -and $frontendOk) {
        Write-Host "`n[terra:doctor] ✅ All checks passed" -ForegroundColor Green
        exit 0
    } else {
        Write-Host "`n[terra:doctor] ❌ One or more checks failed" -ForegroundColor Red
        exit 1
    }
}

switch ($Command.ToLowerInvariant()) {
    "backend"   { Invoke-Backend -Args $Args }
    "frontend"  { Invoke-Frontend -Args $Args }
    "doctor"    { Invoke-Doctor }
    "run" {
        if ($Args.Length -eq 0) {
            Write-Host "[terra] Usage: terra.ps1 run <backend|frontend|doctor>" -ForegroundColor Yellow
            exit 1
        }

        $sub = $Args[0].ToLowerInvariant()
        $rest = @()
        if ($Args.Length -gt 1) {
            $rest = $Args[1..($Args.Length - 1)]
        }

        switch ($sub) {
            "backend"  { Invoke-Backend -Args $rest }
            "frontend" { Invoke-Frontend -Args $rest }
            "doctor"   { Invoke-Doctor }
            default {
                Write-Host "[terra] Unknown run target '$sub'. Expected backend|frontend|doctor." -ForegroundColor Red
                exit 1
            }
        }
    }
    default {
        Write-Host "[terra] Usage: terra.ps1 <backend|frontend|doctor|run>" -ForegroundColor Yellow
        exit 1
    }
}
