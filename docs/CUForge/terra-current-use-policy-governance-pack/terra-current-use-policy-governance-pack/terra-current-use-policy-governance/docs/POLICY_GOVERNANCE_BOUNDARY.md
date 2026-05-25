# Current Use Policy Governance Boundary

## Purpose

Adds versioned policy governance so rollback calculations and notices can always reference the exact rule state used.

## Forge Owns

- rollback policy logic
- policy pack activation
- rule version references
- calculation policy resolution

## Dais Owns

- workflow using resolved policy facts

## TerraTrace Owns

- policy activation audit
- policy resolution references

## Rule

Calculations must reference immutable policy versions.
Never recalculate historical removals using silently changed rules.

## Frontend Wiring

Add:

```tsx
<CurrentUsePolicyGovernancePanel countyId={overview.countyId} />
```

## Backend Wiring

Register:

```csharp
services.AddTerraCurrentUsePolicy();
```
