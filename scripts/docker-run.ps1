# TerraFusion OS - Docker Run Script
# Manages Docker Compose operations

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("up", "down", "restart", "logs", "status", "clean")]
    [string]$Action = "up",
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("dev", "prod")]
    [string]$Environment = "dev",
    
    [Parameter(Mandatory=$false)]
    [switch]$Detached = $false
)

Write-Host "🐋 TerraFusion OS Docker Manager" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Determine compose files to use
$composeFiles = @("-f", "docker-compose.yml")
if ($Environment -eq "dev") {
    $composeFiles += @("-f", "docker-compose.dev.yml")
} elseif ($Environment -eq "prod") {
    $composeFiles += @("-f", "docker-compose.prod.yml")
}

Write-Host "📋 Environment: $Environment" -ForegroundColor Yellow
Write-Host ""

switch ($Action) {
    "up" {
        Write-Host "🚀 Starting TerraFusion OS..." -ForegroundColor Green
        
        # Check if .env file exists
        if (-not (Test-Path ".env")) {
            Write-Host "⚠️  No .env file found. Creating from template..." -ForegroundColor Yellow
            Copy-Item ".env.example" ".env" -ErrorAction SilentlyContinue
        }
        
        $cmd = "docker-compose $($composeFiles -join ' ') up"
        if ($Detached) {
            $cmd += " -d"
        }
        
        Invoke-Expression $cmd
        
        if ($Detached) {
            Write-Host ""
            Write-Host "✅ TerraFusion OS is starting..." -ForegroundColor Green
            Write-Host ""
            Write-Host "📊 Check status with:" -ForegroundColor Cyan
            Write-Host "   ./scripts/docker-run.ps1 -Action status" -ForegroundColor White
            Write-Host ""
            Write-Host "📝 View logs with:" -ForegroundColor Cyan
            Write-Host "   ./scripts/docker-run.ps1 -Action logs" -ForegroundColor White
        }
    }
    
    "down" {
        Write-Host "🛑 Stopping TerraFusion OS..." -ForegroundColor Yellow
        Invoke-Expression "docker-compose $($composeFiles -join ' ') down"
        Write-Host "✅ TerraFusion OS stopped" -ForegroundColor Green
    }
    
    "restart" {
        Write-Host "🔄 Restarting TerraFusion OS..." -ForegroundColor Yellow
        Invoke-Expression "docker-compose $($composeFiles -join ' ') restart"
        Write-Host "✅ TerraFusion OS restarted" -ForegroundColor Green
    }
    
    "logs" {
        Write-Host "📝 Showing logs (Ctrl+C to exit)..." -ForegroundColor Cyan
        Invoke-Expression "docker-compose $($composeFiles -join ' ') logs -f --tail=100"
    }
    
    "status" {
        Write-Host "📊 TerraFusion OS Status" -ForegroundColor Cyan
        Write-Host "------------------------" -ForegroundColor Cyan
        
        Invoke-Expression "docker-compose $($composeFiles -join ' ') ps"
        
        Write-Host ""
        Write-Host "🔍 Health Checks:" -ForegroundColor Yellow
        
        # Check each service health
        $services = @(
            @{Name="API"; Url="http://localhost:5000/api/health"},
            @{Name="Frontend"; Url="http://localhost:3000"},
            @{Name="AI Command"; Url="http://localhost:3001/api/ai-command-brain/health"},
            @{Name="AI Swarm"; Url="http://localhost:3002/api/ai-swarm/health"},
            @{Name="AI Advanced"; Url="http://localhost:3003/api/ai-advanced/health"}
        )
        
        foreach ($service in $services) {
            try {
                $response = Invoke-RestMethod -Uri $service.Url -Method GET -TimeoutSec 2 -ErrorAction Stop
                Write-Host "   ✅ $($service.Name): Healthy" -ForegroundColor Green
            } catch {
                Write-Host "   ❌ $($service.Name): Not responding" -ForegroundColor Red
            }
        }
    }
    
    "clean" {
        Write-Host "🧹 Cleaning up Docker resources..." -ForegroundColor Yellow
        
        # Stop containers
        Invoke-Expression "docker-compose $($composeFiles -join ' ') down"
        
        # Remove volumes
        $confirm = Read-Host "Remove volumes? This will delete all data! (y/N)"
        if ($confirm -eq 'y') {
            Invoke-Expression "docker-compose $($composeFiles -join ' ') down -v"
            Write-Host "✅ Volumes removed" -ForegroundColor Green
        }
        
        # Prune unused images
        $confirm = Read-Host "Prune unused images? (y/N)"
        if ($confirm -eq 'y') {
            docker image prune -f
            Write-Host "✅ Unused images removed" -ForegroundColor Green
        }
        
        Write-Host "✅ Cleanup complete" -ForegroundColor Green
    }
}

Write-Host ""
