Write-Host "--- TERRAFUSION SYSTEM RESTORE PROTOCOL ---" -ForegroundColor Cyan
Write-Host "Initiating Full Stack Boot..." -ForegroundColor Gray

$BasePath = "C:\Users\bsval\terrafusion_os_1.0"

# 1. LAUNCH KERNEL (DB + API)
# We use cmd.exe to run the batch file which handles the API Key injection
$KernelScript = "$BasePath\os-kernel\launch_kernel.cmd"
Write-Host "1. Spawning Kernel Console..." -ForegroundColor Yellow
Start-Process cmd.exe -ArgumentList "/k `"$KernelScript`"" -WorkingDirectory "$BasePath\os-kernel"

# 2. LAUNCH FRONTEND (TerraDossier)
$FrontendPath = "$BasePath\applications\terra-dossier"
Write-Host "2. Spawning Frontend Interface..." -ForegroundColor Yellow
$FrontendCommand = "deno run -A --node-modules-dir --unstable-detect-cjs npm:vite --host 0.0.0.0 --port 3007"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$FrontendPath'; $FrontendCommand"

Write-Host "`n✅ BOOT SEQUENCE INITIATED." -ForegroundColor Green
Write-Host "---------------------------------------------------"
Write-Host "ACTION REQUIRED:" -ForegroundColor White
Write-Host "1. Go to the KERNEL window and enter your OpenAI API Key." -ForegroundColor Cyan
Write-Host "2. Wait for the FRONTEND window to show 'Local: http://localhost:3007'" -ForegroundColor Cyan
Write-Host "3. Open Browser and Perform the Final Verification." -ForegroundColor Cyan
Write-Host "---------------------------------------------------"