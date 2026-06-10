# Windows Process Supervisor Scripts

This directory holds the Windows-side process supervisor for the TerraFusion
backend. It is the Windows substitute for `systemd` (Linux) and NSSM.

## When to use the scheduled task vs `dotnet run` directly

**Use `dotnet run` directly when:**

- You are actively developing the backend (hot reload, attached console,
  breakpoints in an IDE).
- You want to see startup logs in your terminal.
- You are debugging a startup crash and want immediate feedback.

**Use the scheduled task when:**

- You are running TerraFusion as a daily-driver workbench (production-like
  use on the operator laptop) and want the backend to:
  - start automatically on logon,
  - restart on crash (up to 999 times, 1-minute intervals),
  - keep running across Ctrl-C in unrelated terminals.

The scheduled task does **not** replace IIS/Kestrel hosting decisions; it
just ensures `dotnet run` is supervised on Windows the way `systemd` would
supervise it on Linux.

## Install

```powershell
powershell -ExecutionPolicy Bypass -File scripts/windows/install-terrafusion-task.ps1
```

This registers a scheduled task named `TerraFusion.API` under your user
account, configured to:

- Run `dotnet run --project backend/src/TerraFusion.API --no-launch-profile`
- Trigger at logon
- Restart on failure (999 retries, 1-minute interval)
- Run only when you are logged in (no SYSTEM-account complexity)

## Inspect

```powershell
# task status
schtasks /Query /TN TerraFusion.API /V /FO LIST

# current state via PowerShell
Get-ScheduledTask -TaskName TerraFusion.API
Get-ScheduledTaskInfo -TaskName TerraFusion.API
```

## Manually start / stop

```powershell
Start-ScheduledTask -TaskName TerraFusion.API
Stop-ScheduledTask  -TaskName TerraFusion.API
```

Stopping the task does not uninstall it — it stays registered and will
re-trigger at next logon.

## Uninstall

```powershell
powershell -ExecutionPolicy Bypass -File scripts/windows/uninstall-terrafusion-task.ps1
```

Or directly:

```powershell
Unregister-ScheduledTask -TaskName TerraFusion.API -Confirm:$false
```

## What this does NOT do

- It does not run as SYSTEM or NETWORK SERVICE — runs as your interactive
  user, by design (matches your dev env, keeps the security boundary tight).
- It does not start the Postgres / Redis / MSSQL Docker containers — those
  are supervised by Docker Desktop + `restart: unless-stopped` in their
  respective compose files.
- It does not apply migrations — the API itself does that at startup via
  `AutoMigrateHostedService` (see SYNC-INFRA-1 Fix #3).
- It does not collect logs centrally — logs land wherever the API's
  configured Serilog sinks point. Use `Get-ScheduledTaskInfo` to see when
  the task last fired / last result code.

## Doctrine echo

Production deployments use `scripts/production/setup-systemd-service.sh`
(Linux). This Windows path exists specifically for the operator laptop
workbench, where systemd is not available.
