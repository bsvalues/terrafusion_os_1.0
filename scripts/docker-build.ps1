# TerraFusion OS - Docker Build Script
# Builds all Docker images for TerraFusion

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("dev", "prod", "all")]
    [string]$Environment = "all",
    
    [Parameter(Mandatory=$false)]
    [string]$Version = "1.0.0"
)

Write-Host "🐋 TerraFusion OS Docker Build" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan
Write-Host ""

# Set Docker BuildKit for better caching
$env:DOCKER_BUILDKIT = "1"

function Build-Image {
    param(
        [string]$Name,
        [string]$Dockerfile,
        [string]$Context,
        [string]$Tag
    )
    
    Write-Host "📦 Building $Name..." -ForegroundColor Yellow
    
    $command = "docker build -f $Dockerfile -t $Tag $Context"
    Write-Host "   Command: $command" -ForegroundColor Gray
    
    try {
        Invoke-Expression $command
        Write-Host "✅ $Name built successfully!" -ForegroundColor Green
        Write-Host ""
    } catch {
        Write-Host "❌ Failed to build $Name" -ForegroundColor Red
        Write-Host "   Error: $_" -ForegroundColor Red
        exit 1
    }
}

# Build main application image
if ($Environment -eq "all" -or $Environment -eq "prod") {
    Build-Image `
        -Name "TerraFusion API" `
        -Dockerfile "Dockerfile" `
        -Context "." `
        -Tag "terrafusion/api:$Version"
    
    Build-Image `
        -Name "TerraFusion Frontend" `
        -Dockerfile "Dockerfile.frontend" `
        -Context "." `
        -Tag "terrafusion/frontend:$Version"
    
    # Tag as latest
    docker tag "terrafusion/api:$Version" "terrafusion/api:latest"
    docker tag "terrafusion/frontend:$Version" "terrafusion/frontend:latest"
}

# Build development image if needed
if ($Environment -eq "all" -or $Environment -eq "dev") {
    if (Test-Path "Dockerfile.dev") {
        Build-Image `
            -Name "TerraFusion Dev" `
            -Dockerfile "Dockerfile.dev" `
            -Context "." `
            -Tag "terrafusion/dev:$Version"
    }
}

Write-Host "🎉 Build Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Built Images:" -ForegroundColor Cyan
docker images | Select-String -Pattern "terrafusion"
Write-Host ""
Write-Host "💡 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Run: docker-compose up -d" -ForegroundColor White
Write-Host "   2. Check: docker-compose ps" -ForegroundColor White
Write-Host "   3. Logs: docker-compose logs -f" -ForegroundColor White
Write-Host ""
