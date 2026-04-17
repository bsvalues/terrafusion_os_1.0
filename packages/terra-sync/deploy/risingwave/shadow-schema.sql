-- shadow-schema.sql
-- Creates the `shadow` schema + tables in TerraFusion Postgres. These
-- tables mirror the canonical public."Properties", .CamaCharacteristics,
-- .ComparableSales, .PropertyAssessments tables structurally.
--
-- RisingWave JDBC sinks (mv_*.sql) write UPSERTs here. The
-- terra-sync-shadow-diff job (Task 14) compares shadow vs public and
-- emits daily delta reports. Existing consumers never read from the
-- shadow schema — Phase 3 cutover only happens after a 7-day parity
-- gate (<0.1% delta).

CREATE SCHEMA IF NOT EXISTS shadow;

CREATE TABLE IF NOT EXISTS shadow."Properties" (
    "Id" uuid PRIMARY KEY,
    "CountyId" uuid NOT NULL,
    "ParcelId" varchar(50) NOT NULL,
    "PropertyId" varchar(50) NOT NULL,
    "GeoId" varchar(50),
    "Neighborhood" varchar(50),
    "SitusCity" varchar(100),
    "SitusState" varchar(2),
    "SitusZip" varchar(20),
    "PropertyUseCode" varchar(20),
    "LegalDescription" varchar(2000),
    "LastUpdated" timestamp with time zone,
    UNIQUE ("CountyId", "ParcelId")
);

CREATE TABLE IF NOT EXISTS shadow."CamaCharacteristics" (
    "Id" uuid PRIMARY KEY,
    "CountyId" uuid NOT NULL,
    "ParcelId" varchar(50) NOT NULL,
    "TaxYear" int NOT NULL,
    "BuildingType" varchar(10),
    "ImprvVal" numeric(18,2),
    "PhysicalDepreciationPct" numeric(7,4),
    "DepreciationPct" numeric(7,4),
    "UpdatedAt" timestamp with time zone,
    UNIQUE ("CountyId", "ParcelId", "TaxYear")
);

CREATE TABLE IF NOT EXISTS shadow."ComparableSales" (
    "Id" uuid PRIMARY KEY,
    "CountyId" uuid NOT NULL,
    "ParcelId" varchar(50),
    "SaleDate" timestamp with time zone,
    "SalePrice" numeric(18,2),
    "AdjustedSalePrice" numeric(18,2),
    "SaleTypeCode" varchar(5),
    "CountyRatioCode" varchar(10),
    "Qualifier" varchar(10),
    "SuppressOnRatioRptCd" varchar(5),
    "IncludeNoCalc" boolean,
    "LandOnlySale" boolean
);

CREATE TABLE IF NOT EXISTS shadow."PropertyAssessments" (
    "Id" uuid PRIMARY KEY,
    "CountyId" uuid NOT NULL,
    "PropertyParcelId" varchar(50) NOT NULL,
    "AssessmentYear" int NOT NULL,
    "AssessedValue" numeric(18,2),
    "MarketValue" numeric(18,2),
    "ImprovementValue" numeric(18,2),
    "LandValue" numeric(18,2),
    UNIQUE ("CountyId", "PropertyParcelId", "AssessmentYear")
);
