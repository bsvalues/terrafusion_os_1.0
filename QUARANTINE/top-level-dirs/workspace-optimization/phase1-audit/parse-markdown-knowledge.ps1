# parse-markdown-knowledge.ps1
# THE TERRAFUSION WAY - Knowledge Extraction Parser
# Extracts structured knowledge from all 314 markdown files

param(
    [string]$RootPath = "C:\Users\bsval\terrafusion_os_1.0",
    [string]$OutputPath = "C:\Users\bsval\terrafusion_os_1.0\workspace-optimization\phase1-audit\knowledge-base"
)

Write-Host "🧠 THE TERRAFUSION WAY - Knowledge Extraction Starting..." -ForegroundColor Cyan
Write-Host "Root Path: $RootPath" -ForegroundColor Gray
Write-Host "Output Path: $OutputPath" -ForegroundColor Gray
Write-Host ""

# Create output directory
if (-not (Test-Path $OutputPath)) {
    New-Item -ItemType Directory -Path $OutputPath -Force | Out-Null
    Write-Host "✓ Created output directory: $OutputPath" -ForegroundColor Green
}

# Load markdown analysis
$analysisPath = Join-Path (Split-Path $OutputPath -Parent) "markdown-analysis.json"
$analysis = Get-Content $analysisPath -Raw | ConvertFrom-Json

Write-Host "📊 Loaded analysis: $($analysis.TotalFiles) files" -ForegroundColor Green
Write-Host ""

# Initialize knowledge stores
$facts = @()
$metrics = @()
$components = @()
$relationships = @()
$timeline = @()
$decisions = @()
$duplicates = @()

# Pattern definitions for extraction
$patterns = @{
    # Metrics patterns (numbers, measurements, benchmarks)
    Metrics = @(
        '(\d+(?:\.\d+)?)\s*(MB|GB|KB|TB|bytes)',  # File sizes
        '(\d+(?:,\d{3})*)\s*(files?|directories|repos?)',  # Counts
        '(\d+)\s*(lines?|tests?|agents?)',  # Line counts, test counts
        '(\d+(?:\.\d+)?)\s*(%|percent)',  # Percentages
        '(\d+)\s*(days?|weeks?|months?)',  # Time periods
        '(\d+(?:\.\d+)?)\s*(ms|seconds?|minutes?)',  # Durations
        'P(\d+)',  # P50, P95, P99 latency
        '(\d+(?:\.\d+)?)\s*([Xx])\s*faster'  # Speed improvements
    )
    
    # Technology/Component patterns
    Components = @(
        '\.NET\s+\d+(?:\.\d+)?',
        'React\s+\d+',
        'Python\s+\d+\.\d+',
        'Rust\s+\d+\.\d+',
        'PostgreSQL\s+\d+',
        'Kubernetes\s+\d+\.\d+',
        'ASP\.NET\s+Core',
        'FastAPI',
        'TypeScript\s+\d+\.\d+',
        'Terraform',
        'ArgoCD',
        'Prometheus',
        'Grafana',
        'Redis',
        'Docker',
        'Helm\s+\d+'
    )
    
    # Timeline patterns (dates, phases, milestones)
    Timeline = @(
        '\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b',
        '\b\d{4}-\d{2}-\d{2}\b',  # ISO dates
        'Phase\s+\d+(?:\.\d+)?',
        'Week\s+\d+',
        'Day\s+\d+',
        'Sprint\s+\d+'
    )
    
    # Decision patterns (ADRs, choices)
    Decisions = @(
        'decided to',
        'decision:',
        'chose',
        'selected',
        'adopted',
        'migrated to',
        'switched to'
    )
    
    # Relationship patterns (dependencies, connections)
    Relationships = @(
        'depends on',
        'requires',
        'integrates with',
        'connected to',
        'calls',
        'uses',
        'extends',
        'implements'
    )
}

