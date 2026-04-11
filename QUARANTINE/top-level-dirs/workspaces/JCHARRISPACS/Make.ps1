# Benton County PACS - Make.ps1 (Windows PowerShell wrapper for Makefile)
# Usage: .\Make.ps1 <target>
# Examples: .\Make.ps1 help
#           .\Make.ps1 viz
#           .\Make.ps1 pacs-inventory

param(
    [Parameter(Position = 0)]
    [string]$Target = "help"
)

$ErrorActionPreference = "Stop"

# Configuration (override with environment variables)
$env:PACS_SERVER = if ($env:PACS_SERVER) { $env:PACS_SERVER } else { "localhost,1433" }
$env:PACS_DB = if ($env:PACS_DB) { $env:PACS_DB } else { "pacs_oltp" }
$env:PACS_USER = if ($env:PACS_USER) { $env:PACS_USER } else { "sa" }
$env:PACS_PW = if ($env:PACS_PW) { $env:PACS_PW } else { "TF_Pacs2026!" }

$OUT = "./_artifacts"
$DOCS = "./docs/diagrams"

function Show-Help {
    Write-Host "Benton County PACS - Documentation Automation" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Available targets:" -ForegroundColor Yellow
    Write-Host "  help                   Show this help message" -ForegroundColor White
    Write-Host "  viz                    Render Mermaid diagrams to SVG" -ForegroundColor White
    Write-Host "  viz-png                Render Mermaid diagrams to PNG (high-res)" -ForegroundColor White
    Write-Host "  pacs-inventory         Generate live object counts from SQL Server" -ForegroundColor White
    Write-Host "  twin-verify-surface    Verify key database objects exist" -ForegroundColor White
    Write-Host "  twin-trigger-profile   Capture trigger inventory from pacs_oltp" -ForegroundColor White
    Write-Host "  docker-up              Start full stack (SQL + Prometheus + Grafana + sql_exporter)" -ForegroundColor White
    Write-Host "  docker-down            Stop and remove all stack containers" -ForegroundColor White
    Write-Host "  docker-logs            Tail logs from all stack containers" -ForegroundColor White
    Write-Host "  publish-sql            Build DACPACs and deploy to running SQL container" -ForegroundColor White
    Write-Host "  sql-tests              Run pure-SQL test suite (20 tests, no CLR required)" -ForegroundColor White
    Write-Host "  data-dictionary        Export data dictionary (extended properties)" -ForegroundColor White
    Write-Host "  all-checks             Run all verification checks" -ForegroundColor White
    Write-Host "  validate-mermaid       Validate Mermaid syntax (dry-run)" -ForegroundColor White
    Write-Host "  asend-certify          Generate Asend/Proval county readiness certification pack" -ForegroundColor White
    Write-Host "  asend-intake           Run one-command county intake (profiling + certify + packet)" -ForegroundColor White
    Write-Host "  api-run                Start PacsApi dev server (http://localhost:5200)" -ForegroundColor White
    Write-Host "  api-build              dotnet build PacsApi (CI check)" -ForegroundColor White
    Write-Host "  test-api               Smoke-test PacsApi /health endpoint (API must be running)" -ForegroundColor White
    Write-Host "  pacs-health-report     Print stack health summary (SQL + monitoring + API + inventory)" -ForegroundColor White
    Write-Host "  clean                  Remove generated artifacts" -ForegroundColor White
    Write-Host ""
    Write-Host "Environment Variables:" -ForegroundColor Yellow
    Write-Host "  PACS_SERVER = $env:PACS_SERVER" -ForegroundColor Gray
    Write-Host "  PACS_DB     = $env:PACS_DB" -ForegroundColor Gray
    Write-Host "  PACS_USER   = $env:PACS_USER" -ForegroundColor Gray
        Write-Host "  COUNTY_NAME / COUNTY_STATE / INTAKE_OWNER / SUPPORT_TIER" -ForegroundColor Gray
        Write-Host "  MDB1 / MDB2 / ASSESSOR_CONTACT / DBA_CONTACT / IT_CONTACT / PRODUCTION_NOTES" -ForegroundColor Gray
}

