param (
    [string]$OpenAIKey
)

$PSScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition

# FORCE DB CONFIGURATION
$env:POSTGRES_HOST = "localhost"
$env:POSTGRES_PORT = "5433"
$env:POSTGRES_DB = "postgres"
$env:POSTGRES_USER = "postgres"
$env:POSTGRES_PASSWORD = "postgres"

# 1. Try Parameter
if ($OpenAIKey) {
    $env:OPENAI_API_KEY = $OpenAIKey
}

# 2. Try Prompt if Missing
if (-not $env:OPENAI_API_KEY) {
    Write-Host "⚠️  No API Key detected in environment." -ForegroundColor Yellow
    $SecureKey = Read-Host -Prompt "🔑 Enter OpenAI API Key (Input masked)" -AsSecureString
    
    if ($SecureKey) {
        $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureKey)
        $PlainKey = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
        $env:OPENAI_API_KEY = $PlainKey
    }
}

Write-Host "Initializing TerraFusion Kernel..." -ForegroundColor Cyan
Write-Host "Targeting DB: localhost:5433" -ForegroundColor Gray

if ($env:OPENAI_API_KEY) {
    if ($env:OPENAI_API_KEY.Length -gt 10) {
        $MaskedKey = $env:OPENAI_API_KEY.Substring(0, 7) + "..." + $env:OPENAI_API_KEY.Substring($env:OPENAI_API_KEY.Length - 4)
        Write-Host "🧠 Neural Link: CONNECTED ($MaskedKey)" -ForegroundColor Green
    } else {
        Write-Host "🧠 Neural Link: CONNECTED (Short Key Detected)" -ForegroundColor Green
    }
} else {
    Write-Host "⚡ Neural Link: OFFLINE (Local Mode)" -ForegroundColor Yellow
}

# Ensure we are in the correct directory for relative imports/paths
Set-Location "$PSScriptRoot\api"

# Run Deno with checking for the API Key
deno run --allow-net --allow-env --allow-read main.ts
