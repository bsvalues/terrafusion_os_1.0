param(
    [string]$FtpHost = "ftp.terrafusionmarket.io",
    [string]$RemoteRoot = "/public_html",
    [switch]$Ftps,
    [switch]$SkipBuild
)

Write-Host "TerraFusion Hostinger deploy starting..." -ForegroundColor Cyan

# Ensure dist exists (build if missing)
if (-not (Test-Path -LiteralPath "dist")) {
    if ($SkipBuild) {
        Write-Error "dist/ not found and -SkipBuild set. Aborting."
        exit 1
    }
    Write-Host "dist/ not found. Building with 'npm run build:production'..." -ForegroundColor Yellow
    & npm run build:production
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Build failed. Aborting deploy."
        exit $LASTEXITCODE
    }
}

# Get credentials
$cred = Get-Credential -Message "Enter Hostinger FTP credentials (user + password)"

function New-FtpRequest {
    param(
        [string]$Uri,
        [string]$Method
    )
    $request = [System.Net.FtpWebRequest]::Create($Uri)
    $request.Method = $Method
    $request.Credentials = New-Object System.Net.NetworkCredential($cred.UserName, $cred.GetNetworkCredential().Password)
    $request.KeepAlive = $false
    $request.UseBinary = $true
    $request.UsePassive = $true
    if ($Ftps) { $request.EnableSsl = $true }
    return $request
}

function Test-RemotePathExists {
    param([string]$RemotePath)
    $uri = "ftp://$FtpHost$RemotePath"
    try {
        $req = New-FtpRequest -Uri $uri -Method ([System.Net.WebRequestMethods+Ftp]::ListDirectory)
        $resp = $req.GetResponse(); $resp.Close()
        return $true
    } catch {
        return $false
    }
}

function Ensure-RemoteDirectory {
    param([string]$RemotePath)
    $parts = $RemotePath -split '/'
    $accum = ""
    foreach ($p in $parts) {
        if ([string]::IsNullOrWhiteSpace($p)) { continue }
        $accum = "$accum/$p"
        $uri = "ftp://$FtpHost$accum"
        try {
            $req = New-FtpRequest -Uri $uri -Method ([System.Net.WebRequestMethods+Ftp]::MakeDirectory)
            $resp = $req.GetResponse(); $resp.Close()
        } catch {
            if (-not $_.Exception.Response) { throw }
            $status = ($_.Exception.Response).StatusDescription
            # Ignore directory-exists or generic 550 responses; rethrow others
            if ($status -notmatch 'exists|already|550') { throw }
        }
    }
}

function Upload-FtpFile {
    param(
        [string]$LocalPath,
        [string]$RemotePath
    )
    $remoteDir = [System.IO.Path]::GetDirectoryName($RemotePath).Replace('\\','/')
    Ensure-RemoteDirectory -RemotePath $remoteDir
    $uri = "ftp://$FtpHost$RemotePath"
    $request = New-FtpRequest -Uri $uri -Method ([System.Net.WebRequestMethods+Ftp]::UploadFile)
    $content = [System.IO.File]::ReadAllBytes($LocalPath)
    $request.ContentLength = $content.Length
    $stream = $request.GetRequestStream()
    $stream.Write($content, 0, $content.Length)
    $stream.Close()
    $response = $request.GetResponse(); $response.Close()
}

$root = Resolve-Path -LiteralPath "dist"
$files = Get-ChildItem -Path $root -Recurse -File
if ($files.Count -eq 0) {
    Write-Error "No files found in dist/. Aborting."
    exit 1
}

# Resolve effective remote base from env var or parameter, with Hostinger fallback
$effectiveRemoteRoot = if ($env:HOSTINGER_REMOTE_BASE) { $env:HOSTINGER_REMOTE_BASE } else { $RemoteRoot }

# Probe the effective root; if it fails, try Hostinger domains/ path
if (-not (Test-RemotePathExists -RemotePath $effectiveRemoteRoot)) {
    $domain = if ($env:HOSTINGER_DOMAIN) { $env:HOSTINGER_DOMAIN } else { 'terrafusionmarket.io' }
    $candidate = "/domains/$domain/public_html"
    Write-Warning "Remote base '$effectiveRemoteRoot' not accessible. Trying '$candidate'..."
    if (Test-RemotePathExists -RemotePath $candidate) {
        $effectiveRemoteRoot = $candidate
        Write-Host "Using remote base: $effectiveRemoteRoot" -ForegroundColor Yellow
    } else {
        Write-Warning "Could not verify remote base paths. Proceeding, but uploads may fail with 550."
    }
}

$uploaded = 0
foreach ($f in $files) {
    $rel = [System.IO.Path]::GetRelativePath($root, $f.FullName).Replace('\\','/')
    $remote = "$effectiveRemoteRoot/$rel"
    Write-Host ("Uploading: {0} -> {1}" -f $rel, $remote) -ForegroundColor Gray
    try {
        Upload-FtpFile -LocalPath $f.FullName -RemotePath $remote
    } catch {
        $msg = $_.Exception.Message
        $status = try { ($_.Exception.Response).StatusDescription } catch { '' }
        Write-Error "Upload failed for '$rel' to '$remote' :: $msg $status"
        throw
    }
    $uploaded++
}

Write-Host ("Upload complete. Files uploaded: {0}" -f $uploaded) -ForegroundColor Green

try {
    $resp = Invoke-WebRequest -UseBasicParsing -Method Head -Uri "https://terrafusionmarket.io/"
    Write-Host ("Site check: {0} {1}" -f $resp.StatusCode, $resp.StatusDescription) -ForegroundColor Cyan
} catch {
    Write-Warning "Could not verify site availability."
}

Write-Host "Done." -ForegroundColor Cyan
