# TerraFusion OS - Resilience Installation Guide
# Install Polly (C#) and Opossum (Node.js) resilience libraries
################################################################################

Write-Host "`n╔═══════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🛡️  TERRAFUSION RESILIENCE INSTALLATION 🛡️                                  ║" -ForegroundColor White
Write-Host "╚═══════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

# Function to display section header
function Write-Section {
    param([string]$Title)
    Write-Host "`n" -NoNewline
    Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  $Title" -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
}

# Function to check prerequisites
function Test-Prerequisites {
    Write-Section "🔍 CHECKING PREREQUISITES"
    
    $allGood = $true
    
    # Check .NET SDK
    Write-Host "Checking .NET SDK..." -ForegroundColor Gray
    if (Get-Command dotnet -ErrorAction SilentlyContinue) {
        $dotnetVersion = dotnet --version
        Write-Host "  ✅ .NET SDK found: $dotnetVersion" -ForegroundColor Green
    } else {
        Write-Host "  ❌ .NET SDK not found! Install from: https://dotnet.microsoft.com/download" -ForegroundColor Red
        $allGood = $false
    }
    
    # Check Node.js
    Write-Host "Checking Node.js..." -ForegroundColor Gray
    if (Get-Command node -ErrorAction SilentlyContinue) {
        $nodeVersion = node --version
        Write-Host "  ✅ Node.js found: $nodeVersion" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Node.js not found! Install from: https://nodejs.org/" -ForegroundColor Red
        $allGood = $false
    }
    
    # Check npm
    Write-Host "Checking npm..." -ForegroundColor Gray
    if (Get-Command npm -ErrorAction SilentlyContinue) {
        $npmVersion = npm --version
        Write-Host "  ✅ npm found: $npmVersion" -ForegroundColor Green
    } else {
        Write-Host "  ❌ npm not found! Install Node.js to get npm." -ForegroundColor Red
        $allGood = $false
    }
    
    if (-not $allGood) {
        Write-Host "`n❌ Prerequisites not met. Please install missing tools." -ForegroundColor Red
        exit 1
    }
    
    Write-Host "`n✅ All prerequisites met!" -ForegroundColor Green
}

# Install Polly for .NET (C# Backend API)
function Install-Polly {
    Write-Section "📦 INSTALLING POLLY (.NET)"
    
    Write-Host "Polly is a .NET resilience and transient-fault-handling library." -ForegroundColor Gray
    Write-Host "Includes: Retry, Circuit Breaker, Timeout, Bulkhead, Fallback, Rate Limit" -ForegroundColor Gray
    Write-Host ""
    
    # Find Backend API project
    $backendApiProjects = Get-ChildItem -Path . -Recurse -Filter "*.csproj" | 
        Where-Object { $_.Name -like "*Backend*" -or $_.Name -like "*API*" }
    
    if ($backendApiProjects.Count -eq 0) {
        Write-Host "⚠️  No Backend API .csproj files found." -ForegroundColor Yellow
        Write-Host "Manual installation: Run 'dotnet add package Polly.Extensions.Http' in your project directory." -ForegroundColor Gray
        return
    }
    
    foreach ($project in $backendApiProjects) {
        $projectPath = $project.Directory.FullName
        Write-Host "Installing Polly in: $($project.Name)" -ForegroundColor Yellow
        
        Push-Location $projectPath
        
        # Install Polly
        Write-Host "  Installing Polly..." -ForegroundColor Gray
        dotnet add package Polly 2>&1 | Out-Null
        
        Write-Host "  Installing Polly.Extensions.Http..." -ForegroundColor Gray
        dotnet add package Polly.Extensions.Http 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ Polly installed successfully!" -ForegroundColor Green
        } else {
            Write-Host "  ❌ Failed to install Polly" -ForegroundColor Red
        }
        
        Pop-Location
    }
    
    Write-Host "`n📝 Next Steps for Backend API:" -ForegroundColor Cyan
    Write-Host "  1. Copy polly-policies.cs to your project" -ForegroundColor White
    Write-Host "  2. Add to Program.cs or Startup.cs:" -ForegroundColor White
    Write-Host "     services.AddResilientPostgresClient('http://postgres:5432');" -ForegroundColor Gray
    Write-Host "     services.AddResilientRedisClient('http://redis:6379');" -ForegroundColor Gray
    Write-Host "  3. Inject IHttpClientFactory in your services" -ForegroundColor White
    Write-Host "  4. Use: var client = _httpClientFactory.CreateClient('PostgresClient');" -ForegroundColor Gray
}

