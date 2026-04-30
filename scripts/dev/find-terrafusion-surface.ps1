#requires -Version 5.1
<#
.SYNOPSIS
  Slice REPO-MAP-1 — TerraFusion findability finder (PowerShell variant).

.DESCRIPTION
  Cross-cuts the repo for known TerraFusion surface families so a developer
  or agent can answer "where is X?" in one command instead of grepping the
  whole tree from scratch every time. PowerShell counterpart to
  scripts/dev/find-terrafusion-surface.sh.

  Topics:
    sync       TerraFusion Sync surfaces (the bridge from Harris PACS to
               TerraFusion DB)
    workbook   Mapping Workbook services / data model
    comps      Comp eligibility / canonical sale qualification / stale
               diagnostics
    schema     PACS schema catalog (C48 family)
    terraflow  TerraFlow workflow engine references (mostly conceptual
               today; engine code not yet built)
    atlas      Sync Atlas profiling + TerraAtlas GIS references
    forge      Forge / CostForge valuation + comp consumer surfaces
    boundary   All binding boundary docs (SCOPE-1/2/3 + C48-FIX2 anchors)

.PARAMETER Topic
  One of: sync | workbook | comps | schema | terraflow | atlas | forge | boundary

.EXAMPLE
  .\scripts\dev\find-terrafusion-surface.ps1 sync

.EXAMPLE
  .\scripts\dev\find-terrafusion-surface.ps1 schema

.NOTES
  Read-only. Does not modify any file. Prefers ripgrep (rg) when available;
  falls back to Select-String when ripgrep is not on PATH.

  Boundary cross-references:
    docs/REPO_MAP.md
    docs/sync/README.md
    docs/architecture/BOUNDARY_INDEX.md
#>

param(
    [Parameter(Position = 0)]
    [string] $Topic
)

$ErrorActionPreference = 'Stop'

function Show-Usage {
    Write-Host @"
Usage: find-terrafusion-surface.ps1 <topic>

Topics:
  sync       TerraFusion Sync surfaces (the bridge)
  workbook   Mapping Workbook services / data model
  comps      Comp eligibility / canonical sale qualification / stale
  schema     PACS schema catalog (C48 family)
  terraflow  TerraFlow workflow references
  atlas      Sync Atlas + TerraAtlas GIS references
  forge      Forge / CostForge valuation + comp consumer surfaces
  boundary   Binding boundary docs

Examples:
  .\scripts\dev\find-terrafusion-surface.ps1 sync
  .\scripts\dev\find-terrafusion-surface.ps1 workbook
  .\scripts\dev\find-terrafusion-surface.ps1 schema
"@ -ForegroundColor Yellow
}

if ([string]::IsNullOrWhiteSpace($Topic)) {
    Show-Usage
    exit 1
}

# Topic → (regex pattern, root paths) map. Patterns mirror the bash variant
# so both scripts return materially the same hits.
$patterns = @{
    'sync'      = @{
        Pattern = 'SyncAtlas|SyncMapping|CanonicalSaleQualification|SalesCompProof|SyncController|TerraFusion\.Sync\.Workbench'
        Roots   = @('backend', 'docs')
    }
    'workbook'  = @{
        Pattern = 'SyncMappingWorkbook|Mapping Workbook|SyncMappingColumn|SyncMappingCodeValue|SyncCountyActiveWorkbook'
        Roots   = @('backend', 'docs')
    }
    'comps'     = @{
        Pattern = 'CompEligible|SalesComp|CanonicalSaleQualification|comps/eligible|comps/stale|sales-comp'
        Roots   = @('backend', 'docs')
    }
    'schema'    = @{
        Pattern = 'PacsSchema|IPacsSchemaCatalog|IPacsSchemaSource|IPacsSchemaIntrospector|LivePacsSchemaSource|SqlInformationSchemaIntrospector|Harris PACS|INFORMATION_SCHEMA'
        Roots   = @('backend', 'docs')
    }
    'terraflow' = @{
        Pattern = 'TerraFlow|terraflow'
        Roots   = @('backend', 'frontend', 'docs')
    }
    'atlas'     = @{
        Pattern = 'SyncAtlas|TerraAtlas|Atlas profile|atlas-profile|ArcGIS'
        Roots   = @('backend', 'docs')
    }
    'forge'     = @{
        Pattern = 'TerraFusion\.CostForge|CostForge|ForgeController|forge-comp|StatisticsStudio|county-studio'
        Roots   = @('backend', 'frontend', 'docs')
    }
    'boundary'  = @{
        Pattern = 'SCOPE-1|SCOPE-2|SCOPE-3|sync-boundary-policy|terrafusion-domain-boundaries|sync-surface-inventory|BOUNDARY_INDEX|pacs-schema-catalog-as-code-policy'
        Roots   = @('docs')
    }
}

if (-not $patterns.ContainsKey($Topic)) {
    Write-Host "Unknown topic: $Topic" -ForegroundColor Red
    Write-Host "Run with no args to see the topic list." -ForegroundColor Yellow
    exit 1
}

$entry = $patterns[$Topic]
$pattern = $entry.Pattern
$roots = $entry.Roots | Where-Object { Test-Path $_ }

if (-not $roots) {
    Write-Host "[find-terrafusion-surface] None of the expected roots exist for topic '$Topic'." -ForegroundColor Yellow
    exit 0
}

# Prefer ripgrep when available — far faster, honors .gitignore. Skip
# build outputs and binary blobs in both code paths to keep signal-to-
# noise high.
$rg = Get-Command rg -ErrorAction SilentlyContinue
if ($rg) {
    $rgGlobs = @(
        '--glob', '!**/bin/**',
        '--glob', '!**/obj/**',
        '--glob', '!**/.build-verify/**',
        '--glob', '!**/build/**',
        '--glob', '!**/node_modules/**',
        '--glob', '!**/*.dll',
        '--glob', '!**/*.exe',
        '--glob', '!**/*.pdb'
    )
    & rg.exe -n $pattern @rgGlobs @roots
    exit $LASTEXITCODE
}

# Fallback: Select-String. Slower; doesn't honor .gitignore. Skip the
# usual build/binary directories explicitly.
$skipDirs = @('bin', 'obj', '.build-verify', 'build', 'node_modules')
$skipExt  = @('.dll', '.exe', '.pdb')
foreach ($root in $roots) {
    Get-ChildItem -Path $root -Recurse -File -ErrorAction SilentlyContinue |
        Where-Object {
            $segments = $_.FullName -split '[\\/]+'
            -not ($segments | Where-Object { $skipDirs -contains $_ }) -and
            -not ($skipExt -contains $_.Extension.ToLowerInvariant())
        } |
        Select-String -Pattern $pattern -CaseSensitive:$false |
        ForEach-Object {
            "{0}:{1}:{2}" -f $_.Path, $_.LineNumber, $_.Line.Trim()
        }
}
