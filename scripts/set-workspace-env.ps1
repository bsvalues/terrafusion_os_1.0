<#
.SYNOPSIS
    TerraFusion OS 1.0 - Workspace Environment Setup
    
.DESCRIPTION
    Loads workspace environment variables from .workspace.env file and sets them
    for the current PowerShell session. Optionally sets system-level variables
    for persistence across sessions.
    
    Part of Week 3: Path Resolution System - THE TERRAFUSION WAY
    
.PARAMETER Persistent
    Set environment variables at system level (requires admin privileges)
    
.PARAMETER Validate
    Validate that all paths exist after loading
    
.PARAMETER Export
    Export environment variables to a shell script for Bash/WSL
    
.PARAMETER Verbose
    Show detailed information about each variable being set
    
.EXAMPLE
    .\scripts\set-workspace-env.ps1
    Loads environment variables for current session
    
.EXAMPLE
    .\scripts\set-workspace-env.ps1 -Validate
    Loads variables and validates all paths exist
    
.EXAMPLE
    .\scripts\set-workspace-env.ps1 -Persistent
    Sets system-level environment variables (requires admin)
    
.EXAMPLE
    .\scripts\set-workspace-env.ps1 -Export
    Exports variables to set-workspace-env.sh for Bash/WSL
    
.NOTES
    Created: October 10, 2025
    Part of: Strategic Enhancements Week 3
    The TerraFusion Way: Build foundation before features!
#>

param(
    [switch]$Persistent,
    [switch]$Validate,
    [switch]$Export,
    [switch]$Verbose
)

# ============================================================================
# CONFIGURATION
# ============================================================================

$ErrorActionPreference = "Stop"
$WorkspaceRoot = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
$EnvFile = Join-Path $WorkspaceRoot ".workspace.env"

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

