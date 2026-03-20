# County Provisioning Runbook

Date: 2026-03-20
Phase: 13B
Applies to: Any WA State county onboarding to TerraFusion OS

## Overview

This runbook documents the steps required to provision a new county in TerraFusion OS. In Phase 13B, "provisioning" is frontend-only: no backend database migrations are required. The steps add a county test fixture, verify isolation headers, and validate the provisioning contract test suite.

Backend PACS data connection and AKS multi-tenant deployment are Phase 14+ scope.

---

## Preconditions

Before provisioning a new county, confirm all of the following:

| Item | Description | Status |
|------|-------------|--------|
| County slug | Unique lowercase ASCII identifier (e.g., `cowlitz`, `yakima`) | Required |
| Admin user | County assessor admin credentials for login | Required |
| PACS connection | Harris PACS 9.0 connection string + county FIPS code | Required for Phase 14+ |
| `.env.demo` | County-specific demo environment file (see template) | Required for demo |

### Slug format rules

A valid county slug must:
- Start with a lowercase letter (`a-z`)
- Contain only lowercase letters, digits, and hyphens (`a-z0-9-`)
- Be 2–31 characters total
- Be unique across all provisioned counties

Examples: `benton`, `cowlitz`, `yakima`, `king`, `clark`

---

## Step 1: Add county test fixture

Add to `frontend/apps/os-shell/src/__tests__/fixtures/counties.ts`:

```typescript
/** County X — example new county (WA FIPS XXX) */
export const COUNTY_X_AUTH: AuthContextValue = {
  isAuthenticated: true,
  userId: '<county-slug>-assessor-001',
  countyId: '<county-slug>',
  roles: ['assessor'],
  token: 'fake-<county-slug>-token',
};

export const COUNTY_X_PARCEL_IDS = {
  residential: '<county-prefix>-0001-010-0010-000',
} as const;
```

Replace `<county-slug>` with the county's slug (e.g., `yakima`) and `<county-prefix>` with a unique numeric prefix (e.g., `3`).

---

## Step 2: Add PACS response to fixture

Add to `PACS_RESPONSES_BY_COUNTY` in `frontend/apps/os-shell/src/__tests__/fixtures/counties.ts`:

```typescript
'<county-slug>': {
  items: [
    {
      geoId: COUNTY_X_PARCEL_IDS.residential,
      address: '<example address>',
      assessedValue: 0,
      marketValue: 0,
      propertyType: 'Residential',
    },
  ],
  totalCount: <estimated-parcel-count>,
},
```

Use the county's approximate parcel count. For reference: Benton has 89,247; Cowlitz has ~44,000.

---

## Step 3: Create `.env.demo` for the new county

Copy the example env file and fill in county-specific values:

```bash
cp frontend/apps/os-shell/.env.demo.example frontend/apps/os-shell/.env.demo
```

Edit the following keys:

```bash
VITE_COUNTY_ID=<county-slug>
VITE_COUNTY_NAME=<County Name>
VITE_API_URL=<pacs-api-endpoint>
```

---

## Step 4: Run provisioning contract test

```bash
cd frontend/apps/os-shell
pnpm vitest run src/__tests__/provisioning/countyProvisioning.contract.test.ts --reporter=verbose
```

Expected: all tests pass. The contract validates:
- County slug format
- `AuthContextValue` shape has all required fields
- `buildCountyScopedHeaders` produces a valid `X-County-Id` header for the new county

---

## Step 5: Run multi-county isolation test

```bash
pnpm vitest run src/__tests__/isolation/multiCountyIsolation.contract.test.tsx --reporter=verbose
```

Expected: all tests pass. The isolation test proves County A parcels never appear in County B results.

---

## Step 6: Run demo journey for new county

Launch app with new county's `.env.demo`:

```bash
cd frontend/apps/os-shell
pnpm vite --mode demo
```

Walk through the demo journey manually:
1. Login with county admin credentials
2. Search parcels — verify county-specific parcel IDs appear
3. Click a parcel — workbench opens with correct parcel data
4. Navigate Forge, Atlas, Clerk tabs — no crash, no cross-county data leakage

---

## Rollback

To remove a county provisioning:

1. Remove the county fixture entry from `frontend/apps/os-shell/src/__tests__/fixtures/counties.ts`
2. Delete `frontend/apps/os-shell/.env.demo`

No backend changes were made in Phase 13B, so no database rollback is required.

---

## Counties Currently Provisioned

| County | Slug | FIPS | Phase | Notes |
|--------|------|------|-------|-------|
| Benton | `benton` | WA-005 | Phase 7 (complete) | Primary county, 89,247 parcels |
| Cowlitz | `cowlitz` | WA-015 | Phase 13B (fixture only) | Fixture added; PACS connection Phase 14+ |

---

## Troubleshooting

### `buildCountyScopedHeaders` returns `isolated: false`

The county auth context has a missing or empty `countyId`. Verify:
- The fixture's `countyId` field is a non-empty string
- The slug passes `isValidCountySlug()` validation

### Test imports fail for `fixtures/counties`

If Agent B1 has not yet completed, the test uses inline fixture stubs. After B1 commits `counties.ts`, update the provisioning test to import from `../fixtures/counties` and remove the inline stubs.

### Parcel cross-contamination in isolation test

If County A parcel IDs appear in County B results, the mock in `multiCountyIsolation.contract.test.tsx` is reading the wrong `currentAuth`. Verify that `currentAuth` is being set before each render.

---

## Related Files

| File | Purpose |
|------|---------|
| `frontend/apps/os-shell/src/__tests__/fixtures/counties.ts` | County test fixtures (Benton + Cowlitz) |
| `frontend/apps/os-shell/src/__tests__/provisioning/countyProvisioning.contract.test.ts` | This runbook's contract test |
| `frontend/apps/os-shell/src/__tests__/isolation/multiCountyIsolation.contract.test.tsx` | Multi-county isolation proof |
| `frontend/apps/os-shell/src/services/countyIsolation.ts` | Header builder + isolation audit registry |
| `frontend/apps/os-shell/src/auth/useAuthContext.ts` | `AuthContextValue` type definition |
