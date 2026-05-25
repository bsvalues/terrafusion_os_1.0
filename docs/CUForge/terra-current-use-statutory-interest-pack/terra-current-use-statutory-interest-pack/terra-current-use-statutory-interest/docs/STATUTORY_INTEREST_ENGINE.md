# Current Use Statutory Interest Engine

## Purpose

Replace Phase 1 simplified annual interest with date-based statutory interest accrual.

## Default Rule

Interest accrues from April 30 of the year the tax could have been paid without penalty to the removal date.

## Formula

```txt
interest = additionalTax × annualRate × dayCount / 365
```

## Integration Point

Rollback engine should call:

```csharp
ICurrentUseInterestCalculator.CalculateAsync(...)
```

for each rollback tax year.

## Guardrail

Every interest result must include:

- tax year
- accrual start date
- accrual end date
- day count
- annual rate
- formula
- total interest

## Frontend Wiring

Add:

```tsx
<CurrentUseInterestLedgerPanel />
```

near the rollback explanation ledger.
