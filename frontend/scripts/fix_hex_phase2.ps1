
$mappings = @{
    '#00FFFF' = 'var(--tf-transcend-cyan)'
    '#00FFEE' = 'var(--tf-transcend-cyan)'
    '#00e5ff' = 'var(--tf-transcend-cyan)'
    '#22d3ee' = 'var(--tf-transcend-cyan)'
    '#00d2ff' = 'var(--tf-transcend-cyan)'
    '#00cc88' = 'var(--tf-transcend-cyan)'
    '#0080FF' = 'var(--tf-network-blue)'
    '#0099ff' = 'var(--tf-network-blue)'
    '#2196f3' = 'var(--tf-network-blue)'
    '#00aaff' = 'var(--tf-network-blue)'
    '#0891b2' = 'var(--tf-network-blue)'
    '#0A0E1A' = 'var(--tf-bg-void)'
    '#0b1020' = 'var(--tf-bg-surface)'
    '#1a2332' = 'var(--tf-bg-surface)'
    '#1e293b' = 'var(--tf-bg-surface)'
    '#94A3B8' = 'var(--tf-text-secondary)'
    '#64748b' = 'var(--tf-text-secondary)'
    '#00FF88' = 'var(--tf-accent-success)'
    '#00ffaa' = 'var(--tf-accent-success)'
    '#4caf50' = 'var(--tf-accent-success)'
    '#00e676' = 'var(--tf-accent-success)'
    '#00FF00' = 'var(--tf-accent-success)'
    '#FF4444' = 'var(--tf-accent-error)'
    '#ef4444' = 'var(--tf-accent-error)'
    '#ff6b6b' = 'var(--tf-accent-error)'
    '#FF0000' = 'var(--tf-accent-error)'
    '#f44336' = 'var(--tf-accent-error)'
    '#FFAA00' = 'var(--tf-accent-warning)'
    '#ff9800' = 'var(--tf-accent-warning)'
    '#ffd700' = 'var(--tf-accent-warning)'
    '#8844FF' = 'var(--tf-accent-quantum)'
    '#c5a6ff' = 'var(--tf-accent-quantum)'
    '#667eea' = 'var(--tf-accent-quantum)'
    '#9c27b0' = 'var(--tf-accent-quantum)'
    '#d1c4e9' = 'var(--tf-accent-quantum)'
    '#764ba2' = 'var(--tf-accent-quantum)'
    '#FFFFFF' = 'var(--tf-text-primary)'
    '#fff' = 'var(--tf-text-primary)'
    '#000000' = 'var(--tf-bg-void)'
    '#333' = 'var(--tf-bg-surface)'
    '#1a1f2e' = 'var(--tf-bg-surface)'
    '#1a1f3a' = 'var(--tf-bg-surface)'
    '#0f172a' = 'var(--tf-bg-void)'
    '#151932' = 'var(--tf-bg-surface)'
    '#0a0e27' = 'var(--tf-bg-void)'
    '#4fc3f7' = 'var(--tf-network-blue)'
    '#8e9eab' = 'var(--tf-text-secondary)'
}

$targetPath = "c:\Dev\TerraFusionOS\terrafusion-os\frontend\apps\os-shell\src"
if (-not (Test-Path $targetPath)) {
    Write-Error "Path not found: $targetPath"
    exit 1
}

$files = Get-ChildItem -Path $targetPath -Recurse -Include "*.tsx","*.ts"

foreach ($file in $files) {
    if ($file.Name -eq "AxiomSpinner.tsx" -or $file.Name -eq "StrategyDashboard.tsx") {
        Write-Host "Skipping clean file: $($file.Name)"
        continue
    }

    $content = Get-Content -Path $file.FullName -Raw
    $originalContent = $content
    
    foreach ($hex in $mappings.Keys) {
        $replacement = $mappings[$hex]
        
        # Power shell string replacement is case-insensitive by default
        $content = $content.Replace($hex, $replacement)
    }

    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Patched $($file.Name)"
    }
}