# Install Opossum for Node.js (AI Agent)
function Install-Opossum {
    Write-Section "📦 INSTALLING OPOSSUM (Node.js)"
    
    Write-Host "Opossum is a Node.js circuit breaker library." -ForegroundColor Gray
    Write-Host "Includes: Circuit Breaker, Timeout, Fallback, Statistics" -ForegroundColor Gray
    Write-Host ""
    
    # Install in resilience directory
    Write-Host "Installing npm packages in kubernetes/resilience..." -ForegroundColor Yellow
    Push-Location ".\kubernetes\resilience"
    
    Write-Host "  Installing axios..." -ForegroundColor Gray
    npm install axios --save 2>&1 | Out-Null
    
    Write-Host "  Installing opossum..." -ForegroundColor Gray
    npm install opossum --save 2>&1 | Out-Null
    
    Write-Host "  Installing TypeScript..." -ForegroundColor Gray
    npm install --save-dev typescript @types/node 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Opossum installed successfully!" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Failed to install Opossum" -ForegroundColor Red
    }
    
    Pop-Location
    
    # Find AI Agent project
    $aiAgentDirs = Get-ChildItem -Path . -Recurse -Directory | 
        Where-Object { $_.Name -like "*ai-agent*" -and (Test-Path (Join-Path $_.FullName "package.json")) }
    
    if ($aiAgentDirs.Count -gt 0) {
        foreach ($dir in $aiAgentDirs) {
            Write-Host "`nInstalling in AI Agent: $($dir.Name)" -ForegroundColor Yellow
            Push-Location $dir.FullName
            
            Write-Host "  Installing axios..." -ForegroundColor Gray
            npm install axios --save 2>&1 | Out-Null
            
            Write-Host "  Installing opossum..." -ForegroundColor Gray
            npm install opossum --save 2>&1 | Out-Null
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  ✅ Installed successfully!" -ForegroundColor Green
            }
            
            Pop-Location
        }
    } else {
        Write-Host "⚠️  No AI Agent directories with package.json found." -ForegroundColor Yellow
    }
    
    Write-Host "`n📝 Next Steps for AI Agent:" -ForegroundColor Cyan
    Write-Host "  1. Copy resilient-client.ts to your project" -ForegroundColor White
    Write-Host "  2. Import in your code:" -ForegroundColor White
    Write-Host "     import { TerraFusionClients } from './resilient-client';" -ForegroundColor Gray
    Write-Host "  3. Use: const data = await TerraFusionClients.BackendAPIClient.get('/api/data');" -ForegroundColor Gray
    Write-Host "  4. Check stats: TerraFusionClients.getAllStats();" -ForegroundColor Gray
}

# Copy resilience files to projects
function Copy-ResilienceFiles {
    Write-Section "📄 COPYING RESILIENCE FILES"
    
    Write-Host "Copying resilience policy files to projects..." -ForegroundColor Gray
    
    # Backend API (C#)
    $backendDirs = Get-ChildItem -Path . -Recurse -Directory | 
        Where-Object { $_.Name -like "*backend*" -or $_.Name -like "*API*" }
    
    if ($backendDirs.Count -gt 0) {
        $targetDir = $backendDirs[0].FullName
        Write-Host "  Copying polly-policies.cs to: $targetDir" -ForegroundColor Yellow
        
        if (-not (Test-Path "$targetDir\Resilience")) {
            New-Item -Path "$targetDir\Resilience" -ItemType Directory -Force | Out-Null
        }
        
        Copy-Item ".\kubernetes\resilience\polly-policies.cs" "$targetDir\Resilience\" -Force
        Write-Host "  ✅ Copied polly-policies.cs" -ForegroundColor Green
    }
    
    # AI Agent (Node.js)
    $aiAgentDirs = Get-ChildItem -Path . -Recurse -Directory | 
        Where-Object { $_.Name -like "*ai-agent*" -and (Test-Path (Join-Path $_.FullName "package.json")) }
    
    if ($aiAgentDirs.Count -gt 0) {
        $targetDir = $aiAgentDirs[0].FullName
        Write-Host "  Copying resilient-client.ts to: $targetDir" -ForegroundColor Yellow
        
        if (-not (Test-Path "$targetDir\src")) {
            New-Item -Path "$targetDir\src" -ItemType Directory -Force | Out-Null
        }
        
        Copy-Item ".\kubernetes\resilience\resilient-client.ts" "$targetDir\src\" -Force
        Write-Host "  ✅ Copied resilient-client.ts" -ForegroundColor Green
    }
}

