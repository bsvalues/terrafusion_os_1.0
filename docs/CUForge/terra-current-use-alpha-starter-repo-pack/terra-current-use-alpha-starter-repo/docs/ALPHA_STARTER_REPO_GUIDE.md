# Alpha Starter Repo Guide

## What This Is

A minimal implementation target.

It is intentionally smaller than the full generated system.

## Install

1. Copy `src/modules/terra-current-use`.
2. Copy `backend/TerraFusion.Modules.CurrentUse`.
3. Register backend:

```csharp
services.AddTerraCurrentUseAlpha();
```

4. Register frontend tab:

```tsx
<CurrentUseAlphaTab parcelId={parcelId} />
```

## Do Not Add Yet

- AI
- GIS
- Treasurer
- analytics
- import
- multi-county

## Success

The tab renders and rollback returns four years for Farm & Ag after 2025-09-01.