function Invoke-Viz {
    Write-Host "🎨 Rendering Mermaid diagrams..." -ForegroundColor Cyan
    
    if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
        Write-Host "❌ Error: Node.js/npx not found. Install from https://nodejs.org/" -ForegroundColor Red
        exit 1
    }
    
    if (-not (Test-Path $OUT)) {
        New-Item -ItemType Directory -Path $OUT -Force | Out-Null
    }
    
    npx -y @mermaid-js/mermaid-cli@10 -i "$DOCS/erd.mmd" -o "$OUT/erd.svg"
    npx -y @mermaid-js/mermaid-cli@10 -i "$DOCS/crossdb.mmd" -o "$OUT/crossdb.svg"
    npx -y @mermaid-js/mermaid-cli@10 -i "$DOCS/wcf.mmd" -o "$OUT/wcf.svg"
    npx -y @mermaid-js/mermaid-cli@10 -i "$DOCS/recalc_flow.mmd" -o "$OUT/recalc_flow.svg"
    npx -y @mermaid-js/mermaid-cli@10 -i "$DOCS/trigger_cascade.mmd" -o "$OUT/trigger_cascade.svg"
    npx -y @mermaid-js/mermaid-cli@10 -i "$DOCS/api_flow.mmd" -o "$OUT/api_flow.svg"
    
    Write-Host "✅ Diagrams updated in $OUT/" -ForegroundColor Green
    Write-Host "   - erd.svg (Core Database ERD)" -ForegroundColor Gray
    Write-Host "   - crossdb.svg (Cross-Database Integration)" -ForegroundColor Gray
    Write-Host "   - wcf.svg (WCF Service Architecture)" -ForegroundColor Gray
    Write-Host "   - recalc_flow.svg (Property Recalculation Flow)" -ForegroundColor Gray
    Write-Host "   - trigger_cascade.svg (Trigger Cascade Analysis)" -ForegroundColor Gray
    Write-Host "   - api_flow.svg (PacsApi Request Flow)" -ForegroundColor Gray
}

function Invoke-VizPng {
    Write-Host "🎨 Rendering Mermaid diagrams to PNG..." -ForegroundColor Cyan
    
    if (-not (Test-Path $OUT)) {
        New-Item -ItemType Directory -Path $OUT -Force | Out-Null
    }
    
    npx -y @mermaid-js/mermaid-cli@10 -i "$DOCS/erd.mmd" -o "$OUT/erd.png" -w 2400 -H 1800
    npx -y @mermaid-js/mermaid-cli@10 -i "$DOCS/crossdb.mmd" -o "$OUT/crossdb.png" -w 2400 -H 1800
    npx -y @mermaid-js/mermaid-cli@10 -i "$DOCS/wcf.mmd" -o "$OUT/wcf.png" -w 2400 -H 1800
    npx -y @mermaid-js/mermaid-cli@10 -i "$DOCS/recalc_flow.mmd" -o "$OUT/recalc_flow.png" -w 2400 -H 1800
    npx -y @mermaid-js/mermaid-cli@10 -i "$DOCS/trigger_cascade.mmd" -o "$OUT/trigger_cascade.png" -w 2400 -H 1800
    npx -y @mermaid-js/mermaid-cli@10 -i "$DOCS/api_flow.mmd" -o "$OUT/api_flow.png" -w 2400 -H 1800
    
    Write-Host "✅ PNG diagrams created in $OUT/" -ForegroundColor Green
}

