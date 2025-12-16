<#
.SYNOPSIS
    TerraFusion Dev CLI - Windows PowerShell wrapper

.DESCRIPTION
    One-command bring-up, teardown, and maintenance for TerraFusion.
    Delegates to tf.sh in WSL for actual Docker operations.

.EXAMPLE
    tf up              # Start core stack
    tf up --full       # Start all services
    tf down            # Stop stack
    tf down --prune    # Stop + safe prune
    tf doctor          # Health check
    tf clean           # Safe cleanup
    tf clean --deep    # Deep cleanup
    tf compact         # Compact VHDXs
    tf logs            # Tail logs
    tf status          # Container status
    tf ai up           # Start AI Lab stack
    tf ai down         # Stop AI Lab stack
#>

param(
    [Parameter(Position = 0)]
    [string]$Command = "help",

    [Parameter(Position = 1)]
    [string]$SubCommand = "",

    [switch]$Full,
    [switch]$Deep,
    [switch]$Prune,
    [switch]$Follow
)

# ═══════════════════════════════════════════════════════════════════════════
# Configuration
# ═══════════════════════════════════════════════════════════════════════════

# Support both Windows and WSL repo locations
# Set TF_WSL_ROOT env var to use WSL-native path (faster I/O)
$Script:WSL_DISTRO = "Ubuntu"

if ($env:TF_WSL_ROOT) {
    # Using WSL-native repo (recommended for best performance)
    $Script:WSL_ROOT = $env:TF_WSL_ROOT
    $Script:TF_ROOT = $null  # Not using Windows path
    $Script:LOG_DIR = $null  # Logs go to WSL
    $Script:USE_WSL_NATIVE = $true
}
else {
    # Fallback to Windows path (works but slower I/O)
    $Script:TF_ROOT = "C:\Users\bsval\terrafusion_os_1.0"
    $Script:WSL_ROOT = "/mnt/c/Users/bsval/terrafusion_os_1.0"
    $Script:LOG_DIR = "$Script:TF_ROOT\ops\dev\_logs"
    $Script:USE_WSL_NATIVE = $false

    # Ensure log directory exists
    if (-not (Test-Path $Script:LOG_DIR)) {
        New-Item -ItemType Directory -Path $Script:LOG_DIR -Force | Out-Null
    }
}

# ═══════════════════════════════════════════════════════════════════════════
# Helpers
# ═══════════════════════════════════════════════════════════════════════════

function Log {
    param([string]$Message, [string]$Color = "White")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] $Message"
    Write-Host $logEntry -ForegroundColor $Color
    Add-Content -Path "$Script:LOG_DIR\tf.log" -Value $logEntry
}

function Run-WSL {
    param([string]$BashCommand)
    Log "WSL> $BashCommand" "Cyan"
    wsl -d $Script:WSL_DISTRO --cd $Script:WSL_ROOT -- bash -lc $BashCommand
}

