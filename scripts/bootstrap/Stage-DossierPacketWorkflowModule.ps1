<# Stages the exact protected Dossier packet workflow closure; never enables a runtime. #>
[CmdletBinding()]
param(
  [string]$DossierRepository = 'https://github.com/bsvalues/terrafusion-dossier',
  [string]$EnvironmentName = 'Development',
  [switch]$TestOnlyInjectCandidateTamper,
  [switch]$TestOnlyInjectFailureAfterPublish
)
$ErrorActionPreference = 'Stop'
if (@('Development','Test','Testing','CI','Local') -inotcontains $EnvironmentName) { throw 'DOSSIER_PACKET_PRODUCTION_STAGE_REFUSED' }
$expectedCommit = '8f58a6b989641a6fde063afa3dda68bd18062c63'
$expectedArtifact = 'd4f29a599c96499f567c065274127b5c6943955b6366bd5959166ac5abf55c01'
$files = @(
  [ordered]@{ path='operations/work-orders/EO-TF-DOSSIER-DURABLE-PACKET-HANDOFF-001.md'; sizeBytes=10579; sha256='fc3b630e41cb26c86f946cb0ca9b14e4b00084ae9844f632b6120627d2c15723' },
  [ordered]@{ path='src/appeal-handoff/decide-dossier-appeal-handoff.mjs'; sizeBytes=1204; sha256='1dbfedb5762133e7a8be9d2a9b646a0b55a4bc7a376551d059f9713e42d5e65c' },
  [ordered]@{ path='src/mutation-decision/decide-dossier-mutation.mjs'; sizeBytes=18366; sha256='b314d94ac5cd1ed88d7c841f8a87d3263e7a8adf21c4d5d465003c015c66f277' },
  [ordered]@{ path='src/packet-finalization/decide-dossier-packet-finalization.mjs'; sizeBytes=13668; sha256='f55be3fa60a9cd519a425c20d72b8603a3d12283c7bc004085c79be375a097de' }
)
$utf8 = [Text.UTF8Encoding]::new($false)
function Get-Sha256HexFromBytes([byte[]]$Bytes) {
  $sha256 = [Security.Cryptography.SHA256]::Create()
  try { return ([BitConverter]::ToString($sha256.ComputeHash($Bytes)).Replace('-', '').ToLowerInvariant()) }
  finally { $sha256.Dispose() }
}
$manifest = ([ordered]@{ schemaVersion='1.0.0'; artifactType='dossier.packet-workflow.module-set@1'; repository='bsvalues/terrafusion-dossier';
  sourceCommit=$expectedCommit; artifactSha256=$expectedArtifact; files=$files } | ConvertTo-Json -Depth 6 -Compress) + "`n"
