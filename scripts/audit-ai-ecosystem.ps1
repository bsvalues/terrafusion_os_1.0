# ╔══════════════════════════════════════════════════════════════════════╗
# ║   TERRAFUSION AI ECOSYSTEM DEEP AUDIT                                ║
# ║   Discover ALL AI systems, tools, automation before reorganization   ║
# ║   THE TERRAFUSION WAY: Understand completely before changing         ║
# ╚══════════════════════════════════════════════════════════════════════╝

param(
    [string]$WorkspaceRoot = "c:\Users\bsval\terrafusion_os_1.0"
)

$ErrorActionPreference = "Stop"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$reportDir = Join-Path $WorkspaceRoot "AUDIT_REPORTS"

# Ensure report directory exists
if (-not (Test-Path $reportDir)) {
    New-Item -ItemType Directory -Path $reportDir -Force | Out-Null
}

$txtReport = Join-Path $reportDir "AI_ECOSYSTEM_AUDIT_$timestamp.txt"
$jsonReport = Join-Path $reportDir "AI_ECOSYSTEM_AUDIT_$timestamp.json"

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   TERRAFUSION AI ECOSYSTEM DEEP AUDIT                        ║" -ForegroundColor Cyan
Write-Host "║   Phase 0.5: Understanding the AI Development Ecosystem      ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Initialize results
$results = @{
    timestamp = $timestamp
    workspaceRoot = $WorkspaceRoot
    aiSystems = @()
    automationScripts = @()
    configFiles = @()
    documentationSystems = @()
    backupSystems = @()
    devopsInfrastructure = @()
    mcpServers = @()
    knowledgeBases = @()
    hardcodedPaths = @()
    summary = @{}
}

function Write-Report {
    param([string]$Message)
    Add-Content -Path $txtReport -Value $Message
    Write-Host $Message
}

