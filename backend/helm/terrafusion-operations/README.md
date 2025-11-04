# TerraFusion Operations Service - Helm Chart

🏛️ **Government. Transcended.** - County systems integration for 39 Washington State counties

## Overview

Integration service synchronizing data from Harris PACS v12.4.7, Tyler Technologies Vision, and Aumentum Systems across 39 WA counties.

**Features:**
- 39 Washington State counties
- Harris PACS v12.4.7 integration
- Tyler Technologies Vision
- Aumentum Systems
- Tenant-isolated county data
- FISMA-High compliance
- Real-time property data sync

## Installation

```bash
helm install terrafusion-operations ./terrafusion-operations \
  --namespace terrafusion \
  --values values-production.yaml \
  --set counties.benton.enabled=true \
  --set counties.king.enabled=true
```

## Configuration

### Key Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `replicaCount` | Number of replicas | `3` |
| `service.port` | Service port | `5003` |
| `countyIntegration.totalCounties` | WA counties | `39` |
| `harrisPACS.version` | Harris PACS version | `12.4.7` |

### County Configuration

Enable/disable counties individually:

```yaml
counties:
  king:
    enabled: true
    population: 2300000
    parcels: 650000
    syncInterval: 300  # seconds
  benton:
    enabled: true
    population: 210000
    parcels: 89247
    syncInterval: 900
```

## County Systems

- **Harris PACS v12.4.7**: Property assessment system
- **Tyler Technologies Vision**: Tax/revenue system
- **Aumentum Systems**: Additional county operations

## Monitoring

Custom metrics:
- `operations_county_sync_duration_seconds`
- `operations_harris_pacs_requests_total`
- `operations_parcel_sync_count`

## Support

- Documentation: https://docs.terrafusion.gov/operations
- Email: operations-support@terrafusion.gov

---

🏛️ **Government. Transcended.** - 39 counties synchronized with excellence.