function Invoke-PacsInventory {
    Write-Host "📊 Querying pacs_oltp database inventory..." -ForegroundColor Cyan
    
    & (Join-Path $PSScriptRoot 'scripts\sql\pacs_inventory.ps1') `
        -Server $env:PACS_SERVER `
        -Database $env:PACS_DB `
        -Username $env:PACS_USER `
        -Password $env:PACS_PW `
        -OutputPath "$OUT/pacs_inventory.json"
}

function Invoke-VerifySurface {
    Write-Host "🔍 Verifying database surface integrity..." -ForegroundColor Cyan
    
    sqlcmd -S $env:PACS_SERVER -U $env:PACS_USER -P $env:PACS_PW -d $env:PACS_DB -i ./scripts/sql/verify_surface.sql
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Surface verification passed" -ForegroundColor Green
    }
    else {
        Write-Host "❌ Surface verification failed" -ForegroundColor Red
        exit 1
    }
}

function Invoke-TriggerProfile {
    Write-Host "🔍 Profiling triggers on pacs_oltp..." -ForegroundColor Cyan
    
    if (-not (Test-Path $OUT)) {
        New-Item -ItemType Directory -Path $OUT -Force | Out-Null
    }
    
    $query = "SET NOCOUNT ON; SELECT DB_NAME() AS dbname, t.name AS trigger_name, OBJECT_NAME(t.parent_id) AS table_name FROM sys.triggers t WHERE t.parent_id <> 0 ORDER BY table_name, trigger_name;"
    
    sqlcmd -S $env:PACS_SERVER -U $env:PACS_USER -P $env:PACS_PW -d $env:PACS_DB -W -h-1 -s"|" -Q $query | Out-File -FilePath "$OUT/trigger_profile.txt" -Encoding UTF8
    
    Write-Host "✅ Trigger profile saved to $OUT/trigger_profile.txt" -ForegroundColor Green
    Write-Host ""
    Get-Content "$OUT/trigger_profile.txt" | Select-Object -First 20
}

function Invoke-SqlTests {
    # Pure-SQL test suite — no tSQLt, no CLR, no external download needed.
    # Runs scripts/sql/tests/pacs_tests.sql against PACS_Training via docker exec.
    Write-Host "🧪 Running PACS pure-SQL test suite against PACS_Training..." -ForegroundColor Cyan

    $testFile = Join-Path $PSScriptRoot 'scripts\sql\tests\pacs_tests.sql'
    if (-not (Test-Path $testFile)) {
        Write-Host "❌ Test file not found: $testFile" -ForegroundColor Red
        exit 1
    }

    # Check container is running
    $running = docker inspect -f '{{.State.Running}}' tf-mssql 2>$null
    if ($running -ne 'true') {
        Write-Host "❌ Container tf-mssql is not running. Start with: docker compose -f pacs-server-benton/infra/docker/compose.mssql.yml up -d" -ForegroundColor Red
        exit 1
    }

    Write-Host "  Target DB : PACS_Training (mirrors pacs_oltp schema)" -ForegroundColor Gray
    Write-Host "  Test file : $testFile" -ForegroundColor Gray
    Write-Host ""

    $sqlPw = if ($env:PACS_PW) { $env:PACS_PW } else { "TF_Pacs2026!" }

    # Stream test SQL into the container — '-b' makes sqlcmd exit non-zero on RAISERROR
    Get-Content $testFile | docker exec -i tf-mssql `
        /opt/mssql-tools18/bin/sqlcmd `
        -S localhost -U sa -P $sqlPw -C -d PACS_Training -b

    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "❌ One or more tests FAILED (exit $LASTEXITCODE)" -ForegroundColor Red
        exit $LASTEXITCODE
    }
    Write-Host ""
    Write-Host "✅ All PACS tests passed." -ForegroundColor Green
}

function Invoke-ApiRun {
    Write-Host "🚀 Starting PacsApi dev server on http://localhost:5200..." -ForegroundColor Cyan
    $apiProj = Join-Path $PSScriptRoot 'pacs-server-benton\api\PacsApi\PacsApi.csproj'
    $env:ASPNETCORE_ENVIRONMENT = 'Development'
    dotnet run --project $apiProj --launch-profile http
}

function Invoke-ApiBuild {
    Write-Host "🔨 Building PacsApi..." -ForegroundColor Cyan
    $apiProj = Join-Path $PSScriptRoot 'pacs-server-benton\api\PacsApi\PacsApi.csproj'
    dotnet build $apiProj --nologo
    if ($LASTEXITCODE -ne 0) { Write-Host "❌ PacsApi build FAILED" -ForegroundColor Red; exit 1 }
    Write-Host "✅ PacsApi build succeeded" -ForegroundColor Green
}

function Invoke-ApiTest {
    Write-Host "🧪 Smoke-testing PacsApi health endpoint..." -ForegroundColor Cyan
    $url = "http://localhost:5200/health"
    try {
        $resp = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        if ($resp.StatusCode -eq 200) {
            Write-Host "✅ GET $url → $($resp.StatusCode)" -ForegroundColor Green
        } else {
            Write-Host "❌ GET $url returned $($resp.StatusCode)" -ForegroundColor Red; exit 1
        }
    } catch {
        Write-Host "❌ Could not reach $url — is PacsApi running? (.\Make.ps1 api-run)" -ForegroundColor Red
        exit 1
    }
}

function Invoke-PacsHealthReport {
    Write-Host "===========================================================" -ForegroundColor Cyan
    Write-Host "  Benton County PACS — Stack Health Report" -ForegroundColor Cyan
    Write-Host "  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
    Write-Host "===========================================================" -ForegroundColor Cyan
    Write-Host ""

    # 1. SQL Server container
    Write-Host "[ SQL Server ]" -ForegroundColor Yellow
    $sqlRunning = docker inspect -f '{{.State.Running}}' tf-mssql 2>$null
    if ($sqlRunning -eq 'true') {
        Write-Host "  tf-mssql : RUNNING" -ForegroundColor Green
        # Quick connectivity check
        $ping = "SELECT @@VERSION;" | docker exec -i tf-mssql `
            /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$env:PACS_PW" -C -W -h-1 -Q "SELECT 'OK'" 2>$null
        if ($ping -match 'OK') {
            Write-Host "  SQL auth  : OK" -ForegroundColor Green
        } else {
            Write-Host "  SQL auth  : FAIL (check SA_PASSWORD)" -ForegroundColor Red
        }
    } else {
        Write-Host "  tf-mssql : NOT RUNNING  (run: .\Make.ps1 docker-up)" -ForegroundColor Red
    }
    Write-Host ""

    # 2. Monitoring stack
    Write-Host "[ Monitoring Stack ]" -ForegroundColor Yellow
    foreach ($svc in @("pacs-prometheus", "pacs-grafana", "pacs-sql-exporter")) {
        $state = docker inspect -f '{{.State.Running}}' $svc 2>$null
        if ($state -eq 'true') {
            Write-Host "  $svc : RUNNING" -ForegroundColor Green
        } else {
            Write-Host "  $svc : not running" -ForegroundColor DarkGray
        }
    }
    Write-Host ""

    # 3. PacsApi
    Write-Host "[ PacsApi ]" -ForegroundColor Yellow
    try {
        $resp = Invoke-WebRequest -Uri "http://localhost:5200/health" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
        Write-Host "  http://localhost:5200/health : $($resp.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "  http://localhost:5200/health : not reachable  (run: .\Make.ps1 api-run)" -ForegroundColor DarkGray
    }
    Write-Host ""

    # 4. Inventory snapshot (if cached)
    Write-Host "[ Inventory Snapshot ]" -ForegroundColor Yellow
    $inv = Join-Path $PSScriptRoot '_artifacts/pacs_inventory.json'
    if (Test-Path $inv) {
        $data = Get-Content $inv -Raw | ConvertFrom-Json
        Write-Host "  Timestamp : $($data.timestamp)" -ForegroundColor Gray
        $s = $data.summary
        Write-Host "  Tables    : $($s.tables)   Procs: $($s.procedures)   Views: $($s.views)" -ForegroundColor White
        Write-Host "  Indexes   : $($s.indexes)   FK:    $($s.foreign_keys)   Triggers: $($s.triggers)" -ForegroundColor White
        if ($data.row_counts) {
            $rc = $data.row_counts
            Write-Host "  property  : $($rc.property)   owner: $($rc.owner)   property_val: $($rc.property_val)" -ForegroundColor White
        }
    } else {
        Write-Host "  No cached inventory — run: .\Make.ps1 pacs-inventory" -ForegroundColor DarkGray
    }
    Write-Host ""
    Write-Host "===========================================================" -ForegroundColor Cyan
}

