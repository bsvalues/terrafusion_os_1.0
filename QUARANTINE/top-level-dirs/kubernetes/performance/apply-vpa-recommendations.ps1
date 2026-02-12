# TerraFusion OS - Apply VPA Recommendations
# Right-size resource requests/limits based on actual usage
################################################################################

Write-Host "`n╔═══════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  📊 TERRAFUSION VPA RECOMMENDATIONS - RESOURCE RIGHT-SIZING 📊               ║" -ForegroundColor White
Write-Host "╚═══════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

# Configuration
$Namespace = "terrafusion-prod"

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
    
    if (-not (Get-Command kubectl -ErrorAction SilentlyContinue)) {
        Write-Host "❌ kubectl not found! Please install kubectl first." -ForegroundColor Red
        exit 1
    }
    
    # Check if VPA is installed
    Write-Host "Checking VPA installation..." -ForegroundColor Gray
    $vpaCheck = kubectl get vpa -n $Namespace 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ VPA not installed! Install with: .\kubernetes\autoscaling\install-autoscaling.ps1" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Prerequisites check passed!" -ForegroundColor Green
}

# Function to get VPA recommendations
function Get-VPARecommendations {
    Write-Section "📊 FETCHING VPA RECOMMENDATIONS"
    
    Write-Host "Getting VPA recommendations for all services...`n" -ForegroundColor Gray
    
    $vpas = kubectl get vpa -n $Namespace -o json | ConvertFrom-Json
    
    $recommendations = @()
    
    foreach ($vpa in $vpas.items) {
        $name = $vpa.metadata.name
        $targetRef = $vpa.spec.targetRef.name
        $status = $vpa.status
        
        if ($status.recommendation) {
            $rec = $status.recommendation
            
            Write-Host "📦 $name" -ForegroundColor Yellow
            Write-Host "   Target: $targetRef" -ForegroundColor Gray
            
            foreach ($container in $rec.containerRecommendations) {
                $containerName = $container.containerName
                
                Write-Host "   Container: $containerName" -ForegroundColor White
                
                # Current resources (from target)
                $current = @{
                    CPU_Request = "Unknown"
                    CPU_Limit = "Unknown"
                    Memory_Request = "Unknown"
                    Memory_Limit = "Unknown"
                }
                
                # Get current resources from deployment/statefulset
                $targetType = $vpa.spec.targetRef.kind
                $targetJson = kubectl get $targetType $targetRef -n $Namespace -o json 2>$null | ConvertFrom-Json
                if ($targetJson) {
                    $containers = $targetJson.spec.template.spec.containers
                    $targetContainer = $containers | Where-Object { $_.name -eq $containerName }
                    if ($targetContainer.resources) {
                        if ($targetContainer.resources.requests) {
                            $current.CPU_Request = $targetContainer.resources.requests.cpu
                            $current.Memory_Request = $targetContainer.resources.requests.memory
                        }
                        if ($targetContainer.resources.limits) {
                            $current.CPU_Limit = $targetContainer.resources.limits.cpu
                            $current.Memory_Limit = $targetContainer.resources.limits.memory
                        }
                    }
                }
                
                # Recommended resources
                $lowerBound = $container.lowerBound
                $target = $container.target
                $upperBound = $container.upperBound
                $uncappedTarget = $container.uncappedTarget
                
                Write-Host "     Current:" -ForegroundColor Cyan
                Write-Host "       CPU Request: $($current.CPU_Request)" -ForegroundColor Gray
                Write-Host "       CPU Limit: $($current.CPU_Limit)" -ForegroundColor Gray
                Write-Host "       Memory Request: $($current.Memory_Request)" -ForegroundColor Gray
                Write-Host "       Memory Limit: $($current.Memory_Limit)" -ForegroundColor Gray
                
                Write-Host "     VPA Recommendation (Target):" -ForegroundColor Green
                Write-Host "       CPU Request: $($target.cpu)" -ForegroundColor Gray
                Write-Host "       Memory Request: $($target.memory)" -ForegroundColor Gray
                
                Write-Host "     VPA Range:" -ForegroundColor Yellow
                Write-Host "       Lower Bound: CPU $($lowerBound.cpu), Memory $($lowerBound.memory)" -ForegroundColor Gray
                Write-Host "       Upper Bound: CPU $($upperBound.cpu), Memory $($upperBound.memory)" -ForegroundColor Gray
                
                # Calculate savings
                $currentCPU = ConvertTo-Millicores $current.CPU_Request
                $recommendedCPU = ConvertTo-Millicores $target.cpu
                $cpuChange = [math]::Round((($recommendedCPU - $currentCPU) / $currentCPU) * 100, 1)
                
                $currentMemory = ConvertTo-MB $current.Memory_Request
                $recommendedMemory = ConvertTo-MB $target.memory
                $memoryChange = [math]::Round((($recommendedMemory - $currentMemory) / $currentMemory) * 100, 1)
                
                Write-Host "     Impact:" -ForegroundColor Magenta
                if ($cpuChange -gt 0) {
                    Write-Host "       CPU: +$cpuChange% (increase needed)" -ForegroundColor Yellow
                } elseif ($cpuChange -lt 0) {
                    Write-Host "       CPU: $cpuChange% (over-provisioned, save resources!)" -ForegroundColor Green
                } else {
                    Write-Host "       CPU: 0% (optimal)" -ForegroundColor Green
                }
                
                if ($memoryChange -gt 0) {
                    Write-Host "       Memory: +$memoryChange% (increase needed)" -ForegroundColor Yellow
                } elseif ($memoryChange -lt 0) {
                    Write-Host "       Memory: $memoryChange% (over-provisioned, save resources!)" -ForegroundColor Green
                } else {
                    Write-Host "       Memory: 0% (optimal)" -ForegroundColor Green
                }
                
                Write-Host ""
                
                $recommendations += @{
                    Service = $name
                    Target = $targetRef
                    Container = $containerName
                    CurrentCPU = $current.CPU_Request
                    CurrentMemory = $current.Memory_Request
                    RecommendedCPU = $target.cpu
                    RecommendedMemory = $target.memory
                    CPUChange = $cpuChange
                    MemoryChange = $memoryChange
                }
            }
        } else {
            Write-Host "⚠️  $name - No recommendations yet (VPA collecting data...)" -ForegroundColor Yellow
        }
    }
    
    return $recommendations
}

