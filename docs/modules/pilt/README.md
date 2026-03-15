# PILT Module

## Purpose

The PILT (Payment In Lieu of Taxes) module tracks federal land acreage, calculates county entitlements under 31 U.S.C. 6901-6907, and generates annual PILT reports. It integrates with county parcel data to identify qualifying federal parcels and reconcile payments from the Department of the Interior.

## Architecture

### Backend

- **Routes**: `/api/pilt/*` -- CRUD for PILT records, entitlement calculations, and report generation.
- **Service**: `PiltService` handles acreage aggregation, entitlement math (Section 6902/6904), and sequestration adjustments.
- **Storage**: PILT records stored in the `PiltEntitlements` and `FederalParcels` tables via Entity Framework Core. County isolation enforced through the standard `CountyId` filter.

### Frontend

- **PILT Dashboard** (`/pilt`) -- Summary of current-year entitlement, acreage breakdown by federal program, and payment status.
- **Report Builder** (`/pilt/reports`) -- Generate and export annual PILT reports in PDF and CSV formats.
- **Acreage Editor** (`/pilt/acreage`) -- Review and adjust federal parcel acreage with GIS overlay.

### AI Agents

- **PiltAcreageValidator** -- Cross-references county GIS parcel boundaries against BLM/NFS shapefiles to flag acreage discrepancies.
- **PiltEntitlementAuditor** -- Verifies entitlement calculations against published DOI rates and population data.

## Data Model

| Table              | Key Columns                                                    |
|--------------------|----------------------------------------------------------------|
| FederalParcels     | Id, CountyId, ParcelNumber, ProgramCode, AgencyCode, Acreage   |
| PiltEntitlements   | Id, CountyId, FiscalYear, GrossEntitlement, Sequestration, Net |
| PiltPayments       | Id, EntitlementId, PaymentDate, Amount, TreasuryRef            |

All tables include standard audit fields (`CreatedAt`, `UpdatedAt`, `CreatedBy`, `UpdatedBy`) managed by the `AuditableEntityInterceptor`.

## API Endpoints

| Method | Path                          | Description                          |
|--------|-------------------------------|--------------------------------------|
| GET    | `/api/pilt/entitlements`      | List entitlements for current county |
| GET    | `/api/pilt/entitlements/{fy}` | Get entitlement by fiscal year       |
| POST   | `/api/pilt/entitlements`      | Create or recalculate entitlement    |
| GET    | `/api/pilt/parcels`           | List federal parcels in county       |
| PUT    | `/api/pilt/parcels/{id}`      | Update parcel acreage                |
| GET    | `/api/pilt/reports/{fy}`      | Generate PILT report for fiscal year |
| GET    | `/api/pilt/payments`          | List payment records                 |

## Security Notes

All credentials are managed via environment variables. No secrets are stored in version control.

County data isolation is enforced at the query level -- every PILT query filters by the authenticated user's `CountyId`. Audit fields are auto-populated and cannot be overridden by API callers. Access requires the `pilt:read` or `pilt:write` permission scope.
