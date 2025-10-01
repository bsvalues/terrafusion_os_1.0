# TerraFusion OS API Startup Script with Dynamic Port Management
# Elite Government Technology Platform

param(
    [string]$Port = $env:TF_API_PORT
)

# Load port configuration from .env.ports if port not provided
if (-not $Port) {
    # Try to load from .env.ports file
    $envPortsPath = Join-Path $PSScriptRoot "..\.env.ports"
    if (Test-Path $envPortsPath) {
        $envContent = Get-Content $envPortsPath | Where-Object { $_ -match "TF_API_PORT=" -and $_ -notmatch "^#" }
        if ($envContent) {
            # Extract the default port value from TF_API_PORT=${TF_API_PORT:-5050}
            $portMatch = $envContent | Select-String "TF_API_PORT=.*:-(\d+)"
            if ($portMatch) {
                $Port = $portMatch.Matches[0].Groups[1].Value
                Write-Host "⚙️ Loaded API port from .env.ports: $Port" -ForegroundColor Yellow
            }
        }
    }
    
    # Final fallback - refuse to start without configuration
    if (-not $Port) {
        Write-Host "❌ ANTI-HARDCODING: TF_API_PORT must be set in environment variables or .env.ports" -ForegroundColor Red
        Write-Host "💡 Set port: `$env:TF_API_PORT='5050' or configure .env.ports" -ForegroundColor Yellow
        exit 1
    }
    
    $env:TF_API_PORT = $Port
}

Write-Host "🚀 Starting TerraFusion OS API Gateway on port $Port" -ForegroundColor Green
Write-Host "🏛️ Government Operating System - Elite .NET 8.0 Performance" -ForegroundColor Cyan

# Navigate to API directory and start with dynamic port
Set-Location "backend/TerraFusion.API"
dotnet run --project TerraFusion.API.csproj --urls="http://localhost:$Port"