# Helper: Convert CPU to millicores
function ConvertTo-Millicores {
    param([string]$cpu)
    
    if ($cpu -match '(\d+)m') {
        return [int]$Matches[1]
    } elseif ($cpu -match '(\d+)') {
        return [int]$Matches[1] * 1000
    }
    return 500  # Default
}

# Helper: Convert Memory to MB
function ConvertTo-MB {
    param([string]$memory)
    
    if ($memory -match '(\d+)Mi') {
        return [int]$Matches[1]
    } elseif ($memory -match '(\d+)Gi') {
        return [int]$Matches[1] * 1024
    } elseif ($memory -match '(\d+)M') {
        return [int]$Matches[1]
    } elseif ($memory -match '(\d+)G') {
        return [int]$Matches[1] * 1000
    }
    return 512  # Default
}

# Function to apply VPA recommendations
function Apply-VPARecommendations {
    param($recommendations)
    
    Write-Section "🚀 APPLYING VPA RECOMMENDATIONS"
    
    Write-Host "This will update resource requests based on VPA recommendations." -ForegroundColor Gray
    Write-Host "Deployments will be automatically updated and pods restarted." -ForegroundColor Gray
    Write-Host ""
    
    $applyAll = Read-Host "Apply all recommendations? (y/n)"
    
    if ($applyAll -ne 'y') {
        Write-Host "Skipping application. Review recommendations above." -ForegroundColor Yellow
        return
    }
    
    foreach ($rec in $recommendations) {
        Write-Host "Updating $($rec.Target)..." -ForegroundColor Yellow
        
        # Update deployment/statefulset with new resources
        $patchJson = @{
            spec = @{
                template = @{
                    spec = @{
                        containers = @(
                            @{
                                name = $rec.Container
                                resources = @{
                                    requests = @{
                                        cpu = $rec.RecommendedCPU
                                        memory = $rec.RecommendedMemory
                                    }
                                    limits = @{
                                        cpu = (ConvertTo-Millicores $rec.RecommendedCPU) * 2 + "m"
                                        memory = (ConvertTo-MB $rec.RecommendedMemory) * 2 + "Mi"
                                    }
                                }
                            }
                        )
                    }
                }
            }
        } | ConvertTo-Json -Depth 10
        
        kubectl patch deployment $rec.Target -n $Namespace --patch $patchJson 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ Updated successfully" -ForegroundColor Green
        } else {
            Write-Host "  ❌ Failed to update" -ForegroundColor Red
        }
    }
    
    Write-Host "`n✅ All recommendations applied! Pods will restart with new resources." -ForegroundColor Green
}

