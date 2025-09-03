# TerraFusion OS - Test Suite Demo Runner
# Government. Transcended.

Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Blue
Write-Host "║                TerraFusion OS Testing Suite                 ║" -ForegroundColor Blue  
Write-Host "║                   Government. Transcended.                  ║" -ForegroundColor Blue
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Blue

Write-Host ""
Write-Host "[SCAN] Analyzing testing infrastructure..." -ForegroundColor Cyan

# Count test files
$testFiles = Get-ChildItem -Path "testing" -Recurse -Filter "*.ts" -ErrorAction SilentlyContinue
$testCount = $testFiles.Count

Write-Host "[INFO] Found $testCount test files" -ForegroundColor Blue

# Analyze test categories
$categories = @()
if (Test-Path "testing\core") { $categories += "Core Tests" }
if (Test-Path "testing\government") { $categories += "Government Compliance" }
if (Test-Path "testing\ai") { $categories += "AI & Claude-Flow" }
if (Test-Path "testing\advanced") { $categories += "Advanced Testing" }
if (Test-Path "testing\security") { $categories += "Security Testing" }

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                    TEST SUITE STATUS                        ║" -ForegroundColor Green
Write-Host "╠══════════════════════════════════════════════════════════════╣" -ForegroundColor Green
Write-Host "║                                                              ║" -ForegroundColor Green
Write-Host "║  📁 Test Files: $($testCount.ToString().PadLeft(3)) files                                ║" -ForegroundColor Green
Write-Host "║  📊 Categories: $($categories.Count.ToString().PadLeft(2)) categories                            ║" -ForegroundColor Green

foreach ($category in $categories) {
    Write-Host "║     - $($category.PadRight(20))                              ║" -ForegroundColor Green
}

Write-Host "║                                                              ║" -ForegroundColor Green

# Test specific files
$chaosTest = Test-Path "testing\advanced\chaos-engineering\chaos-tests.ts"
$propertyTest = Test-Path "testing\advanced\property-based\property-tests.ts"
$securityTest = Test-Path "testing\advanced\security\penetration-tests.ts"
$claudeFlowTest = Test-Path "testing\ai\claude-flow\integration.test.ts"
$harrisTest = Test-Path "testing\government\harris-pacs\integration.test.ts"

Write-Host "║  🔥 Chaos Engineering: $(if($chaosTest){'✅ READY'}else{'❌ MISSING'})                    ║" -ForegroundColor Green
Write-Host "║  🧮 Property-Based: $(if($propertyTest){'✅ READY'}else{'❌ MISSING'})                      ║" -ForegroundColor Green
Write-Host "║  🔒 Security Testing: $(if($securityTest){'✅ READY'}else{'❌ MISSING'})                    ║" -ForegroundColor Green
Write-Host "║  🧠 Claude-Flow: $(if($claudeFlowTest){'✅ READY'}else{'❌ MISSING'})                        ║" -ForegroundColor Green
Write-Host "║  🔗 Harris PACS: $(if($harrisTest){'✅ READY'}else{'❌ MISSING'})                         ║" -ForegroundColor Green

Write-Host "║                                                              ║" -ForegroundColor Green

# Configuration files
$vitestConfig = Test-Path "testing\config\vitest.config.ts"
$playwrightConfig = Test-Path "testing\config\playwright.config.ts"
$jestConfig = Test-Path "testing\config\jest.config.js"

Write-Host "║  ⚙️  Vitest Config: $(if($vitestConfig){'✅ READY'}else{'❌ MISSING'})                      ║" -ForegroundColor Green
Write-Host "║  🎭 Playwright Config: $(if($playwrightConfig){'✅ READY'}else{'❌ MISSING'})                 ║" -ForegroundColor Green
Write-Host "║  🧪 Jest Config: $(if($jestConfig){'✅ READY'}else{'❌ MISSING'})                         ║" -ForegroundColor Green

Write-Host "║                                                              ║" -ForegroundColor Green

# Test runners
$masterRunner = Test-Path "testing\scripts\run-all-tests.sh"
$categoryRunner = Test-Path "testing\scripts\run-category-tests.sh"
$advancedRunner = Test-Path "testing\scripts\run-advanced-tests.sh"

Write-Host "║  🚀 Master Runner: $(if($masterRunner){'✅ READY'}else{'❌ MISSING'})                       ║" -ForegroundColor Green
Write-Host "║  📂 Category Runner: $(if($categoryRunner){'✅ READY'}else{'❌ MISSING'})                    ║" -ForegroundColor Green
Write-Host "║  🔥 Advanced Runner: $(if($advancedRunner){'✅ READY'}else{'❌ MISSING'})                    ║" -ForegroundColor Green

Write-Host "║                                                              ║" -ForegroundColor Green

$status = if ($testCount -gt 0 -and $chaosTest -and $propertyTest -and $securityTest) { "OPERATIONAL" } else { "READY FOR SETUP" }
Write-Host "║  🏆 STATUS: $($status.PadRight(15))                          ║" -ForegroundColor Green
Write-Host "║  🏛️  Government. Transcended.                               ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Green

Write-Host ""
Write-Host "Quick Start Commands:" -ForegroundColor Yellow
Write-Host "  npm run test                    # Run basic tests" -ForegroundColor White
Write-Host "  npm run test:government         # Government compliance tests" -ForegroundColor White
Write-Host "  npm run test:ai-swarm           # AI swarm tests" -ForegroundColor White
Write-Host "  npm run e2e                     # End-to-end tests" -ForegroundColor White

Write-Host ""
Write-Host "Advanced Testing (when dependencies installed):" -ForegroundColor Yellow
Write-Host "  ./testing/scripts/run-all-tests.sh" -ForegroundColor White
Write-Host "  ./testing/scripts/run-advanced-tests.sh chaos-engineering" -ForegroundColor White
Write-Host "  ./testing/scripts/run-category-tests.sh government" -ForegroundColor White

Write-Host ""
Write-Host "🎯 TerraFusion OS Testing Suite: $status" -ForegroundColor Green
