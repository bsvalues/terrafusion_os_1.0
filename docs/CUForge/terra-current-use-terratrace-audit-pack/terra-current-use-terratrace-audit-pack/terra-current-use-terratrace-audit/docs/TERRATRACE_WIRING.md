# TerraTrace Current Use Wiring

## Purpose

This slice adds append-only audit trace support to Current Use.

## Backend Registration

```csharp
services.AddTerraCurrentUseTrace();
```

This replaces the no-op Current Use audit sink with a Trace-backed sink.

## Frontend Wiring

Add to Current Use tab:

```tsx
<CurrentUseTracePanel parcelId={overview.parcelId} />
```

## API Routes

```txt
GET  /api/trace/current-use/parcels/{parcelId}
POST /api/trace/current-use/events
GET  /api/trace/current-use/parcels/{parcelId}/verify
```

## Audit Rule

Do not edit trace events.

Corrections must be appended as new events.

## Events to Emit

- rollback calculation run
- rollback calculation locked
- notice preview generated
- notice sent
- document linked
- evidence packet reviewed
- workflow task created
- AI summary generated
- spatial review viewed
- removal finalized
