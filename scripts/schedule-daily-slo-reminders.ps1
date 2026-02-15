# TerraFusion OS — Schedule Daily SLO Capture Reminders
#
# Creates Windows Task Scheduler reminders for Days 1-7 SLO capture windows.
# Each task triggers a notification 5 minutes before the capture window opens.
#
# Classification: Government Operations — Automation

param(
    [switch]$DryRun,
    [switch]$Remove
)

$ErrorActionPreference = "Stop"

# ===== Configuration =====

$REPO_ROOT = Split-Path -Parent $PSScriptRoot
$DAYS = @(
    @{ Day = 1; Date = "2026-02-15"; Time = "14:55" },  # 5min before 15:00 PST window
    @{ Day = 2; Date = "2026-02-16"; Time = "14:55" },
    @{ Day = 3; Date = "2026-02-17"; Time = "14:55" },
    @{ Day = 4; Date = "2026-02-18"; Time = "14:55" },
    @{ Day = 5; Date = "2026-02-19"; Time = "14:55" },
    @{ Day = 6; Date = "2026-02-20"; Time = "14:55" },
    @{ Day = 7; Date = "2026-02-21"; Time = "14:55" }
)

# ===== Task Creation =====

function New-SLOCaptureReminder {
    param($Day, $Date, $Time)

    $TaskName = "TerraFusion-SLO-Day$Day-Reminder"
    $StartTime = "${Date}T${Time}:00"
    
    $Action = New-ScheduledTaskAction `
        -Execute "powershell.exe" `
        -Argument "-NoProfile -Command `"Write-Host '🔔 TERRAFUSION: Day $Day SLO capture window opens in 5 minutes!'; Start-Sleep 10; Write-Host 'Run: node scripts/capture-daily-slo-burn.mjs --day=$Day'; pause`""
    
    $Trigger = New-ScheduledTaskTrigger `
        -Once `
        -At $StartTime
    
    $Settings = New-ScheduledTaskSettingsSet `
        -StartWhenAvailable `
        -AllowStartIfOnBatteries `
        -DontStopIfGoingOnBatteries
    
    $Principal = New-ScheduledTaskPrincipal `
        -UserId $env:USERNAME `
        -RunLevel Limited
    
    if ($DryRun) {
        Write-Host "  [DRY-RUN] Would create: $TaskName at $StartTime"
        return
    }
    
    try {
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
        Register-ScheduledTask `
            -TaskName $TaskName `
            -Action $Action `
            -Trigger $Trigger `
            -Settings $Settings `
            -Principal $Principal | Out-Null
        Write-Host "  ✅ Created: $TaskName (triggers $StartTime)"
    } catch {
        Write-Host "  ❌ Failed to create $TaskName`: $_"
    }
}

function Remove-SLOCaptureReminders {
    Write-Host "`n🗑️  Removing all TerraFusion SLO reminder tasks...`n"
    
    foreach ($day in $DAYS) {
        $TaskName = "TerraFusion-SLO-Day$($day.Day)-Reminder"
        
        if ($DryRun) {
            Write-Host "  [DRY-RUN] Would remove: $TaskName"
            continue
        }
        
        try {
            Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction Stop
            Write-Host "  ✅ Removed: $TaskName"
        } catch {
            Write-Host "  ⚠️  Task not found: $TaskName"
        }
    }
}

# ===== Main Execution =====

Write-Host "`n🔔 TerraFusion OS — Daily SLO Capture Reminder Scheduler"
Write-Host "======================================================`n"

if ($Remove) {
    Remove-SLOCaptureReminders
    exit 0
}

Write-Host "Creating 7 reminder tasks (15:00-15:59 PST capture window):`n"

foreach ($day in $DAYS) {
    New-SLOCaptureReminder -Day $day.Day -Date $day.Date -Time $day.Time
}

Write-Host "`n✅ All reminder tasks scheduled"
Write-Host ""
Write-Host "Verification:"
Write-Host "  Get-ScheduledTask -TaskName 'TerraFusion-SLO-*'"
Write-Host ""
Write-Host "To remove all reminders:"
Write-Host "  .\scripts\schedule-daily-slo-reminders.ps1 -Remove"
Write-Host ""
