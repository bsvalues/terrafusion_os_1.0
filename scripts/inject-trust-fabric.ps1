# Mass Trust Fabric Injection Script - PowerShell Version
# Refactors ALL TerraFusion microservice frontends to use trust fabric

param(
    [string]$RolloutPercentage = "0",
    [switch]$DryRun = $false,
    [switch]$Force = $false
)

Write-Host "🚀 TerraFusion OS - Mass Trust Fabric Integration" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

# Configuration
$TrustFabricAdapterPath = "../shared-libraries/trust-fabric-adapter"
$BackupDir = "./trust-fabric-backup-$(Get-Date -Format 'yyyyMMdd_HHmmss')"

# Create backup directory
New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null

# Frontend directories to search
$FrontendDirs = @(
    "frontend/src",
    "frontend-v2/src", 
    "terrafusion-frontend/src",
    "modules/*/frontend/src",
    "modules/*/PWA",
    "modules/*/web",
    "services/*/frontend",
    "services/*/web",
    "apps/*/src",
    "microservices/*/frontend"
)

# Entry files to inject into
$EntryFiles = @(
    "index.js", "main.js", "app.js",
    "index.ts", "main.ts", "app.ts", 
    "index.jsx", "main.jsx", "app.jsx",
    "index.tsx", "main.tsx", "app.tsx"
)

# HTML files to inject script tag
$HtmlFiles = @("index.html", "main.html", "app.html")

function Inject-IntoJsFile {
    param([string]$FilePath)
    
    $BackupFile = Join-Path $BackupDir "$(Split-Path $FilePath -Leaf)_$(Get-Date -Format 'HHmmss')"
    
    Write-Host "  📝 Injecting into: $FilePath" -ForegroundColor Yellow
    
    if ($DryRun) {
        Write-Host "    🔍 DRY RUN - Would inject into $FilePath" -ForegroundColor Cyan
        return
    }
    
    # Create backup
    Copy-Item $FilePath $BackupFile
    
    # Check if already injected
    $Content = Get-Content $FilePath -Raw
    if ($Content -match "trust-fabric-adapter") {
        Write-Host "    ⚠️  Already injected, skipping" -ForegroundColor Yellow
        return
    }
    
    # Create injection code
    $InjectionCode = @"
// TerraFusion Trust Fabric Integration - AUTO-INJECTED
try {
  // Import and initialize trust fabric adapter
  if (typeof require !== 'undefined') {
    // Node.js environment
    const TrustFabricAdapter = require('@terrafusion/trust-fabric-adapter');
    new TrustFabricAdapter().initialize();
  } else if (typeof window !== 'undefined') {
    // Browser environment - load dynamically
    const script = document.createElement('script');
    script.src = '/shared/trust-fabric-adapter.js';
    script.onload = () => {
      if (window.TrustFabricAdapter) {
        new window.TrustFabricAdapter().initialize();
      }
    };
    document.head.appendChild(script);
  }
} catch (error) {
  console.warn('Trust Fabric Adapter failed to load:', error);
}
// END TerraFusion Trust Fabric Integration

"@
    
    # Inject at the beginning
    $NewContent = $InjectionCode + $Content
    Set-Content -Path $FilePath -Value $NewContent
    
    Write-Host "    ✅ Injected successfully" -ForegroundColor Green
}

function Inject-IntoHtmlFile {
    param([string]$FilePath)
    
    $BackupFile = Join-Path $BackupDir "$(Split-Path $FilePath -Leaf)_$(Get-Date -Format 'HHmmss')"
    
    Write-Host "  📝 Injecting into HTML: $FilePath" -ForegroundColor Yellow
    
    if ($DryRun) {
        Write-Host "    🔍 DRY RUN - Would inject into $FilePath" -ForegroundColor Cyan
        return
    }
    
    # Create backup
    Copy-Item $FilePath $BackupFile
    
    # Check if already injected
    $Content = Get-Content $FilePath -Raw
    if ($Content -match "trust-fabric-adapter") {
        Write-Host "    ⚠️  Already injected, skipping" -ForegroundColor Yellow
        return
    }
    
    # Inject script tag before closing head tag
    $ScriptInjection = @"
  <script src="/shared/trust-fabric-adapter.js"></script>
  <script>
    try {
      new TrustFabricAdapter().initialize();
    } catch(e) {
      console.warn("Trust Fabric initialization failed:", e);
    }
  </script>
</head>
"@
    
    $NewContent = $Content -replace "</head>", $ScriptInjection
    Set-Content -Path $FilePath -Value $NewContent
    
    Write-Host "    ✅ HTML injection successful" -ForegroundColor Green
}

function Setup-NpmLink {
    Write-Host "🔗 Setting up npm link for trust fabric adapter" -ForegroundColor Cyan
    
    if ($DryRun) {
        Write-Host "🔍 DRY RUN - Would setup npm link" -ForegroundColor Cyan
        return
    }
    
    Push-Location $TrustFabricAdapterPath
    try {
        npm link
        Write-Host "✅ Trust fabric adapter linked globally" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Failed to link adapter: $_" -ForegroundColor Red
    }
    finally {
        Pop-Location
    }
}

