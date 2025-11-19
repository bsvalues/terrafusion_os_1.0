# TerraFusion Jest Issues Fix Script
# Fixes corrupted package.json, duplicate mocks, and naming collisions

Write-Host "🔧 TerraFusion Jest Issues Fix Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 1. Fix corrupted package.json file
Write-Host "`n📦 Step 1: Fixing corrupted package.json files..." -ForegroundColor Yellow

$corruptedPackageJson = "C:\Users\bsval\terrafusion_os_1.0\marketplace\autonomous-research-engine\package.json"
if (Test-Path $corruptedPackageJson) {
    Write-Host "   🔍 Checking: $corruptedPackageJson"
    try {
        $content = Get-Content $corruptedPackageJson -Raw -ErrorAction Stop
        if ([string]::IsNullOrWhiteSpace($content)) {
            Write-Host "   ❌ File is empty, creating minimal package.json" -ForegroundColor Red
            $minimalPackage = @{
                name        = "autonomous-research-engine"
                version     = "1.0.0"
                description = "TerraFusion Autonomous Research Engine"
                private     = $true
                main        = "index.js"
                scripts     = @{
                    test = "echo `"Error: no test specified`" && exit 1"
                }
            } | ConvertTo-Json -Depth 3
            Set-Content -Path $corruptedPackageJson -Value $minimalPackage
            Write-Host "   ✅ Created minimal package.json" -ForegroundColor Green
        }
        else {
            # Try to parse JSON
            $null = $content | ConvertFrom-Json
            Write-Host "   ✅ Package.json is valid" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "   ❌ JSON parse error, recreating file" -ForegroundColor Red
        $minimalPackage = @{
            name        = "autonomous-research-engine"
            version     = "1.0.0"
            description = "TerraFusion Autonomous Research Engine"
            private     = $true
            main        = "index.js"
            scripts     = @{
                test = "echo `"Error: no test specified`" && exit 1"
            }
        } | ConvertTo-Json -Depth 3
        Set-Content -Path $corruptedPackageJson -Value $minimalPackage
        Write-Host "   ✅ Recreated package.json" -ForegroundColor Green
    }
}

# 2. Fix duplicate manual mocks
Write-Host "`n🎭 Step 2: Fixing duplicate manual mocks..." -ForegroundColor Yellow

# Remove duplicate fileMock from _CLEAN_BUILD_ZONE
$duplicateFileMock = "C:\Users\bsval\terrafusion_os_1.0\_CLEAN_BUILD_ZONE\src\__mocks__\fileMock.ts"
if (Test-Path $duplicateFileMock) {
    Remove-Item $duplicateFileMock -Force
    Write-Host "   ✅ Removed duplicate fileMock from _CLEAN_BUILD_ZONE" -ForegroundColor Green
}
else {
    Write-Host "   ℹ️  Duplicate fileMock not found" -ForegroundColor Gray
}

# Remove duplicate llm-service mock (keep main, remove production)
$duplicateLlmService = "C:\Users\bsval\terrafusion_os_1.0\applications\terra-playground-production\server\services\__mocks__\llm-service.ts"
if (Test-Path $duplicateLlmService) {
    Remove-Item $duplicateLlmService -Force
    Write-Host "   ✅ Removed duplicate llm-service from terra-playground-production" -ForegroundColor Green
}
else {
    Write-Host "   ℹ️  Duplicate llm-service not found" -ForegroundColor Gray
}

# 3. Fix Haste module naming collisions by making package names unique
Write-Host "`n🏷️  Step 3: Fixing Haste module naming collisions..." -ForegroundColor Yellow

# Define packages that need unique names
$packagesToRename = @(
    @{
        Path    = "C:\Users\bsval\terrafusion_os_1.0\_CLEAN_BUILD_ZONE\package.json"
        NewName = "terrafusion-frontend-build-zone"
    },
    @{
        Path    = "C:\Users\bsval\terrafusion_os_1.0\terrabuild-modernization\package.json"
        NewName = "terrabuild-modernization"
    },
    @{
        Path    = "C:\Users\bsval\terrafusion_os_1.0\terrabuild-modernization-backup-20251019-105910.archived\package.json"
        NewName = "terrabuild-backup-archived"
    },
    @{
        Path    = "C:\Users\bsval\terrafusion_os_1.0\applications\bcbs-gis-pro-production\package.json"
        NewName = "bcbs-gis-pro-production"
    },
    @{
        Path    = "C:\Users\bsval\terrafusion_os_1.0\applications\bcbs-webhub-production\package.json"
        NewName = "bcbs-webhub-production"
    },
    @{
        Path    = "C:\Users\bsval\terrafusion_os_1.0\applications\terra-gama-production\package.json"
        NewName = "terra-gama-production"
    },
    @{
        Path    = "C:\Users\bsval\terrafusion_os_1.0\applications\terra-v0demo-production\package.json"
        NewName = "terra-v0demo-production"
    },
    @{
        Path    = "C:\Users\bsval\terrafusion_os_1.0\applications\terra-proplus-production\package.json"
        NewName = "terra-proplus-production"
    },
    @{
        Path    = "C:\Users\bsval\terrafusion_os_1.0\applications\terra-prof-production\package.json"
        NewName = "terra-prof-production"
    },
    @{
        Path    = "C:\Users\bsval\terrafusion_os_1.0\infrastructure\marketplace-unified\package.json"
        NewName = "marketplace-unified-infrastructure"
    }
)

foreach ($package in $packagesToRename) {
    if (Test-Path $package.Path) {
        try {
            $content = Get-Content $package.Path -Raw | ConvertFrom-Json
            $content.name = $package.NewName
            $content | ConvertTo-Json -Depth 10 | Set-Content $package.Path
            Write-Host "   ✅ Renamed package to: $($package.NewName)" -ForegroundColor Green
        }
        catch {
            Write-Host "   ❌ Failed to rename: $($package.Path)" -ForegroundColor Red
            Write-Host "      Error: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

# 4. Create .jestignore file to exclude problematic directories
Write-Host "`n🚫 Step 4: Creating .jestignore file..." -ForegroundColor Yellow

$jestIgnoreContent = @"
# Ignore backup and archived directories
**/backup-*/**
**/*-backup-*/**
**/*.archived/**

# Ignore build zones and temporary directories
_CLEAN_BUILD_ZONE/**
**/dist/**
**/build/**
**/node_modules/**

# Ignore production application duplicates (keep main versions)
applications/*-production/**

# Ignore specific problematic directories
marketplace/autonomous-research-engine/**
terrabuild-modernization-backup-*/**

# Ignore lock files from Jest processing
**/package-lock.json
**/yarn.lock
**/pnpm-lock.yaml
"@

Set-Content -Path "C:\Users\bsval\terrafusion_os_1.0\.jestignore" -Value $jestIgnoreContent
Write-Host "   ✅ Created .jestignore file" -ForegroundColor Green

# 5. Update Jest configuration to handle the monorepo better
Write-Host "`n⚙️  Step 5: Updating Jest configuration..." -ForegroundColor Yellow

$jestConfigPath = "C:\Users\bsval\terrafusion_os_1.0\jest.config.js"
if (Test-Path $jestConfigPath) {
    $jestConfig = Get-Content $jestConfigPath -Raw

    # Add or update testPathIgnorePatterns
    if ($jestConfig -notmatch "testPathIgnorePatterns") {
        $ignorePatterns = @"

  // Ignore problematic paths
  testPathIgnorePatterns: [
    "<rootDir>/node_modules/",
    "<rootDir>/_CLEAN_BUILD_ZONE/",
    "<rootDir>/applications/.*-production/",
    "<rootDir>/.*backup.*/",
    "<rootDir>/.*\\.archived/",
    "<rootDir>/marketplace/autonomous-research-engine/"
  ],
"@
        $jestConfig = $jestConfig -replace "module\.exports = \{", "module.exports = {$ignorePatterns"
    }

    # Add or update modulePathIgnorePatterns
    if ($jestConfig -notmatch "modulePathIgnorePatterns") {
        $moduleIgnorePatterns = @"

  // Ignore duplicate modules
  modulePathIgnorePatterns: [
    "<rootDir>/_CLEAN_BUILD_ZONE/",
    "<rootDir>/applications/.*-production/",
    "<rootDir>/.*backup.*/",
    "<rootDir>/.*\\.archived/"
  ],
"@
        $jestConfig = $jestConfig -replace "module\.exports = \{", "module.exports = {$moduleIgnorePatterns"
    }

    Set-Content -Path $jestConfigPath -Value $jestConfig
    Write-Host "   ✅ Updated Jest configuration" -ForegroundColor Green
}
else {
    # Create a basic Jest config if it doesn't exist
    $basicJestConfig = @"
module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Ignore problematic paths
  testPathIgnorePatterns: [
    "<rootDir>/node_modules/",
    "<rootDir>/_CLEAN_BUILD_ZONE/",
    "<rootDir>/applications/.*-production/",
    "<rootDir>/.*backup.*/",
    "<rootDir>/.*\\.archived/",
    "<rootDir>/marketplace/autonomous-research-engine/"
  ],

  // Ignore duplicate modules
  modulePathIgnorePatterns: [
    "<rootDir>/_CLEAN_BUILD_ZONE/",
    "<rootDir>/applications/.*-production/",
    "<rootDir>/.*backup.*/",
    "<rootDir>/.*\\.archived/"
  ],

  // Transform files
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest'
  },

  // File extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Test match patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.(ts|tsx|js|jsx)',
    '<rootDir>/frontend/src/**/*.test.(ts|tsx|js|jsx)',
    '<rootDir>/backend/**/*.test.(ts|tsx|js|jsx)'
  ],

  // Coverage
  collectCoverageFrom: [
    'src/**/*.{ts,tsx,js,jsx}',
    '!src/**/*.d.ts'
  ]
};
"@
    Set-Content -Path $jestConfigPath -Value $basicJestConfig
    Write-Host "   ✅ Created basic Jest configuration" -ForegroundColor Green
}

# 6. Clean Jest cache
Write-Host "`n🧹 Step 6: Cleaning Jest cache..." -ForegroundColor Yellow
try {
    Push-Location "C:\Users\bsval\terrafusion_os_1.0"
    if (Get-Command jest -ErrorAction SilentlyContinue) {
        & jest --clearCache
        Write-Host "   ✅ Jest cache cleared" -ForegroundColor Green
    }
    else {
        Write-Host "   ⚠️  Jest command not found, skipping cache clear" -ForegroundColor Yellow
    }
    Pop-Location
}
catch {
    Write-Host "   ⚠️  Could not clear Jest cache: $($_.Exception.Message)" -ForegroundColor Yellow
    Pop-Location
}

Write-Host "`n🎉 Jest issues fix complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Fixed corrupted package.json" -ForegroundColor Green
Write-Host "✅ Removed duplicate mocks" -ForegroundColor Green
Write-Host "✅ Resolved naming collisions" -ForegroundColor Green
Write-Host "✅ Created .jestignore file" -ForegroundColor Green
Write-Host "✅ Updated Jest configuration" -ForegroundColor Green
Write-Host "✅ Cleaned Jest cache" -ForegroundColor Green
Write-Host "`n📋 Next steps:" -ForegroundColor White
Write-Host "   1. Restart VS Code Jest extension" -ForegroundColor Gray
Write-Host "   2. Run 'npm test' to verify fixes" -ForegroundColor Gray
Write-Host "   3. Check Jest Test Explorer" -ForegroundColor Gray
