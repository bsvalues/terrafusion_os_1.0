# Configurable Parameters
$Server = "192.168.48.167"               # SQL Server IP
$Database = "ciaps"                      # Target Database
$Username = "ciaps_dev"                  # SQL Login
$Password = "ciaps_dev"                  # SQL Password 
$SourceDirectory = "\\JCHARRISPACS\BuildingPermit_Import"
$LogFile = "I:\LoaderLog_$(Get-Date -Format yyyyMMdd_HHmmss).log"

# Create log directory if it doesn't exist
$LogDir = Split-Path -Parent $LogFile
if (!(Test-Path -Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force
}

# Start Logging
Write-Output "Building Permit Loader Started: $(Get-Date)" | Out-File -Append $LogFile

# Verify Source Directory
if (!(Test-Path -Path $SourceDirectory)) {
    Write-Output "Error: Source directory $SourceDirectory does not exist." | Out-File -Append $LogFile
    exit 1
}

# Process Each File
$Files = Get-ChildItem -Path $SourceDirectory -Filter "*.csv" -File
if ($Files.Count -eq 0) {
    Write-Output "No files found in $SourceDirectory." | Out-File -Append $LogFile
    exit 1
}

# Test SQL Connection before processing
try {
    $TestConnection = sqlcmd -S $Server -d $Database -U $Username -P $Password -Q "SELECT 1"
    if ($LASTEXITCODE -ne 0) {
        Write-Output "Error: Could not connect to SQL Server." | Out-File -Append $LogFile
        exit 1
    }
} catch {
    Write-Output "Error: SQL Connection test failed: $_" | Out-File -Append $LogFile
    exit 1
}

foreach ($File in $Files) {
    try {
        Write-Output "Processing file: $($File.FullName)" | Out-File -Append $LogFile
        
        # Verify file exists and is not empty
        if ((Get-Item $File.FullName).Length -eq 0) {
            Write-Output "Error: File $($File.Name) is empty." | Out-File -Append $LogFile
            continue
        }

        # Load File into SQL Server
        $SqlQuery = @"
        BULK INSERT BuildingPermit_Import
        FROM '$($File.FullName)'
        WITH (
            FIELDTERMINATOR = ',',
            ROWTERMINATOR = '\n',
            FIRSTROW = 2,
            CODEPAGE = '65001'
        );
"@

        $result = sqlcmd -S $Server -d $Database -U $Username -P $Password -Q $SqlQuery
        if ($LASTEXITCODE -ne 0) {
            Write-Output "Error loading $($File.Name) into database. Error: $result" | Out-File -Append $LogFile
            continue
        }

        # Move processed file to archive
        $ArchiveDir = Join-Path $SourceDirectory "Processed"
        if (!(Test-Path -Path $ArchiveDir)) {
            New-Item -ItemType Directory -Path $ArchiveDir -Force
        }
        
        $ArchiveFile = Join-Path $ArchiveDir "$($File.BaseName)_$(Get-Date -Format yyyyMMdd_HHmmss)$($File.Extension)"
        Move-Item -Path $File.FullName -Destination $ArchiveFile -Force
        
        Write-Output "Successfully processed: $($File.Name)" | Out-File -Append $LogFile

    } catch {
        Write-Output "Unexpected error processing file $($File.Name): $_" | Out-File -Append $LogFile
    }
}

Write-Output "Building Permit Loader Completed: $(Get-Date)" | Out-File -Append $LogFile
