param(
    [switch]$Execute,
    [switch]$VerboseLog
)

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path | Split-Path -Parent
Set-Location $Root

function Write-Info($msg){ if($VerboseLog){ Write-Host "[INFO] $msg" -ForegroundColor Cyan } }
function Plan($from,$to){ "MOVE: `"$from`" -> `"$to`"" }

# Explicit whitelist that should remain in repo root
$Whitelist = @(
  '.editorconfig', '.gitattributes', '.gitignore',
  '.prettierrc', '.eslintrc.json', '.lintstagedrc.json',
  'README.md', 'LICENSE', 'CONTRIBUTING.md', 'SECURITY.md', 'CHANGELOG.md',
  'package.json',
  # env templates
  '.env.example', '.env.template', '.env.asotin', '.env.benton', '.env.benton.example', '.env.benton.template', '.env.cowlitz', '.env.franklin', '.env.yakima'
)

# (Intentionally no directory move logic; directories are skipped below to avoid unintended changes.)

# Destination rules by file pattern
$Rules = @(
  @{ Pattern = 'AI_AGENT_QUICK_START.md'; Dest = 'docs' },
  @{ Pattern = 'AI_MCP_COMPREHENSIVE_EXTRACTION_COMPLETE.md'; Dest = 'docs/ai' },
  @{ Pattern = 'AI_NAVIGATION.md'; Dest = 'docs/ai' },
  @{ Pattern = 'AUDIT_*'; Dest = 'docs/compliance' },
  @{ Pattern = 'BENTON_COUNTY_*'; Dest = 'docs/deployments/benton' },
  @{ Pattern = 'CAMA_*'; Dest = 'docs/migration' },
  @{ Pattern = 'CHAMPIONSHIP_*'; Dest = 'docs/branding' },
  @{ Pattern = 'CLAUDE*'; Dest = 'docs/integrations/claude-flow' },
  @{ Pattern = 'COMPREHENSIVE_*'; Dest = 'docs' },
  @{ Pattern = 'CONSCIOUSNESS_*'; Dest = 'docs/consciousness' },
  @{ Pattern = 'CONSOLIDATION_*'; Dest = 'docs/architecture' },
  @{ Pattern = 'DEEP_DIVE_ANALYSIS.md'; Dest = 'docs/architecture' },
  @{ Pattern = 'DEPLOYMENT_COMPLETE_SUMMARY.md'; Dest = 'docs/deployments' },
  @{ Pattern = 'DEVELOPMENT_SETUP.md'; Dest = 'docs' },
  @{ Pattern = 'ENHANCED_UNIFIED_TERRAFUSION_OS.html'; Dest = 'docs/architecture' }
)

# Ensure destination directories (use approved verb)
function New-DirIfMissing($path){ if(-not (Test-Path $path)){ New-Item -ItemType Directory -Path $path | Out-Null } }

$planned = @()

# List root files (exclude directories and whitelist)
$rootItems = Get-ChildItem -LiteralPath $Root -Force

foreach($item in $rootItems){
  if($item.PSIsContainer){
    # Keep known directories, skip unknown directories (we do not move directories here)
    continue
  }
  $name = $item.Name
  if($Whitelist -contains $name){ continue }

  # Skip hidden/system files
  if($name -match '^(Thumbs\.db|\.DS_Store)$'){ continue }

  $dest = $null

  # Apply named rules
  foreach($rule in $Rules){
    if($name -like $rule.Pattern){ $dest = Join-Path $Root $rule.Dest; break }
  }

  # Fallbacks by extension
  if(-not $dest){
    switch -regex ($item.Extension.ToLower()){
      '^\.md$' { $dest = Join-Path $Root 'docs/misc'; break }
      '^\.html?$' { $dest = Join-Path $Root 'docs/misc'; break }
      '^\.ps1$' { $dest = Join-Path $Root 'scripts'; break }
      '^\.sh$' { $dest = Join-Path $Root 'scripts'; break }
      '^\.json$' { $dest = Join-Path $Root 'config'; break }
      default { $dest = $null }
    }
  }

  if($dest){
    New-DirIfMissing $dest
    $target = Join-Path $dest $name
    $planned += (Plan $item.FullName $target)
    if($Execute){ Move-Item -LiteralPath $item.FullName -Destination $target -Force }
  }
}

if($planned.Count -eq 0){
  Write-Host 'No moves planned. Root appears clean or only whitelisted files present.' -ForegroundColor Green
} else {
  Write-Host "Planned moves ($($planned.Count)):" -ForegroundColor Yellow
  $planned | ForEach-Object { Write-Host $_ }
  if(-not $Execute){
    Write-Host "Dry run only. Re-run with -Execute to apply changes." -ForegroundColor Cyan
  } else {
    Write-Host "Executed moves successfully." -ForegroundColor Green
  }
}
