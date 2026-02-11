<#
.SYNOPSIS
    Benton Parity Harness — Windows/PowerShell parity layer.

.DESCRIPTION
    Provides BENTON_MODE toggle and harness execution on Windows for local
    dev testing. Uses Windows Firewall (netsh advfirewall) instead of iptables.

    NOTE: The canonical harness runs on Linux (iptables). This script provides
    parity for Windows development machines.

.EXAMPLE
    # Enable Benton Mode (requires Administrator)
    .\benton-mode.ps1 -Action Enable

    # Disable Benton Mode
    .\benton-mode.ps1 -Action Disable

    # Check status
    .\benton-mode.ps1 -Action Status

    # Run the full harness (env-var mode, no firewall changes)
    .\benton-mode.ps1 -Action Harness
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [ValidateSet('Enable', 'Disable', 'Status', 'Harness')]
    [string]$Action
)

$ErrorActionPreference = 'Stop'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent (Split-Path -Parent $ScriptDir)
$EvidenceDir = Join-Path $ScriptDir 'evidence'
$RuleName = 'BentonParity_DenyAllOutbound'

function Write-Phase { param([string]$Message) Write-Host "`n=== $Message ===`n" -ForegroundColor Cyan }
function Write-Ok { param([string]$Message) Write-Host "[OK]   $Message" -ForegroundColor Green }
function Write-Fail { param([string]$Message) Write-Host "[FAIL] $Message" -ForegroundColor Red }
function Write-Warn { param([string]$Message) Write-Host "[WARN] $Message" -ForegroundColor Yellow }
function Write-Info { param([string]$Message) Write-Host "[INFO] $Message" -ForegroundColor Gray }

function Test-Administrator {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identity)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Enable-BentonMode {
    Write-Phase 'ENABLING BENTON MODE (Windows Firewall)'

    if (-not (Test-Administrator)) {
        Write-Fail 'Administrator privileges required. Run as Administrator.'
        exit 1
    }

    # Remove existing rule if present
    $existing = Get-NetFirewallRule -DisplayName $RuleName -ErrorAction SilentlyContinue
    if ($existing) {
        Write-Warn 'Benton Mode already active — re-applying rules'
        Remove-NetFirewallRule -DisplayName $RuleName -ErrorAction SilentlyContinue
    }

    # Block all outbound (except loopback and local subnets)
    New-NetFirewallRule `
        -DisplayName $RuleName `
        -Direction Outbound `
        -Action Block `
        -RemoteAddress 'Internet' `
        -Protocol TCP `
        -Enabled True `
        -Description 'Benton Parity Harness: Deny all outbound to discover requirements' | Out-Null

    # Enable firewall logging
    Set-NetFirewallProfile -Profile Domain, Private, Public `
        -LogBlocked True `
        -LogFileName "$EvidenceDir\windows-firewall.log" `
        -LogMaxSizeKilobytes 32768

    # Set env var for the session
    $env:BENTON_MODE = '1'

    if (-not (Test-Path $EvidenceDir)) { New-Item -ItemType Directory -Path $EvidenceDir -Force | Out-Null }
    "$(Get-Date -Format 'o') BENTON_MODE=ENABLED" | Out-File -Append "$EvidenceDir\mode-transitions.log"

    Write-Ok 'Benton Mode ENABLED (Windows Firewall)'
    Write-Info 'All outbound internet traffic is now BLOCKED'
    Write-Info 'Local subnet traffic is still allowed'
    Write-Info "Firewall log: $EvidenceDir\windows-firewall.log"
}

function Disable-BentonMode {
    Write-Phase 'DISABLING BENTON MODE'

    if (-not (Test-Administrator)) {
        Write-Fail 'Administrator privileges required.'
        exit 1
    }

    Remove-NetFirewallRule -DisplayName $RuleName -ErrorAction SilentlyContinue

    $env:BENTON_MODE = '0'

    if (-not (Test-Path $EvidenceDir)) { New-Item -ItemType Directory -Path $EvidenceDir -Force | Out-Null }
    "$(Get-Date -Format 'o') BENTON_MODE=DISABLED" | Out-File -Append "$EvidenceDir\mode-transitions.log"

    Write-Ok 'Benton Mode DISABLED — normal outbound restored'
}

function Show-Status {
    Write-Phase 'BENTON MODE STATUS'

    $rule = Get-NetFirewallRule -DisplayName $RuleName -ErrorAction SilentlyContinue
    if ($rule -and $rule.Enabled -eq 'True') {
        Write-Ok 'Benton Mode is ACTIVE (Windows Firewall rule present)'
        $rule | Format-List DisplayName, Direction, Action, Enabled
    }
    else {
        Write-Warn 'Benton Mode is INACTIVE'
    }

    if ($env:BENTON_MODE -eq '1') {
        Write-Info 'BENTON_MODE env var is set (simulation mode)'
    }
}

