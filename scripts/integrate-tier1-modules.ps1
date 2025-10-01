#!/usr/bin/env pwsh

<#
.SYNOPSIS
    TerraFusion OS Tier 1 Module Integration Script
    
.DESCRIPTION
    Integrates the three critical Tier 1 modules for Benton County deployment:
    1. unified-system - Central integration hub for government operations
    2. terra-fusion-sync - Harris PACS data synchronization  
    3. government-core - 14-module composite package for core government services
    
.PARAMETER BackendUrl
    The URL of the TerraFusion OS backend API (default: http://localhost:5000)
    
.PARAMETER Timeout
    Timeout in seconds for API calls (default: 30)
    
.EXAMPLE
    .\integrate-tier1-modules.ps1
    
.EXAMPLE
    .\integrate-tier1-modules.ps1 -BackendUrl "http://localhost:5000" -Timeout 60
#>

param(
    [string]$BackendUrl = "http://localhost:5000",
    [int]$Timeout = 30
)

# TerraFusion OS Tier 1 Module Integration
$ErrorActionPreference = "Stop"

Write-Host "🚀 TerraFusion OS - Tier 1 Module Integration" -ForegroundColor Cyan
Write-Host "🎯 Target: Benton County Washington Deployment" -ForegroundColor Yellow
Write-Host "🏛️ Government-Grade System with 50,000 AI Agents" -ForegroundColor Green
Write-Host ("=" * 70) -ForegroundColor Gray

# Define Tier 1 critical modules
$Tier1Modules = @(
    @{
        Id = "unified-system"
        Name = "Unified System Integration Platform"
        Description = "Central integration hub for government operations"
        Priority = "Critical"
        ExpectedFeatures = @("CrossSystemCoordination", "GovernmentOperationsHub", "BentonCountyIntegration")
    },
    @{
        Id = "terra-fusion-sync"
        Name = "Terra Fusion Sync Engine"
        Description = "Harris PACS data synchronization for 89,247 parcels"
        Priority = "Critical"
        ExpectedFeatures = @("HarrisPacsSync", "RealTimeDataSync", "PropertyDataPipeline")
    },
    @{
        Id = "government-core"
        Name = "Government Core Package Suite"
        Description = "14-module composite package for core government services"
        Priority = "Critical"
        ExpectedFeatures = @("AssessmentWorkflows", "PermitSystems", "ComplianceTracking", "FISMACompliance")
    }
)

# Function to test API connectivity
function Test-TerraFusionAPI {
    param([string]$Url)
    
    try {
        Write-Host "🔍 Testing TerraFusion OS API connectivity..." -ForegroundColor Yellow
        $response = Invoke-RestMethod -Uri "$Url/health" -Method Get -TimeoutSec $Timeout
        Write-Host "✅ API Health Check: OK" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ API Health Check Failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "💡 Ensure TerraFusion OS backend is running at: $Url" -ForegroundColor Yellow
        return $false
    }
}

# Function to integrate a single module
function Invoke-ModuleIntegration {
    param(
        [hashtable]$Module,
        [string]$ApiUrl,
        [int]$AttemptNumber = 1,
        [int]$MaxAttempts = 3
    )
    
    Write-Host "`n🔧 Integrating: $($Module.Name)" -ForegroundColor Cyan
    Write-Host "   Module ID: $($Module.Id)" -ForegroundColor Gray
    Write-Host "   Priority: $($Module.Priority)" -ForegroundColor Gray
    Write-Host "   Description: $($Module.Description)" -ForegroundColor Gray
    
    try {
        # Attempt integration via API call to our enhanced ModuleIntegrationService
        $integrationUrl = "$ApiUrl/api/moduleintegration/integrate/$($Module.Id)"
        $requestBody = @{
            priority = "Tier1"
            requiredServices = @("LegacyIntegration", "DataSync", "GovernmentCompliance")
            deploymentMode = "Production"
            bentonCountySpecific = $true
        } | ConvertTo-Json
        
        Write-Host "📡 Calling integration API..." -ForegroundColor Yellow
        $response = Invoke-RestMethod -Uri $integrationUrl -Method Post -Body $requestBody -ContentType "application/json" -TimeoutSec $Timeout
        
        if ($response.success -eq $true) {
            Write-Host "✅ $($Module.Name) - Integration Complete" -ForegroundColor Green
            
            # Display integration details
            if ($response.configurationApplied) {
                Write-Host "📋 Configuration Applied:" -ForegroundColor Cyan
                Write-Host "   Priority: $($response.configurationApplied.Priority)" -ForegroundColor Gray
                Write-Host "   Deployment Mode: $($response.configurationApplied.DeploymentMode)" -ForegroundColor Gray
            }
            
            return $true
        }
        else {
            Write-Host "❌ Integration Failed: $($response.errorMessage)" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "❌ Integration Exception: $($_.Exception.Message)" -ForegroundColor Red
        
        if ($AttemptNumber -lt $MaxAttempts) {
            $delaySeconds = $AttemptNumber * 2
            Write-Host "⏳ Retrying in $delaySeconds seconds... (Attempt $AttemptNumber/$MaxAttempts)" -ForegroundColor Yellow
            Start-Sleep -Seconds $delaySeconds
            return Invoke-ModuleIntegration -Module $Module -ApiUrl $ApiUrl -AttemptNumber ($AttemptNumber + 1) -MaxAttempts $MaxAttempts
        }
        
        return $false
    }
}

# Function to get integration status report
function Get-IntegrationStatusReport {
    param([string]$ApiUrl)
    
    try {
        Write-Host "`n📊 Fetching Integration Status Report..." -ForegroundColor Yellow
        $statusUrl = "$ApiUrl/api/moduleintegration/status"
        $response = Invoke-RestMethod -Uri $statusUrl -Method Get -TimeoutSec $Timeout
        
        Write-Host "`n📈 INTEGRATION STATUS REPORT" -ForegroundColor Cyan
        Write-Host "   Total Modules: $($response.totalModules)" -ForegroundColor Gray
        Write-Host "   Integrated: $($response.integratedModules)" -ForegroundColor Green
        Write-Host "   Ready to Integrate: $($response.readyToIntegrateModules)" -ForegroundColor Yellow
        Write-Host "   Success Rate: $([math]::Round($response.integrationSuccessRate * 100, 1))%" -ForegroundColor Cyan
        
        if ($response.integrationSuccessRate -ge 0.90) {
            Write-Host "🏆 EXCELLENT - System ready for government deployment" -ForegroundColor Green
        }
        elseif ($response.integrationSuccessRate -ge 0.75) {
            Write-Host "✅ GOOD - Minor optimizations recommended" -ForegroundColor Yellow
        }
        else {
            Write-Host "⚠️  ATTENTION REQUIRED - Additional integration needed" -ForegroundColor Red
        }
        
        return $true
    }
    catch {
        Write-Host "❌ Status Report Failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to check deployment readiness
function Test-DeploymentReadiness {
    param([string]$ApiUrl)
    
    try {
        Write-Host "`n🎯 Checking Benton County Deployment Readiness..." -ForegroundColor Yellow
        $readinessUrl = "$ApiUrl/api/moduleintegration/deployment-readiness"
        $response = Invoke-RestMethod -Uri $readinessUrl -Method Get -TimeoutSec $Timeout
        
        Write-Host "`n🏛️ BENTON COUNTY DEPLOYMENT READINESS" -ForegroundColor Cyan
        Write-Host "   Overall Readiness: $($response.overallReadiness)%" -ForegroundColor Gray
        Write-Host "   Critical Modules: $($response.criticalModulesReady)/$($response.totalCriticalModules)" -ForegroundColor Gray
        Write-Host "   Compliance Status: $($response.complianceStatus)" -ForegroundColor Gray
        Write-Host "   AI Agents Active: $($response.aiAgentsActive)" -ForegroundColor Gray
        
        if ($response.overallReadiness -ge 95) {
            Write-Host "🚀 READY FOR PRODUCTION DEPLOYMENT" -ForegroundColor Green
        }
        elseif ($response.overallReadiness -ge 80) {
            Write-Host "⚠️  DEPLOYMENT POSSIBLE - Minor items to address" -ForegroundColor Yellow
        }
        else {
            Write-Host "❌ NOT READY - Critical integrations required" -ForegroundColor Red
        }
        
        return $response.overallReadiness -ge 80
    }
    catch {
        Write-Host "❌ Deployment Readiness Check Failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "💡 Continuing with integration sequence..." -ForegroundColor Yellow
        return $false
    }
}

# Main execution
try {
    # Step 1: Test API connectivity
    if (-not (Test-TerraFusionAPI -Url $BackendUrl)) {
        Write-Host "`n❌ Cannot proceed without API connectivity" -ForegroundColor Red
        Write-Host "💡 Start TerraFusion OS backend: dotnet run --project backend/TerraFusion.API" -ForegroundColor Yellow
        exit 1
    }
    
    # Step 2: Execute Tier 1 module integration
    $totalModules = $Tier1Modules.Count
    $successfulIntegrations = 0
    $integrationResults = @()
    
    foreach ($module in $Tier1Modules) {
        $result = Invoke-ModuleIntegration -Module $module -ApiUrl $BackendUrl
        $integrationResults += @{
            Module = $module.Name
            Success = $result
        }
        
        if ($result) {
            $successfulIntegrations++
        }
        
        # Progress indicator
        $progress = [math]::Round(($successfulIntegrations / $totalModules) * 100, 1)
        Write-Host "📈 Progress: $progress% ($successfulIntegrations/$totalModules)" -ForegroundColor Cyan
    }
    
    # Step 3: Display results
    Write-Host "`n" + ("=" * 70) -ForegroundColor Gray
    
    if ($successfulIntegrations -eq $totalModules) {
        Write-Host "🎉 TIER 1 INTEGRATION COMPLETE" -ForegroundColor Green
        Write-Host "✅ All critical government modules integrated successfully" -ForegroundColor Green
        Write-Host "🏛️ System ready for Benton County deployment validation" -ForegroundColor Green
        
        # Get final status report
        Get-IntegrationStatusReport -ApiUrl $BackendUrl
        
        # Check deployment readiness
        Test-DeploymentReadiness -ApiUrl $BackendUrl
        
    } else {
        Write-Host "⚠️  TIER 1 INTEGRATION PARTIAL" -ForegroundColor Yellow
        Write-Host "✅ $successfulIntegrations/$totalModules modules integrated" -ForegroundColor Yellow
        Write-Host "🔧 Review failed integrations and retry" -ForegroundColor Yellow
        
        # Show which modules failed
        Write-Host "`n📋 Integration Results:" -ForegroundColor Cyan
        foreach ($result in $integrationResults) {
            $status = if ($result.Success) { "✅" } else { "❌" }
            Write-Host "   $status $($result.Module)" -ForegroundColor Gray
        }
    }
    
    Write-Host "`n🚀 TerraFusion OS - Ready for Government Operations" -ForegroundColor Cyan
    Write-Host ("=" * 70) -ForegroundColor Gray
    
} catch {
    Write-Host "`n❌ Script Execution Failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "📋 Check TerraFusion OS backend status and retry" -ForegroundColor Yellow
    exit 1
}