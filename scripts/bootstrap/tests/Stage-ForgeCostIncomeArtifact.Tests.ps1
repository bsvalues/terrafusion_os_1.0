$ErrorActionPreference = 'Stop'
# Standard-library tests execute the real production functions in isolation. Synthetic
# admission pins never enter the script entrypoint or the committed options authority.
$scriptPath = Join-Path $PSScriptRoot '../Stage-ForgeValuationKernel.ps1'
$ast = [Management.Automation.Language.Parser]::ParseFile($scriptPath, [ref]$null, [ref]$null)
foreach ($function in $ast.FindAll({ param($node)
    $node -is [Management.Automation.Language.FunctionDefinitionAst] -and $node.Name -like '*ForgeCostIncome*'
}, $false)) { Invoke-Expression $function.Extent.Text }
$failures = [Collections.Generic.List[string]]::new()
$passed = 0
function Check([string]$Name, [scriptblock]$Body) {
    try { & $Body; $script:passed++; Write-Output "PASS $Name" }
    catch { $script:failures.Add("${Name}: $($_.Exception.Message)"); Write-Output "FAIL ${Name}: $($_.Exception.Message)" }
}
function Refuses([scriptblock]$Body) {
    $rejected = $false
    try { & $Body | Out-Null } catch {
        if ($_.Exception -is [Management.Automation.CommandNotFoundException]) { throw }
        $rejected = $true
    }
    if (-not $rejected) { throw 'Expected refusal.' }
}
function Digest([string]$Path) { (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant() }
function Make-Zip([string]$Path, [string[]]$Names, [int]$LinkIndex = -1, [int]$LargeIndex = -1) {
    $zip = [IO.Compression.ZipFile]::Open($Path, [IO.Compression.ZipArchiveMode]::Create)
    try {
        for ($i = 0; $i -lt $Names.Count; $i++) {
            $entry = $zip.CreateEntry($Names[$i])
            if ($i -eq $LinkIndex) { $entry.ExternalAttributes = -1577123840 } # Unix symbolic link 0120000
            $stream = $entry.Open()
            try {
                $bytes = if ($i -eq $LargeIndex) { [byte[]]::new(1048577) }
                    elseif ($Names[$i] -eq 'manifest.json') { [IO.File]::ReadAllBytes($manifestPath) }
                    else { [Text.Encoding]::UTF8.GetBytes('SYNTHETIC-NOT-AN-EXECUTABLE') }
                $stream.Write([byte[]]$bytes, 0, $bytes.Length)
            } finally { $stream.Dispose() }
        }
    } finally { $zip.Dispose() }
}
$root = Join-Path ([IO.Path]::GetTempPath()) ('forge-intake-tests-' + [Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $root | Out-Null
try {
    $source = 'a' * 40
    $receipt = [ordered]@{
        schemaVersion = 1; transport = 'github-actions-windows-artifact@1'
        repository = 'bsvalues/terrafusion-forge'; workflowPath = '.github/workflows/suite-ci.yml'
        event = 'push'; branch = 'main'; conclusion = 'success'; runId = '123'; runAttempt = '2'; artifactId = '456'
        artifactName = "terraforge-valuation-kernel-windows-x64-$source"; protectedCommit = $source
        archiveSha256 = 'c' * 64; manifestSha256 = 'd' * 64; executableSha256 = 'b' * 64
    }
    $pins = @{
        CanonicalSourceCommit = $source; ProducerCommit = $source; WorkflowRunId = '123'; WorkflowRunAttempt = '2'; ArtifactId = '456'
        ArchiveSha256 = $receipt.archiveSha256; ProducerManifestSha256 = $receipt.manifestSha256
        ExecutableSha256 = $receipt.executableSha256; Target = 'x86_64-pc-windows-msvc'
    }
    Check 'accept exact independently admitted native receipt' { Assert-ForgeCostIncomeReceipt $receipt $pins }
    Check 'reject each substituted run artifact source or download identity' {
        foreach ($key in @('repository','workflowPath','event','branch','conclusion','runId','runAttempt','artifactId',
            'artifactName','protectedCommit','archiveSha256','manifestSha256','executableSha256','transport')) {
            $changed = @{} + $receipt; $changed[$key] = 'other'
            Refuses { Assert-ForgeCostIncomeReceipt $changed $pins }
        }
    }
    $manifestPath = Join-Path $root 'manifest.json'
    [IO.File]::WriteAllText($manifestPath, '{"synthetic":true}')
    $archive = Join-Path $root 'valid.zip'
    Make-Zip $archive @('manifest.json', 'terraforge-kernel-valuation.exe')
    $pins.ArchiveSha256 = Digest $archive
    $pins.ProducerManifestSha256 = Digest $manifestPath
    $pins.ExecutableSha256 = [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData(
        [Text.Encoding]::UTF8.GetBytes('SYNTHETIC-NOT-AN-EXECUTABLE'))).ToLowerInvariant()
    Check 'extract exact two admitted files without executing them' {
        $destination = Join-Path $root 'valid'
        Expand-ForgeCostIncomeArchive $archive $destination $pins
        if ((Get-ChildItem -LiteralPath $destination).Count -ne 2) { throw 'Not the exact pair.' }
        if ((Digest (Join-Path $destination 'terraforge-kernel-valuation.exe')) -cne $pins.ExecutableSha256) { throw 'Wrong bytes.' }
    }
    Check 'reject archive tamper before destination creation' {
        $wrong = @{} + $pins; $wrong.ArchiveSha256 = '0' * 64
        $destination = Join-Path $root 'tampered'
        Refuses { Expand-ForgeCostIncomeArchive $archive $destination $wrong }
        if (Test-Path -LiteralPath $destination) { throw 'Tampered archive wrote files.' }
    }
    $cases = @(
        @{ Name = 'traversal'; Files = @('../manifest.json','terraforge-kernel-valuation.exe') },
        @{ Name = 'backslash'; Files = @('sub\manifest.json','terraforge-kernel-valuation.exe') },
        @{ Name = 'absolute'; Files = @('C:/manifest.json','terraforge-kernel-valuation.exe') },
        @{ Name = 'duplicate'; Files = @('manifest.json','manifest.json') },
        @{ Name = 'case-alias'; Files = @('MANIFEST.JSON','terraforge-kernel-valuation.exe') },
        @{ Name = 'third-file'; Files = @('manifest.json','terraforge-kernel-valuation.exe','extra.txt') },
        @{ Name = 'missing'; Files = @('manifest.json') },
        @{ Name = 'link'; Files = @('manifest.json','terraforge-kernel-valuation.exe'); Link = 1 },
        @{ Name = 'oversize-manifest'; Files = @('manifest.json','terraforge-kernel-valuation.exe'); Large = 0 }
    )
    foreach ($case in $cases) {
        Check ("reject ZIP " + $case.Name) {
            $path = Join-Path $root ($case.Name + '.zip')
            Make-Zip $path $case.Files $(if ($case.ContainsKey('Link')) { $case.Link } else { -1 }) $(if ($case.ContainsKey('Large')) { $case.Large } else { -1 })
            $fixturePins = @{} + $pins; $fixturePins.ArchiveSha256 = Digest $path
            Refuses { Expand-ForgeCostIncomeArchive $path (Join-Path $root $case.Name) $fixturePins }
        }
    }
    Check 'reject extracted pair with substituted manifest' {
        $wrong = @{} + $pins; $wrong.ProducerManifestSha256 = '0' * 64
        Refuses { Expand-ForgeCostIncomeArchive $archive (Join-Path $root 'wrong-manifest') $wrong }
    }
    Check 'unadmitted production pins refuse without building or staging' {
        $options = [IO.File]::ReadAllText((Join-Path $PSScriptRoot '../../../backend/src/TerraFusion.API/Configuration/RustKernelsOptions.cs'))
        $unadmitted = Join-Path $root 'unadmitted-options.cs'
        [IO.File]::WriteAllText($unadmitted, ([regex]::Replace($options, '(public const string ForgeCostIncome\w+ = )"[^"]*";', '$1"";')))
        Refuses { Get-ForgeCostIncomePins $unadmitted }
    }
    # Pair publication tests retain actual filesystem copies and moves. Only the
    # post-copy verifier is faulted to model disk tamper before rollback.
    $receiptPath = Join-Path $root 'receipt.json'
    $receipt.archiveSha256 = $pins.ArchiveSha256
    $receipt.manifestSha256 = $pins.ProducerManifestSha256
    $receipt.executableSha256 = $pins.ExecutableSha256
    [IO.File]::WriteAllText($receiptPath, ($receipt | ConvertTo-Json -Depth 10))
    $pins.ReceiptSha256 = Digest $receiptPath
    $forgeRoot = Join-Path $root '.terrafusion/runtime/forge'
    $slot = Join-Path $forgeRoot 'cost-income'
    $proof = Join-Path $forgeRoot ('cost-income-staging/run-' + [Guid]::NewGuid().ToString('N'))
    $candidate = Join-Path $proof 'candidate'
    New-Item -ItemType Directory -Path $proof | Out-Null
    Copy-Item -LiteralPath (Join-Path $root 'valid') -Destination $candidate -Recurse
    Copy-Item -LiteralPath $receiptPath -Destination (Join-Path $candidate 'receipt.json')
    Check 'publish verified pair and receipt to isolated slot' {
        Publish-ForgeCostIncomeCandidate $root $proof $pins
        if ((Digest (Join-Path $slot 'receipt.json')) -cne $pins.ReceiptSha256) { throw 'Receipt not published.' }
        if ((Digest (Join-Path $slot 'manifest.json')) -cne $pins.ProducerManifestSha256) { throw 'Pair not published.' }
    }
    Check 'post-copy tamper restores previous complete pair and retains failed evidence' {
        if (-not (Test-Path -LiteralPath $slot)) { throw 'Prior publication missing.' }
        $secondProof = Join-Path $forgeRoot ('cost-income-staging/run-' + [Guid]::NewGuid().ToString('N'))
        New-Item -ItemType Directory -Path $secondProof | Out-Null
        Copy-Item -LiteralPath $candidate -Destination (Join-Path $secondProof 'candidate') -Recurse
        $realVerifier = (Get-Command Assert-ForgeCostIncomePair).ScriptBlock
        $script:verificationCalls = 0
        try {
            Set-Item Function:Assert-ForgeCostIncomePair -Value {
                param($Directory, $Pins)
                $script:verificationCalls++
                if ($script:verificationCalls -eq 2) { throw 'Synthetic post-copy tamper.' }
                & $realVerifier $Directory $Pins
            }
            Refuses { Publish-ForgeCostIncomeCandidate $root $secondProof $pins }
        } finally { Set-Item Function:Assert-ForgeCostIncomePair -Value $realVerifier }
        if ((Digest (Join-Path $slot 'receipt.json')) -cne $pins.ReceiptSha256 -or
            (Digest (Join-Path $slot 'terraforge-kernel-valuation.exe')) -cne $pins.ExecutableSha256) { throw 'Previous pair not restored.' }
        if (-not (Test-Path -LiteralPath (Join-Path $secondProof 'failed'))) { throw 'Failed evidence not retained.' }
    }
    Check 'reject foreign staging root without touching previous pair' {
        Refuses { Publish-ForgeCostIncomeCandidate $root $root $pins }
        if ((Digest (Join-Path $slot 'receipt.json')) -cne $pins.ReceiptSha256) { throw 'Previous pair changed.' }
    }
    $specPath = 'operations/work-orders/EO-TF-FORGE-COST-INCOME-001.md'
    $sourceFiles = @{}
    foreach ($path in @('Cargo.toml','Cargo.lock','build.rs','src/main.rs','src/approaches.rs','tests/approaches.rs')) {
        $sourceFiles['kernels/terraforge.kernel.valuation/' + $path] = 'e' * 64
    }
    $sourceFiles[$specPath] = 'f' * 64
    $pins.SpecificationSha256 = 'f' * 64
    $lines = @($sourceFiles.Keys); [Array]::Sort($lines, [StringComparer]::Ordinal)
    $pins.SourceClosureSha256 = [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData(
        [Text.Encoding]::UTF8.GetBytes((($lines | ForEach-Object { $_ + ':' + $sourceFiles[$_] }) -join "`n") + "`n"))).ToLowerInvariant()
    $dependencyLine = 'synthetic@1.0.0|registry+https://github.com/rust-lang/crates.io-index|' + ('9' * 64) + "`n"
    $pins.DependencyClosureSha256 = [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData(
        [Text.Encoding]::UTF8.GetBytes($dependencyLine))).ToLowerInvariant()
    $manifest = @{
        schemaVersion = 1; repository = 'bsvalues/terrafusion-forge'; producerCommit = $source; canonicalSourceCommit = $source
        commit = $source; workflow = 'suite-ci'; workflowRunId = '123'; artifactName = $receipt.artifactName
        target = 'x86_64-pc-windows-msvc'; executableFilename = 'terraforge-kernel-valuation.exe'; executableSha256 = $pins.ExecutableSha256
        capabilityExchanges = @('forge.cost@1.0.0','forge.income@1.0.0'); canonicalSourceIntegrity = @{ files = $sourceFiles }
        kernelSourceHashes = $sourceFiles; specification = @{ path = $specPath; sha256 = 'f' * 64; sourceCommit = $source
            authorityRepository = 'bsvalues/terrafusion_os_1.0'; workOrder = 'WO-EO-TF-FORGE-COST-INCOME-001' }
        dependencyClosure = @(@{name = 'synthetic'; version = '1.0.0'; source = 'registry+https://github.com/rust-lang/crates.io-index'; checksum = '9' * 64})
    }
    Check 'verify complete native source spec and registry dependency closure' { Assert-ForgeCostIncomeManifest $manifest $pins }
    Check 'reject missing transitive dependency even when source fields agree' {
        $changed = @{} + $manifest; $changed.dependencyClosure = @()
        Refuses { Assert-ForgeCostIncomeManifest $changed $pins }
    }
    Check 'reject omitted approaches module and spec substitution' {
        $changed = @{} + $manifest; $changed.canonicalSourceIntegrity = @{files = @{} + $sourceFiles}
        $changed.canonicalSourceIntegrity.files.Remove('kernels/terraforge.kernel.valuation/src/approaches.rs')
        Refuses { Assert-ForgeCostIncomeManifest $changed $pins }
        $changed = @{} + $manifest; $changed.specification = @{} + $manifest.specification; $changed.specification.sha256 = '0' * 64
        Refuses { Assert-ForgeCostIncomeManifest $changed $pins }
    }
} finally {
    $resolved = [IO.Path]::GetFullPath($root)
    $temporary = [IO.Path]::GetFullPath([IO.Path]::GetTempPath())
    if (-not $resolved.StartsWith($temporary, [StringComparison]::OrdinalIgnoreCase) -or
        [IO.Path]::GetFileName($resolved) -notlike 'forge-intake-tests-*') { throw 'Unsafe test cleanup path.' }
    Remove-Item -LiteralPath $resolved -Recurse -Force
}
Write-Output "$passed passed; $($failures.Count) failed. Synthetic fixtures only; no admitted runtime proof."
if ($failures.Count) { throw ($failures -join "`n") }
