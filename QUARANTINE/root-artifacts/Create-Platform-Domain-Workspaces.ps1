# 🔧 CREATE OS PLATFORM DOMAIN WORKSPACES
# THE TERRAFUSION WAY: Fix the missing platform domain workspaces

Write-Host "🚨 CRITICAL FIX: Creating Missing OS Platform Domain Workspaces" -ForegroundColor Red
Write-Host "THE TERRAFUSION WAY: No assumptions, empirical validation!" -ForegroundColor Magenta

# OS Platform domains from actual directory structure
$platformDomains = @(
    "ai-systems",
    "auth", 
    "consciousness",
    "development",
    "engines",
    "infrastructure", 
    "monitoring",
    "performance",
    "security",
    "services",
    "specialized",
    "trust"
)

$created = 0

foreach ($domain in $platformDomains) {
    $workspaceFile = "workspaces/platform/$domain.code-workspace"
    
    Write-Host "Creating: $workspaceFile" -ForegroundColor Cyan
    
    $workspaceContent = @"
{
  "folders": [
    {
      "name": "🏗️ $($domain.ToUpper()) Domain",
      "path": "../../os-platform/$domain"
    },
    {
      "name": "📦 Platform SDK",
      "path": "../../SDK"
    },
    {
      "name": "🧪 Tests",
      "path": "../../tests"
    },
    {
      "name": "📚 Architecture Docs",
      "path": "../../docs/architecture"
    },
    {
      "name": "⚙️ Config (shared)",
      "path": "../../config"
    }
  ],
  "settings": {
    "workbench.colorCustomizations": {
      "titleBar.activeBackground": "#7c3aed",
      "titleBar.activeForeground": "#ffffff"
    },
    "files.exclude": {
      "**/node_modules": true,
      "**/dist": true,
      "../../marketplace": true,
      "../../frontend": true,
      "../../terrafusion-cos": true,
      "../../backend": true
    },
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
      "source.organizeImports": "explicit",
      "source.fixAll": "explicit"
    }
  },
  "extensions": {
    "recommendations": [
      "ms-python.python",
      "ms-vscode.vscode-typescript-next",
      "rust-lang.rust-analyzer",
      "ms-python.vscode-pylance"
    ]
  },
  "launch": {
    "version": "0.2.0",
    "configurations": [
      {
        "name": "Start $($domain.ToUpper()) Service",
        "type": "debugpy",
        "request": "launch",
        "program": "../../os-platform/$domain/main.py",
        "console": "integratedTerminal"
      }
    ]
  },
  "tasks": {
    "version": "2.0.0",
    "tasks": [
      {
        "label": "Build $($domain.ToUpper())",
        "type": "shell",
        "command": "make",
        "args": ["build-$domain"],
        "group": "build"
      },
      {
        "label": "Test $($domain.ToUpper())",
        "type": "shell", 
        "command": "make",
        "args": ["test-$domain"],
        "group": "test"
      }
    ]
  }
}
"@

    # Ensure directory exists
    $dir = Split-Path $workspaceFile -Parent
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    
    Set-Content -Path $workspaceFile -Value $workspaceContent -Encoding UTF8
    $created++
}

Write-Host ""
Write-Host "✅ FIXED: Created $created OS Platform domain workspaces!" -ForegroundColor Green
Write-Host "📁 Location: workspaces/platform/" -ForegroundColor White
Write-Host "🎯 Domains: $($platformDomains -join ', ')" -ForegroundColor Gray

Write-Host ""
Write-Host "🔄 Next: Run validation to confirm all workspaces are healthy" -ForegroundColor Cyan
Write-Host "   .\Validate-Workspaces.ps1" -ForegroundColor White

Write-Host ""
Write-Host "THE TERRAFUSION WAY: Found the gap, fixed it systematically! 🎯" -ForegroundColor Magenta