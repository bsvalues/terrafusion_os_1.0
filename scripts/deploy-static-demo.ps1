# TerraFusion OS 1.0 - Static Data Production Demo
param([switch]$Force)

Write-Host "🚀 TerraFusion Benton County Static Demo" -ForegroundColor Green

# Check Docker
try {
    docker version | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Start Docker Desktop first" -ForegroundColor Red
    exit 1
}

# Create environment file
Copy-Item ".env.benton.example" ".env.benton" -Force
Write-Host "✅ Environment configured for static demo" -ForegroundColor Green

# Create network
docker network create --subnet 172.30.10.0/24 terrafusion_demo 2>$null
Write-Host "✅ Network ready" -ForegroundColor Green

# Create sample data directory
New-Item -ItemType Directory -Path "data/benton" -Force | Out-Null
@"
parcel_id,situs_address,city,state,zip,land_sqft,bldg_sqft,year_built,lat,lon
R32400-300-0010,123 Main St,Richland,WA,99352,8000,2400,1995,46.2857,-119.2945
R32400-300-0020,456 Oak Ave,Kennewick,WA,99336,7200,2100,1987,46.2112,-119.1372
R32400-300-0030,789 Pine Rd,Pasco,WA,99301,9600,2800,2001,46.2396,-119.1006
"@ | Out-File -FilePath "data/benton/parcels.csv" -Encoding UTF8

Write-Host "✅ Sample Benton County data created" -ForegroundColor Green

# Start lightweight demo stack
Write-Host "🚀 Starting static demo services..." -ForegroundColor Cyan
docker compose -f compose/docker-compose.demo.yml --env-file .env.benton up -d db redis api

# Wait for services
Start-Sleep -Seconds 5

# Start monitoring
docker compose -f compose/docker-compose.demo.yml --env-file .env.benton up -d grafana

Write-Host ""
Write-Host "🎉 Static Demo Running!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Demo Endpoints:" -ForegroundColor Cyan
Write-Host "  API Health:    http://localhost:\${{TF_ADMIN_PORT:-8080}}/health" -ForegroundColor White
Write-Host "  Parcels Data:  http://localhost:\${{TF_ADMIN_PORT:-8080}}/api/counties/benton/parcels" -ForegroundColor White
Write-Host "  Assessments:   http://localhost:\${{TF_ADMIN_PORT:-8080}}/api/counties/benton/assessments" -ForegroundColor White
Write-Host "  Dashboard:     http://localhost:\${{TF_ADMIN_PORT:-8080}}/api/dashboard/stats" -ForegroundColor White
Write-Host "  Grafana:       http://localhost:\${{TF_ADMIN_PORT:-8080}}" -ForegroundColor White
Write-Host ""
Write-Host "🗄️  Database:      PostgreSQL with static Benton County data" -ForegroundColor Yellow
Write-Host "📁 Sample Data:   ./data/benton/parcels.csv" -ForegroundColor Yellow
Write-Host ""
Write-Host "🛑 Stop: docker compose -f compose/docker-compose.demo.yml down" -ForegroundColor Red
