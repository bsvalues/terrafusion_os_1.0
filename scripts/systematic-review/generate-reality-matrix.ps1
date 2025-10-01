# TerraFusion OS - Reality Matrix Generator
# Hits 4 beacon endpoints and writes truth table

param(
    [string]$BaseUrl = "http://localhost:\${{TF_API_PORT:-5000}}",
    [string]$OutputPath = "../../docs/REALITY_MATRIX.md"
)

$ErrorActionPreference = "Continue"

Write-Host "Generating Reality Matrix..." -ForegroundColor Cyan

# Initialize results
$results = @{
    Health = @{ Status = "🔴"; Message = "Not responding" }
    Security = @{ Status = "🔴"; Message = "Not configured" }
    Agents = @{ Status = "🔴"; Message = "No data" }
    Modules = @{ Status = "🔴"; Message = "No data" }
    Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
}

# Test 1: Health endpoint
try {
    $health = Invoke-RestMethod -Uri "$BaseUrl/health" -Method Get -TimeoutSec 5
    if ($health) {
        $results.Health.Status = "✅"
        $results.Health.Message = "Healthy"
        $results.Health.Details = $health
    }
} catch {
    $results.Health.Error = $_.Exception.Message
}

# Test 2: Security status
try {
    $security = Invoke-RestMethod -Uri "$BaseUrl/api/security/status" -Method Get -TimeoutSec 5
    if ($security.authScheme -eq "Bearer" -and $security.auditLogger -notmatch "Mock") {
        $results.Security.Status = "✅"
        $results.Security.Message = "Production auth"
    } elseif ($security.auditLogger -match "Mock") {
        $results.Security.Status = "⚠️"
        $results.Security.Message = "Using mock services"
    }
    $results.Security.Details = $security
} catch {
    $results.Security.Error = $_.Exception.Message
}

# Test 3: Agent metrics
try {
    $agents = Invoke-RestMethod -Uri "$BaseUrl/api/agents/metrics" -Method Get -TimeoutSec 5
    if ($agents.active -gt 0) {
        $activeCount = $agents.active
        $targetCount = 1008
        $percentage = [math]::Round(($activeCount / $targetCount) * 100, 1)
        
        if ($percentage -ge 90) {
            $results.Agents.Status = "✅"
        } elseif ($percentage -ge 50) {
            $results.Agents.Status = "⚠️"
        }
        $results.Agents.Message = "$activeCount/$targetCount agents ($percentage%)"
    }
    $results.Agents.Details = $agents
} catch {
    $results.Agents.Error = $_.Exception.Message
}

# Test 4: Module status
try {
    $modules = Invoke-RestMethod -Uri "$BaseUrl/api/modules/status" -Method Get -TimeoutSec 5
    if ($modules.Count -gt 0) {
        $activeModules = ($modules | Where-Object { $_.status -eq "active" }).Count
        $totalModules = 32
        
        if ($activeModules -eq $totalModules) {
            $results.Modules.Status = "✅"
        } elseif ($activeModules -gt 0) {
            $results.Modules.Status = "⚠️"
        }
        $results.Modules.Message = "$activeModules/$totalModules modules active"
    }
    $results.Modules.Details = $modules
} catch {
    $results.Modules.Error = $_.Exception.Message
}

# Generate markdown
$markdown = @"
# 📊 REALITY MATRIX - TerraFusion OS

*Generated: $($results.Timestamp)*  
*Endpoint: $BaseUrl*

## 🎯 System Truth Table

| Component | Status | Reality | Details |
|-----------|--------|---------|---------|
| **Health Check** | $($results.Health.Status) | $($results.Health.Message) | DB: $(if($results.Health.Details.database) {'Connected'} else {'Disconnected'}) |
| **Security** | $($results.Security.Status) | $($results.Security.Message) | Auth: $(if($results.Security.Details.authScheme) {$results.Security.Details.authScheme} else {'None'}) |
| **AI Agents** | $($results.Agents.Status) | $($results.Agents.Message) | Queue: $(if($results.Agents.Details.queued) {$results.Agents.Details.queued} else {'0'}) |
| **Modules** | $($results.Modules.Status) | $($results.Modules.Message) | Hot-swap: $(if($results.Modules.Details[0].hotSwapEnabled) {'Yes'} else {'No'}) |

## 📈 Performance Metrics

