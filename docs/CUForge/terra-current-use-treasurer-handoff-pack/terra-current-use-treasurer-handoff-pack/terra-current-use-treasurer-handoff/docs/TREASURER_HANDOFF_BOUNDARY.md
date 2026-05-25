# Current Use Treasurer Handoff Boundary

## Purpose

Create a controlled handoff from Forge rollback calculation to Treasurer payment/collection.

## Forge Owns

- rollback calculation
- calculation version
- calculation explanation
- payment packet creation from locked calculation

## Treasurer Owns

- payment collection
- receipts
- payment status
- treasury accounting

## Dais Owns

- task state such as WaitingOnTreasurer

## TerraTrace Owns

- packet created
- sent to treasurer
- paid receipt events

## Frontend Wiring

Add to Current Use tab:

```tsx
<CurrentUseTreasurerHandoffPanel parcelId={overview.parcelId} />
```

## Backend Wiring

Register:

```csharp
services.AddTerraCurrentUseTreasurerHandoff();
```

## API Routes

```txt
GET  /api/treasurer/current-use/parcels/{parcelId}/payment-packets
POST /api/treasurer/current-use/payment-packets
POST /api/treasurer/current-use/payment-packets/{paymentPacketId}/send
POST /api/treasurer/current-use/payment-packets/{paymentPacketId}/mark-paid
```

## Guardrail

This is not a payment processor.

It creates and tracks the handoff packet only.
