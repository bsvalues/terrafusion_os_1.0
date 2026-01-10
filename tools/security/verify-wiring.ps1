$ErrorActionPreference = "Stop"
Write-Host "--- GUARDRAIL: WIRING INTEGRITY CHECK ---" -ForegroundColor Cyan

$DeadZones = @("marketplace/", "workspaces/", "SDK/modules/")
$CriticalDirs = @("docker-compose*", "deployment", "infrastructure", "kubernetes", "scripts", "workspaces", "frontend", "backend")

$Failed = $false
foreach ($dir in $CriticalDirs) {
    if (Test-Path $dir) {
        $Hits = Get-ChildItem -Path $dir -Recurse -File -Include *.yml,*.yaml,*.json,*.ps1,*.sh,*.csproj,*.sln,*.js,*.ts,*.tsx -ErrorAction SilentlyContinue | 
            Select-String -Pattern "marketplace/|workspaces/|SDK/modules/" -SimpleMatch
        
        if ($Hits) {
            Write-Host "❌ Dead Zone Detected in: $dir" -ForegroundColor Red
            $Hits | ForEach-Object { Write-Host "   $($_.Path):$($_.LineNumber)" -ForegroundColor Gray }
            $Failed = $true
        }
    }
}

if ($Failed) {
    Write-Error "Wiring Verification Failed. Dead-zone references found."
    exit 1
}
Write-Host "✅ Wiring Secure. No dead zones detected." -ForegroundColor Green
