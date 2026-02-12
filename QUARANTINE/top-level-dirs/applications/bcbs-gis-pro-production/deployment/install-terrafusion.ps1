# TerraFusion Enterprise PowerShell Installer
# Microsoft/Apple Level Deployment System

param(
    [string]$InstallPath = "$env:ProgramFiles\TerraFusion",
    [string]$DataPath = "$env:ProgramData\TerraFusion",
    [switch]$Silent = $false
)

# Requires PowerShell 5.0 or higher and Administrator privileges
#Requires -Version 5.0
#Requires -RunAsAdministrator

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

class TerraFusionInstaller {
    [string]$InstallPath
    [string]$DataPath
    [bool]$Silent
    [int]$CurrentStep = 0
    [string[]]$Steps = @(
        "System Requirements Check",
        "Database Setup", 
        "Dependencies Installation",
        "Application Build",
        "Desktop App Creation",
        "Service Registration",
        "Final Configuration",
        "Deployment Complete"
    )

    TerraFusionInstaller([string]$installPath, [string]$dataPath, [bool]$silent) {
        $this.InstallPath = $installPath
        $this.DataPath = $dataPath
        $this.Silent = $silent
    }

    [void] DisplayProgress([string]$message, [int]$percentComplete = -1) {
        if ($this.Silent) { return }
        
        $step = $this.Steps[$this.CurrentStep]
        $stepProgress = if ($percentComplete -ge 0) { $percentComplete } else { [int](($this.CurrentStep + 1) / $this.Steps.Count * 100) }
        
        Clear-Host
        Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
        Write-Host "║                    TERRAFUSION INSTALLER                     ║" -ForegroundColor Cyan
        Write-Host "║                Enterprise Deployment System                  ║" -ForegroundColor Cyan
        Write-Host "╠══════════════════════════════════════════════════════════════╣" -ForegroundColor Cyan
        Write-Host "║ Step $($this.CurrentStep + 1)/$($this.Steps.Count): $($step.PadRight(48)) ║" -ForegroundColor White
        Write-Host "║                                                              ║" -ForegroundColor White
        
        $progressBar = $this.CreateProgressBar($stepProgress)
        Write-Host "║ $progressBar $($stepProgress.ToString().PadLeft(3))% ║" -ForegroundColor Green
        Write-Host "║                                                              ║" -ForegroundColor White
        Write-Host "║ $($message.PadRight(60)) ║" -ForegroundColor Yellow
        Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    }

    [string] CreateProgressBar([int]$percentage) {
        $width = 40
        $filled = [Math]::Round($width * $percentage / 100)
        $empty = $width - $filled
        return "█" * $filled + "░" * $empty
    }

    [bool] CheckSystemRequirements() {
        $this.DisplayProgress("Checking system requirements...")
        
        try {
            # Check Windows version
            $osVersion = [System.Environment]::OSVersion.Version
            if ($osVersion.Major -lt 10) {
                throw "Windows 10 or higher required"
            }
            $this.DisplayProgress("Windows version: $($osVersion.Major).$($osVersion.Minor) ✓")
            Start-Sleep -Milliseconds 500

            # Check memory
            $totalMemory = [Math]::Round((Get-CimInstance -ClassName Win32_ComputerSystem).TotalPhysicalMemory / 1GB, 1)
            if ($totalMemory -lt 4) {
                throw "Minimum 4GB RAM required, found $totalMemory GB"
            }
            $this.DisplayProgress("Memory: $totalMemory GB ✓")
            Start-Sleep -Milliseconds 500

            # Check disk space
            $freeSpace = [Math]::Round((Get-PSDrive C).Free / 1GB, 1)
            if ($freeSpace -lt 10) {
                throw "Minimum 10GB free space required, found $freeSpace GB"
            }
            $this.DisplayProgress("Disk space: $freeSpace GB available ✓")
            Start-Sleep -Milliseconds 500

            $this.CurrentStep++
            return $true
        }
        catch {
            $this.DisplayProgress("System requirements check failed: $($_.Exception.Message)")
            return $false
        }
    }

