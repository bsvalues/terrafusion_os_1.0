# Day 8 Phase 0-2 Execution Script
# Execute this in staging environment
# Duration: 75-90 minutes

$ErrorActionPreference = "Stop"

# Configuration
$STAGING_ENV = "staging"
$STAGING_NAMESPACE = "terrafusion-staging"
$STAGING_CONTEXT = "staging-k8s-context"  # Update with your actual context
$OUTPUT_DIR = "out/day8-f2-staging"
$BACKUP_DIR = "ops/tests/chaos/backups/2025-10-07"

# Create output directories
New-Item -ItemType Directory -Path $OUTPUT_DIR -Force | Out-Null
New-Item -ItemType Directory -Path $BACKUP_DIR -Force | Out-Null

Write-Host "`n╔════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║          DAY 8 STAGING EXECUTION: Phase 0-2 (75-90min)                   ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

# ==============================================================================
# PHASE 0: PRE-FLIGHT + BACKUP (15 minutes)
# ==============================================================================

Write-Host "`n════════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "PHASE 0: PRE-FLIGHT + BACKUP (15min)" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════════════════════`n" -ForegroundColor Yellow

Write-Host "[1/4] Verifying Kubernetes cluster connectivity..." -ForegroundColor White
# kubectl config use-context $STAGING_CONTEXT
# kubectl cluster-info

Write-Host "`n✓ NOTE: Manual kubectl commands required" -ForegroundColor Yellow
Write-Host "   Run these commands manually (replace context name):" -ForegroundColor Gray
Write-Host "   kubectl config use-context YOUR_STAGING_CONTEXT" -ForegroundColor Cyan
Write-Host "   kubectl cluster-info" -ForegroundColor Cyan

Read-Host "`n   Press ENTER after verifying cluster connectivity"

Write-Host "`n[2/4] Checking namespace and Istio installation..." -ForegroundColor White
Write-Host "   Run these commands:" -ForegroundColor Gray
Write-Host "   kubectl get namespace $STAGING_NAMESPACE" -ForegroundColor Cyan
Write-Host "   kubectl get pods -n istio-system" -ForegroundColor Cyan

Read-Host "`n   Press ENTER after verifying namespace and Istio"

Write-Host "`n[3/4] Creating backup directory..." -ForegroundColor White
if (Test-Path $BACKUP_DIR) {
    Write-Host "   ✓ Backup directory exists: $BACKUP_DIR" -ForegroundColor Green
} else {
    New-Item -ItemType Directory -Path $BACKUP_DIR -Force | Out-Null
    Write-Host "   ✓ Created backup directory: $BACKUP_DIR" -ForegroundColor Green
}

Write-Host "`n[4/4] Exporting current DestinationRules..." -ForegroundColor White
Write-Host "   Run this command to backup current config:" -ForegroundColor Gray
Write-Host "   kubectl get destinationrule -n $STAGING_NAMESPACE -o yaml > $BACKUP_DIR/destinationrules-backup.yaml" -ForegroundColor Cyan

Read-Host "`n   Press ENTER after creating backup"

Write-Host "`n✅ PHASE 0 COMPLETE - Pre-flight checks passed" -ForegroundColor Green
Write-Host "   Backup location: $BACKUP_DIR/destinationrules-backup.yaml" -ForegroundColor Gray

# ==============================================================================
# PHASE 1: DEPLOY CIRCUIT BREAKER (30 minutes)
# ==============================================================================

Write-Host "`n════════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "PHASE 1: DEPLOY CIRCUIT BREAKER (30min)" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════════════════════`n" -ForegroundColor Yellow

Write-Host "Deploying optimized circuit breaker configuration..." -ForegroundColor White
Write-Host "`n📋 Deployment commands (run manually if needed):" -ForegroundColor Cyan