function Write-Header {
    param([string]$Title)
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "  $Title" -ForegroundColor White
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Cyan
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Expand-EnvironmentVariables {
    param([string]$Value)
    
    # Replace ${VAR} syntax with $env:VAR syntax for PowerShell
    $expanded = $Value
    $pattern = '\$\{([^}]+)\}'
    
    while ($expanded -match $pattern) {
        $varName = $Matches[1]
        $varValue = [Environment]::GetEnvironmentVariable($varName, "Process")
        
        if ($null -eq $varValue) {
            $varValue = [Environment]::GetEnvironmentVariable($varName, "User")
        }
        
        if ($null -eq $varValue) {
            $varValue = [Environment]::GetEnvironmentVariable($varName, "Machine")
        }
        
        if ($null -ne $varValue) {
            $expanded = $expanded -replace "\`${$varName}", $varValue
        } else {
            Write-Warning "Variable $varName referenced but not yet defined"
            break
        }
    }
    
    return $expanded
}

# ============================================================================
# MAIN SCRIPT
# ============================================================================

Write-Header "TerraFusion OS 1.0 - Workspace Environment Setup"

# Check if .workspace.env exists
if (-not (Test-Path $EnvFile)) {
    Write-Error ".workspace.env file not found at: $EnvFile"
    Write-Info "Please ensure the .workspace.env file exists in the workspace root."
    exit 1
}

Write-Success "Found .workspace.env file"

# Check for admin privileges if Persistent flag is used
if ($Persistent) {
    $isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    
    if (-not $isAdmin) {
        Write-Error "Setting persistent environment variables requires administrator privileges."
        Write-Info "Please run this script as administrator or remove the -Persistent flag."
        exit 1
    }
    
    Write-Warning "Running with administrator privileges - will set system-level variables"
}

# ============================================================================
# LOAD ENVIRONMENT VARIABLES
# ============================================================================

Write-Header "Loading Environment Variables"

$envVars = @{}
$loadedCount = 0
$skippedCount = 0
$errorCount = 0

# Read and parse .workspace.env file
Get-Content $EnvFile | ForEach-Object {
    $line = $_.Trim()
    
    # Skip comments and empty lines
    if ($line -match '^\s*#' -or $line -eq '') {
        return
    }
    
    # Parse KEY=VALUE format
    if ($line -match '^([^=]+)=(.*)$') {
        $key = $Matches[1].Trim()
        $value = $Matches[2].Trim()
        
        # Expand any variable references in the value
        $expandedValue = Expand-EnvironmentVariables $value
        
        try {
            # Set environment variable for current process
            [Environment]::SetEnvironmentVariable($key, $expandedValue, "Process")
            
            # Set persistent if requested
            if ($Persistent) {
                [Environment]::SetEnvironmentVariable($key, $expandedValue, "Machine")
            }
            
            $envVars[$key] = $expandedValue
            $loadedCount++
            
            if ($Verbose) {
                Write-Success "$key = $expandedValue"
            }
        }
        catch {
            $errorMsg = $_.Exception.Message
            Write-Error "Failed to set ${key}: $errorMsg"
            $errorCount++
        }
    }
}

Write-Host ""
Write-Success "Loaded $loadedCount environment variables"

if ($errorCount -gt 0) {
    Write-Warning "Failed to load $errorCount variables"
}

# ============================================================================
# VALIDATE PATHS
# ============================================================================

if ($Validate) {
    Write-Header "Validating Paths"
    
    $validCount = 0
    $invalidCount = 0
    $invalidPaths = @()
    
    foreach ($key in $envVars.Keys) {
        $value = $envVars[$key]
        
        # Skip non-path variables (ports, settings, metadata)
        if ($key -match '_PORT$' -or 
            $key -match '_ENV$' -or 
            $key -match '_DEBUG$' -or 
            $key -match '_LOG_LEVEL$' -or 
            $key -match '_WATCH$' -or 
            $key -match '_VERSION$' -or 
            $key -match '_CREATED$' -or 
            $key -match '_UPDATED$' -or 
            $key -match '_OWNER$') {
            continue
        }
        
        # Check if path exists
        if (Test-Path $value) {
            $validCount++
            if ($Verbose) {
                Write-Success "$key exists: $value"
            }
        } else {
            $invalidCount++
            $invalidPaths += @{
                Variable = $key
                Path = $value
            }
            Write-Warning "$key does not exist: $value"
        }
    }
    
    Write-Host ""
    Write-Success "Valid paths: $validCount"
    
    if ($invalidCount -gt 0) {
        Write-Warning "Invalid paths: $invalidCount"
        Write-Host ""
        Write-Info "Paths that don't exist yet (may be created later):"
        foreach ($item in $invalidPaths) {
            Write-Host "  • $($item.Variable): $($item.Path)" -ForegroundColor Yellow
        }
    }
}

# ============================================================================
# EXPORT TO BASH SCRIPT
# ============================================================================

if ($Export) {
    Write-Header "Exporting to Bash Script"
    
    $bashScript = Join-Path $WorkspaceRoot "scripts\set-workspace-env.sh"
    $bashContent = @"
#!/bin/bash
# TerraFusion OS 1.0 - Workspace Environment Setup (Bash/WSL)
# Auto-generated from .workspace.env by set-workspace-env.ps1
# Created: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

# Load environment variables
"@
    
    foreach ($key in $envVars.Keys) {
        $value = $envVars[$key]
        # Convert Windows paths to WSL paths if they start with C:\
        if ($value -match '^[A-Z]:\\') {
            $wslPath = $value -replace '^([A-Z]):\\', '/mnt/$1/' -replace '\\', '/'
            $wslPath = $wslPath.ToLower()
            $bashContent += "`nexport $key=`"$wslPath`""
        } else {
            $bashContent += "`nexport $key=`"$value`""
        }
    }
    
    $bashContent += @"


# Print success message
echo "✅ TerraFusion OS environment variables loaded for Bash/WSL"
echo "📂 Workspace root: `$TERRAFUSION_ROOT"
echo ""
echo "Use 'source scripts/set-workspace-env.sh' to load these variables in your shell"
"@
    
    Set-Content -Path $bashScript -Value $bashContent -Encoding UTF8
    
    # Make script executable (if running in WSL or Git Bash)
    if (Get-Command wsl -ErrorAction SilentlyContinue) {
        wsl chmod +x "$(wsl wslpath -u $bashScript)"
    }
    
    Write-Success "Exported to: $bashScript"
    Write-Info "To use in WSL/Bash: source scripts/set-workspace-env.sh"
}

# ============================================================================
# SUMMARY
# ============================================================================

Write-Header "Summary"

Write-Host "📊 Environment Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "  Loaded Variables: $loadedCount" -ForegroundColor Cyan

if ($Persistent) {
    Write-Host "  Persistence:      System-level (permanent)" -ForegroundColor Green
} else {
    Write-Host "  Persistence:      Session-level (current shell only)" -ForegroundColor Yellow
}

if ($Validate) {
    Write-Host "  Valid Paths:      $validCount" -ForegroundColor Green
    if ($invalidCount -gt 0) {
        Write-Host "  Invalid Paths:    $invalidCount (may be created later)" -ForegroundColor Yellow
    }
}

if ($Export) {
    Write-Host "  Bash Export:      ✅ Created" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎯 Key Environment Variables:" -ForegroundColor Cyan
Write-Host "  TERRAFUSION_ROOT:    $($envVars['TERRAFUSION_ROOT'])" -ForegroundColor White
Write-Host "  TERRAFUSION_SRC:     $($envVars['TERRAFUSION_SRC'])" -ForegroundColor White
Write-Host "  TERRAFUSION_BACKEND: $($envVars['TERRAFUSION_BACKEND'])" -ForegroundColor White
Write-Host "  TERRAFUSION_MODULES: $($envVars['TERRAFUSION_MODULES'])" -ForegroundColor White

Write-Host ""
Write-Host "✨ THE TERRAFUSION WAY: Build foundation before features!" -ForegroundColor Magenta
Write-Host ""

# ============================================================================
# USAGE EXAMPLES
# ============================================================================

Write-Host "📚 Usage Examples:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  PowerShell:" -ForegroundColor Yellow
Write-Host "    `$root = `$env:TERRAFUSION_ROOT" -ForegroundColor White
Write-Host "    `$backend = `$env:TERRAFUSION_BACKEND" -ForegroundColor White
Write-Host ""
Write-Host "  Node.js/TypeScript:" -ForegroundColor Yellow
Write-Host "    const root = process.env.TERRAFUSION_ROOT;" -ForegroundColor White
Write-Host ""
Write-Host "  C#/.NET:" -ForegroundColor Yellow
Write-Host "    var root = Environment.GetEnvironmentVariable(`"TERRAFUSION_ROOT`");" -ForegroundColor White
Write-Host ""
Write-Host "  Python:" -ForegroundColor Yellow
Write-Host "    import os; root = os.getenv('TERRAFUSION_ROOT')" -ForegroundColor White
Write-Host ""

if (-not $Persistent) {
    Write-Host "💡 Tip: Use -Persistent flag to make these variables permanent" -ForegroundColor Cyan
    Write-Host "   (requires administrator privileges)" -ForegroundColor Gray
    Write-Host ""
}

Write-Success "Environment setup complete! Ready for path-resilient development!"
Write-Host ""
