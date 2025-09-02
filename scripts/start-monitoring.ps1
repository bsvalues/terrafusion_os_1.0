#!/usr/bin/env pwsh

# TerraFusion OS Monitoring Stack Startup Script
# CTO Enhancement: Comprehensive Monitoring & Observability

Write-Host "🚀 STARTING TERRAFUSION MONITORING STACK" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Check if Docker is running
try {
    docker version | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check if main TerraFusion stack is running
Write-Host "🔍 Checking TerraFusion main stack..." -ForegroundColor Yellow
try {
    $backendHealth = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method GET -ErrorAction Stop
    Write-Host "✅ Main TerraFusion stack is running" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Main TerraFusion stack is not running. Starting it first..." -ForegroundColor Yellow
    try {
        docker-compose up -d
        Start-Sleep -Seconds 10
        Write-Host "✅ Main stack started" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to start main stack" -ForegroundColor Red
        exit 1
    }
}

# Create monitoring network if it doesn't exist
Write-Host "🌐 Creating monitoring network..." -ForegroundColor Yellow
try {
    docker network create terrafusion-network 2>$null
    Write-Host "✅ Network created/verified" -ForegroundColor Green
} catch {
    Write-Host "ℹ️  Network already exists" -ForegroundColor Blue
}

# Start monitoring stack
Write-Host "📊 Starting monitoring services..." -ForegroundColor Yellow
try {
    docker-compose -f docker-compose.monitoring.yml up -d
    Write-Host "✅ Monitoring stack started successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to start monitoring stack" -ForegroundColor Red
    exit 1
}

# Wait for services to be ready
Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Check service status
Write-Host "🔍 Checking monitoring service status..." -ForegroundColor Yellow

$services = @(
    @{Name="Prometheus"; Port=9090; URL="http://localhost:9090"},
    @{Name="Alertmanager"; Port=9093; URL="http://localhost:9093"},
    @{Name="Grafana"; Port=3000; URL="http://localhost:3000"},
    @{Name="Node Exporter"; Port=9100; URL="http://localhost:9100/metrics"},
    @{Name="Nginx Exporter"; Port=9113; URL="http://localhost:9113/metrics"},
    @{Name="cAdvisor"; Port=8080; URL="http://localhost:8080/metrics"}
)

$allHealthy = $true

foreach ($service in $services) {
    try {
        $response = Invoke-RestMethod -Uri $service.URL -Method GET -TimeoutSec 5 -ErrorAction Stop
        Write-Host "✅ $($service.Name) is healthy on port $($service.Port)" -ForegroundColor Green
    } catch {
        Write-Host "❌ $($service.Name) is not responding on port $($service.Port)" -ForegroundColor Red
        $allHealthy = $false
    }
}

# Display access information
Write-Host ""
Write-Host "🌐 MONITORING STACK ACCESS INFORMATION" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "• Prometheus:     http://localhost:9090" -ForegroundColor White
Write-Host "• Alertmanager:   http://localhost:9093" -ForegroundColor White
Write-Host "• Grafana:        http://localhost:3000" -ForegroundColor White
Write-Host "• Node Exporter:  http://localhost:9100/metrics" -ForegroundColor White
Write-Host "• Nginx Exporter: http://localhost:9113/metrics" -ForegroundColor White
Write-Host "• cAdvisor:       http://localhost:8080/metrics" -ForegroundColor White

Write-Host ""
Write-Host "🔑 GRAFANA LOGIN CREDENTIALS" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host "Username: admin" -ForegroundColor White
Write-Host "Password: terrafusion2025" -ForegroundColor White

Write-Host ""
if ($allHealthy) {
    Write-Host "🎉 MONITORING STACK IS FULLY OPERATIONAL!" -ForegroundColor Green
    Write-Host "All services are healthy and ready for production monitoring." -ForegroundColor Green
} else {
    Write-Host "⚠️  SOME MONITORING SERVICES ARE NOT RESPONDING" -ForegroundColor Yellow
    Write-Host "Check the logs with: docker-compose -f docker-compose.monitoring.yml logs" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📋 NEXT STEPS:" -ForegroundColor Cyan
Write-Host "1. Open Grafana at http://localhost:3000" -ForegroundColor White
Write-Host "2. Login with admin/terrafusion2025" -ForegroundColor White
Write-Host "3. The TerraFusion dashboard should be automatically provisioned" -ForegroundColor White
Write-Host "4. Configure additional alerts and dashboards as needed" -ForegroundColor White

Write-Host ""
Write-Host "🔄 To stop monitoring: docker-compose -f docker-compose.monitoring.yml down" -ForegroundColor Blue
Write-Host "📊 To view logs: docker-compose -f docker-compose.monitoring.yml logs -f" -ForegroundColor Blue