| Metric | Claimed | Actual | Gap |
|--------|---------|--------|-----|
| **AI Performance** | 379,000,000× | $(if($results.Agents.Details.performanceMultiplier) {$results.Agents.Details.performanceMultiplier + '×'} else {'Unknown'}) | $(if($results.Agents.Details.performanceMultiplier) {[math]::Round(379000000 / $results.Agents.Details.performanceMultiplier, 0).ToString() + '×'} else {'N/A'}) |
| **Active Agents** | 1,008 | $(if($results.Agents.Details.active) {$results.Agents.Details.active} else {'0'}) | $(if($results.Agents.Details.active) {(1008 - $results.Agents.Details.active)} else {'1008'}) |
| **Active Modules** | 32 | $(if($results.Modules.Details) {($results.Modules.Details | Where-Object { $_.status -eq 'active' }).Count} else {'0'}) | $(if($results.Modules.Details) {(32 - ($results.Modules.Details | Where-Object { $_.status -eq 'active' }).Count)} else {'32'}) |
| **API Latency** | <50ms | $(if($results.Health.Details.responseTime) {$results.Health.Details.responseTime + 'ms'} else {'Unknown'}) | $(if($results.Health.Details.responseTime -and $results.Health.Details.responseTime -gt 50) {'⚠️'} else {'-'}) |

## 🔐 Security Reality

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| **Auth Type** | OAuth2/SAML | $(if($results.Security.Details.authScheme) {$results.Security.Details.authScheme} else {'None'}) | $(if($results.Security.Details.authScheme -eq 'Bearer') {'⚠️'} else {'🔴'}) |
| **MFA Enabled** | Required | $(if($results.Security.Details.mfaEnabled) {'Yes'} else {'No'}) | $(if($results.Security.Details.mfaEnabled) {'✅'} else {'🔴'}) |
| **Audit Logger** | Production | $(if($results.Security.Details.auditLogger) {$results.Security.Details.auditLogger} else {'None'}) | $(if($results.Security.Details.auditLogger -match 'Mock') {'🔴'} else {'✅'}) |
| **Session Mgmt** | Redis | $(if($results.Security.Details.sessionStore) {$results.Security.Details.sessionStore} else {'None'}) | $(if($results.Security.Details.sessionStore -eq 'Redis') {'✅'} else {'🔴'}) |

## 🚨 Critical Issues

$(if($results.Health.Status -eq '🔴') {"- **Health endpoint not responding** - System may be down`n"} else {""})
$(if($results.Security.Status -ne '✅') {"- **Security using mock services** - Not production ready`n"} else {""})
$(if($results.Agents.Details.active -lt 100) {"- **Less than 100 agents active** - AI swarm not operational`n"} else {""})
$(if($results.Modules.Details.Count -lt 10) {"- **Less than 10 modules loaded** - System incomplete`n"} else {""})

## 📝 Endpoint Details

### /health Response
``````json
$(if($results.Health.Details) {$results.Health.Details | ConvertTo-Json -Depth 3} else {"No response"})
``````

### /api/security/status Response
``````json
$(if($results.Security.Details) {$results.Security.Details | ConvertTo-Json -Depth 3} else {"No response"})
``````

### /api/agents/metrics Response
``````json
$(if($results.Agents.Details) {$results.Agents.Details | ConvertTo-Json -Depth 3} else {"No response"})
``````

### /api/modules/status Response
``````json
$(if($results.Modules.Details) {($results.Modules.Details | Select-Object -First 3) | ConvertTo-Json -Depth 3} else {"No response"})
``````

## 🔄 Auto-Refresh

This matrix auto-generates every 5 minutes in CI/CD.  
Manual refresh: ``.\scripts\systematic-review\generate-reality-matrix.ps1``

---
*Truth in Engineering - No marketing, just facts*
"@

# Write to file
$outputFullPath = Join-Path $PSScriptRoot $OutputPath
$markdown | Out-File -FilePath $outputFullPath -Encoding UTF8

Write-Host "Reality Matrix generated: $outputFullPath" -ForegroundColor Green

# Display summary
Write-Host "`nSystem Status Summary:" -ForegroundColor Cyan
Write-Host "  Health: $($results.Health.Status) $($results.Health.Message)" -ForegroundColor White
Write-Host "  Security: $($results.Security.Status) $($results.Security.Message)" -ForegroundColor White
Write-Host "  Agents: $($results.Agents.Status) $($results.Agents.Message)" -ForegroundColor White
Write-Host "  Modules: $($results.Modules.Status) $($results.Modules.Message)" -ForegroundColor White

# Return overall status
$overallStatus = "🔴"
if ($results.Health.Status -eq "✅" -and $results.Security.Status -ne "🔴") {
    if ($results.Agents.Status -ne "🔴" -or $results.Modules.Status -ne "🔴") {
        $overallStatus = "⚠️"
    }
    if ($results.Health.Status -eq "✅" -and $results.Security.Status -eq "✅" -and 
        $results.Agents.Status -eq "✅" -and $results.Modules.Status -eq "✅") {
        $overallStatus = "✅"
    }
}

Write-Host "`nOverall System Status: $overallStatus" -ForegroundColor $(if($overallStatus -eq "✅") {"Green"} elseif($overallStatus -eq "⚠️") {"Yellow"} else {"Red"})

exit $(if($overallStatus -eq "🔴") {1} else {0})
