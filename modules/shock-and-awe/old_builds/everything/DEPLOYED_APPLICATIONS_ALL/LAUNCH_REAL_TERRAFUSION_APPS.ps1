#!/usr/bin/env pwsh

Clear-Host
Write-Host "################################################################" -ForegroundColor Cyan
Write-Host "#                                                              #" -ForegroundColor Cyan
Write-Host "#           🚀 TERRAFUSION REAL APPLICATIONS LAUNCHER 🚀       #" -ForegroundColor Cyan
Write-Host "#                                                              #" -ForegroundColor Cyan
Write-Host "#              RUST + NEXT.JS ENTERPRISE PLATFORM             #" -ForegroundColor Cyan
Write-Host "#                                                              #" -ForegroundColor Cyan
Write-Host "################################################################" -ForegroundColor Cyan

Write-Host "`n🎯 VERIFIED REAL APPLICATIONS AVAILABLE:" -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor White

Write-Host "`n1️⃣  TerraFusionBuild_ACTUAL" -ForegroundColor Green
Write-Host "    🔧 Rust Backend (Axum + SQLite)" -ForegroundColor White
Write-Host "    🌐 Next.js Frontend (TypeScript + React)" -ForegroundColor White
Write-Host "    📊 Property Assessment Platform" -ForegroundColor White
Write-Host "    🚀 Ports: Backend 8080, Frontend 3000" -ForegroundColor White

Write-Host "`n2️⃣  TerraFusionPlayground_PRODUCTION" -ForegroundColor Green
Write-Host "    🐍 Python Flask Backend" -ForegroundColor White
Write-Host "    🌐 Enterprise Application Hub" -ForegroundColor White
Write-Host "    🎮 Manages entire TerraFusion ecosystem" -ForegroundColor White
Write-Host "    🚀 Port: 3000" -ForegroundColor White

Write-Host "`n3️⃣  TerraFusionProf_PRODUCTION" -ForegroundColor Green
Write-Host "    🦀 Rust Microservices (5+ services)" -ForegroundColor White
Write-Host "    🌐 Enterprise Architecture" -ForegroundColor White
Write-Host "    📈 Advanced Property Analytics" -ForegroundColor White
Write-Host "    🚀 Multiple ports (5000+)" -ForegroundColor White

Write-Host "`n4️⃣  Launch ALL Applications" -ForegroundColor Magenta
Write-Host "    🔥 Complete TerraFusion Ecosystem" -ForegroundColor White
Write-Host "    ⚡ All services running simultaneously" -ForegroundColor White

Write-Host "`n0️⃣  Exit" -ForegroundColor Red

Write-Host "`n=========================================" -ForegroundColor White

# Get user choice
do {
    $choice = Read-Host "`n🔥 Select application to launch (1-4, 0 to exit)"
} while ($choice -notmatch '^[0-4]$')

switch ($choice) {
    "1" {
        Write-Host "`n🚀 Launching TerraFusionBuild_ACTUAL..." -ForegroundColor Cyan
        Set-Location "TerraFusionBuild_ACTUAL"
        if (Test-Path "launch_terrafusion.ps1") {
            .\launch_terrafusion.ps1
        } else {
            Write-Host "❌ Launch script not found!" -ForegroundColor Red
            Read-Host "Press Enter to continue"
        }
    }
    
    "2" {
        Write-Host "`n🚀 Launching TerraFusionPlayground_PRODUCTION..." -ForegroundColor Cyan
        Set-Location "TerraFusionPlayground_PRODUCTION"
        if (Test-Path "launch_playground.ps1") {
            .\launch_playground.ps1
        } else {
            Write-Host "❌ Launch script not found! Trying direct launch..." -ForegroundColor Yellow
            if (Test-Path "start_playground.py") {
                python start_playground.py
            } else {
                Write-Host "❌ start_playground.py not found!" -ForegroundColor Red
            }
        }
    }
    
    "3" {
        Write-Host "`n🚀 Launching TerraFusionProf_PRODUCTION..." -ForegroundColor Cyan
        Write-Host "⚠️ Advanced microservices setup - checking configuration..." -ForegroundColor Yellow
        Set-Location "TerraFusionProf_PRODUCTION"
        
        # Check for launch script or try direct cargo run
        if (Test-Path "EXECUTE_NOW.sh") {
            Write-Host "Found EXECUTE_NOW.sh - converting to PowerShell..." -ForegroundColor Yellow
            # Convert bash script to PowerShell commands
            Write-Host "Starting Rust microservices..." -ForegroundColor Cyan
            Set-Location "terrafusion_rust"
            cargo run --release
        } else {
            Write-Host "❌ Launch configuration not found!" -ForegroundColor Red
            Read-Host "Press Enter to continue"
        }
    }
    
    "4" {
        Write-Host "`n🔥 LAUNCHING ALL REAL APPLICATIONS..." -ForegroundColor Magenta
        Write-Host "⚡ This will start the complete TerraFusion ecosystem!" -ForegroundColor Yellow
        
        # Launch TerraFusionPlayground first (hub)
        Write-Host "`n1️⃣ Starting TerraFusion Hub..." -ForegroundColor Cyan
        Start-Process -FilePath "powershell" -ArgumentList "-File", "TerraFusionPlayground_PRODUCTION/launch_playground.ps1" -WindowStyle Normal
        
        Start-Sleep 3
        
        # Launch TerraFusionBuild
        Write-Host "2️⃣ Starting TerraFusion Build..." -ForegroundColor Cyan
        Start-Process -FilePath "powershell" -ArgumentList "-File", "TerraFusionBuild_ACTUAL/launch_terrafusion.ps1" -WindowStyle Normal
        
        Write-Host "`n🎉 ALL APPLICATIONS LAUNCHING!" -ForegroundColor Green
        Write-Host "🌐 TerraFusion Hub: http://localhost:\${{TF_FRONTEND_PORT:-3000}}" -ForegroundColor White
        Write-Host "🌐 Rust Backend: http://localhost:\${{TF_FRONTEND_PORT:-3000}}" -ForegroundColor White
        Write-Host "🌐 Next.js Frontend: http://localhost:\${{TF_FRONTEND_PORT:-3000}}" -ForegroundColor White
        
        Write-Host "`n🔥 Opening applications in browser..." -ForegroundColor Yellow
        Start-Process "http://localhost:\${{TF_FRONTEND_PORT:-3000}}"
        Start-Sleep 3
        Start-Process "http://localhost:\${{TF_FRONTEND_PORT:-3000}}"
        
        Read-Host "`nPress Enter to continue"
    }
    
    "0" {
        Write-Host "`n👋 Goodbye! TerraFusion applications ready when you are." -ForegroundColor Green
        exit
    }
}

Read-Host "`nPress Enter to return to main menu or close window" 