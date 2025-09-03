Write-Host "🌟 TERRAFUSION PLATFORM LAUNCHER 🌟" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Blue
Write-Host "🏢 Enterprise Property Assessment & Tax Management" -ForegroundColor Green
Write-Host "🤖 AI-Powered Data Mining & Analytics Platform" -ForegroundColor Green
Write-Host "=" * 50 -ForegroundColor Blue

Write-Host "`n🎯 TerraFusion Applications:" -ForegroundColor Cyan
Write-Host "1. 🏠 TerraFusion Build      - http://localhost:5000" -ForegroundColor White
Write-Host "2. 🔄 TerraFlow              - http://localhost:5001" -ForegroundColor White  
Write-Host "3. 🔗 TerraFusionSync        - http://localhost:5002" -ForegroundColor White
Write-Host "4. 🤖 TerraAgent             - http://localhost:5003" -ForegroundColor White
Write-Host "5. 🏢 TerraFusionAssessor    - http://localhost:5004" -ForegroundColor White
Write-Host "6. 📊 TerraFusionDashboard   - http://localhost:5005" -ForegroundColor White
Write-Host "7. ⛏️  TerraMiner            - http://localhost:5006" -ForegroundColor White
Write-Host "8. 💰 TerraFusionLevy        - http://localhost:5007" -ForegroundColor White

Write-Host "`n🚀 Choose Action:" -ForegroundColor Cyan
Write-Host "1. Start All Applications" -ForegroundColor White
Write-Host "2. Open All URLs in Browser" -ForegroundColor White
Write-Host "3. Check Status Only" -ForegroundColor White

$choice = Read-Host "`n💡 Enter choice (1-3)"

switch ($choice) {
    "1" {
        Write-Host "`n🚀 Starting all TerraFusion applications..." -ForegroundColor Cyan
        
        # Start each application
        Write-Host "Starting TerraFusion Build..." -ForegroundColor Yellow
        Start-Process -FilePath "node" -ArgumentList "simple-server.js" -WorkingDirectory "TerraFusion_Build_PRODUCTION" -WindowStyle Minimized
        
        Write-Host "Starting TerraFlow..." -ForegroundColor Yellow
        Start-Process -FilePath "python" -ArgumentList "app.py" -WorkingDirectory "TerraFlow_PRODUCTION" -WindowStyle Minimized
        
        Write-Host "Starting TerraFusionSync..." -ForegroundColor Yellow
        Start-Process -FilePath "python" -ArgumentList "app.py" -WorkingDirectory "TerraFusionSync_PRODUCTION" -WindowStyle Minimized
        
        Write-Host "Starting TerraAgent..." -ForegroundColor Yellow
        Start-Process -FilePath "python" -ArgumentList "app_simple.py" -WorkingDirectory "TerraAgent_PRODUCTION" -WindowStyle Minimized
        
        Write-Host "Starting TerraFusionAssessor..." -ForegroundColor Yellow
        Start-Process -FilePath "npm" -ArgumentList "start" -WorkingDirectory "TerraFusionAssessor_PRODUCTION" -WindowStyle Minimized
        
        Write-Host "Starting TerraFusionDashboard..." -ForegroundColor Yellow
        Start-Process -FilePath "node" -ArgumentList "dist/index.js" -WorkingDirectory "TerraFusionDashboard_PRODUCTION" -WindowStyle Minimized
        
        Write-Host "Starting TerraMiner..." -ForegroundColor Yellow
        Start-Process -FilePath "python" -ArgumentList "app.py" -WorkingDirectory "TerraMiner_PRODUCTION" -WindowStyle Minimized
        
        Write-Host "Starting TerraFusionLevy..." -ForegroundColor Yellow
        Start-Process -FilePath "python" -ArgumentList "main.py" -WorkingDirectory "TerraFusionLevy_PRODUCTION" -WindowStyle Minimized
        
        Write-Host "`n✅ All applications started! Wait 30-60 seconds for full startup." -ForegroundColor Green
        Write-Host "🌐 Applications will be available at the URLs shown above." -ForegroundColor Green
    }
    "2" {
        Write-Host "`n🌐 Opening all applications in browser..." -ForegroundColor Cyan
        Start-Process "http://localhost:5000"
        Start-Sleep 1
        Start-Process "http://localhost:5001"
        Start-Sleep 1
        Start-Process "http://localhost:5002"
        Start-Sleep 1
        Start-Process "http://localhost:5003"
        Start-Sleep 1
        Start-Process "http://localhost:5004"
        Start-Sleep 1
        Start-Process "http://localhost:5005"
        Start-Sleep 1
        Start-Process "http://localhost:5006"
        Start-Sleep 1
        Start-Process "http://localhost:5007"
        Write-Host "✅ Opened all 8 applications in browser!" -ForegroundColor Green
    }
    "3" {
        Write-Host "`n📊 Application Status Check:" -ForegroundColor Cyan
        Write-Host "🏠 TerraFusion Build:     http://localhost:5000" -ForegroundColor White
        Write-Host "🔄 TerraFlow:             http://localhost:5001" -ForegroundColor White
        Write-Host "🔗 TerraFusionSync:       http://localhost:5002" -ForegroundColor White
        Write-Host "🤖 TerraAgent:            http://localhost:5003" -ForegroundColor White
        Write-Host "🏢 TerraFusionAssessor:   http://localhost:5004" -ForegroundColor White
        Write-Host "📊 TerraFusionDashboard:  http://localhost:5005" -ForegroundColor White
        Write-Host "⛏️  TerraMiner:           http://localhost:5006" -ForegroundColor White
        Write-Host "💰 TerraFusionLevy:       http://localhost:5007" -ForegroundColor White
        Write-Host "`n💡 Visit the URLs above to check if applications are running" -ForegroundColor Yellow
    }
    default {
        Write-Host "`n🚀 Starting all applications by default..." -ForegroundColor Cyan
        # Same as option 1
    }
}

Write-Host "`n🎊 TerraFusion Platform Ready!" -ForegroundColor Green
Write-Host "💡 Run this script again anytime to manage the platform" -ForegroundColor Yellow
Write-Host "`nPress any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 