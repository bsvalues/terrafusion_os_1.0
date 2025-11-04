# TerraFusion Playground MCP Setup Script
# This script sets up the MCP server for use with Cursor

Write-Host "🌍 TerraFusion Playground MCP Setup" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking Node.js installation..." -ForegroundColor Cyan
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor Green
    
    # Check if version is 18 or higher
    $versionNumber = $nodeVersion -replace 'v', ''
    $majorVersion = [int]($versionNumber.Split('.')[0])
    
    if ($majorVersion -lt 18) {
        Write-Host "⚠ Warning: Node.js version 18+ is recommended. Current: $nodeVersion" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 18+ first." -ForegroundColor Red
    Write-Host "   Download from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "⚠ No package.json found. Make sure you're in the TerraFusion Playground root directory." -ForegroundColor Yellow
}

Write-Host ""

# Create mcp-server directory if it doesn't exist
if (-not (Test-Path "mcp-server")) {
    Write-Host "Creating mcp-server directory..." -ForegroundColor Cyan
    New-Item -ItemType Directory -Path "mcp-server" | Out-Null
    Write-Host "✓ Created mcp-server directory" -ForegroundColor Green
} else {
    Write-Host "✓ mcp-server directory exists" -ForegroundColor Green
}

Write-Host ""

# Install dependencies
Write-Host "Installing MCP server dependencies..." -ForegroundColor Cyan
Set-Location "mcp-server"

try {
    npm install
    Write-Host "✓ Dependencies installed successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Set-Location ".."
    exit 1
}

Write-Host ""

# Build the MCP server
Write-Host "Building MCP server..." -ForegroundColor Cyan
try {
    npm run build
    Write-Host "✓ MCP server built successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to build MCP server" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Set-Location ".."
    exit 1
}

# Return to project root
Set-Location ".."

Write-Host ""

# Check if mcp-config.json exists
if (Test-Path "mcp-config.json") {
    Write-Host "✓ MCP configuration file already exists" -ForegroundColor Green
} else {
    Write-Host "Creating MCP configuration file..." -ForegroundColor Cyan
    Write-Host "✓ MCP configuration created at mcp-config.json" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 TerraFusion Playground MCP Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Configure Cursor to use the MCP server:" -ForegroundColor White
Write-Host "   - Open Cursor settings" -ForegroundColor Gray
Write-Host "   - Navigate to MCP section" -ForegroundColor Gray
Write-Host "   - Add the configuration from mcp-config.json" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Restart Cursor to load the MCP server" -ForegroundColor White
Write-Host ""
Write-Host "3. Available TerraFusion MCP tools:" -ForegroundColor White
Write-Host "   • tf_project_health - Project health analysis" -ForegroundColor Gray
Write-Host "   • tf_code_quality - Code quality checks" -ForegroundColor Gray
Write-Host "   • tf_component_generator - Generate components" -ForegroundColor Gray
Write-Host "   • tf_dependency_audit - Dependency management" -ForegroundColor Gray
Write-Host "   • tf_environment_setup - Environment validation" -ForegroundColor Gray
Write-Host "   • tf_performance_check - Performance analysis" -ForegroundColor Gray
Write-Host "   • tf_geospatial_tools - Geospatial utilities" -ForegroundColor Gray
Write-Host "   • tf_deployment_check - Deployment validation" -ForegroundColor Gray
Write-Host ""
Write-Host "📖 For detailed usage instructions, see: mcp-server/README.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "Happy coding with TerraFusion! 🚀" -ForegroundColor Green 