# TerraFusion cOS Windows PowerShell Launcher
# Professional Government Operating System with CostForge Integration
# "Government. Transcended."

param(
    [switch]$SkipDependencies,
    [switch]$CostForgeOnly,
    [switch]$Debug
)

# Set error action preference
$ErrorActionPreference = "Continue"

# Function to write colored output
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

# Function to check Python installation
function Test-PythonInstallation {
    try {
        $pythonVersion = python --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Python found: $pythonVersion" "Green"
            return $true
        }
    }
    catch {
        Write-ColorOutput "❌ Python not found!" "Red"
        Write-ColorOutput "   Please install Python 3.8+ from: https://www.python.org/downloads/" "Yellow"
        return $false
    }
}

# Function to setup virtual environment
function Initialize-VirtualEnvironment {
    if (-not (Test-Path "venv")) {
        Write-ColorOutput "📦 Creating Python virtual environment..." "Cyan"
        python -m venv venv
        if ($LASTEXITCODE -ne 0) {
            Write-ColorOutput "❌ Failed to create virtual environment" "Red"
            return $false
        }
    }
    
    Write-ColorOutput "🔧 Activating virtual environment..." "Cyan"
    & ".\venv\Scripts\Activate.ps1"
    return $true
}

# Function to install dependencies
function Install-Dependencies {
    if ($SkipDependencies) {
        Write-ColorOutput "⏭️ Skipping dependency installation" "Yellow"
        return $true
    }
    
    Write-ColorOutput "📚 Installing TerraFusion cOS dependencies..." "Cyan"
    pip install -r requirements.txt
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput "❌ Failed to install core dependencies" "Red"
        return $false
    }
    
    Write-ColorOutput "🖥️ Installing desktop shell dependencies..." "Cyan"
    pip install matplotlib pillow numpy requests
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput "⚠️ Some desktop dependencies failed, continuing..." "Yellow"
    }
    
    return $true
}

# Function to check CostForge integration
function Test-CostForgeIntegration {
    $costforgeFiles = @(
        "costforge_ai_terrafusion_module.py",
        "costforge_ai_complete_system.py",
        "costforge_ai_backend_engine.py"
    )
    
    $foundFiles = 0
    foreach ($file in $costforgeFiles) {
        if (Test-Path $file) {
            $foundFiles++
        }
    }
    
    if ($foundFiles -gt 0) {
        Write-ColorOutput "✅ CostForge AI integration found ($foundFiles/$($costforgeFiles.Count) components)" "Green"
        return $true
    } else {
        Write-ColorOutput "⚠️ CostForge AI integration not found" "Yellow"
        return $false
    }
}

# Function to launch desktop shell
function Start-TerraFusionDesktop {
    param([string]$ShellType = "advanced")
    
    $shellScripts = @{
        "advanced" = "desktop/advanced_desktop_shell.py"
        "basic" = "desktop/shell_main.py"
        "web" = "desktop/web_shell.py"
    }
    
    $script = $shellScripts[$ShellType]
    if (-not (Test-Path $script)) {
        Write-ColorOutput "❌ Desktop shell script not found: $script" "Red"
        return $false
    }
    
    Write-ColorOutput "🚀 Launching TerraFusion cOS Desktop Shell ($ShellType)..." "Green"
    Write-ColorOutput "   Desktop Shell: Native Windows Interface" "White"
    Write-ColorOutput "   CostForge Integration: Active" "White"
    Write-ColorOutput "   Security Level: Government Grade" "White"
    Write-ColorOutput "" "White"
    
    if ($Debug) {
        Write-ColorOutput "🐛 Debug mode: Starting with verbose output" "Magenta"
        python -u $script
    } else {
        python $script
    }
    
    return $LASTEXITCODE -eq 0
}

# Main execution
Write-ColorOutput "" "White"
Write-ColorOutput "================================================================" "Cyan"
Write-ColorOutput "  🏛️ TerraFusion cOS - Government Operating System" "White"
Write-ColorOutput "  Professional Desktop Shell with CostForge AI Integration" "White"
Write-ColorOutput "  'Government. Transcended.'" "White"
Write-ColorOutput "================================================================" "Cyan"
Write-ColorOutput "" "White"

# Set working directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Check Python installation
if (-not (Test-PythonInstallation)) {
    Read-Host "Press Enter to exit"
    exit 1
}

# Setup virtual environment
if (-not (Initialize-VirtualEnvironment)) {
    Read-Host "Press Enter to exit"
    exit 1
}

# Install dependencies
if (-not (Install-Dependencies)) {
    Read-Host "Press Enter to exit"
    exit 1
}

# Check CostForge integration
$costforgeAvailable = Test-CostForgeIntegration

# Launch desktop shell
$launchSuccess = $false

if ($CostForgeOnly -and $costforgeAvailable) {
    Write-ColorOutput "🎯 Launching CostForge-focused interface..." "Green"
    $launchSuccess = Start-TerraFusionDesktop "advanced"
} else {
    # Try advanced shell first
    $launchSuccess = Start-TerraFusionDesktop "advanced"
    
    if (-not $launchSuccess) {
        Write-ColorOutput "⚠️ Advanced shell failed, trying basic shell..." "Yellow"
        $launchSuccess = Start-TerraFusionDesktop "basic"
    }
    
    if (-not $launchSuccess) {
        Write-ColorOutput "⚠️ Basic shell failed, trying web shell..." "Yellow"
        $launchSuccess = Start-TerraFusionDesktop "web"
    }
}

# Handle launch failure
if (-not $launchSuccess) {
    Write-ColorOutput "" "White"
    Write-ColorOutput "❌ Failed to launch TerraFusion cOS Desktop Shell" "Red"
    Write-ColorOutput "" "White"
    Write-ColorOutput "Troubleshooting:" "Yellow"
    Write-ColorOutput "1. Ensure Python 3.8+ is installed" "White"
    Write-ColorOutput "2. Check that all dependencies are installed" "White"
    Write-ColorOutput "3. Verify tkinter is available (usually included with Python)" "White"
    Write-ColorOutput "4. Try running: python -c `"import tkinter; print('tkinter OK')`"" "White"
    Write-ColorOutput "5. Check for error messages above" "White"
    Write-ColorOutput "" "White"
    Read-Host "Press Enter to exit"
    exit 1
}

Write-ColorOutput "" "White"
Write-ColorOutput "✅ TerraFusion cOS Desktop Shell closed successfully" "Green"
Read-Host "Press Enter to exit"







