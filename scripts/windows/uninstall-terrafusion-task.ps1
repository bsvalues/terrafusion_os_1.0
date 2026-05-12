# ============================================================================
# uninstall-terrafusion-task.ps1
# ----------------------------------------------------------------------------
# Removes the TerraFusion.API Windows Scheduled Task created by
# install-terrafusion-task.ps1. Does NOT touch the backend itself; just
# the supervisor wrapper.
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts/windows/uninstall-terrafusion-task.ps1
# ============================================================================

$ErrorActionPreference = "Stop"

$taskName = "TerraFusion.API"

$existing = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($null -eq $existing) {
    Write-Host "Task '$taskName' not found; nothing to do."
    exit 0
}

Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
Write-Host "Unregistered task: $taskName"
