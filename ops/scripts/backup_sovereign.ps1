# Backup Script for TerraFusion Sovereign Deployment
# Backs up SQLite DB and Audit artifacts

$BackupRoot = "C:\TerraFusion_Backups"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmm"
$BackupFolder = Join-Path $BackupRoot $Timestamp
$DataPath = Join-Path $PSScriptRoot "..\..\data\terrafusion.db"
$AuditPath = Join-Path $PSScriptRoot "..\..\artifacts\audit"

# Create Directory
if (!(Test-Path $BackupRoot)) { New-Item -ItemType Directory -Path $BackupRoot | Out-Null }
if (!(Test-Path $BackupFolder)) { New-Item -ItemType Directory -Path $BackupFolder | Out-Null }

Write-Host "Creating Backup: $Timestamp"
Write-Host "Source DB: $DataPath"

# Copy DB (Simple copy - SQLite WAL mode usually allows this, or use vacuum if needed)
# Ideally, stop service or use .backup command but for simple Sovereign setup, copy is baseline.
if (Test-Path $DataPath) {
    Copy-Item $DataPath -Destination $BackupFolder
} else {
    Write-Warning "Database file not found at $DataPath"
}

# Zip Audit Logs
if (Test-Path $AuditPath) {
    Compress-Archive -Path $AuditPath -DestinationPath (Join-Path $BackupFolder "audit_logs.zip")
}

# Values specific to this run
$ZipName = "$Timestamp.zip"
$ZipPath = Join-Path $BackupRoot $ZipName

# Zip the timestamped folder
Compress-Archive -Path $BackupFolder -DestinationPath $ZipPath

# Remove unzipped folder
Remove-Item -Path $BackupFolder -Recurse -Force

Write-Host "Backup Created: $ZipPath"

# cleanup old backups (>30 days)
Get-ChildItem -Path $BackupRoot -Filter "*.zip" | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } | Remove-Item