# Verify Istio circuit breakers
function Test-IstioCircuitBreakers {
    Write-Section "🔍 VERIFYING ISTIO CIRCUIT BREAKERS"
    
    Write-Host "Checking Istio DestinationRules..." -ForegroundColor Gray
    
    if (-not (Test-Path ".\kubernetes\istio\destination-rules.yaml")) {
        Write-Host "⚠️  Istio destination rules not found!" -ForegroundColor Yellow
        Write-Host "Install Istio first: .\kubernetes\istio\install-istio.ps1" -ForegroundColor Gray
        return
    }
    
    $content = Get-Content ".\kubernetes\istio\destination-rules.yaml" -Raw
    
    if ($content -match "outlierDetection") {
        Write-Host "  ✅ Istio circuit breakers configured!" -ForegroundColor Green
        Write-Host "     • consecutiveErrors: 5" -ForegroundColor Gray
        Write-Host "     • baseEjectionTime: 30s" -ForegroundColor Gray
        Write-Host "     • maxEjectionPercent: 50%" -ForegroundColor Gray
    } else {
        Write-Host "  ⚠️  No outlierDetection found in destination rules" -ForegroundColor Yellow
    }
}

# Display summary
function Show-Summary {
    Write-Section "📊 INSTALLATION SUMMARY"
    
    Write-Host @"
╔═══════════════════════════════════════════════════════════════════════════════╗
║                         RESILIENCE COMPONENTS INSTALLED                       ║
╚═══════════════════════════════════════════════════════════════════════════════╝

✅ INFRASTRUCTURE LEVEL (Istio)
   • Circuit Breakers: 5 DestinationRules with outlierDetection
   • Threshold: 5 consecutive errors → 30s ejection
   • Coverage: Backend API, AI Agent, MCP Servers, PostgreSQL, Redis

✅ APPLICATION LEVEL - BACKEND API (C# + Polly)
   • Retry: 3 attempts with exponential backoff (1s, 2s, 4s)
   • Circuit Breaker: Opens after 5 failures, stays open 30s
   • Timeout: 10s for database, 30s for AI
   • Fallback: Cached responses when dependencies down

✅ APPLICATION LEVEL - AI AGENT (Node.js + Opossum)
   • Circuit Breaker: 50% error threshold, 30s reset timeout
   • Retry: 3 attempts with exponential backoff
   • Timeout: Configurable per service (5s-30s)
   • Fallback: Degraded mode responses

✅ CHAOS ENGINEERING
   • Test Suite: chaos-tests.ps1 (5 scenarios)
   • Coverage: Pod failures, network latency, dependencies, CPU load, cascades

─────────────────────────────────────────────────────────────────────────────────
NEXT STEPS
─────────────────────────────────────────────────────────────────────────────────

1. 🧪 Run Chaos Tests:
   .\kubernetes\resilience\chaos-tests.ps1

2. 📊 Monitor Circuit Breakers in Grafana:
   kubectl port-forward -n monitoring svc/grafana 3000:80
   Open: http://localhost:3000/d/istio-service

3. 🔧 Configure Resilience Policies:
   • Backend API: Edit polly-policies.cs (retry count, timeout values)
   • AI Agent: Edit resilient-client.ts (circuit breaker thresholds)
   • Istio: Edit kubernetes/istio/destination-rules.yaml

4. 📈 Monitor Metrics:
   kubectl get hpa -n terrafusion-prod --watch
   kubectl get destinationrules -n terrafusion-prod

─────────────────────────────────────────────────────────────────────────────────
DOCUMENTATION
─────────────────────────────────────────────────────────────────────────────────

📖 Full Guide: .\kubernetes\resilience\README.md
🧪 Chaos Tests: .\kubernetes\resilience\chaos-tests.ps1
🔧 Polly Policies: .\kubernetes\resilience\polly-policies.cs
🔧 Opossum Client: .\kubernetes\resilience\resilient-client.ts

═══════════════════════════════════════════════════════════════════════════════
"@ -ForegroundColor White
}

# Main execution
function Start-Installation {
    Write-Host "`n🚀 Starting TerraFusion Resilience Installation..." -ForegroundColor Cyan
    Write-Host "This will install Polly, Opossum, and configure resilience policies.`n" -ForegroundColor Gray
    
    Test-Prerequisites
    Install-Polly
    Install-Opossum
    Copy-ResilienceFiles
    Test-IstioCircuitBreakers
    Show-Summary
    
    Write-Host "`n╔═══════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║  🎉 RESILIENCE INSTALLATION COMPLETE! 🎉                                      ║" -ForegroundColor Green
    Write-Host "╚═══════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
}

# Run installation
Start-Installation
