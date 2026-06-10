# ============================================================================
# install-terrafusion-task.ps1
# ----------------------------------------------------------------------------
# Registers a Windows Scheduled Task that runs `dotnet run` for the
# TerraFusion.API backend on logon and restarts on failure.
#
# This is the SYNC-INFRA-1 Windows substitute for systemd / NSSM. Promotes
# the backend from "operator must remember to start it" to "supervised by
# Windows".
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts/windows/install-terrafusion-task.ps1
#
# Uninstall:
#   powershell -ExecutionPolicy Bypass -File scripts/windows/uninstall-terrafusion-task.ps1
#
# See: scripts/windows/README.md
# ============================================================================

$ErrorActionPreference = "Stop"

$taskName = "TerraFusion.API"
$repoRoot = (Get-Item $PSScriptRoot).Parent.Parent.FullName
$apiProject = Join-Path $repoRoot "backend/src/TerraFusion.API"

if (-not (Test-Path $apiProject)) {
    Write-Error "API project not found at: $apiProject"
    exit 1
}

$action = New-ScheduledTaskAction `
    -Execute "dotnet" `
    -Argument "run --project `"$apiProject`" --no-launch-profile" `
    -WorkingDirectory $apiProject

$trigger = New-ScheduledTaskTrigger -AtLogon

$settings = New-ScheduledTaskSettingsSet `
    -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) `
    -StartWhenAvailable -DontStopOnIdleEnd

$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive

Register-ScheduledTask `
    -TaskName $taskName -Action $action -Trigger $trigger `
    -Settings $settings -Principal $principal -Force

Write-Host "Registered task: $taskName"
Write-Host "Manage via: schtasks /Query /TN $taskName"
Write-Host "Uninstall: Unregister-ScheduledTask -TaskName $taskName -Confirm:`$false"
