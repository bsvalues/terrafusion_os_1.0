# County Studio Risk Surfaces Design

## Doctrine

County Studio is organized around how valuation decisions are made, corrected, and defended. For Benton County, the primary operating model is valuation structure, not municipal geography.

The county landing surface is a risk surface, not a navigation tree:

```text
County Health
Revaluation Cycle Risk
Neighborhood Risk
Model Group Risk
District Exposure
Value Tier Equity
Unified Risk Ledger
```

City remains reference metadata only. It must not be the default drill path, command queue, or analytical lens.

## Phase 1 Scope

This implementation creates the five Benton command boards from active County Studio segment data:

- Revaluation Cycle Health Board
- Neighborhood Risk Board
- Model Group Risk Board
- Taxing District Exposure Board
- Value Tier Equity Board

The boards summarize parcel counts, ratio sample counts, median ratio, COD, PRD, PRB, exception burden, and composite risk where data is available. Missing dimensions are shown as explicit data contract gaps, not substituted with city or ZIP.

## Phase 2 Scope

This implementation adds a Unified Risk Ledger that ranks all available risk objects across the five boards. The ledger becomes the county command queue:

```text
Rank | Object | Type | Risk | Reason | Next Action
```

Selecting a neighborhood ledger item drills into its parcel evidence through the existing neighborhood/segment table. Selecting a segment-backed item selects the strongest evidence segment.

## Phase 3 Preparation

The implementation does not build simulation, recalibration, appeal prediction, or forecasting. It only prepares clean AI/workflow inputs by attaching Benton context to risk objects:

- revaluation cycle
- market area
- neighborhood
- model group
- property class
- value tier
- taxing district
- segment id

Existing Inspector, Dais, Dossier, Atlas, SalesForge, CostForge, and CompsForge handoffs remain the working correction surfaces.

## Data Contract

Current segment data already contains:

- `revalArea`
- `geographyRef`
- `buildingType`
- `qualityGrade`
- `segmentType`
- ratio metrics
- parcel and exception counts

The UI accepts these optional future Benton fields when the backend provides them:

- `marketArea`
- `modelGroup`
- `propertyClass`
- `valueTier`
- `taxingDistrict`

Until those fields are available, the corresponding board shows a contract gap or a conservative derived label. City is never used as a replacement analytical key.

## UI Behavior

County view opens with County Health followed by the Benton risk surface board and Unified Risk Ledger. The city rollup is removed from the primary county landing surface.

The breadcrumb copy changes from `County -> City -> Neighborhood -> Segment` to `County -> Risk Surface -> Parcel Evidence`. Existing city drill functions remain in the store as compatibility code for older rollup components and tests, but new county-level work does not route through them.

## Testing

Focused tests cover:

- risk surface aggregation
- missing Benton dimensions producing explicit contract gaps
- county landing rendering risk boards instead of city rollup as the primary table
- ledger selection drilling into neighborhood evidence without city-first routing

## Non-Goals

- No database seeding work.
- No TerraFusion Sync work.
- No forecasting engine.
- No recalibration lab.
- No appeal prediction AI.
- No replacement of the existing downstream correction workbenches.
