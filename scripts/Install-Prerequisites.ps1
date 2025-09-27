#!/usr/bin/env pwsh
<#
.SYNOPSIS
    🛠️ TerraFusion OS 1.0 - Prerequisites Installer
    Automated installation of required deployment tools

.DESCRIPTION
    This script automatically installs all the prerequisites required for
    TerraFusion OS 1.0 deployment including Terraform, Azure CLI, and other tools.
    
.PARAMETER InstallPath
    Custom installation path (default: C:\tools)
    
.PARAMETER SkipChocolatey
    Skip Chocolatey installation if already available
    
.EXAMPLE
    .\Install-Prerequisites.ps1
    
.EXAMPLE
    .\Install-Prerequisites.ps1 -InstallPath "C:\MyTools"
#>

[CmdletBinding()]
param(
    [string]$InstallPath = "C:\tools",
    [switch]$SkipChocolatey,
    [switch]$Force
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-InstallLog {
    param(
        [string]$Message,
        [ValidateSet('INFO', 'WARN', 'ERROR', 'SUCCESS')]
        [string]$Level = 'INFO'
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $colors = @{
        'INFO' = 'White'
        'WARN' = 'Yellow' 
        'ERROR' = 'Red'
        'SUCCESS' = 'Green'
    }
    
    Write-Host "[$timestamp] [$Level] $Message" -ForegroundColor $colors[$Level]
}

function Test-IsAdmin {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Install-Chocolatey {
    if ($SkipChocolatey) {
        Write-InstallLog "Skipping Chocolatey installation" -Level 'WARN'
        return
    }
    
    Write-InstallLog "🍫 Installing Chocolatey package manager..." -Level 'INFO'
    
    try {
        $chocoCommand = Get-Command choco -ErrorAction SilentlyContinue
        if ($chocoCommand) {
            Write-InstallLog "✅ Chocolatey already installed" -Level 'SUCCESS'
            return
        }
        
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        
        # Refresh environment variables
        $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")
        
        Write-InstallLog "✅ Chocolatey installed successfully" -Level 'SUCCESS'
    }
    catch {
        Write-InstallLog "❌ Failed to install Chocolatey: $($_.Exception.Message)" -Level 'ERROR'
        throw
    }
}

function Install-Terraform {
    Write-InstallLog "🏗️ Installing Terraform..." -Level 'INFO'
    
    try {
        $terraformCommand = Get-Command terraform -ErrorAction SilentlyContinue
        if ($terraformCommand -and !$Force) {
            Write-InstallLog "✅ Terraform already installed" -Level 'SUCCESS'
            return
        }
        
        choco install terraform -y
        
        # Refresh PATH
        $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")
        
        # Verify installation
        $version = terraform version
        Write-InstallLog "✅ Terraform installed: $version" -Level 'SUCCESS'
    }
    catch {
        Write-InstallLog "❌ Failed to install Terraform: $($_.Exception.Message)" -Level 'ERROR'
        throw
    }
}

function Install-AzureCLI {
    Write-InstallLog "☁️ Installing Azure CLI..." -Level 'INFO'
    
    try {
        $azCommand = Get-Command az -ErrorAction SilentlyContinue
        if ($azCommand -and !$Force) {
            Write-InstallLog "✅ Azure CLI already installed" -Level 'SUCCESS'
            return
        }
        
        choco install azure-cli -y
        
        # Refresh PATH
        $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")
        
        # Verify installation
        $version = az version --output tsv --query '"azure-cli"'
        Write-InstallLog "✅ Azure CLI installed: $version" -Level 'SUCCESS'
    }
    catch {
        Write-InstallLog "❌ Failed to install Azure CLI: $($_.Exception.Message)" -Level 'ERROR'
        throw
    }
}

function Install-Kubectl {
    Write-InstallLog "☸️ Installing kubectl..." -Level 'INFO'
    
    try {
        $kubectlCommand = Get-Command kubectl -ErrorAction SilentlyContinue
        if ($kubectlCommand -and !$Force) {
            Write-InstallLog "✅ kubectl already installed" -Level 'SUCCESS'
            return
        }
        
        choco install kubernetes-cli -y
        
        # Refresh PATH
        $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")
        
        # Verify installation
        $version = kubectl version --client --output=yaml | Select-String "gitVersion"
        Write-InstallLog "✅ kubectl installed: $version" -Level 'SUCCESS'
    }
    catch {
        Write-InstallLog "❌ Failed to install kubectl: $($_.Exception.Message)" -Level 'ERROR'
        throw
    }
}

function Install-Docker {
    Write-InstallLog "🐳 Checking Docker installation..." -Level 'INFO'
    
    try {
        $dockerCommand = Get-Command docker -ErrorAction SilentlyContinue
        if ($dockerCommand) {
            $version = docker --version
            Write-InstallLog "✅ Docker already installed: $version" -Level 'SUCCESS'
            return
        }
        
        Write-InstallLog "⚠️ Docker not found. Please install Docker Desktop manually from: https://www.docker.com/products/docker-desktop/" -Level 'WARN'
        Write-InstallLog "📋 After installing Docker Desktop, restart your computer and run this script again." -Level 'INFO'
    }
    catch {
        Write-InstallLog "❌ Error checking Docker: $($_.Exception.Message)" -Level 'ERROR'
    }
}

function Install-NodeJS {
    Write-InstallLog "📦 Checking Node.js installation..." -Level 'INFO'
    
    try {
        $nodeCommand = Get-Command node -ErrorAction SilentlyContinue
        if ($nodeCommand) {
            $version = node --version
            Write-InstallLog "✅ Node.js already installed: $version" -Level 'SUCCESS'
            return
        }
        
        choco install nodejs -y
        
        # Refresh PATH
        $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")
        
        # Verify installation
        $version = node --version
        Write-InstallLog "✅ Node.js installed: $version" -Level 'SUCCESS'
    }
    catch {
        Write-InstallLog "❌ Failed to install Node.js: $($_.Exception.Message)" -Level 'ERROR'
        throw
    }
}

function Install-DotNetSDK {
    Write-InstallLog "🔧 Checking .NET SDK installation..." -Level 'INFO'
    
    try {
        $dotnetCommand = Get-Command dotnet -ErrorAction SilentlyContinue
        if ($dotnetCommand) {
            $version = dotnet --version
            Write-InstallLog "✅ .NET SDK already installed: $version" -Level 'SUCCESS'
            return
        }
        
        choco install dotnet-sdk -y
        
        # Refresh PATH
        $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")
        
        # Verify installation
        $version = dotnet --version
        Write-InstallLog "✅ .NET SDK installed: $version" -Level 'SUCCESS'
    }
    catch {
        Write-InstallLog "❌ Failed to install .NET SDK: $($_.Exception.Message)" -Level 'ERROR'
        throw
    }
}

# Main installation process
try {
    Write-Host @"
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║  🛠️ TERRAFUSION OS 1.0 - PREREQUISITES INSTALLER                           ║
║                                                                              ║
║  Installing required deployment tools...                                    ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

    Write-InstallLog "🚀 Starting prerequisites installation..." -Level 'INFO'
    
    # Check if running as administrator
    if (!(Test-IsAdmin)) {
        Write-InstallLog "❌ This script must be run as Administrator" -Level 'ERROR'
        Write-InstallLog "💡 Right-click PowerShell and select 'Run as Administrator'" -Level 'INFO'
        exit 1
    }
    
    Write-InstallLog "✅ Running as Administrator" -Level 'SUCCESS'
    
    # Install prerequisites in order
    Install-Chocolatey
    Install-Terraform
    Install-AzureCLI
    Install-Kubectl
    Install-Docker
    Install-NodeJS
    Install-DotNetSDK
    
    Write-InstallLog "" -Level 'INFO'
    Write-InstallLog "🎉 Prerequisites installation completed!" -Level 'SUCCESS'
    Write-InstallLog "" -Level 'INFO'
    Write-InstallLog "📋 Next steps:" -Level 'INFO'
    Write-InstallLog "   1. Close and reopen PowerShell to refresh PATH" -Level 'INFO'
    Write-InstallLog "   2. Run: az login (to authenticate with Azure)" -Level 'INFO'
    Write-InstallLog "   3. Run: .\Deploy-TerraFusion.ps1 -Environment production" -Level 'INFO'
    Write-InstallLog "" -Level 'INFO'
    Write-InstallLog "🔧 If Docker was installed, restart your computer first." -Level 'WARN'
    
}
catch {
    Write-InstallLog "💥 Installation failed: $($_.Exception.Message)" -Level 'ERROR'
    Write-InstallLog "📞 Please check the error above and try again." -Level 'INFO'
    exit 1
}