$manifestHash = Get-Sha256HexFromBytes -Bytes ($utf8.GetBytes($manifest))
$osRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$slot = Join-Path $osRoot '.terrafusion/runtime/dossier/packet-workflow'
$temporaryRoot = Join-Path $osRoot '.tmp'
function Assert-NoLinks([string]$Path) {
  $cursor = [IO.Path]::GetFullPath($Path)
  while ($cursor) {
    if (Test-Path -LiteralPath $cursor) {
      if ((Get-Item -LiteralPath $cursor -Force).Attributes.HasFlag([IO.FileAttributes]::ReparsePoint)) { throw "DOSSIER_PACKET_REPARSE_REFUSED: $cursor" }
    }
    $parent = [IO.Directory]::GetParent($cursor)
    if ($null -eq $parent) { break }; $cursor = $parent.FullName
  }
}
function Get-RelativePathCompat([string]$Root, [string]$Target) {
  $rootFull = [IO.Path]::GetFullPath($Root).TrimEnd([char[]]@([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar)) + [IO.Path]::DirectorySeparatorChar
  $targetFull = [IO.Path]::GetFullPath($Target)
  if (-not $targetFull.StartsWith($rootFull, [StringComparison]::OrdinalIgnoreCase)) { throw 'DOSSIER_PACKET_RELATIVE_PATH_SCOPE_REFUSED' }
  return $targetFull.Substring($rootFull.Length)
}
function Assert-Stage([string]$Directory) {
  Assert-NoLinks $Directory
  $entries = @(Get-ChildItem -LiteralPath $Directory -Force -Recurse)
  if (@($entries | Where-Object { $_.Attributes.HasFlag([IO.FileAttributes]::ReparsePoint) }).Count) { throw 'DOSSIER_PACKET_STAGE_REPARSE_REFUSED' }
  $actual = @($entries | Where-Object { -not $_.PSIsContainer })
  $expected = @($files.path) + 'manifest.json'
  if ($actual.Count -ne $expected.Count) { throw 'DOSSIER_PACKET_EXACT_INVENTORY_REQUIRED' }
  foreach ($entry in $actual) {
    if ((Get-RelativePathCompat -Root $Directory -Target $entry.FullName).Replace('\','/') -cnotin $expected) { throw 'DOSSIER_PACKET_UNEXPECTED_FILE' }
  }
  foreach ($file in $files) {
    $path = Join-Path $Directory $file.path
    if ((Get-Item -LiteralPath $path).Length -ne $file.sizeBytes -or
        (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant() -cne $file.sha256) { throw "DOSSIER_PACKET_SOURCE_IDENTITY_MISMATCH: $($file.path)" }
  }
  if ((Get-FileHash -LiteralPath (Join-Path $Directory 'manifest.json') -Algorithm SHA256).Hash.ToLowerInvariant() -cne $manifestHash) { throw 'DOSSIER_PACKET_MANIFEST_IDENTITY_MISMATCH' }
}
function Git-Value([string]$Repository, [string[]]$Arguments) {
  $result = & git --no-replace-objects -C $Repository @Arguments
  if ($LASTEXITCODE -ne 0) { throw "DOSSIER_PACKET_GIT_FAILED: $($Arguments[0])" }
  return ($result -join "`n").Trim()
}
function Export-Blob([string]$Repository, [string]$Relative, [string]$Destination) {
  [IO.Directory]::CreateDirectory((Split-Path -Parent $Destination)) | Out-Null
  $start = [Diagnostics.ProcessStartInfo]::new('git')
  $start.UseShellExecute = $false; $start.CreateNoWindow = $true
  $start.RedirectStandardOutput = $true; $start.RedirectStandardError = $true
  $start.Arguments = "--no-replace-objects -C `"$Repository`" show `"${expectedCommit}:$Relative`""
  $process = [Diagnostics.Process]::new(); $process.StartInfo = $start
  try {
    if (-not $process.Start()) { throw 'DOSSIER_PACKET_GIT_START_FAILED' }
    $errorRead = $process.StandardError.ReadToEndAsync()
    $output = [IO.File]::Open($Destination, [IO.FileMode]::CreateNew)
    try { $process.StandardOutput.BaseStream.CopyTo($output) } finally { $output.Dispose() }
    $process.WaitForExit()
    if ($process.ExitCode -ne 0) { throw "DOSSIER_PACKET_BLOB_EXPORT_FAILED: $Relative" }
    $null = $errorRead.GetAwaiter().GetResult()
  } finally { $process.Dispose() }
}
Assert-NoLinks $slot; Assert-NoLinks $temporaryRoot
[IO.Directory]::CreateDirectory($temporaryRoot) | Out-Null
$lock = [IO.File]::Open((Join-Path $temporaryRoot 'dossier-packet-stage.lock'), [IO.FileMode]::OpenOrCreate, [IO.FileAccess]::ReadWrite, [IO.FileShare]::None)
$scratch = Join-Path $temporaryRoot ('dossier-packet-stage-' + [Guid]::NewGuid().ToString('N'))
$candidate = Join-Path $scratch 'candidate'; $backup = Join-Path $scratch 'backup'
$published = $false; $preserveScratch = $false
try {
  # Unknown prior contents belong to someone else: refuse rather than replace them.
  if (Test-Path -LiteralPath $slot) { Assert-Stage $slot }
  [IO.Directory]::CreateDirectory($candidate) | Out-Null
  if (Test-Path -LiteralPath $DossierRepository -PathType Container) {
    $source = (Resolve-Path -LiteralPath $DossierRepository).Path
  } else {
    if ($DossierRepository -cne 'https://github.com/bsvalues/terrafusion-dossier') { throw 'DOSSIER_PACKET_REPOSITORY_REFUSED' }
    $source = Join-Path $scratch 'source'
    & git clone --no-checkout --filter=blob:none $DossierRepository $source
    if ($LASTEXITCODE -ne 0) { throw 'DOSSIER_PACKET_CLONE_FAILED' }
  }
  $origin = Git-Value $source @('remote','get-url','origin')
  if ($origin -notmatch '^(https://github\.com/bsvalues/terrafusion-dossier(?:\.git)?/?|git@github\.com:bsvalues/terrafusion-dossier(?:\.git)?|ssh://git@github\.com/bsvalues/terrafusion-dossier(?:\.git)?)$') { throw 'DOSSIER_PACKET_ORIGIN_REFUSED' }
  if ((Git-Value $source @('cat-file','-t',$expectedCommit)) -cne 'commit') { throw 'DOSSIER_PACKET_EXACT_COMMIT_REQUIRED' }
  foreach ($file in $files) { Export-Blob $source $file.path (Join-Path $candidate $file.path) }
  [IO.File]::WriteAllText((Join-Path $candidate 'manifest.json'), $manifest, $utf8)
  if ($TestOnlyInjectCandidateTamper) { [IO.File]::AppendAllText((Join-Path $candidate $files[3].path), "`n// injected tamper", $utf8) }
  Assert-Stage $candidate
  [IO.Directory]::CreateDirectory((Split-Path -Parent $slot)) | Out-Null
  Assert-NoLinks $slot
  if (Test-Path -LiteralPath $slot) { Move-Item -LiteralPath $slot -Destination $backup; Assert-Stage $backup }
  Move-Item -LiteralPath $candidate -Destination $slot; $published = $true
  Assert-Stage $slot
  if ($TestOnlyInjectFailureAfterPublish) { throw 'DOSSIER_PACKET_INJECTED_POST_PUBLISH_FAILURE' }
  Write-Output "DOSSIER_PACKET_STAGE_OK: $expectedCommit; $expectedArtifact; $slot"
} catch {
  $original = $_
  try {
    if ($published) { Assert-Stage $slot; Remove-Item -LiteralPath $slot -Recurse -Force }
    if (Test-Path -LiteralPath $backup) { Assert-Stage $backup; Move-Item -LiteralPath $backup -Destination $slot; Assert-Stage $slot }
  } catch { $preserveScratch = $true; throw "DOSSIER_PACKET_ROLLBACK_REQUIRES_RECOVERY: $scratch; $($_.Exception.Message)" }
  throw $original
} finally {
  $lock.Dispose()
  if (-not $preserveScratch -and (Test-Path -LiteralPath $scratch)) {
    $resolvedScratch = [IO.Path]::GetFullPath($scratch)
    if (-not $resolvedScratch.StartsWith(([IO.Path]::GetFullPath($temporaryRoot) + [IO.Path]::DirectorySeparatorChar), [StringComparison]::OrdinalIgnoreCase)) { throw 'DOSSIER_PACKET_CLEANUP_SCOPE_REFUSED' }
    Assert-NoLinks $resolvedScratch
    if (@(Get-ChildItem -LiteralPath $resolvedScratch -Force -Recurse | Where-Object { $_.Attributes.HasFlag([IO.FileAttributes]::ReparsePoint) }).Count) { throw 'DOSSIER_PACKET_CLEANUP_REPARSE_REFUSED' }
    Remove-Item -LiteralPath $resolvedScratch -Recurse -Force
  }
}