if (Test-Path "ops/tests/chaos/scripts/day8-deploy-circuit-breaker.sh") {
    Write-Host "`n   Option 1: Using deployment script (Linux/WSL)" -ForegroundColor Gray
    Write-Host "   cd ops/tests/chaos/scripts" -ForegroundColor Cyan
    Write-Host "   bash day8-deploy-circuit-breaker.sh" -ForegroundColor Cyan
    
    Write-Host "`n   Option 2: Manual kubectl apply" -ForegroundColor Gray
    Write-Host "   kubectl apply -f ops/tests/chaos/configs/circuit-breaker-config.yaml -n $STAGING_NAMESPACE" -ForegroundColor Cyan
    
    $deployChoice = Read-Host "`n   Choose deployment method (1=script, 2=manual kubectl) [1]"
    
    if ($deployChoice -eq "2" -or $deployChoice -eq "") {
        Write-Host "`n   Execute this command:" -ForegroundColor Yellow
        Write-Host "   kubectl apply -f ops/tests/chaos/configs/circuit-breaker-config.yaml -n $STAGING_NAMESPACE" -ForegroundColor Cyan
        Read-Host "`n   Press ENTER after deployment"
    } else {
        Write-Host "`n   ⚠️  Run the bash script in WSL or Linux environment" -ForegroundColor Yellow
        Read-Host "   Press ENTER after running the script"
    }
} else {
    Write-Host "   ⚠️  Deployment script not found at expected location" -ForegroundColor Red
    Write-Host "   Manual deployment required:" -ForegroundColor Yellow
    Write-Host "   kubectl apply -f ops/tests/chaos/configs/circuit-breaker-config.yaml -n $STAGING_NAMESPACE" -ForegroundColor Cyan
    Read-Host "`n   Press ENTER after manual deployment"
}

Write-Host "`n⏳ Waiting 30s for Istio propagation..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

Write-Host "`n🔍 Verifying deployment..." -ForegroundColor White
Write-Host "   Run these verification commands:" -ForegroundColor Gray
Write-Host "   kubectl get destinationrule -n $STAGING_NAMESPACE" -ForegroundColor Cyan
Write-Host "   kubectl get destinationrule terrafusion-api-dr-optimized -n $STAGING_NAMESPACE -o yaml | grep -A5 outlierDetection" -ForegroundColor Cyan

Write-Host "`n📋 PASS GATE - Verify these values:" -ForegroundColor Yellow
Write-Host "   - baseEjectionTime: 15s (was 30s)" -ForegroundColor Gray
Write-Host "   - consecutiveGatewayErrors: 3 (was 5)" -ForegroundColor Gray
Write-Host "   - interval: 10s (was 30s)" -ForegroundColor Gray
Write-Host "   - No pod restarts in last 5 minutes" -ForegroundColor Gray

$phase1Pass = Read-Host "`n   Does deployment pass all checks? (yes/no) [yes]"

if ($phase1Pass -eq "no") {
    Write-Host "`n❌ PHASE 1 FAILED - Rolling back..." -ForegroundColor Red
    Write-Host "   kubectl apply -f $BACKUP_DIR/destinationrules-backup.yaml -n $STAGING_NAMESPACE" -ForegroundColor Cyan
    Read-Host "   Press ENTER after rollback"
    exit 1
}

Write-Host "`n✅ PHASE 1 COMPLETE - Circuit breaker deployed" -ForegroundColor Green

# ==============================================================================
# PHASE 2: F2 VALIDATION (45 minutes)
# ==============================================================================

Write-Host "`n════════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "PHASE 2: F2 VALIDATION (45min)" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════════════════════`n" -ForegroundColor Yellow

Write-Host "⚠️  CHAOS TEST EXECUTION REQUIRED" -ForegroundColor Yellow
Write-Host "`nThis phase requires running the F2 chaos test script." -ForegroundColor White

if (Test-Path "ops/tests/chaos/scripts/day8-validate-f2-recovery.sh") {
    Write-Host "`n📋 Validation commands:" -ForegroundColor Cyan
    Write-Host "   cd ops/tests/chaos/scripts" -ForegroundColor Gray
    Write-Host "   bash day8-validate-f2-recovery.sh --env staging --fault F2 --duration 10m --report ../../$OUTPUT_DIR" -ForegroundColor Cyan
    
    Write-Host "`n   Expected test duration: ~10 minutes" -ForegroundColor Gray
    Write-Host "   Output report: $OUTPUT_DIR/ri_report.md" -ForegroundColor Gray
    Write-Host "   Output metrics: $OUTPUT_DIR/metrics.json" -ForegroundColor Gray
} else {
    Write-Host "`n   ⚠️  Validation script not found" -ForegroundColor Red
    Write-Host "   Manual chaos test required" -ForegroundColor Yellow
}

Read-Host "`nPress ENTER to continue after F2 chaos test completes"

Write-Host "`n🔍 Checking for validation results..." -ForegroundColor White

$reportPath = "$OUTPUT_DIR/ri_report.md"
$metricsPath = "$OUTPUT_DIR/metrics.json"

