# Controller Route Map — Alpha

## Required

```txt
GET  /api/forge/current-use/parcels/{parcelId}/overview
GET  /api/forge/current-use/parcels/{parcelId}/evidence
GET  /api/forge/current-use/parcels/{parcelId}/timeline
POST /api/forge/current-use/rollback/calculate
GET  /api/forge/current-use/policy/{countyId}
POST /api/forge/current-use/policy/resolve
GET  /api/trace/current-use/parcels/{parcelId}
POST /api/trace/current-use/events
GET  /api/trace/current-use/parcels/{parcelId}/verify
GET  /api/forge/current-use/security/roles
POST /api/forge/current-use/security/authorize
GET  /api/forge/current-use/observability/health
```

## Optional In Alpha

```txt
POST /api/forge/current-use/notices/preview
```
