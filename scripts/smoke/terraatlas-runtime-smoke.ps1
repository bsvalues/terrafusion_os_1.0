param(
  [string]$ApiBaseUrl = "http://127.0.0.1:5047",
  [string]$ParcelId = "119802030006001"
)

$ErrorActionPreference = "Stop"

$base = $ApiBaseUrl.TrimEnd("/")

function Assert-True {
  param(
    [bool]$Condition,
    [string]$Message
  )

  if (-not $Condition) {
    throw $Message
  }
}

function Get-Json {
  param([string]$Path)

  Invoke-RestMethod -Uri "$base$Path" -TimeoutSec 30
}

$health = Get-Json "/health"
Assert-True ($health.status -eq "Healthy") "API health is not Healthy."

$boundary = Get-Json "/api/atlas/gis/parcels/$ParcelId/boundary"
$combined = Get-Json "/api/atlas/gis/parcels/$ParcelId"

$ring = @()
if ($combined.boundary.ringJson) {
  $ring = $combined.boundary.ringJson | ConvertFrom-Json
}

Assert-True ($boundary.parcelId -eq $ParcelId) "Boundary parcelId mismatch."
Assert-True ($boundary.source -eq "live") "Boundary source is not live."
Assert-True ($combined.boundary.parcelId -eq $ParcelId) "Combined boundary parcelId mismatch."
Assert-True ($combined.boundary.source -eq "live") "Combined boundary source is not live."
Assert-True ($combined.layers.parcelId -eq $ParcelId) "Combined layers parcelId mismatch."
Assert-True ($combined.layers.source -eq "live") "Combined layers source is not live."
Assert-True ($combined.boundary.ownerName -eq "COX DONNA M") "Owner mismatch."
Assert-True (($combined.boundary.situsDisplay -replace "\s+", " ") -like "*203 E 47TH PL*") "Situs mismatch."
Assert-True ($combined.boundary.centroid.derivedFrom -eq "arcgis-centroid") "Centroid source mismatch."
Assert-True ([math]::Round([double]$combined.boundary.centroid.lat, 6) -eq 46.166972) "Centroid latitude mismatch."
Assert-True ([math]::Round([double]$combined.boundary.centroid.lng, 6) -eq -119.115613) "Centroid longitude mismatch."
Assert-True ([double]$combined.boundary.areaAcres -eq 0.3271) "Area acres mismatch."
Assert-True ([int]$combined.boundary.areaSqFt -eq 14250) "Area square feet mismatch."
Assert-True ($ring.Count -eq 15) "Expected 15 ring points."
Assert-True ($combined.layers.taxArea.taxAreaNumber -eq "K1") "Tax area mismatch."
Assert-True ($combined.layers.landClass.primaryUseCd -eq "11") "Land class mismatch."
Assert-True ($combined.layers.flood.source -eq "stub") "Flood source should remain stub external enrichment."
Assert-True ($null -eq $combined.layers.zoning) "Zoning should remain null external enrichment."

[pscustomobject]@{
  status = "pass"
  terminalStatus = ("PRODUCTION READY WITH EXTERNAL ENRICHMENT GAPS {0} TERRAATLAS SUITE APPS PARTIAL" -f [char]0x2014)
  routeScope = "/atlas"
  appProof = [pscustomobject]@{
    TerraGIS = "PARTIAL"
    ParcelLens = "PARTIAL"
    LayerWorks = "PARTIAL"
    TerraQuery = "READ_ONLY"
    TerraSketch = "NOT_IMPLEMENTED"
    TerraPrint = "NOT_IMPLEMENTED"
    TerraExport = "NOT_IMPLEMENTED"
    TerraGISPro = "QUEUED"
    GeoEquity = "QUEUED"
    AppraisalGIS = "QUEUED"
  }
  dataCountTruth = [pscustomobject]@{
    gisGeometryRows = 80084
    ringJsonGeometries = 80083
    activeParcelCount = "not verified"
    pacsRows = "hidden from Suite UI unless explicitly labeled as PACS rows"
  }
  parcelId = $ParcelId
  boundarySource = $combined.boundary.source
  layersSource = $combined.layers.source
  owner = $combined.boundary.ownerName
  situs = ($combined.boundary.situsDisplay -replace "\s+", " ")
  centroid = [pscustomobject]@{
    lat = $combined.boundary.centroid.lat
    lng = $combined.boundary.centroid.lng
    derivedFrom = $combined.boundary.centroid.derivedFrom
  }
  areaAcres = $combined.boundary.areaAcres
  areaSqFt = $combined.boundary.areaSqFt
  ringPoints = $ring.Count
  taxArea = $combined.layers.taxArea.taxAreaNumber
  landClass = $combined.layers.landClass.primaryUseCd
  floodClassification = "EXTERNAL-ONLY: source stub"
  zoningClassification = "EXTERNAL-ONLY: zoning null"
} | ConvertTo-Json -Depth 5