function Inject-IntoPackageJson {
    param([string]$DirPath)
    
    $PackageJsonPath = Join-Path $DirPath "package.json"
    
    if (Test-Path $PackageJsonPath) {
        Write-Host "  📦 Adding dependency to: $PackageJsonPath" -ForegroundColor Yellow
        
        if ($DryRun) {
            Write-Host "    🔍 DRY RUN - Would modify package.json" -ForegroundColor Cyan
            return
        }
        
        # Create backup
        $BackupFile = Join-Path $BackupDir "package.json_$(Split-Path $DirPath -Leaf)_$(Get-Date -Format 'HHmmss')"
        Copy-Item $PackageJsonPath $BackupFile
        
        try {
            $PackageJson = Get-Content $PackageJsonPath | ConvertFrom-Json
            
            if (-not $PackageJson.dependencies) {
                $PackageJson | Add-Member -NotePropertyName "dependencies" -NotePropertyValue @{}
            }
            
            if (-not $PackageJson.dependencies."@terrafusion/trust-fabric-adapter") {
                $PackageJson.dependencies."@terrafusion/trust-fabric-adapter" = "file:../../shared-libraries/trust-fabric-adapter"
                
                $PackageJson | ConvertTo-Json -Depth 10 | Set-Content $PackageJsonPath
                Write-Host "    ✅ Package.json updated" -ForegroundColor Green
            }
            
            # Link the package
            Push-Location $DirPath
            try {
                npm link "@terrafusion/trust-fabric-adapter" 2>$null
            }
            catch {
                Write-Host "    ⚠️  npm link failed: $_" -ForegroundColor Yellow
            }
            finally {
                Pop-Location
            }
        }
        catch {
            Write-Host "    ⚠️  Could not modify package.json: $_" -ForegroundColor Yellow
        }
    }
}

# Main execution
Write-Host "🔍 Searching for frontend directories..." -ForegroundColor Cyan

# Set environment variable
$env:TRUST_FABRIC_ROLLOUT = $RolloutPercentage

# Setup npm link first
Setup-NpmLink

$FoundCount = 0

# Search for all frontend directories and files
foreach ($Pattern in $FrontendDirs) {
    $Dirs = Get-ChildItem -Path $Pattern -Directory -ErrorAction SilentlyContinue
    
    foreach ($Dir in $Dirs) {
        Write-Host "📁 Found frontend directory: $($Dir.FullName)" -ForegroundColor Cyan
        $FoundCount++
        
        # Add npm dependency
        Inject-IntoPackageJson (Split-Path $Dir.FullName -Parent)
        
        # Look for entry files
        foreach ($EntryFile in $EntryFiles) {
            $FilePath = Join-Path $Dir.FullName $EntryFile
            if (Test-Path $FilePath) {
                Inject-IntoJsFile $FilePath
            }
        }
        
        # Look for HTML files
        foreach ($HtmlFile in $HtmlFiles) {
            $FilePath = Join-Path $Dir.FullName $HtmlFile
            if (Test-Path $FilePath) {
                Inject-IntoHtmlFile $FilePath
            }
        }
    }
}

# Also check root frontend directories
foreach ($EntryFile in $EntryFiles) {
    $FilePath = "frontend/$EntryFile"
    if (Test-Path $FilePath) {
        Inject-IntoJsFile $FilePath
    }
}

foreach ($HtmlFile in $HtmlFiles) {
    $FilePath = "frontend/$HtmlFile"
    if (Test-Path $FilePath) {
        Inject-IntoHtmlFile $FilePath
    }
}

Write-Host ""
Write-Host "🎯 INJECTION COMPLETE" -ForegroundColor Green
Write-Host "=====================" -ForegroundColor Green
Write-Host "📊 Processed directories: $FoundCount" -ForegroundColor White
Write-Host "💾 Backups stored in: $BackupDir" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Next steps:" -ForegroundColor Yellow
Write-Host "  1. Set rollout percentage: `$env:TRUST_FABRIC_ROLLOUT='10'" -ForegroundColor White
Write-Host "  2. Test one service: cd services/[service-name] && npm start" -ForegroundColor White
Write-Host "  3. Monitor logs for trust fabric activity" -ForegroundColor White
Write-Host "  4. Increase rollout: `$env:TRUST_FABRIC_ROLLOUT='50'" -ForegroundColor White
Write-Host "  5. Full rollout: `$env:TRUST_FABRIC_ROLLOUT='100'" -ForegroundColor White
Write-Host ""
Write-Host "🛑 Emergency rollback:" -ForegroundColor Red
Write-Host "  `$env:TRUST_FABRIC_FORCE='false'" -ForegroundColor White
Write-Host ""
Write-Host "✅ All frontends now configured for trust fabric integration!" -ForegroundColor Green