# Function to extract metrics from text
function Extract-Metrics {
    param($text, $filename)
    
    $results = @()
    
    foreach ($pattern in $patterns.Metrics) {
        $matches = [regex]::Matches($text, $pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
        foreach ($match in $matches) {
            $results += [PSCustomObject]@{
                Source = $filename
                Type = "Metric"
                Value = $match.Value
                Context = Get-ContextAround -text $text -match $match -before 50 -after 50
            }
        }
    }
    
    return $results
}

# Function to extract components from text
function Extract-Components {
    param($text, $filename)
    
    $results = @()
    
    foreach ($pattern in $patterns.Components) {
        $matches = [regex]::Matches($text, $pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
        foreach ($match in $matches) {
            $results += [PSCustomObject]@{
                Source = $filename
                Type = "Component"
                Name = $match.Value
                Context = Get-ContextAround -text $text -match $match -before 30 -after 30
            }
        }
    }
    
    return $results
}

# Function to extract timeline events
function Extract-Timeline {
    param($text, $filename)
    
    $results = @()
    
    foreach ($pattern in $patterns.Timeline) {
        $matches = [regex]::Matches($text, $pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
        foreach ($match in $matches) {
            $results += [PSCustomObject]@{
                Source = $filename
                Type = "TimelineEvent"
                Date = $match.Value
                Context = Get-ContextAround -text $text -match $match -before 100 -after 100
            }
        }
    }
    
    return $results
}

# Function to extract decisions
function Extract-Decisions {
    param($text, $filename)
    
    $results = @()
    
    foreach ($pattern in $patterns.Decisions) {
        $matches = [regex]::Matches($text, $pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
        foreach ($match in $matches) {
            $results += [PSCustomObject]@{
                Source = $filename
                Type = "Decision"
                Keyword = $match.Value
                Context = Get-ContextAround -text $text -match $match -before 100 -after 100
            }
        }
    }
    
    return $results
}

# Function to extract relationships
function Extract-Relationships {
    param($text, $filename)
    
    $results = @()
    
    foreach ($pattern in $patterns.Relationships) {
        $matches = [regex]::Matches($text, $pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
        foreach ($match in $matches) {
            $results += [PSCustomObject]@{
                Source = $filename
                Type = "Relationship"
                Keyword = $match.Value
                Context = Get-ContextAround -text $text -match $match -before 100 -after 100
            }
        }
    }
    
    return $results
}

# Function to extract facts (headings as facts)
function Extract-Facts {
    param($text, $filename)
    
    $results = @()
    
    # Extract all markdown headings as potential facts
    $headingPattern = '^#{1,6}\s+(.+)$'
    $matches = [regex]::Matches($text, $headingPattern, [System.Text.RegularExpressions.RegexOptions]::Multiline)
    
    foreach ($match in $matches) {
        $heading = $match.Groups[1].Value.Trim()
        
        # Skip empty or very short headings
        if ($heading.Length -lt 5) { continue }
        
        $results += [PSCustomObject]@{
            Source = $filename
            Type = "Fact"
            Heading = $heading
            Context = Get-ContextAround -text $text -match $match -before 0 -after 200
        }
    }
    
    return $results
}

# Helper function to get context around a match
function Get-ContextAround {
    param($text, $match, $before, $after)
    
    $start = [Math]::Max(0, $match.Index - $before)
    $length = [Math]::Min($text.Length - $start, $before + $match.Length + $after)
    
    return $text.Substring($start, $length).Trim()
}

# Function to detect duplicates
function Detect-Duplicates {
    param($files)
    
    $results = @()
    $seenContent = @{}
    
    foreach ($file in $files) {
        try {
            $content = Get-Content -Path $file.FullName -Raw -ErrorAction Stop
            $hash = (Get-FileHash -InputStream ([System.IO.MemoryStream]::new([System.Text.Encoding]::UTF8.GetBytes($content))) -Algorithm MD5).Hash
            
            if ($seenContent.ContainsKey($hash)) {
                $results += [PSCustomObject]@{
                    File1 = $seenContent[$hash]
                    File2 = $file.Name
                    Type = "ExactDuplicate"
                    Hash = $hash
                }
            } else {
                $seenContent[$hash] = $file.Name
            }
        }
        catch {
            # Skip files we can't read
        }
    }
    
    return $results
}

# Get all markdown files
$markdownFiles = Get-ChildItem -Path $RootPath -Filter "*.md" -File

Write-Host "🔍 Processing $($markdownFiles.Count) files..." -ForegroundColor Cyan
Write-Host ""

$processed = 0
$skipped = 0

foreach ($file in $markdownFiles) {
    try {
        $content = Get-Content -Path $file.FullName -Raw -ErrorAction Stop
        
        # Skip empty files
        if ([string]::IsNullOrWhiteSpace($content)) {
            Write-Host "  ⊘ Skipping empty: $($file.Name)" -ForegroundColor DarkGray
            $skipped++
            continue
        }
        
        # Extract knowledge
        $facts += Extract-Facts -text $content -filename $file.Name
        $metrics += Extract-Metrics -text $content -filename $file.Name
        $components += Extract-Components -text $content -filename $file.Name
        $timeline += Extract-Timeline -text $content -filename $file.Name
        $decisions += Extract-Decisions -text $content -filename $file.Name
        $relationships += Extract-Relationships -text $content -filename $file.Name
        
        $processed++
        Write-Host "  ✓ Processed: $($file.Name)" -ForegroundColor Gray
    }
    catch {
        Write-Host "  ✗ Error processing $($file.Name): $_" -ForegroundColor Red
        $skipped++
    }
}

Write-Host ""
Write-Host "🔍 Detecting duplicates..." -ForegroundColor Cyan
$duplicates = Detect-Duplicates -files $markdownFiles

Write-Host ""
Write-Host "💾 Exporting knowledge base..." -ForegroundColor Cyan

# Export to JSON
$facts | ConvertTo-Json -Depth 10 | Out-File -FilePath (Join-Path $OutputPath "facts.json") -Encoding UTF8
Write-Host "  ✓ Saved: facts.json ($($facts.Count) facts)" -ForegroundColor Green

$metrics | ConvertTo-Json -Depth 10 | Out-File -FilePath (Join-Path $OutputPath "metrics.json") -Encoding UTF8
Write-Host "  ✓ Saved: metrics.json ($($metrics.Count) metrics)" -ForegroundColor Green

$components | ConvertTo-Json -Depth 10 | Out-File -FilePath (Join-Path $OutputPath "components.json") -Encoding UTF8
Write-Host "  ✓ Saved: components.json ($($components.Count) components)" -ForegroundColor Green

$timeline | ConvertTo-Json -Depth 10 | Out-File -FilePath (Join-Path $OutputPath "timeline.json") -Encoding UTF8
Write-Host "  ✓ Saved: timeline.json ($($timeline.Count) events)" -ForegroundColor Green

$decisions | ConvertTo-Json -Depth 10 | Out-File -FilePath (Join-Path $OutputPath "decisions.json") -Encoding UTF8
Write-Host "  ✓ Saved: decisions.json ($($decisions.Count) decisions)" -ForegroundColor Green

$relationships | ConvertTo-Json -Depth 10 | Out-File -FilePath (Join-Path $OutputPath "relationships.json") -Encoding UTF8
Write-Host "  ✓ Saved: relationships.json ($($relationships.Count) relationships)" -ForegroundColor Green

$duplicates | ConvertTo-Json -Depth 10 | Out-File -FilePath (Join-Path $OutputPath "duplicates.json") -Encoding UTF8
Write-Host "  ✓ Saved: duplicates.json ($($duplicates.Count) duplicates)" -ForegroundColor Green

# Create summary
$summary = @{
    ProcessedFiles = $processed
    SkippedFiles = $skipped
    TotalFiles = $markdownFiles.Count
    ExtractionDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    KnowledgeBase = @{
        Facts = $facts.Count
        Metrics = $metrics.Count
        Components = $components.Count
        Timeline = $timeline.Count
        Decisions = $decisions.Count
        Relationships = $relationships.Count
        Duplicates = $duplicates.Count
    }
}

$summary | ConvertTo-Json -Depth 10 | Out-File -FilePath (Join-Path $OutputPath "extraction-summary.json") -Encoding UTF8
Write-Host "  ✓ Saved: extraction-summary.json" -ForegroundColor Green

Write-Host ""
Write-Host "📊 EXTRACTION SUMMARY" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Processed Files: $processed" -ForegroundColor Yellow
Write-Host "  Skipped Files: $skipped (empty or error)" -ForegroundColor Yellow
Write-Host "  Total Files: $($markdownFiles.Count)" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Facts Extracted: $($facts.Count)" -ForegroundColor Green
Write-Host "  Metrics Extracted: $($metrics.Count)" -ForegroundColor Green
Write-Host "  Components Found: $($components.Count)" -ForegroundColor Green
Write-Host "  Timeline Events: $($timeline.Count)" -ForegroundColor Green
Write-Host "  Decisions Found: $($decisions.Count)" -ForegroundColor Green
Write-Host "  Relationships Found: $($relationships.Count)" -ForegroundColor Green
Write-Host "  Duplicates Detected: $($duplicates.Count)" -ForegroundColor $(if ($duplicates.Count -gt 0) { "Red" } else { "Green" })
Write-Host ""
Write-Host "✅ Knowledge Extraction Complete!" -ForegroundColor Green
Write-Host "🎯 THE TERRAFUSION WAY - We know everything we touch!" -ForegroundColor Cyan