function Invoke-DataDictionary {
    Write-Host "📚 Exporting data dictionary from extended properties..." -ForegroundColor Cyan
    & ./scripts/sql/export_data_dictionary.ps1 -Server $env:PACS_SERVER -Database $env:PACS_DB -Username $env:PACS_USER -Password $env:PACS_PW -OutputDir "$OUT/data_dictionary"
}

function Invoke-AllChecks {
    Invoke-PacsInventory
    Invoke-VerifySurface
    Invoke-TriggerProfile
    Invoke-SqlTests

    # R1 Observability smoke test (non-blocking — monitoring stack may not be running in CI)
    $r1Script = Join-Path $PSScriptRoot 'pacs-server-benton/scripts/Test-R1-Monitoring.ps1'
    if (Test-Path $r1Script) {
        Write-Host "🔭 Running R1 monitoring smoke test..." -ForegroundColor Cyan
        pwsh -NonInteractive -File $r1Script -SqlServer $env:PACS_SERVER -SaPassword $env:PACS_PW
        if ($LASTEXITCODE -ne 0) {
            Write-Host "⚠️  R1 monitoring smoke test had failures (non-blocking in all-checks)" -ForegroundColor Yellow
        }
    }

    Write-Host ""
    Write-Host "✅ All checks complete. Artifacts in $OUT/" -ForegroundColor Green
}

