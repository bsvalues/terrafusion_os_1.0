Write-Host "Killing zombie processes..."
taskkill /F /IM deno.exe /T 2>$null

Write-Host "Cleaning cache..."
Remove-Item -Path "deno.lock" -ErrorAction SilentlyContinue
Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Adding Deno to Path..."
$env:Path += ";$HOME\.deno\bin"

Write-Host "Starting TerraDossier..."
$env:DENO_NO_PACKAGE_JSON=1
deno task dev
