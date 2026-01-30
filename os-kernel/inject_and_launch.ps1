Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  TERRAFUSION KERNEL - DIRECT LAUNCH PROTOCOL" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan

$ErrorActionPreference = "Stop"

# 1. KILL STALE BACKEND PROCESSES ONLY
Write-Host "`n[Step 1] Terminating stale backend processes..." -ForegroundColor Yellow
$StaleProcesses = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
if ($StaleProcesses) {
    # FIX: Using $p_id instead of reserved $pid
    foreach ($conn in $StaleProcesses) {
        $p_id = $conn.OwningProcess
        try {
            Stop-Process -Id $p_id -Force -ErrorAction SilentlyContinue
            Write-Host "  💀 Killed PID $p_id (Port 5000)" -ForegroundColor Gray
        } catch {}
    }
} else {
    Write-Host "  ✅ Port 5000 is clear." -ForegroundColor Green
}

# 2. SECURE INPUT
Write-Host "`n[Step 2] Security Clearance Required" -ForegroundColor Yellow
$Key = Read-Host -Prompt "Enter OpenAI API Key (Input will be hidden/masked)" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($Key)
$PlainKey = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

if ($PlainKey.Length -lt 10) {
    Write-Host "⚠️  No Valid Key detected. Launching in HEURISTIC FALLBACK MODE." -ForegroundColor Yellow
    $env:OPENAI_API_KEY = ""
} else {
    $env:OPENAI_API_KEY = $PlainKey
    Write-Host "✅ Key Injected." -ForegroundColor Green
}

# 3. CONFIGURE ENVIRONMENT
$env:TF_SOVEREIGN_URLS = "http://localhost:5000"
$env:POSTGRES_HOST = "localhost"
$env:POSTGRES_PORT = "5432"
$env:POSTGRES_DB = "terrafusion"
$env:POSTGRES_USER = "postgres"
$env:POSTGRES_PASSWORD = "postgres"

# 4. LAUNCH KERNEL (Direct Mode)
$KernelDir = "C:\Users\bsval\terrafusion_os_1.0\os-kernel\api"
Write-Host "`n[Step 3] Igniting Kernel..." -ForegroundColor Green
Set-Location $KernelDir

# Launch Deno directly in this window to preserve the environment variable
deno run --allow-net --allow-env --allow-read main.ts