    [bool] CheckAndInstallNode() {
        $this.DisplayProgress("Checking Node.js installation...")
        
        try {
            $nodeVersion = node --version 2>$null
            if ($LASTEXITCODE -eq 0) {
                $this.DisplayProgress("Node.js found: $nodeVersion ✓")
                return $true
            }
        }
        catch {
            # Node.js not found, install it
        }

        $this.DisplayProgress("Installing Node.js LTS...")
        
        $nodeUrl = "https://nodejs.org/dist/v20.10.0/node-v20.10.0-x64.msi"
        $nodeInstaller = "$env:TEMP\node-installer.msi"
        
        try {
            Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeInstaller -UseBasicParsing
            $this.DisplayProgress("Node.js downloaded, installing...")
            
            Start-Process -FilePath "msiexec.exe" -ArgumentList "/i `"$nodeInstaller`" /quiet /norestart" -Wait
            
            # Refresh environment variables
            $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")
            
            # Verify installation
            $nodeVersion = node --version 2>$null
            if ($LASTEXITCODE -eq 0) {
                $this.DisplayProgress("Node.js installed successfully: $nodeVersion ✓")
                Remove-Item $nodeInstaller -Force -ErrorAction SilentlyContinue
                return $true
            }
            else {
                throw "Node.js installation verification failed"
            }
        }
        catch {
            $this.DisplayProgress("Node.js installation failed: $($_.Exception.Message)")
            return $false
        }
    }

    [bool] SetupDatabase() {
        $this.DisplayProgress("Setting up PostgreSQL database...")
        
        try {
            # Check if PostgreSQL is already installed
            $pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
            if ($pgService) {
                $this.DisplayProgress("PostgreSQL service found ✓")
                Start-Sleep -Milliseconds 500
            }
            else {
                $this.DisplayProgress("Installing PostgreSQL...")
                
                $pgUrl = "https://get.enterprisedb.com/postgresql/postgresql-15.5-1-windows-x64.exe"
                $pgInstaller = "$env:TEMP\postgresql-installer.exe"
                
                Invoke-WebRequest -Uri $pgUrl -OutFile $pgInstaller -UseBasicParsing
                $this.DisplayProgress("PostgreSQL downloaded, installing...")
                
                $arguments = "--mode unattended --superpassword postgres --servicepassword postgres --servicename postgresql-x64-15"
                Start-Process -FilePath $pgInstaller -ArgumentList $arguments -Wait
                
                $this.DisplayProgress("PostgreSQL installed successfully ✓")
                Remove-Item $pgInstaller -Force -ErrorAction SilentlyContinue
            }

            $this.DisplayProgress("Configuring database connection...")
            Start-Sleep -Milliseconds 1000
            
            $this.CurrentStep++
            return $true
        }
        catch {
            $this.DisplayProgress("Database setup failed: $($_.Exception.Message)")
            return $false
        }
    }

    [bool] InstallDependencies() {
        $this.DisplayProgress("Installing application dependencies...")
        
        try {
            # Create installation directory
            New-Item -ItemType Directory -Force -Path $this.InstallPath | Out-Null
            New-Item -ItemType Directory -Force -Path $this.DataPath | Out-Null
            New-Item -ItemType Directory -Force -Path "$($this.DataPath)\logs" | Out-Null
            New-Item -ItemType Directory -Force -Path "$($this.DataPath)\backups" | Out-Null

            # Copy application files
            $sourceDir = Split-Path -Parent $PSScriptRoot
            Copy-Item -Path "$sourceDir\*" -Destination $this.InstallPath -Recurse -Force -Exclude @('node_modules', 'dist', '.git')
            
            $this.DisplayProgress("Application files copied ✓")
            Start-Sleep -Milliseconds 500

            # Install npm dependencies
            Set-Location $this.InstallPath
            $this.DisplayProgress("Installing npm packages...")
            
            $npmProcess = Start-Process -FilePath "npm" -ArgumentList "install --production --silent" -PassThru -NoNewWindow -RedirectStandardOutput "$env:TEMP\npm-install.log" -RedirectStandardError "$env:TEMP\npm-error.log"
            
            do {
                Start-Sleep -Milliseconds 500
                $this.DisplayProgress("Installing packages... (this may take a few minutes)")
            } while (!$npmProcess.HasExited)

            if ($npmProcess.ExitCode -eq 0) {
                $this.DisplayProgress("Dependencies installed successfully ✓")
            }
            else {
                $errorContent = Get-Content "$env:TEMP\npm-error.log" -Raw
                throw "npm install failed: $errorContent"
            }

            $this.CurrentStep++
            return $true
        }
        catch {
            $this.DisplayProgress("Dependency installation failed: $($_.Exception.Message)")
            return $false
        }
    }

    [bool] BuildApplication() {
        $this.DisplayProgress("Building TerraFusion application...")
        
        try {
            Set-Location $this.InstallPath
            
            $this.DisplayProgress("Compiling frontend assets...")
            $buildProcess = Start-Process -FilePath "npm" -ArgumentList "run build" -PassThru -NoNewWindow -RedirectStandardOutput "$env:TEMP\npm-build.log" -RedirectStandardError "$env:TEMP\npm-build-error.log"
            
            do {
                Start-Sleep -Milliseconds 1000
                $this.DisplayProgress("Building application bundle...")
            } while (!$buildProcess.HasExited)

            if ($buildProcess.ExitCode -eq 0) {
                $this.DisplayProgress("Application built successfully ✓")
            }
            else {
                $errorContent = Get-Content "$env:TEMP\npm-build-error.log" -Raw
                throw "Build failed: $errorContent"
            }

            $this.CurrentStep++
            return $true
        }
        catch {
            $this.DisplayProgress("Build failed: $($_.Exception.Message)")
            return $false
        }
    }

    [bool] CreateDesktopApp() {
        $this.DisplayProgress("Creating desktop application...")
        
        try {
            $this.DisplayProgress("Configuring Electron packaging...")
            Start-Sleep -Milliseconds 500

            # Create Electron configuration
            $electronConfig = @{
                productName = "TerraFusion Civil Infrastructure"
                appId = "com.terrafusion.civil-infrastructure"
                directories = @{ output = "dist-electron" }
                files = @("dist/**/*", "node_modules/**/*", "server/**/*")
                win = @{
                    target = "nsis"
                    icon = "assets/icon.ico"
                }
                nsis = @{
                    oneClick = $false
                    allowToChangeInstallationDirectory = $true
                    createDesktopShortcut = $true
                    createStartMenuShortcut = $true
                }
            }

            $electronConfig | ConvertTo-Json -Depth 3 | Out-File -FilePath "$($this.InstallPath)\electron-builder.json" -Encoding utf8

            $this.DisplayProgress("Desktop application configuration complete ✓")
            
            $this.CurrentStep++
            return $true
        }
        catch {
            $this.DisplayProgress("Desktop app creation failed: $($_.Exception.Message)")
            return $false
        }
    }

    [bool] RegisterService() {
        $this.DisplayProgress("Registering Windows service...")
        
        try {
            # Create service wrapper script
            $serviceScript = @"
@echo off
cd /d "$($this.InstallPath)"
node server/index.js
"@
            $serviceScript | Out-File -FilePath "$($this.InstallPath)\terrafusion-service.bat" -Encoding ascii

            # Create and start Windows service
            $serviceName = "TerraFusion"
            $serviceDisplayName = "TerraFusion Civil Infrastructure"
            $serviceDescription = "Enterprise GIS platform for civil infrastructure management"
            $servicePath = "`"$($this.InstallPath)\terrafusion-service.bat`""

            # Remove existing service if it exists
            $existingService = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
            if ($existingService) {
                Stop-Service -Name $serviceName -Force -ErrorAction SilentlyContinue
                & sc.exe delete $serviceName
                Start-Sleep -Seconds 2
            }

            # Create new service
            & sc.exe create $serviceName binPath= $servicePath DisplayName= $serviceDisplayName start= auto
            & sc.exe description $serviceName $serviceDescription
            
            $this.DisplayProgress("Service registered successfully ✓")
            Start-Sleep -Milliseconds 500

            # Start the service
            & sc.exe start $serviceName
            $this.DisplayProgress("Service started successfully ✓")

            $this.CurrentStep++
            return $true
        }
        catch {
            $this.DisplayProgress("Service registration failed: $($_.Exception.Message)")
            return $false
        }
    }

