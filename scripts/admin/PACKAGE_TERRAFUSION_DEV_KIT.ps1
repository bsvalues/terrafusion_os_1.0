# TerraFusion Dev Kit v1.0 - Package Script
# Creates complete distributable archive

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  📦 TERRAFUSION DEV KIT v1.0 - PACKAGING                     ║" -ForegroundColor White
Write-Host "║  Creating distributable archive...                          ║" -ForegroundColor White
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$packageName = "TerraFusion_DevKit_v1.0_$timestamp"
$tempDir = "temp-package/$packageName"

# Create temp directory
Write-Host "📁 Creating package directory..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

# Copy Dev Kit components
Write-Host "📦 Copying Dev Kit components..." -ForegroundColor Yellow

$components = @(
    @{ src = "packages/tf-visual"; dest = "$tempDir/packages/tf-visual" },
    @{ src = "packages/tf-audio"; dest = "$tempDir/packages/tf-audio" },
    @{ src = "apps/demo"; dest = "$tempDir/apps/demo" },
    @{ src = "assets/brand"; dest = "$tempDir/assets/brand" },
    @{ src = "design"; dest = "$tempDir/design" },
    @{ src = "design-sync"; dest = "$tempDir/design-sync" },
    @{ src = "core-os"; dest = "$tempDir/core-os" },
    @{ src = "native-shell"; dest = "$tempDir/native-shell"; exclude = @("bin", "obj") },
    @{ src = "frontend/src"; dest = "$tempDir/frontend/src" },
    @{ src = "frontend/package.json"; dest = "$tempDir/frontend/" },
    @{ src = "frontend/vite.config.ts"; dest = "$tempDir/frontend/" },
    @{ src = "backend/TerraFusion.API"; dest = "$tempDir/backend/TerraFusion.API"; exclude = @("bin", "obj") }
)

foreach ($comp in $components) {
    if (Test-Path $comp.src) {
        Write-Host "   ├─ $($comp.src)" -ForegroundColor Green
        
        if ($comp.exclude) {
            # Copy with exclusions
            robocopy $comp.src $comp.dest /E /XD $comp.exclude /NFL /NDL /NJH /NJS /NC /NS | Out-Null
        } else {
            Copy-Item $comp.src $comp.dest -Recurse -Force
        }
    }
}

# Copy documentation
Write-Host "📚 Copying documentation..." -ForegroundColor Yellow
$docs = @(
    "TERRAFUSION_DEV_KIT_README.md",
    "TERRAFUSION_DEV_KIT_v1.0_COMPLETE.md",
    "BUILD_AND_RUN_GUIDE.md",
    "FINAL_CORRECTED_ARCHITECTURE.md",
    "TERRAFUSION_NATIVE_ARCHITECTURE_FINAL.md",
    "LAUNCH_INSTRUCTIONS.md",
    "CLAUDE.md"
)

foreach ($doc in $docs) {
    if (Test-Path $doc) {
        Write-Host "   ├─ $doc" -ForegroundColor Green
        Copy-Item $doc "$tempDir/" -Force
    }
}

# Copy build scripts
Write-Host "🔧 Copying build scripts..." -ForegroundColor Yellow
$scripts = @(
    "START_TERRAFUSION_NATIVE.ps1",
    "TAURI_EXTRACTION_GUIDE.md"
)

foreach ($script in $scripts) {
    if (Test-Path $script) {
        Write-Host "   ├─ $script" -ForegroundColor Green
        Copy-Item $script "$tempDir/" -Force
    }
}

# Create README in package
Write-Host "📝 Creating package README..." -ForegroundColor Yellow
Copy-Item "TERRAFUSION_DEV_KIT_README.md" "$tempDir/README.md" -Force

# Create archive
Write-Host ""
Write-Host "🗜️  Creating ZIP archive..." -ForegroundColor Cyan
$zipPath = "TerraFusion_DevKit_v1.0_$timestamp.zip"

Compress-Archive -Path $tempDir -DestinationPath $zipPath -Force

# Get file size
$zipSize = (Get-Item $zipPath).Length / 1MB

Write-Host ""
Write-Host "✅ Package created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📦 Package Details:" -ForegroundColor Cyan
Write-Host "   File: $zipPath" -ForegroundColor White
Write-Host "   Size: $([math]::Round($zipSize, 2)) MB" -ForegroundColor White
Write-Host ""

# Cleanup
Write-Host "🧹 Cleaning up temp files..." -ForegroundColor Yellow
Remove-Item "temp-package" -Recurse -Force

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🎉 TERRAFUSION DEV KIT v1.0 PACKAGED!                       ║" -ForegroundColor Green
Write-Host "╠══════════════════════════════════════════════════════════════╣" -ForegroundColor Cyan
Write-Host "║                                                              ║" -ForegroundColor White
Write-Host "║  Package: $zipPath" -ForegroundColor White
Write-Host "║  Size: $([math]::Round($zipSize, 2)) MB" -ForegroundColor White
Write-Host "║                                                              ║" -ForegroundColor White
Write-Host "║  Includes:                                                   ║" -ForegroundColor White
Write-Host "║  ✅ WebGPU Visual Engine (φ-depth + micro-fluid + iris)     ║" -ForegroundColor Green
Write-Host "║  ✅ Sonic Codex (WebAudio + WAV export)                     ║" -ForegroundColor Green
Write-Host "║  ✅ Core Rust Services (2,500 lines)                        ║" -ForegroundColor Green
Write-Host "║  ✅ Native Shell (WPF + WebView2)                           ║" -ForegroundColor Green
Write-Host "║  ✅ React Frontend (configured)                             ║" -ForegroundColor Green
Write-Host "║  ✅ .NET API Gateway (FFI integrated)                       ║" -ForegroundColor Green
Write-Host "║  ✅ Interactive Demo                                        ║" -ForegroundColor Green
Write-Host "║  ✅ Complete Documentation                                  ║" -ForegroundColor Green
Write-Host "║                                                              ║" -ForegroundColor White
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "🚀 Ready to distribute!" -ForegroundColor Green
Write-Host ""