function Find-AIDirectories {
    Write-Host "🔍 Discovering AI Systems..." -ForegroundColor Yellow
    
    $aiPatterns = @(
        "ai-*",
        "*-ai",
        "*ai*",
        ".ai",
        "mcp-*",
        "*-mcp",
        "*swarm*",
        "*agent*",
        "*claude*"
    )
    
    $aiDirs = @()
    
    foreach ($pattern in $aiPatterns) {
        Get-ChildItem -Path $WorkspaceRoot -Directory -Filter $pattern -ErrorAction SilentlyContinue | ForEach-Object {
            if ($_.FullName -notmatch "node_modules|dist|build|\.next|\.git") {
                $aiDirs += @{
                    name = $_.Name
                    path = $_.FullName
                    relativePath = $_.FullName.Replace($WorkspaceRoot, "").TrimStart('\')
                    size = (Get-ChildItem -Path $_.FullName -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
                    fileCount = (Get-ChildItem -Path $_.FullName -Recurse -File -ErrorAction SilentlyContinue).Count
                }
            }
        }
    }
    
    # Also check root level directories that might be AI-related
    $knownAIDirs = @(".ai", "ai-workspace-companion", "backend\ai-swarm", "backend\ai-models", "backend\ai-swarm-service")
    foreach ($dir in $knownAIDirs) {
        $fullPath = Join-Path $WorkspaceRoot $dir
        if (Test-Path $fullPath) {
            $item = Get-Item $fullPath
            $aiDirs += @{
                name = $item.Name
                path = $item.FullName
                relativePath = $dir
                size = (Get-ChildItem -Path $item.FullName -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
                fileCount = (Get-ChildItem -Path $item.FullName -Recurse -File -ErrorAction SilentlyContinue).Count
            }
        }
    }
    
    # Remove duplicates
    $aiDirs = $aiDirs | Sort-Object -Property path -Unique
    
    return $aiDirs
}

function Find-AutomationScripts {
    Write-Host "🔍 Discovering Automation Scripts..." -ForegroundColor Yellow
    
    $scriptPatterns = @("*.ps1", "*.sh", "*.bat", "*.py")
    $scripts = @()
    
    foreach ($pattern in $scriptPatterns) {
        Get-ChildItem -Path $WorkspaceRoot -File -Filter $pattern -Recurse -ErrorAction SilentlyContinue | ForEach-Object {
            if ($_.FullName -notmatch "node_modules|dist|build|\.next|\.git|obj|bin") {
                $content = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
                $isAutomation = $content -match "(deploy|build|test|start|setup|install|migration|backup|workflow|orchestrate)"
                
                if ($isAutomation) {
                    $scripts += @{
                        name = $_.Name
                        path = $_.FullName
                        relativePath = $_.FullName.Replace($WorkspaceRoot, "").TrimStart('\')
                        type = $_.Extension
                        size = $_.Length
                        purpose = if ($content -match "# Purpose: (.+)") { $matches[1] } else { "Unknown" }
                    }
                }
            }
        }
    }
    
    return $scripts
}

function Find-ConfigFiles {
    Write-Host "🔍 Discovering Configuration Files..." -ForegroundColor Yellow
    
    $configPatterns = @(
        "*config*.json",
        "*config*.yaml",
        "*config*.yml",
        ".env*",
        "mcp-*.json",
        "*-config.ts",
        "*-config.js"
    )
    
    $configs = @()
    
    foreach ($pattern in $configPatterns) {
        Get-ChildItem -Path $WorkspaceRoot -File -Filter $pattern -Recurse -ErrorAction SilentlyContinue | ForEach-Object {
            if ($_.FullName -notmatch "node_modules|dist|build|\.next|\.git|obj|bin") {
                $configs += @{
                    name = $_.Name
                    path = $_.FullName
                    relativePath = $_.FullName.Replace($WorkspaceRoot, "").TrimStart('\')
                    type = $_.Extension
                    size = $_.Length
                }
            }
        }
    }
    
    return $configs
}

function Find-DocumentationSystems {
    Write-Host "🔍 Discovering Documentation Systems..." -ForegroundColor Yellow
    
    $docDirs = @()
    $docPatterns = @("*codex*", "*docs*", "*documentation*", "*wiki*", "*knowledge*")
    
    foreach ($pattern in $docPatterns) {
        Get-ChildItem -Path $WorkspaceRoot -Directory -Filter $pattern -ErrorAction SilentlyContinue | ForEach-Object {
            if ($_.FullName -notmatch "node_modules|dist|build|\.next|\.git") {
                $docDirs += @{
                    name = $_.Name
                    path = $_.FullName
                    relativePath = $_.FullName.Replace($WorkspaceRoot, "").TrimStart('\')
                    fileCount = (Get-ChildItem -Path $_.FullName -Recurse -File -Filter "*.md" -ErrorAction SilentlyContinue).Count
                    totalSize = (Get-ChildItem -Path $_.FullName -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
                }
            }
        }
    }
    
    return $docDirs
}

function Find-BackupSystems {
    Write-Host "🔍 Discovering Backup Systems..." -ForegroundColor Yellow
    
    $backupDirs = @()
    $backupPatterns = @("*backup*", "*archive*", "*snapshot*")
    
    foreach ($pattern in $backupPatterns) {
        Get-ChildItem -Path $WorkspaceRoot -Directory -Filter $pattern -Recurse -Depth 2 -ErrorAction SilentlyContinue | ForEach-Object {
            if ($_.FullName -notmatch "node_modules|dist|build|\.next|\.git") {
                $backupDirs += @{
                    name = $_.Name
                    path = $_.FullName
                    relativePath = $_.FullName.Replace($WorkspaceRoot, "").TrimStart('\')
                    size = (Get-ChildItem -Path $_.FullName -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
                    fileCount = (Get-ChildItem -Path $_.FullName -Recurse -File -ErrorAction SilentlyContinue).Count
                }
            }
        }
    }
    
    return $backupDirs
}

function Find-DevOpsInfrastructure {
    Write-Host "🔍 Discovering DevOps Infrastructure..." -ForegroundColor Yellow
    
    $devopsDirs = @()
    $devopsPatterns = @("*ops*", "*docker*", "*k8s*", "*kubernetes*", "*terraform*", "*pipeline*", "*ci*", "*cd*")
    
    foreach ($pattern in $devopsPatterns) {
        Get-ChildItem -Path $WorkspaceRoot -Directory -Filter $pattern -ErrorAction SilentlyContinue | ForEach-Object {
            if ($_.FullName -notmatch "node_modules|dist|build|\.next|\.git") {
                $devopsDirs += @{
                    name = $_.Name
                    path = $_.FullName
                    relativePath = $_.FullName.Replace($WorkspaceRoot, "").TrimStart('\')
                    fileCount = (Get-ChildItem -Path $_.FullName -Recurse -File -ErrorAction SilentlyContinue).Count
                }
            }
        }
    }
    
    # Check for Dockerfiles
    $dockerfiles = Get-ChildItem -Path $WorkspaceRoot -File -Filter "Dockerfile*" -Recurse -ErrorAction SilentlyContinue | Where-Object {
        $_.FullName -notmatch "node_modules|dist|build|\.next|\.git"
    }
    
    return @{
        directories = $devopsDirs
        dockerfiles = $dockerfiles.Count
    }
}

function Find-MCPServers {
    Write-Host "🔍 Discovering MCP Servers..." -ForegroundColor Yellow
    
    $mcpDirs = @()
    
    # Find all mcp-* directories
    Get-ChildItem -Path $WorkspaceRoot -Directory -Filter "mcp-*" -Recurse -ErrorAction SilentlyContinue | ForEach-Object {
        if ($_.FullName -notmatch "node_modules|dist|build|\.next|\.git") {
            $mcpDirs += @{
                name = $_.Name
                path = $_.FullName
                relativePath = $_.FullName.Replace($WorkspaceRoot, "").TrimStart('\')
                hasPackageJson = Test-Path (Join-Path $_.FullName "package.json")
            }
        }
    }
    
    return $mcpDirs
}

function Find-HardcodedPaths {
    Write-Host "🔍 Scanning for Hardcoded Paths..." -ForegroundColor Yellow
    
    $pathPatterns = @(
        "c:\\Users\\bsval\\terrafusion",
        "C:\\Users\\bsval\\terrafusion",
        "/Users/bsval/terrafusion",
        "terrafusion_os_1.0",
        "src/",
        "modules/",
        "backend/"
    )
    
    $filesWithPaths = @()
    $extensions = @("*.ts", "*.js", "*.json", "*.yaml", "*.yml", "*.ps1", "*.sh", "*.py")
    
    foreach ($ext in $extensions) {
        Get-ChildItem -Path $WorkspaceRoot -File -Filter $ext -Recurse -ErrorAction SilentlyContinue | ForEach-Object {
            if ($_.FullName -notmatch "node_modules|dist|build|\.next|\.git|obj|bin|AUDIT_REPORTS") {
                $content = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
                
                $foundPaths = @()
                foreach ($pattern in $pathPatterns) {
                    if ($content -match [regex]::Escape($pattern)) {
                        $foundPaths += $pattern
                    }
                }
                
                if ($foundPaths.Count -gt 0) {
                    $filesWithPaths += @{
                        file = $_.FullName.Replace($WorkspaceRoot, "").TrimStart('\')
                        paths = $foundPaths
                        type = $_.Extension
                    }
                }
            }
        }
    }
    
    return $filesWithPaths
}

# ═══════════════════════════════════════════════════════════════════════
# EXECUTE AUDIT
# ═══════════════════════════════════════════════════════════════════════

Write-Report ""
Write-Report "╔══════════════════════════════════════════════════════════════════════╗"
Write-Report "║   TERRAFUSION AI ECOSYSTEM DEEP AUDIT                                ║"
Write-Report "║   Phase 0.5: Understanding the AI Development Ecosystem              ║"
Write-Report "╚══════════════════════════════════════════════════════════════════════╝"
Write-Report ""
Write-Report "Audit started: $(Get-Date)"
Write-Report "Workspace: $WorkspaceRoot"
Write-Report ""

# Run all discovery functions
$results.aiSystems = Find-AIDirectories
$results.automationScripts = Find-AutomationScripts
$results.configFiles = Find-ConfigFiles
$results.documentationSystems = Find-DocumentationSystems
$results.backupSystems = Find-BackupSystems
$results.devopsInfrastructure = Find-DevOpsInfrastructure
$results.mcpServers = Find-MCPServers
$results.hardcodedPaths = Find-HardcodedPaths

# Generate summary
$results.summary = @{
    aiSystemsCount = $results.aiSystems.Count
    automationScriptsCount = $results.automationScripts.Count
    configFilesCount = $results.configFiles.Count
    documentationSystemsCount = $results.documentationSystems.Count
    backupSystemsCount = $results.backupSystems.Count
    devopsDirectoriesCount = $results.devopsInfrastructure.directories.Count
    dockerfilesCount = $results.devopsInfrastructure.dockerfiles
    mcpServersCount = $results.mcpServers.Count
    filesWithHardcodedPathsCount = $results.hardcodedPaths.Count
}

# ═══════════════════════════════════════════════════════════════════════
# GENERATE REPORT
# ═══════════════════════════════════════════════════════════════════════

Write-Report ""
Write-Report "SECTION 1: AI SYSTEMS DISCOVERED"
Write-Report "--------------------------------------------------"
Write-Report "Total AI Systems: $($results.aiSystems.Count)"
Write-Report ""

foreach ($ai in $results.aiSystems | Sort-Object -Property name) {
    Write-Report "📦 $($ai.name)"
    Write-Report "   Path: $($ai.relativePath)"
    Write-Report "   Files: $($ai.fileCount)"
    Write-Report "   Size: $([math]::Round($ai.size / 1MB, 2)) MB"
    Write-Report ""
}

Write-Report ""
Write-Report "SECTION 2: AUTOMATION SCRIPTS"
Write-Report "--------------------------------------------------"
Write-Report "Total Scripts: $($results.automationScripts.Count)"
Write-Report ""

$scriptsByType = $results.automationScripts | Group-Object -Property type
foreach ($group in $scriptsByType) {
    Write-Report "$($group.Name): $($group.Count) scripts"
}
Write-Report ""

Write-Report ""
Write-Report "SECTION 3: CONFIGURATION FILES"
Write-Report "--------------------------------------------------"
Write-Report "Total Config Files: $($results.configFiles.Count)"
Write-Report ""

$configsByType = $results.configFiles | Group-Object -Property type
foreach ($group in $configsByType) {
    Write-Report "$($group.Name): $($group.Count) files"
}
Write-Report ""

Write-Report ""
Write-Report "SECTION 4: DOCUMENTATION SYSTEMS"
Write-Report "--------------------------------------------------"
Write-Report "Total Documentation Systems: $($results.documentationSystems.Count)"
Write-Report ""

foreach ($doc in $results.documentationSystems | Sort-Object -Property name) {
    Write-Report "📚 $($doc.name)"
    Write-Report "   Path: $($doc.relativePath)"
    Write-Report "   Markdown Files: $($doc.fileCount)"
    Write-Report "   Total Size: $([math]::Round($doc.totalSize / 1MB, 2)) MB"
    Write-Report ""
}

Write-Report ""
Write-Report "SECTION 5: BACKUP SYSTEMS"
Write-Report "--------------------------------------------------"
Write-Report "Total Backup Systems: $($results.backupSystems.Count)"
Write-Report ""

$totalBackupSize = ($results.backupSystems | Measure-Object -Property size -Sum).Sum
Write-Report "Total Backup Size: $([math]::Round($totalBackupSize / 1GB, 2)) GB"
Write-Report ""

Write-Report ""
Write-Report "SECTION 6: DEVOPS INFRASTRUCTURE"
Write-Report "--------------------------------------------------"
Write-Report "DevOps Directories: $($results.devopsInfrastructure.directories.Count)"
Write-Report "Dockerfiles: $($results.devopsInfrastructure.dockerfiles)"
Write-Report ""

foreach ($devops in $results.devopsInfrastructure.directories | Sort-Object -Property name) {
    Write-Report "🚀 $($devops.name)"
    Write-Report "   Path: $($devops.relativePath)"
    Write-Report ""
}

Write-Report ""
Write-Report "SECTION 7: MCP SERVERS"
Write-Report "--------------------------------------------------"
Write-Report "Total MCP Servers: $($results.mcpServers.Count)"
Write-Report ""

foreach ($mcp in $results.mcpServers | Sort-Object -Property name) {
    $status = if ($mcp.hasPackageJson) { "✅" } else { "⚠️" }
    Write-Report "$status $($mcp.name)"
    Write-Report "   Path: $($mcp.relativePath)"
    Write-Report ""
}

Write-Report ""
Write-Report "SECTION 8: HARDCODED PATHS (REORGANIZATION RISK)"
Write-Report "--------------------------------------------------"
Write-Report "Files with hardcoded paths: $($results.hardcodedPaths.Count)"
Write-Report ""

if ($results.hardcodedPaths.Count -gt 0) {
    Write-Report "⚠️ WARNING: These files contain hardcoded paths that may break during reorganization:"
    Write-Report ""
    
    $topFiles = $results.hardcodedPaths | Select-Object -First 20
    foreach ($file in $topFiles) {
        Write-Report "   $($file.file)"
        Write-Report "      Paths found: $($file.paths -join ', ')"
        Write-Report ""
    }
    
    if ($results.hardcodedPaths.Count -gt 20) {
        Write-Report "   ... and $($results.hardcodedPaths.Count - 20) more files"
        Write-Report ""
    }
}

Write-Report ""
Write-Report "SECTION 9: ECOSYSTEM SUMMARY"
Write-Report "--------------------------------------------------"
Write-Report "AI Systems: $($results.summary.aiSystemsCount)"
Write-Report "Automation Scripts: $($results.summary.automationScriptsCount)"
Write-Report "Config Files: $($results.summary.configFilesCount)"
Write-Report "Documentation Systems: $($results.summary.documentationSystemsCount)"
Write-Report "Backup Systems: $($results.summary.backupSystemsCount)"
Write-Report "DevOps Directories: $($results.summary.devopsDirectoriesCount)"
Write-Report "Dockerfiles: $($results.summary.dockerfilesCount)"
Write-Report "MCP Servers: $($results.summary.mcpServersCount)"
Write-Report "Files with Hardcoded Paths: $($results.summary.filesWithHardcodedPathsCount)"
Write-Report ""

Write-Report ""
Write-Report "SECTION 10: RECOMMENDATIONS FOR WORKSPACE OF DREAMS"
Write-Report "--------------------------------------------------"
Write-Report ""
Write-Report "1. ✅ PRESERVE AI INFRASTRUCTURE"
Write-Report "   - Keep .ai/ and ai-workspace-companion/ in logical locations"
Write-Report "   - Don't break AI agent paths"
Write-Report "   - Maintain MCP server integrations"
Write-Report ""
Write-Report "2. ⚠️ ADDRESS HARDCODED PATHS"
Write-Report "   - $($results.summary.filesWithHardcodedPathsCount) files have hardcoded paths"
Write-Report "   - Create path resolution system before reorganizing"
Write-Report "   - Use relative paths or environment variables"
Write-Report ""
Write-Report "3. 📚 ORGANIZE DOCUMENTATION"
Write-Report "   - $($results.summary.documentationSystemsCount) documentation systems found"
Write-Report "   - Consider consolidating into single knowledge base"
Write-Report "   - Maintain AI-accessible documentation structure"
Write-Report ""
Write-Report "4. 🔧 PRESERVE AUTOMATION"
Write-Report "   - $($results.summary.automationScriptsCount) automation scripts found"
Write-Report "   - Test all scripts after reorganization"
Write-Report "   - Update script paths as needed"
Write-Report ""
Write-Report "5. 💾 CONSOLIDATE BACKUPS"
Write-Report "   - $($results.summary.backupSystemsCount) backup systems found"
Write-Report "   - Consider single backup location"
Write-Report "   - Total backup size: $([math]::Round($totalBackupSize / 1GB, 2)) GB"
Write-Report ""

Write-Report ""
Write-Report "╔══════════════════════════════════════════════════════════════════════╗"
Write-Report "║              ✅ AI ECOSYSTEM AUDIT COMPLETE! ✅                      ║"
Write-Report "║   Ready to design workspace that works WITH your AI systems         ║"
Write-Report "╚══════════════════════════════════════════════════════════════════════╝"
Write-Report ""

# Save JSON report
$results | ConvertTo-Json -Depth 10 | Out-File -FilePath $jsonReport -Encoding UTF8

Write-Host ""
Write-Host "Reports saved to:" -ForegroundColor Green
Write-Host "  Text: $txtReport" -ForegroundColor Cyan
Write-Host "  JSON: $jsonReport" -ForegroundColor Cyan
Write-Host ""