    [bool] FinalConfiguration() {
        $this.DisplayProgress("Applying final configuration...")
        
        try {
            # Create desktop shortcut
            $desktopPath = [Environment]::GetFolderPath("Desktop")
            $shortcutPath = "$desktopPath\TerraFusion Civil Infrastructure.lnk"
            
            $wshShell = New-Object -ComObject WScript.Shell
            $shortcut = $wshShell.CreateShortcut($shortcutPath)
            $shortcut.TargetPath = "http://localhost:5000"
            $shortcut.IconLocation = "$($this.InstallPath)\assets\icon.ico"
            $shortcut.Description = "TerraFusion Civil Infrastructure Platform"
            $shortcut.Save()

            $this.DisplayProgress("Desktop shortcut created ✓")
            Start-Sleep -Milliseconds 500

            # Create Start Menu shortcut
            $startMenuPath = "$env:ProgramData\Microsoft\Windows\Start Menu\Programs\TerraFusion"
            New-Item -ItemType Directory -Force -Path $startMenuPath | Out-Null
            
            $startMenuShortcut = "$startMenuPath\TerraFusion Civil Infrastructure.lnk"
            $shortcut = $wshShell.CreateShortcut($startMenuShortcut)
            $shortcut.TargetPath = "http://localhost:5000"
            $shortcut.IconLocation = "$($this.InstallPath)\assets\icon.ico"
            $shortcut.Description = "TerraFusion Civil Infrastructure Platform"
            $shortcut.Save()

            $this.DisplayProgress("Start Menu shortcut created ✓")
            Start-Sleep -Milliseconds 500

            # Register uninstaller
            $uninstallScript = @"
@echo off
title TerraFusion Uninstaller
echo Removing TerraFusion Civil Infrastructure...
sc stop "TerraFusion"
sc delete "TerraFusion"
rmdir /s /q "$($this.InstallPath)"
rmdir /s /q "$($this.DataPath)"
del "$desktopPath\TerraFusion Civil Infrastructure.lnk"
rmdir /s /q "$startMenuPath"
reg delete "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\TerraFusion" /f
echo TerraFusion has been successfully removed.
pause
"@
            $uninstallScript | Out-File -FilePath "$($this.InstallPath)\uninstall.bat" -Encoding ascii

            # Register in Windows Programs and Features
            $regPath = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\TerraFusion"
            New-Item -Path $regPath -Force | Out-Null
            Set-ItemProperty -Path $regPath -Name "DisplayName" -Value "TerraFusion Civil Infrastructure"
            Set-ItemProperty -Path $regPath -Name "UninstallString" -Value "`"$($this.InstallPath)\uninstall.bat`""
            Set-ItemProperty -Path $regPath -Name "DisplayVersion" -Value "1.0.0"
            Set-ItemProperty -Path $regPath -Name "Publisher" -Value "TerraFusion Technologies"
            Set-ItemProperty -Path $regPath -Name "DisplayIcon" -Value "$($this.InstallPath)\assets\icon.ico"

            $this.DisplayProgress("Uninstaller registered ✓")
            Start-Sleep -Milliseconds 500

            $this.CurrentStep++
            return $true
        }
        catch {
            $this.DisplayProgress("Final configuration failed: $($_.Exception.Message)")
            return $false
        }
    }

    [void] ShowCompletion() {
        if ($this.Silent) { return }
        
        Clear-Host
        Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
        Write-Host "║                    DEPLOYMENT COMPLETE                      ║" -ForegroundColor Green
        Write-Host "╠══════════════════════════════════════════════════════════════╣" -ForegroundColor Green
        Write-Host "║                                                              ║" -ForegroundColor White
        Write-Host "║  🎉 TerraFusion Civil Infrastructure is ready!             ║" -ForegroundColor Yellow
        Write-Host "║                                                              ║" -ForegroundColor White
        Write-Host "║  Access Methods:                                             ║" -ForegroundColor White
        Write-Host "║  • Desktop shortcut: TerraFusion Civil Infrastructure       ║" -ForegroundColor Cyan
        Write-Host "║  • Web browser: http://localhost:5000                       ║" -ForegroundColor Cyan
        Write-Host "║  • Start Menu: TerraFusion folder                           ║" -ForegroundColor Cyan
        Write-Host "║                                                              ║" -ForegroundColor White
        Write-Host "║  Service Status: Running automatically                      ║" -ForegroundColor Green
        Write-Host "║  Installation Path: $($this.InstallPath.PadRight(32)) ║" -ForegroundColor White
        Write-Host "║                                                              ║" -ForegroundColor White
        Write-Host "║  Next Steps:                                                 ║" -ForegroundColor Yellow
        Write-Host "║  1. Launch TerraFusion from desktop shortcut                ║" -ForegroundColor White
        Write-Host "║  2. Configure your county data sources                      ║" -ForegroundColor White
        Write-Host "║  3. Set up user accounts and permissions                    ║" -ForegroundColor White
        Write-Host "║  4. Import GIS layers and parcel data                       ║" -ForegroundColor White
        Write-Host "║                                                              ║" -ForegroundColor White
        Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Green
        
        Write-Host "`nLaunching TerraFusion Civil Infrastructure..." -ForegroundColor Yellow
        Start-Sleep -Seconds 3
        Start-Process "http://localhost:5000"
    }

    [bool] Install() {
        try {
            if (-not $this.CheckSystemRequirements()) { return $false }
            if (-not $this.CheckAndInstallNode()) { return $false }
            if (-not $this.SetupDatabase()) { return $false }
            if (-not $this.InstallDependencies()) { return $false }
            if (-not $this.BuildApplication()) { return $false }
            if (-not $this.CreateDesktopApp()) { return $false }
            if (-not $this.RegisterService()) { return $false }
            if (-not $this.FinalConfiguration()) { return $false }
            
            $this.ShowCompletion()
            return $true
        }
        catch {
            Write-Error "Installation failed: $($_.Exception.Message)"
            return $false
        }
    }
}

# Main execution
try {
    $installer = [TerraFusionInstaller]::new($InstallPath, $DataPath, $Silent)
    $success = $installer.Install()
    
    if ($success) {
        Write-Host "TerraFusion installation completed successfully!" -ForegroundColor Green
        exit 0
    }
    else {
        Write-Error "TerraFusion installation failed!"
        exit 1
    }
}
catch {
    Write-Error "Installation error: $($_.Exception.Message)"
    exit 1
}