function Show-Banner {
    Write-Host ""
    Write-Host "  ╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "  ║           🌍 TerraFusion Dev CLI                          ║" -ForegroundColor Cyan
    Write-Host "  ╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

function Show-Help {
    Show-Banner
    Write-Host "  Usage: tf <command> [options]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Commands:" -ForegroundColor White
    Write-Host "    up              Start core stack (postgres, redis, backend, ai)" -ForegroundColor Gray
    Write-Host "    up --full       Start all services including monitoring" -ForegroundColor Gray
    Write-Host "    down            Stop stack" -ForegroundColor Gray
    Write-Host "    down --prune    Stop + safe prune" -ForegroundColor Gray
    Write-Host "    doctor          Health check (WSL, Docker, disk)" -ForegroundColor Gray
    Write-Host "    clean           Safe cleanup (images, build cache)" -ForegroundColor Gray
    Write-Host "    clean --deep    Deep cleanup (volumes, networks)" -ForegroundColor Gray
    Write-Host "    compact         Compact WSL VHDXs (requires restart)" -ForegroundColor Gray
    Write-Host "    logs            Tail service logs" -ForegroundColor Gray
    Write-Host "    status          Show container status" -ForegroundColor Gray
    Write-Host "    ai up           Start AI Lab stack (isolated)" -ForegroundColor Gray
    Write-Host "    ai down         Stop AI Lab stack" -ForegroundColor Gray
    Write-Host "    baseline        Capture performance baseline" -ForegroundColor Gray
    Write-Host ""
}

# ═══════════════════════════════════════════════════════════════════════════
# Commands
# ═══════════════════════════════════════════════════════════════════════════

function Invoke-Up {
    Show-Banner
    Log "Starting TerraFusion stack..." "Green"

    if ($Full) {
        Log "Full mode: starting all services" "Yellow"
        Run-WSL "docker compose -f docker-compose.yml -f compose/docker-compose.monitoring.yml up -d"
    }
    else {
        Run-WSL "docker compose -f docker-compose.yml up -d"
    }

    Log "Waiting for services to be healthy..." "Gray"
    Start-Sleep -Seconds 5

    Log "Service status:" "Cyan"
    Run-WSL "docker compose -f docker-compose.yml ps --format 'table {{.Name}}\t{{.Status}}\t{{.Ports}}'"

    Log "Stack is up! 🚀" "Green"
    Write-Host ""
    Write-Host "  Endpoints:" -ForegroundColor Yellow
    Write-Host "    Backend API:  http://localhost:8080" -ForegroundColor Gray
    Write-Host "    PostgreSQL:   localhost:5432" -ForegroundColor Gray
    Write-Host "    Redis:        localhost:6379" -ForegroundColor Gray
    Write-Host ""
}

function Invoke-Down {
    Show-Banner
    Log "Stopping TerraFusion stack..." "Yellow"

    Run-WSL "docker compose -f docker-compose.yml down"

    if ($Prune) {
        Log "Running safe prune..." "Yellow"
        Run-WSL "docker image prune -f"
        Run-WSL "docker builder prune -f"
    }

    Log "Stack stopped." "Green"
}

function Invoke-Doctor {
    Show-Banner
    Log "Running health checks..." "Cyan"

    Write-Host ""
    Write-Host "  ═══ WSL Status ═══" -ForegroundColor Yellow
    wsl -l -v

    Write-Host ""
    Write-Host "  ═══ WSL Resources ═══" -ForegroundColor Yellow
    Run-WSL "echo 'Memory:' && free -h | head -2 && echo '' && echo 'CPUs:' && nproc"

    Write-Host ""
    Write-Host "  ═══ Docker Status ═══" -ForegroundColor Yellow
    Run-WSL "docker system df"

    Write-Host ""
    Write-Host "  ═══ Running Containers ═══" -ForegroundColor Yellow
    Run-WSL "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | head -20"

    Write-Host ""
    Write-Host "  ═══ Disk Usage ═══" -ForegroundColor Yellow
    $drive = Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='C:'"
    $freeGB = [math]::Round($drive.FreeSpace / 1GB, 1)
    $totalGB = [math]::Round($drive.Size / 1GB, 1)
    $usedPct = [math]::Round((1 - $drive.FreeSpace / $drive.Size) * 100, 1)
    Write-Host "    C: Drive: $freeGB GB free / $totalGB GB ($usedPct% used)" -ForegroundColor $(if ($usedPct -gt 80) { "Red" } elseif ($usedPct -gt 60) { "Yellow" } else { "Green" })

    # Check VHDX sizes
    $dockerVhdx = Get-Item "$env:LOCALAPPDATA\Docker\wsl\disk\docker_data.vhdx" -ErrorAction SilentlyContinue
    if ($dockerVhdx) {
        $vhdxGB = [math]::Round($dockerVhdx.Length / 1GB, 1)
        Write-Host "    Docker VHDX: $vhdxGB GB" -ForegroundColor $(if ($vhdxGB -gt 100) { "Yellow" } else { "Green" })
    }

    Write-Host ""
    Log "Health check complete." "Green"
}

function Invoke-Clean {
    Show-Banner

    if ($Deep) {
        Log "Running deep clean (careful!)..." "Red"
        Run-WSL "docker system prune -f"
        Run-WSL "docker volume prune -f"
    }
    else {
        Log "Running safe clean..." "Yellow"
        Run-WSL "docker image prune -f"
        Run-WSL "docker builder prune -f"
    }

    Log "Clean complete." "Green"
}

function Invoke-Compact {
    Show-Banner
    Log "Compacting WSL VHDXs..." "Yellow"
    Log "This requires WSL shutdown. Continue? (Ctrl+C to abort)" "Red"
    Start-Sleep -Seconds 3

    Log "Shutting down WSL..." "Yellow"
    wsl --shutdown
    Start-Sleep -Seconds 5

    Log "Running DiskCare compaction..." "Cyan"
    & "C:\Tools\DiskCare\DiskCare.ps1" -EnableDockerCompaction

    Log "Compaction complete. WSL will restart on next use." "Green"
}

function Invoke-Logs {
    Show-Banner
    Log "Tailing logs (Ctrl+C to stop)..." "Cyan"
    Run-WSL "docker compose -f docker-compose.yml logs -f --tail=100"
}

function Invoke-Status {
    Show-Banner
    Log "Container status:" "Cyan"
    Run-WSL "docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}'"
}

function Invoke-AI {
    Show-Banner

    switch ($SubCommand) {
        "up" {
            Log "Starting AI Lab stack (isolated)..." "Magenta"
            Run-WSL "docker compose -f ops/ai/compose.ai.yml up -d"
            Log "AI Lab is up! Ollama: http://localhost:11434" "Green"
        }
        "down" {
            Log "Stopping AI Lab stack..." "Yellow"
            Run-WSL "docker compose -f ops/ai/compose.ai.yml down"
            Log "AI Lab stopped." "Green"
        }
        default {
            Write-Host "  Usage: tf ai <up|down>" -ForegroundColor Yellow
        }
    }
}

function Invoke-Baseline {
    Show-Banner
    Log "Capturing baseline..." "Cyan"
    $label = "baseline_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    & "C:\Tools\DevBaseline\Capture-Baseline.ps1" -Label $label
}

# ═══════════════════════════════════════════════════════════════════════════
# Main
# ═══════════════════════════════════════════════════════════════════════════

switch ($Command) {
    "up" { Invoke-Up }
    "down" { Invoke-Down }
    "doctor" { Invoke-Doctor }
    "clean" { Invoke-Clean }
    "compact" { Invoke-Compact }
    "logs" { Invoke-Logs }
    "status" { Invoke-Status }
    "ai" { Invoke-AI }
    "baseline" { Invoke-Baseline }
    default { Show-Help }
}
