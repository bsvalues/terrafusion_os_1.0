# LEV-129 - Compliance Test Scenario Seeding

## Purpose

Documents demo data scenarios that exercise Washington State levy compliance
rules. Each scenario targets a specific statutory constraint.

## Scenarios

### 1. Constitutional 1% Limit Breach

- District with combined regular levies exceeding $10.00 per $1,000 AV.
- Expected: system flags violation and prevents certification.

### 2. Highest Lawful Levy (HLL) Cap

- District whose requested levy exceeds prior year HLL + 1% + new construction.
- Expected: system caps the levy at the HLL ceiling.

### 3. Pro-Ration (Lid Lift Interaction)

- Two overlapping districts where combined rates require pro-ration.
- Expected: system distributes available capacity proportionally.

### 4. Annexation Year Adjustment

- District with mid-year annexation changing assessed value base.
- Expected: rate recalculated using blended AV.

### 5. Voter-Approved Excess Levy

- School district with voter-approved M&O and bond levies.
- Expected: excess levy amounts excluded from 1% aggregate check.

## Seeding

Each scenario is a self-contained dataset inserted into a test schema.
Scenarios can be activated individually via a scenario ID parameter.

## Validation Queries

```sql
-- Scenario 1: should return 1 flagged district
SELECT * FROM compliance_flags WHERE rule = 'CONST_1PCT' AND tax_year = 2025;

-- Scenario 2: should show capped amount
SELECT requested, certified FROM levy_requests WHERE scenario = 'HLL_CAP';
```