# Function to show savings summary
function Show-SavingsSummary {
    param($recommendations)
    
    Write-Section "💰 COST SAVINGS SUMMARY"
    
    $totalCPUSavings = 0
    $totalMemorySavings = 0
    
    foreach ($rec in $recommendations) {
        if ($rec.CPUChange -lt 0) {
            $cpuSaved = [math]::Abs($rec.CPUChange)
            $totalCPUSavings += $cpuSaved
        }
        if ($rec.MemoryChange -lt 0) {
            $memorySaved = [math]::Abs($rec.MemoryChange)
            $totalMemorySavings += $memorySaved
        }
    }
    
    if ($totalCPUSavings -gt 0 -or $totalMemorySavings -gt 0) {
        Write-Host "Over-provisioned resources detected!" -ForegroundColor Yellow
        Write-Host "  • CPU: Average -$([math]::Round($totalCPUSavings / $recommendations.Count, 1))% per service" -ForegroundColor Green
        Write-Host "  • Memory: Average -$([math]::Round($totalMemorySavings / $recommendations.Count, 1))% per service" -ForegroundColor Green
        Write-Host ""
        Write-Host "Estimated Annual Savings:" -ForegroundColor Cyan
        
        # Rough cost calculation (AWS pricing)
        # 1 vCPU = $30/month, 1GB RAM = $4/month
        $avgCPUSavingsPercent = $totalCPUSavings / $recommendations.Count
        $avgMemorySavingsPercent = $totalMemorySavings / $recommendations.Count
        
        $cpuCostSavings = ($avgCPUSavingsPercent / 100) * 30 * 12 * $recommendations.Count
        $memoryCostSavings = ($avgMemorySavingsPercent / 100) * 4 * 12 * $recommendations.Count
        $totalSavings = $cpuCostSavings + $memoryCostSavings
        
        Write-Host "  • CPU: $([math]::Round($cpuCostSavings, 0))/year" -ForegroundColor White
        Write-Host "  • Memory: $([math]::Round($memoryCostSavings, 0))/year" -ForegroundColor White
        Write-Host "  • Total: $([math]::Round($totalSavings, 0))/year" -ForegroundColor Green
    } else {
        Write-Host "✅ Resources are well-tuned! No significant over-provisioning detected." -ForegroundColor Green
    }
}

# Main execution
function Start-VPAOptimization {
    Write-Host "`n🚀 Starting VPA-based resource optimization..." -ForegroundColor Cyan
    Write-Host "This will analyze actual resource usage and recommend right-sizing.`n" -ForegroundColor Gray
    
    Test-Prerequisites
    $recommendations = Get-VPARecommendations
    
    if ($recommendations.Count -gt 0) {
        Show-SavingsSummary -recommendations $recommendations
        Apply-VPARecommendations -recommendations $recommendations
    } else {
        Write-Host "⚠️  No recommendations available yet. VPA needs more time to collect data." -ForegroundColor Yellow
        Write-Host "Wait 5-10 minutes and run this script again." -ForegroundColor Gray
    }
    
    Write-Host "`n╔═══════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║  🎉 VPA OPTIMIZATION COMPLETE! 🎉                                             ║" -ForegroundColor Green
    Write-Host "╚═══════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
}

# Run optimization
Start-VPAOptimization
