# TerraFusion Direct FTP Deploy - PowerShell
param([string]$Password)

$FtpHost = "82.198.236.1"
$FtpUser = "u240968583.terrafusionmarket.io"
$LocalDir = "dist"

Write-Host "`n🚀 TERRAFUSION DIRECT FTP DEPLOYMENT" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════`n" -ForegroundColor Cyan

if (-not $Password) {
    $SecurePass = Read-Host "Enter FTP password" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecurePass)
    $Password = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
}

if (-not (Test-Path $LocalDir)) {
    Write-Error "dist/ folder not found"
    exit 1
}

$files = Get-ChildItem -Path $LocalDir -Recurse -File
Write-Host "📁 Files to upload: $($files.Count)`n" -ForegroundColor Yellow

# Create directories first
Write-Host "📁 Creating remote directories..." -ForegroundColor Cyan
$dirs = Get-ChildItem -Path $LocalDir -Recurse -Directory | ForEach-Object { $_.FullName.Substring((Resolve-Path $LocalDir).Path.Length + 1).Replace('\', '/') }
foreach ($dir in $dirs) {
    $ftpUri = "ftp://$FtpHost/public_html/$dir"
    try {
        $request = [System.Net.FtpWebRequest]::Create($ftpUri)
        $request.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
        $request.Credentials = New-Object System.Net.NetworkCredential($FtpUser, $Password)
        $request.UseBinary = $true
        $request.UsePassive = $true
        $request.KeepAlive = $false
        $response = $request.GetResponse()
        $response.Close()
        Write-Host "  Created: $dir" -ForegroundColor Green
    } catch {
        # Directory may already exist, ignore error
    }
}

Write-Host "`n📤 Uploading files..." -ForegroundColor Cyan

$uploaded = 0
$failed = 0

foreach ($file in $files) {
    $relativePath = $file.FullName.Substring((Resolve-Path $LocalDir).Path.Length + 1).Replace('\', '/')
    $ftpUri = "ftp://$FtpHost/public_html/$relativePath"

    Write-Host "  Uploading: $relativePath" -ForegroundColor Gray -NoNewline

    try {
        $request = [System.Net.FtpWebRequest]::Create($ftpUri)
        $request.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
        $request.Credentials = New-Object System.Net.NetworkCredential($FtpUser, $Password)
        $request.UseBinary = $true
        $request.UsePassive = $true
        $request.KeepAlive = $false

        $content = [System.IO.File]::ReadAllBytes($file.FullName)
        $request.ContentLength = $content.Length

        $stream = $request.GetRequestStream()
        $stream.Write($content, 0, $content.Length)
        $stream.Close()

        $response = $request.GetResponse()
        $response.Close()

        Write-Host " ✅" -ForegroundColor Green
        $uploaded++
    } catch {
        Write-Host " ❌ $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
}

Write-Host "`n═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ Uploaded: $uploaded files" -ForegroundColor Green
if ($failed -gt 0) {
    Write-Host "❌ Failed: $failed files" -ForegroundColor Red
}

Write-Host "`n🌐 Live Site: https://terrafusionmarket.io" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════`n" -ForegroundColor Cyan