function Invoke-ValidateMermaid {
    Write-Host "🔍 Validating Mermaid diagram syntax..." -ForegroundColor Cyan
    
    $files = @("erd.mmd", "crossdb.mmd", "wcf.mmd", "recalc_flow.mmd", "trigger_cascade.mmd", "api_flow.mmd")
    
    foreach ($file in $files) {
        try {
            npx -y @mermaid-js/mermaid-cli@10 -i "$DOCS/$file" -o "$env:TEMP/mermaid_test.svg" 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ $file OK" -ForegroundColor Green
            }
            else {
                Write-Host "❌ $file FAILED" -ForegroundColor Red
            }
        }
        catch {
            Write-Host "❌ $file FAILED" -ForegroundColor Red
        }
    }
}

function Invoke-AsendCertify {
    Write-Host "🏛️ Generating Asend/Proval county certification pack..." -ForegroundColor Cyan

    $script = Join-Path $PSScriptRoot 'scripts\diagnostics\Build-AsendProvalCertification.ps1'
    $profileDir = Join-Path $PSScriptRoot '_artifacts\asend_proval\profiling'
    $outputDir  = Join-Path $PSScriptRoot '_artifacts\asend_proval\certification'
    if (-not (Test-Path $script)) {
        Write-Host "❌ Certification script not found: $script" -ForegroundColor Red
        exit 1
    }

    & $script `
        -ProfileDir $profileDir `
        -OutputDir $outputDir `
        -CountyName "Benton County"

    if (-not $?) {
        Write-Host "❌ Asend/Proval certification generation failed" -ForegroundColor Red
        exit 1
    }

    Write-Host "✅ Certification artifacts written to $outputDir" -ForegroundColor Green
}

function Invoke-AsendIntake {
    Write-Host "📦 Running one-command Asend/Proval county intake..." -ForegroundColor Cyan

    $script = Join-Path $PSScriptRoot 'scripts\diagnostics\Run-AsendProvalCountyIntake.ps1'
    if (-not (Test-Path $script)) {
        Write-Host "❌ Intake runner script not found: $script" -ForegroundColor Red
        exit 1
    }

    $county = if ($env:COUNTY_NAME) { $env:COUNTY_NAME } else { "Benton County" }
    $mdb1 = if ($env:MDB1) { $env:MDB1 } else { "" }
    $mdb2 = if ($env:MDB2) { $env:MDB2 } else { "" }
    $state = if ($env:COUNTY_STATE) { $env:COUNTY_STATE } else { "WA" }
    $owner = if ($env:INTAKE_OWNER) { $env:INTAKE_OWNER } else { "" }
    $tier = if ($env:SUPPORT_TIER) { $env:SUPPORT_TIER } else { "Legacy-Only" }
    $assessor = if ($env:ASSESSOR_CONTACT) { $env:ASSESSOR_CONTACT } else { "" }
    $dba = if ($env:DBA_CONTACT) { $env:DBA_CONTACT } else { "" }
    $it = if ($env:IT_CONTACT) { $env:IT_CONTACT } else { "" }
    $notes = if ($env:PRODUCTION_NOTES) { $env:PRODUCTION_NOTES } else { "" }

    if ([string]::IsNullOrWhiteSpace($mdb1)) {
        Write-Host "❌ Missing MDB1 environment variable." -ForegroundColor Red
        Write-Host "   Example:" -ForegroundColor Yellow
        Write-Host "   `$env:COUNTY_NAME='Benton County'; `$env:MDB1='e:\\path\\gis.mdb'; `$env:MDB2='e:\\path\\real.mdb'; `$env:ASSESSOR_CONTACT='Jane Doe'; .\Make.ps1 asend-intake" -ForegroundColor Gray
        exit 1
    }

    & $script `
        -CountyName $county `
        -MdbPath1 $mdb1 `
        -MdbPath2 $mdb2 `
        -State $state `
        -IntakeOwner $owner `
        -AssessorContact $assessor `
        -DbaContact $dba `
        -ItContact $it `
        -ProductionSystemNotes $notes `
        -SupportTierTarget $tier

    if (-not $?) {
        Write-Host "❌ County intake failed" -ForegroundColor Red
        exit 1
    }

    Write-Host "✅ County intake completed" -ForegroundColor Green
}

function Invoke-DockerUp {
    Write-Host "Starting PACS full stack (SQL + Prometheus + Grafana + sql_exporter)..." -ForegroundColor Cyan
    $compose = Join-Path $PSScriptRoot 'pacs-server-benton\infra\docker\compose.full.yml'
    docker compose -f $compose up -d
    if ($LASTEXITCODE -ne 0) { Write-Host "docker compose up failed" -ForegroundColor Red; exit 1 }
    Write-Host ""
    Write-Host "  SQL Server  : localhost,1433" -ForegroundColor Gray
    Write-Host "  Prometheus  : http://localhost:9090" -ForegroundColor Gray
    Write-Host "  Grafana     : http://localhost:3000  (admin / admin)" -ForegroundColor Gray
    Write-Host "  sql_exporter: http://localhost:9399/metrics" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Stack is starting. Run '.\ Make.ps1 docker-logs' to watch progress." -ForegroundColor Green
}

function Invoke-DockerDown {
    Write-Host "Stopping PACS full stack..." -ForegroundColor Cyan
    $compose = Join-Path $PSScriptRoot 'pacs-server-benton\infra\docker\compose.full.yml'
    docker compose -f $compose down
    if ($LASTEXITCODE -ne 0) { Write-Host "docker compose down failed" -ForegroundColor Red; exit 1 }
    Write-Host "Stack stopped." -ForegroundColor Green
}

function Invoke-DockerLogs {
    Write-Host "Tailing logs (Ctrl+C to stop)..." -ForegroundColor Cyan
    $compose = Join-Path $PSScriptRoot 'pacs-server-benton\infra\docker\compose.full.yml'
    docker compose -f $compose logs --follow --tail 50
}

function Invoke-PublishSql {
    Write-Host "Building DACPACs and deploying to SQL Server..." -ForegroundColor Cyan
    $publish = Join-Path $PSScriptRoot 'pacs-server-benton\scripts\publish.ps1'
    $sqlPw   = if ($env:SA_PASSWORD) { $env:SA_PASSWORD } elseif ($env:PACS_PW) { $env:PACS_PW } else { 'TF_Pacs2026!' }
    pwsh -NonInteractive -File $publish -SqlServer "$env:PACS_SERVER" -SaPassword $sqlPw
    if ($LASTEXITCODE -ne 0) { Write-Host "publish.ps1 FAILED" -ForegroundColor Red; exit 1 }

    # Provision the pacs_api_svc least-privilege login after schema is deployed
    Write-Host "Provisioning pacs_api_svc service account..." -ForegroundColor Cyan
    $svcPw  = if ($env:PACS_API_SVC_PASSWORD) { $env:PACS_API_SVC_PASSWORD } else { 'PacsApi_Svc2026!' }
    $svcSql = (Get-Content (Join-Path $PSScriptRoot 'scripts\sql\create_api_service_account.sql') -Raw) `
        -replace '\$\(PACS_API_SVC_PASSWORD\)', $svcPw
    $svcSql | docker exec -i tf-mssql /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P $sqlPw -C 2>&1 |
        Where-Object { $_ -match 'pacs_api_svc|ERROR|error' } | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    Write-Host "DACPACs deployed." -ForegroundColor Green
}