function Invoke-Harness {
    Write-Phase 'BENTON PARITY HARNESS (Windows)'

    # Set BENTON_MODE env var for subprocess awareness
    if (-not $env:BENTON_MODE) { $env:BENTON_MODE = '0' }

    if (-not (Test-Path $EvidenceDir)) { New-Item -ItemType Directory -Path $EvidenceDir -Force | Out-Null }

    $isBentonMode = ($env:BENTON_MODE -eq '1') -or
                    (Get-NetFirewallRule -DisplayName $RuleName -ErrorAction SilentlyContinue)

    # Metadata
    @{
        harness_version = '1.0.0'
        started_at      = (Get-Date -Format 'o')
        hostname        = $env:COMPUTERNAME
        benton_mode     = [bool]$isBentonMode
        platform        = 'windows'
        phase           = 'all'
    } | ConvertTo-Json | Out-File "$EvidenceDir\harness-meta.json" -Encoding utf8

    # --- Network Probe ---
    Write-Phase 'NETWORK PROBE'
    $netReqs = @()
    $endpoints = @(
        @{ Label = 'GitHub API'; Host = 'api.github.com'; Port = 443 }
        @{ Label = 'GitHub'; Host = 'github.com'; Port = 443 }
        @{ Label = 'npm Registry'; Host = 'registry.npmjs.org'; Port = 443 }
        @{ Label = 'NuGet Registry'; Host = 'api.nuget.org'; Port = 443 }
        @{ Label = 'NuGet CDN'; Host = 'globalcdn.nuget.org'; Port = 443 }
    )

    foreach ($ep in $endpoints) {
        try {
            $tcp = New-Object System.Net.Sockets.TcpClient
            $result = $tcp.BeginConnect($ep.Host, $ep.Port, $null, $null)
            $waited = $result.AsyncWaitHandle.WaitOne(5000, $false)
            if ($waited -and $tcp.Connected) {
                Write-Ok "NET  $($ep.Label) ($($ep.Host):$($ep.Port))"
            }
            else {
                throw 'timeout'
            }
            $tcp.Close()
        }
        catch {
            Write-Fail "NET  $($ep.Label) ($($ep.Host):$($ep.Port)) — blocked/unreachable"
            $netReqs += @{
                timestamp = (Get-Date -Format 'o')
                category  = 'network'
                key       = "$($ep.Host):$($ep.Port)"
                value     = "Required for: $($ep.Label)"
                source    = 'net-probe-windows'
            }
        }
    }
    $netReqs | ConvertTo-Json -Depth 3 | Out-File "$EvidenceDir\network-requirements.json" -Encoding utf8

    # --- Build Probe ---
    Write-Phase 'BUILD PROBE'
    $buildReqs = @()

    # dotnet
    $dotnetCmd = Get-Command dotnet -ErrorAction SilentlyContinue
    if (-not $dotnetCmd) {
        Write-Fail 'BUILD dotnet not found'
        $buildReqs += @{
            timestamp = (Get-Date -Format 'o'); category = 'toolchain'
            key = 'dotnet-sdk'; value = 'dotnet SDK 8.0.x required'; source = 'build-probe'
        }
    }
    else {
        Write-Ok "BUILD dotnet $(dotnet --version)"
        $slnPath = Join-Path $RepoRoot 'backend\TerraFusion.sln'
        if (Test-Path $slnPath) {
            $restoreOut = & dotnet restore $slnPath 2>&1 | Out-String
            if ($LASTEXITCODE -ne 0) {
                Write-Fail 'BUILD dotnet restore failed'
                $buildReqs += @{
                    timestamp = (Get-Date -Format 'o'); category = 'nuget-source'
                    key = 'dotnet-restore'; value = $restoreOut.Substring(0, [Math]::Min(500, $restoreOut.Length))
                    source = 'dotnet restore'
                }
            }
            else { Write-Ok 'BUILD dotnet restore succeeded' }
        }
    }

    # node/pnpm
    $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
    if (-not $nodeCmd) {
        Write-Fail 'BUILD node not found'
        $buildReqs += @{
            timestamp = (Get-Date -Format 'o'); category = 'toolchain'
            key = 'node'; value = 'Node.js 20.x required'; source = 'build-probe'
        }
    }
    else { Write-Ok "BUILD node $(node --version)" }

    $pnpmCmd = Get-Command pnpm -ErrorAction SilentlyContinue
    if (-not $pnpmCmd) {
        Write-Fail 'BUILD pnpm not found'
        $buildReqs += @{
            timestamp = (Get-Date -Format 'o'); category = 'toolchain'
            key = 'pnpm'; value = 'pnpm >=9.0.0 required'; source = 'build-probe'
        }
    }
    else {
        Write-Ok "BUILD pnpm $(pnpm --version)"
    }

    $buildReqs | ConvertTo-Json -Depth 3 | Out-File "$EvidenceDir\supply-chain-requirements.json" -Encoding utf8

    # --- Summary ---
    Write-Phase 'HARNESS COMPLETE'
    Write-Info "Evidence directory: $EvidenceDir"
    Write-Info "Network requirements: $($netReqs.Count)"
    Write-Info "Build requirements: $($buildReqs.Count)"

    if ($netReqs.Count -eq 0 -and $buildReqs.Count -eq 0) {
        Write-Ok 'All probes passed'
    }
    else {
        Write-Warn 'Requirements discovered — review evidence directory'
    }
}

# --- Dispatch ---
switch ($Action) {
    'Enable'  { Enable-BentonMode }
    'Disable' { Disable-BentonMode }
    'Status'  { Show-Status }
    'Harness' { Invoke-Harness }
}