if (Test-Path $reportPath) {
    Write-Host "   ✓ Found report: $reportPath" -ForegroundColor Green
    Write-Host "`n📊 Report preview:" -ForegroundColor Cyan
    Get-Content $reportPath -Head 20
    Write-Host "`n   ... (see full report in file)" -ForegroundColor Gray
} else {
    Write-Host "   ⚠️  Report not found: $reportPath" -ForegroundColor Yellow
    Write-Host "   Please ensure chaos test completed successfully" -ForegroundColor Gray
}

if (Test-Path $metricsPath) {
    Write-Host "`n   ✓ Found metrics: $metricsPath" -ForegroundColor Green
    Write-Host "`n📈 Key Metrics:" -ForegroundColor Cyan
    
    try {
        $metrics = Get-Content $metricsPath | ConvertFrom-Json
        Write-Host "   F2 Recovery Time: $($metrics.f2_recovery_time_seconds)s" -ForegroundColor White
        Write-Host "   F2 RI: $($metrics.f2_ri)" -ForegroundColor White
        Write-Host "   Error Rate: $($metrics.f2_error_rate_pct)%" -ForegroundColor White
    } catch {
        Write-Host "   ⚠️  Could not parse metrics JSON" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ⚠️  Metrics not found: $metricsPath" -ForegroundColor Yellow
}

Write-Host "`n📋 ACCEPTANCE CRITERIA - Verify ALL pass:" -ForegroundColor Yellow
Write-Host "   [ ] F2 recovery time ≤60s (target 45-55s)" -ForegroundColor Gray
Write-Host "   [ ] F2 RI ≥0.9500" -ForegroundColor Gray
Write-Host "   [ ] Error rate <1.0%" -ForegroundColor Gray
Write-Host "   [ ] Integrity errors = 0" -ForegroundColor Gray
Write-Host "   [ ] Post-recovery P95 ≤500ms within 60s" -ForegroundColor Gray

$phase2Pass = Read-Host "`n   Does validation pass ALL acceptance criteria? (yes/no) [yes]"

if ($phase2Pass -eq "no") {
    Write-Host "`n❌ PHASE 2 FAILED - Rolling back..." -ForegroundColor Red
    Write-Host "   kubectl apply -f $BACKUP_DIR/destinationrules-backup.yaml -n $STAGING_NAMESPACE" -ForegroundColor Cyan
    Write-Host "   Capturing failure artifacts..." -ForegroundColor Yellow
    Read-Host "   Press ENTER after rollback and artifact capture"
    exit 1
}

Write-Host "`n✅ PHASE 2 COMPLETE - F2 validation passed" -ForegroundColor Green

# ==============================================================================
# SUMMARY
# ==============================================================================

Write-Host "`n╔════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║          🎉 PHASE 0-2 STAGING EXECUTION COMPLETE                         ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green

Write-Host "`n📊 RESULTS SUMMARY:" -ForegroundColor Cyan
Write-Host "   ✅ Phase 0: Pre-flight + backup complete" -ForegroundColor Green
Write-Host "   ✅ Phase 1: Circuit breaker deployed" -ForegroundColor Green
Write-Host "   ✅ Phase 2: F2 validation passed" -ForegroundColor Green

Write-Host "`n📁 ARTIFACTS:" -ForegroundColor Cyan
Write-Host "   - Report: $reportPath" -ForegroundColor Gray
Write-Host "   - Metrics: $metricsPath" -ForegroundColor Gray
Write-Host "   - Backup: $BACKUP_DIR/destinationrules-backup.yaml" -ForegroundColor Gray

Write-Host "`n🚀 NEXT STEPS:" -ForegroundColor Yellow
Write-Host "   1. Deploy F2 alert pack to staging" -ForegroundColor White
Write-Host "      kubectl apply -f ops/tests/chaos/monitoring/f2-recovery.alerts.yaml" -ForegroundColor Cyan
Write-Host "`n   2. Start RS256 dual-sign window (48h)" -ForegroundColor White
Write-Host "      See: ops/runbooks/day9-rs256-migration.md Phase 1" -ForegroundColor Cyan
Write-Host "`n   3. Begin 24h staging soak" -ForegroundColor White
Write-Host "      Light background load, watch for anomalies" -ForegroundColor Cyan
Write-Host "`n   4. After 24h soak: Schedule production deployment" -ForegroundColor White
Write-Host "      Use: ops/tests/chaos/DAY_8_PRODUCTION_CHANGE_CARD.md" -ForegroundColor Cyan

Write-Host "`n✅ Staging validation complete - Ready for production planning`n" -ForegroundColor Green
