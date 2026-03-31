# Pilt packaging repair — live endpoint verification
param([string]$Port = '5000')

$base = "http://localhost:$Port"
$loginUri = "$base/api/auth/login"
$body = '{"email":"assessor@terrafusionmarket.com","password":"test12345","rememberMe":false}'

# --- authenticate ---
$r = Invoke-WebRequest -UseBasicParsing -Uri $loginUri -Method POST -ContentType 'application/json' -Body $body -ErrorAction Stop
$j = $r.Content | ConvertFrom-Json
$jwt = $j.token ?? $j.accessToken ?? $j.jwt ?? $j.access_token
if (-not $jwt) { Write-Error "No JWT in login response. Keys: $($j | Get-Member -MemberType NoteProperty | Select-Object -ExpandProperty Name -join ',')"; exit 1 }
$h = @{ Authorization = "Bearer $jwt" }
Write-Host "AUTH OK (HTTP $($r.StatusCode))"

# --- 1. health (anon) ---
Write-Host "`n[1] GET /api/system/health"
$res = Invoke-WebRequest -UseBasicParsing -Uri "$base/api/system/health" -ErrorAction SilentlyContinue
Write-Host "HTTP $($res.StatusCode)"
$res.Content

# --- 2. catalog (auth) ---
Write-Host "`n[2] GET /api/modules"
try {
    $res = Invoke-WebRequest -UseBasicParsing -Uri "$base/api/modules" -Headers $h -ErrorAction Stop
    Write-Host "HTTP $($res.StatusCode)"
    $res.Content
} catch { Write-Host "HTTP $($_.Exception.Response.StatusCode.value__): $($_.ErrorDetails.Message)" }

# --- 3. by-name/Pilt (auth) ---
Write-Host "`n[3] GET /api/modules/by-name/Pilt"
try {
    $res = Invoke-WebRequest -UseBasicParsing -Uri "$base/api/modules/by-name/Pilt" -Headers $h -ErrorAction Stop
    Write-Host "HTTP $($res.StatusCode)"
    $res.Content
} catch { Write-Host "HTTP $($_.Exception.Response.StatusCode.value__): $($_.ErrorDetails.Message)" }

# --- 4. ProductionModules/Pilt (auth) ---
Write-Host "`n[4] GET /api/ProductionModules/Pilt"
try {
    $res = Invoke-WebRequest -UseBasicParsing -Uri "$base/api/ProductionModules/Pilt" -Headers $h -ErrorAction Stop
    Write-Host "HTTP $($res.StatusCode)"
    $res.Content
} catch { Write-Host "HTTP $($_.Exception.Response.StatusCode.value__): $($_.ErrorDetails.Message)" }
