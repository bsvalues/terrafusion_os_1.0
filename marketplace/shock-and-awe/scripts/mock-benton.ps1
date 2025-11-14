param(
    [int]$StatsPort = 5051,
    [int]$FinancePort = 5052
)

# Ensure we run from the openapi folder
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $root "..\")
$openapi = Resolve-Path (Join-Path $repoRoot "openapi")

Write-Host "Starting Prism mocks from: $openapi"
Push-Location $openapi

try {
    npx -y @stoplight/prism-cli mock statistics.yaml --port $StatsPort | Write-Output
    npx -y @stoplight/prism-cli mock finance.yaml --port $FinancePort | Write-Output
}
finally {
    Pop-Location
}
