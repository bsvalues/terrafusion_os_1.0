Write-Host "--- DIRECT NEURAL INJECTION PROTOCOL ---" -ForegroundColor Cyan
$ErrorActionPreference = "Stop"

# 1. CLEANUP
taskkill /F /IM deno.exe /T 2>$null
Write-Host "☠️  Stale Kernel Terminated." -ForegroundColor Yellow

# 2. SECURE KEY INPUT
$SecureKey = Read-Host -Prompt "Enter OpenAI API Key (Input will be masked)" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureKey)
$PlainKey = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# 3. SET ENVIRONMENT (Current Session Only)
# Force Database Params here too just in case
$env:POSTGRES_HOST = "localhost"
$env:POSTGRES_PORT = "5433"
$env:POSTGRES_DB = "postgres"
$env:POSTGRES_USER = "postgres"
$env:POSTGRES_PASSWORD = "postgres"
$env:OPENAI_API_KEY = $PlainKey

# 4. LAUNCH KERNEL (Direct Mode)
Write-Host "🚀 Launching Deno Kernel with Key Injection..." -ForegroundColor Green
Set-Location "C:\Users\bsval\terrafusion_os_1.0\os-kernel\api"

deno run --allow-net --allow-env --allow-read main.ts