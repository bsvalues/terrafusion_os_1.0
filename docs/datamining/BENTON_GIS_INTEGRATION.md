# Benton County GIS Integration (TMR-152)

## Overview

TerraFusion DataMining integrates with Benton County GIS for spatial property data, parcel boundaries, and geographic analysis.

## Configuration

All endpoints and credentials are read from `IConfiguration`. No secrets in code.

### Required Configuration Keys

| Key | Description |
|-----|-------------|
| `DataSources:benton-gis:Endpoint` | GIS service base URL |
| `DataSources:benton-gis:ApiKey` | API key (if required) |
| `DataSources:benton-gis:LayerIds` | Comma-separated layer IDs to query |

### Environment Variables

```bash
export DATASOURCES__BENTON_GIS__ENDPOINT="https://gis.bentoncounty.example.com/arcgis/rest"
export DATASOURCES__BENTON_GIS__APIKEY="<from-secure-vault>"
```

## Data Layers

| Layer | Description | Use Case |
|-------|-------------|----------|
| Parcels | Parcel boundaries | Property identification |
| Zoning | Zoning districts | Land use classification |
| Flood | Flood zones | Risk assessment |
| Addresses | Address points | Geocoding validation |

## Geocoding

`LocationUtils` and `LocationProcessing` handle batch geocoding:

- Forward geocoding: address to lat/long
- Benton County bounds validation (46.0-46.7N, 119.1-119.9W)
- Distance calculations via Haversine formula

## Data Flow

1. GIS connector queries configured ArcGIS REST endpoints
2. Spatial data is normalized and stored in the DataMining store
3. Parcel boundaries are linked to PACS records via parcel number

## Troubleshooting

- **No spatial data**: Verify GIS endpoint URL and layer IDs
- **Coordinates out of bounds**: Check `LocationProcessing.IsWithinBentonCounty()`
- **Rate limiting**: GIS services may throttle; check connector retry settings
