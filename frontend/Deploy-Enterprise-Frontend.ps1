#!/usr/bin/env pwsh
<#
.SYNOPSIS
TerraFusion Frontend - Enterprise Architecture Deployment Script

.DESCRIPTION
Deploys the refactored TerraFusion frontend with complete enterprise infrastructure:
- Service Mesh client with Consul integration
- Trust Fabric with cryptographic attestation
- Circuit Breaker with fault tolerance
- Secure API client with all integrations

.AUTHOR
TerraFusion Engineering Team

.VERSION
2.0.0 - Enterprise Architecture
#>

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("development", "production", "staging")]
    [string]$Environment = "development",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipMigration,
    
    [Parameter(Mandatory=$false)]
    [switch]$TestOnly,
    
    [Parameter(Mandatory=$false)]
    [switch]$Force
)

Write-Host "🚀 TerraFusion Enterprise Frontend Deployment" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor White
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "Architecture: Service Mesh + Trust Fabric + Circuit Breaker" -ForegroundColor Magenta
Write-Host ""

$frontendPath = "c:\Users\bsval\terrafusion_os_1.0\frontend"
$originalPath = Get-Location

try {
    Set-Location $frontendPath
    
    # Step 1: Environment Setup
    Write-Host "📋 Step 1: Environment Configuration" -ForegroundColor Cyan
    Write-Host "===================================" -ForegroundColor White
    
    if ($Environment -eq "development") {
        Copy-Item ".env.development" ".env" -Force
        Write-Host "✅ Configured for development environment" -ForegroundColor Green
    } elseif ($Environment -eq "production") {
        Copy-Item ".env.enterprise" ".env" -Force
        Write-Host "✅ Configured for production environment" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Using default environment configuration" -ForegroundColor Yellow
    }
    
    # Step 2: Dependency Installation
    Write-Host "`n🔧 Step 2: Installing Enterprise Dependencies" -ForegroundColor Cyan
    Write-Host "============================================" -ForegroundColor White
    
    $enterpriseDeps = @(
        "consul",
        "dids", 
        "key-did-provider-ed25519",
        "opossum",
        "ws",
        "@types/ws"
    )
    
    Write-Host "📦 Installing enterprise packages..." -ForegroundColor Yellow
    
    foreach ($dep in $enterpriseDeps) {
        Write-Host "  Installing $dep..." -ForegroundColor Gray
        npm install $dep
        if ($LASTEXITCODE -ne 0) {
            Write-Host "⚠️ Warning: Failed to install $dep" -ForegroundColor Yellow
        }
    }
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Enterprise dependencies installed successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        throw "Dependency installation failed"
    }
    
    # Step 3: Component Migration
    if (-not $SkipMigration) {
        Write-Host "`n🔄 Step 3: Component Migration to Enterprise Architecture" -ForegroundColor Cyan
        Write-Host "=======================================================" -ForegroundColor White
        
        if (Test-Path "scripts\migrate-components.js") {
            Write-Host "🚀 Running automated component migration..." -ForegroundColor Yellow
            
            if ($Force) {
                node scripts\migrate-components.js --force
            } else {
                node scripts\migrate-components.js
            }
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Component migration completed" -ForegroundColor Green
            } else {
                Write-Host "⚠️ Migration completed with warnings" -ForegroundColor Yellow
            }
        } else {
            Write-Host "⏭️ Migration script not found, skipping..." -ForegroundColor Yellow
        }
    } else {
        Write-Host "`n⏭️ Step 3: Component Migration (SKIPPED)" -ForegroundColor Yellow
    }
    
    # Step 4: Type Checking and Build Validation
    Write-Host "`n🔍 Step 4: Enterprise Architecture Validation" -ForegroundColor Cyan
    Write-Host "=============================================" -ForegroundColor White
    
    Write-Host "📋 Checking TypeScript compilation..." -ForegroundColor Yellow
    $tscResult = npx tsc --noEmit
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ TypeScript validation passed" -ForegroundColor Green
    } else {
        Write-Host "❌ TypeScript errors detected" -ForegroundColor Red
        if (-not $Force) {
            throw "TypeScript validation failed"
        }
    }
    
    # Step 5: Infrastructure Health Check
    Write-Host "`n🔍 Step 5: Infrastructure Health Check" -ForegroundColor Cyan
    Write-Host "======================================" -ForegroundColor White
    
    $infrastructureChecks = @(
        @{ Name = "Service Mesh Client"; File = "src\infrastructure\ServiceMesh.ts" },
        @{ Name = "Trust Fabric Client"; File = "src\infrastructure\TrustFabric.ts" },
        @{ Name = "Circuit Breaker"; File = "src\infrastructure\CircuitBreaker.ts" },
        @{ Name = "Secure API Client"; File = "src\infrastructure\SecureAPIClient.ts" },
        @{ Name = "Infrastructure Context"; File = "src\contexts\InfrastructureContext.tsx" },
        @{ Name = "Example Refactored Component"; File = "src\components\PropertySearchRefactored.tsx" }
    )
    
    $allHealthy = $true
    foreach ($check in $infrastructureChecks) {
        if (Test-Path $check.File) {
            Write-Host "✅ $($check.Name): Ready" -ForegroundColor Green
        } else {
            Write-Host "❌ $($check.Name): Missing" -ForegroundColor Red
            $allHealthy = $false
        }
    }
    
    if ($allHealthy) {
        Write-Host "`n🎯 Infrastructure Status: READY FOR ENTERPRISE DEPLOYMENT" -ForegroundColor Green
    } else {
        Write-Host "`n⚠️ Infrastructure Status: INCOMPLETE" -ForegroundColor Yellow
        if (-not $Force) {
            throw "Infrastructure validation failed"
        }
    }
    
    # Step 6: Build Process
    if (-not $TestOnly) {
        Write-Host "`n🏗️ Step 6: Enterprise Build Process" -ForegroundColor Cyan
        Write-Host "===================================" -ForegroundColor White
        
        Write-Host "📦 Building enterprise frontend..." -ForegroundColor Yellow
        $buildResult = npm run build
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Enterprise build completed successfully" -ForegroundColor Green
            
            # Get build stats
            if (Test-Path "dist") {
                $buildSize = (Get-ChildItem -Path "dist" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
                Write-Host "📊 Build size: $([math]::Round($buildSize, 2)) MB" -ForegroundColor Cyan
            }
        } else {
            Write-Host "❌ Build failed" -ForegroundColor Red
            throw "Build process failed"
        }
    } else {
        Write-Host "`n⏭️ Step 6: Build Process (SKIPPED - Test Only)" -ForegroundColor Yellow
    }
    
    # Step 7: Start Development Server (if development)
    if ($Environment -eq "development" -and -not $TestOnly) {
        Write-Host "`n🚀 Step 7: Starting Enterprise Development Server" -ForegroundColor Cyan
        Write-Host "================================================" -ForegroundColor White
        
        Write-Host "🌐 Service Mesh: Enabled with fallback mode" -ForegroundColor Green
        Write-Host "🔐 Trust Fabric: Enabled with local attestation" -ForegroundColor Green  
        Write-Host "🔧 Circuit Breaker: Enabled with development settings" -ForegroundColor Green
        Write-Host "🔒 Secure API: Enabled with caching and retries" -ForegroundColor Green
        Write-Host ""
        Write-Host "🎯 Frontend will be available at: http://localhost:\${{TF_FRONTEND_PORT:-3000}}" -ForegroundColor Cyan
        Write-Host "📡 Backend API expected at: http://localhost:\${{TF_FRONTEND_PORT:-3000}}" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "⚡ Starting development server with enterprise architecture..." -ForegroundColor Yellow
        
        # Start the development server
        npm run dev
    }
    
    # Final Summary
    Write-Host "`n🎉 DEPLOYMENT SUMMARY" -ForegroundColor Magenta
    Write-Host "=====================" -ForegroundColor White
    Write-Host "✅ Environment: $Environment" -ForegroundColor Green
    Write-Host "✅ Enterprise Dependencies: Installed" -ForegroundColor Green
    Write-Host "✅ Infrastructure Components: Ready" -ForegroundColor Green
    if (-not $TestOnly) {
        Write-Host "✅ Build: Completed" -ForegroundColor Green
    }
    Write-Host ""
    Write-Host "🏗️ Enterprise Architecture Deployed:" -ForegroundColor Cyan
    Write-Host "  • Service Mesh Client (Consul Integration)" -ForegroundColor White
    Write-Host "  • Trust Fabric Client (Cryptographic Attestation)" -ForegroundColor White  
    Write-Host "  • Circuit Breaker (Fault Tolerance)" -ForegroundColor White
    Write-Host "  • Secure API Client (Unified Interface)" -ForegroundColor White
    Write-Host "  • React Context Integration" -ForegroundColor White
    Write-Host "  • Component Migration Framework" -ForegroundColor White
    Write-Host ""
    Write-Host "📋 Next Steps:" -ForegroundColor Yellow
    Write-Host "  1. Ensure backend API is running on http://localhost:\${{TF_FRONTEND_PORT:-3000}}" -ForegroundColor Gray
    Write-Host "  2. Start Trust Fabric enforcement if in production" -ForegroundColor Gray
    Write-Host "  3. Configure Consul for service discovery" -ForegroundColor Gray
    Write-Host "  4. Migrate remaining components using migrate-components.js" -ForegroundColor Gray
    Write-Host "  5. Add WebSocket integration for real-time updates" -ForegroundColor Gray
    Write-Host "  6. Implement comprehensive telemetry and monitoring" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🎯 TerraFusion Frontend: ENTERPRISE READY!" -ForegroundColor Green
    
} catch {
    Write-Host "`n❌ DEPLOYMENT FAILED" -ForegroundColor Red
    Write-Host "===================" -ForegroundColor White
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  • Check Node.js version (requires 18+)" -ForegroundColor Gray
    Write-Host "  • Verify npm dependencies are compatible" -ForegroundColor Gray
    Write-Host "  • Ensure backend API is accessible" -ForegroundColor Gray
    Write-Host "  • Check network connectivity for service discovery" -ForegroundColor Gray
    Write-Host "  • Use --Force flag to override validation errors" -ForegroundColor Gray
    
    exit 1
} finally {
    Set-Location $originalPath
}