function Invoke-Clean {
    Write-Host "🧹 Cleaning generated artifacts..." -ForegroundColor Cyan
    
    if (Test-Path $OUT) {
        Remove-Item -Path $OUT -Recurse -Force
    }
    
    Write-Host "✅ Clean complete" -ForegroundColor Green
}

# Main execution
switch ($Target.ToLower()) {
    "help" { Show-Help }
    "viz" { Invoke-Viz }
    "viz-png" { Invoke-VizPng }
    "pacs-inventory" { Invoke-PacsInventory }
    "twin-verify-surface" { Invoke-VerifySurface }
    "twin-trigger-profile" { Invoke-TriggerProfile }
    "docker-up"    { Invoke-DockerUp }
    "docker-down"  { Invoke-DockerDown }
    "docker-logs"  { Invoke-DockerLogs }
    "publish-sql"  { Invoke-PublishSql }
    "sql-tests" { Invoke-SqlTests }
    "data-dictionary" { Invoke-DataDictionary }
    "all-checks" { Invoke-AllChecks }
    "validate-mermaid" { Invoke-ValidateMermaid }
    "asend-certify" { Invoke-AsendCertify }
    "asend-intake" { Invoke-AsendIntake }
    "api-run" { Invoke-ApiRun }
    "test-api" { Invoke-ApiTest }
    "api-build" { Invoke-ApiBuild }
    "pacs-health-report" { Invoke-PacsHealthReport }
    "clean" { Invoke-Clean }
    default {
        Write-Host "❌ Unknown target: $Target" -ForegroundColor Red
        Write-Host ""
        Show-Help
        exit 1
    }
}
