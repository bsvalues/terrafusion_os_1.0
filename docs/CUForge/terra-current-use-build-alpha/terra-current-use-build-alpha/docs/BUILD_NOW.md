# Build Now

## Cutline

Build only this:

```txt
Property Workbench → Current Use tab → rollback calculation → explanation ledger → notice preview
```

## Frontend Mount

```tsx
import { CurrentUseAlphaTab } from '@/modules/terra-current-use';

<CurrentUseAlphaTab parcelId={parcelId} />
```

## Backend Registration

```csharp
services.AddTerraCurrentUse();
```

## API Routes

```txt
GET  /api/forge/current-use/parcels/{parcelId}/overview
POST /api/forge/current-use/rollback/calculate
```

## Done

- tab renders
- rollback runs
- four-year Farm & Ag rule passes
- seven-year Open Space rule passes
- explanation ledger visible
- notice preview says human review required
