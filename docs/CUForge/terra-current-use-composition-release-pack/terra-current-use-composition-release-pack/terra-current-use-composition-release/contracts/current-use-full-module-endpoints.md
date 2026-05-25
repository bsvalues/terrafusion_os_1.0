# Current Use Full Module Endpoint Map

## Core Forge

```txt
GET  /api/forge/current-use/parcels/{parcelId}/overview
GET  /api/forge/current-use/parcels/{parcelId}/evidence
GET  /api/forge/current-use/parcels/{parcelId}/timeline
POST /api/forge/current-use/rollback/calculate
POST /api/forge/current-use/notices/preview
```

## TerraTrace

```txt
GET  /api/trace/current-use/parcels/{parcelId}
POST /api/trace/current-use/events
GET  /api/trace/current-use/parcels/{parcelId}/verify
```

## Policy

```txt
GET  /api/forge/current-use/policy/{countyId}
POST /api/forge/current-use/policy/resolve
```

## Dossier

```txt
GET   /api/dossier/current-use/parcels/{parcelId}/evidence-packet
POST  /api/dossier/current-use/documents/link
PATCH /api/dossier/current-use/documents/{documentId}/status
```

## Dais

```txt
GET   /api/dais/current-use/parcels/{parcelId}/tasks
POST  /api/dais/current-use/tasks
PATCH /api/dais/current-use/tasks/{taskId}/status
```

## Atlas

```txt
GET /api/atlas/current-use/parcels/{parcelId}/spatial-review
GET /api/atlas/current-use/parcels/{parcelId}/homesite-overlay
```

## Treasurer

```txt
GET  /api/treasurer/current-use/parcels/{parcelId}/payment-packets
POST /api/treasurer/current-use/payment-packets
POST /api/treasurer/current-use/payment-packets/{paymentPacketId}/send
POST /api/treasurer/current-use/payment-packets/{paymentPacketId}/mark-paid
```

## Appeals

```txt
GET  /api/forge/current-use/appeals/parcels/{parcelId}
POST /api/forge/current-use/appeals
POST /api/forge/current-use/appeals/{appealId}/filed
```

## Compliance

```txt
GET  /api/forge/current-use/compliance/parcels/{parcelId}/summary
POST /api/forge/current-use/compliance/inspections
POST /api/forge/current-use/compliance/inspections/{inspectionId}/complete
```

## Analytics

```txt
GET /api/forge/current-use/analytics/{countyId}/summary
```
