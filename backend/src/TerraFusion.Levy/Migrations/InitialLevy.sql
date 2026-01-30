CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

START TRANSACTION;

CREATE TABLE "Districts" (
    "Id" uuid NOT NULL,
    "CountyId" character varying(100) NOT NULL,
    "DistrictCode" character varying(50) NOT NULL,
    "Name" character varying(200) NOT NULL,
    "Description" character varying(2000),
    "DistrictType" character varying(100) NOT NULL,
    "Boundaries" jsonb,
    "TotalAssessedValue" numeric(18,2) NOT NULL,
    "ParcelCount" integer NOT NULL,
    "IsActive" boolean NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone,
    "CreatedBy" character varying(200) NOT NULL,
    "UpdatedBy" character varying(200),
    "Metadata" jsonb,
    CONSTRAINT "PK_Districts" PRIMARY KEY ("Id")
);

CREATE TABLE "LevyMeasures" (
    "Id" uuid NOT NULL,
    "CountyId" character varying(100) NOT NULL,
    "Name" character varying(200) NOT NULL,
    "Description" character varying(2000),
    "LevyYear" integer NOT NULL,
    "LevyType" character varying(100) NOT NULL,
    "Status" character varying(50) NOT NULL,
    "TargetAmount" numeric(18,2) NOT NULL,
    "CalculatedAmount" numeric(18,2) NOT NULL,
    "MaximumRate" numeric(10,6),
    "CalculatedRate" numeric(10,6) NOT NULL,
    "ApprovedDate" timestamp with time zone,
    "EffectiveDate" timestamp with time zone,
    "ExpirationDate" timestamp with time zone,
    "SubjectToLimit" boolean NOT NULL,
    "TotalAssessedValue" numeric(18,2) NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone,
    "CreatedBy" character varying(200) NOT NULL,
    "UpdatedBy" character varying(200),
    "QuantumOptimized" boolean NOT NULL,
    "AiConfidenceScore" numeric(5,4),
    "Metadata" jsonb,
    CONSTRAINT "PK_LevyMeasures" PRIMARY KEY ("Id")
);

CREATE TABLE "DistrictParcels" (
    "Id" uuid NOT NULL,
    "CountyId" character varying(100) NOT NULL,
    "DistrictId" uuid NOT NULL,
    "ParcelNumber" character varying(50) NOT NULL,
    "AssessedValue" numeric(18,2) NOT NULL,
    "IsActive" boolean NOT NULL,
    "AddedDate" timestamp with time zone NOT NULL,
    "RemovedDate" timestamp with time zone,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone,
    "CreatedBy" character varying(200) NOT NULL,
    "UpdatedBy" character varying(200),
    CONSTRAINT "PK_DistrictParcels" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_DistrictParcels_Districts_DistrictId" FOREIGN KEY ("DistrictId") REFERENCES "Districts" ("Id") ON DELETE CASCADE
);

CREATE TABLE "LevyMeasureDistricts" (
    "DistrictsId" uuid NOT NULL,
    "LevyMeasuresId" uuid NOT NULL,
    CONSTRAINT "PK_LevyMeasureDistricts" PRIMARY KEY ("DistrictsId", "LevyMeasuresId"),
    CONSTRAINT "FK_LevyMeasureDistricts_Districts_DistrictsId" FOREIGN KEY ("DistrictsId") REFERENCES "Districts" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_LevyMeasureDistricts_LevyMeasures_LevyMeasuresId" FOREIGN KEY ("LevyMeasuresId") REFERENCES "LevyMeasures" ("Id") ON DELETE CASCADE
);

CREATE TABLE "LevyRates" (
    "Id" uuid NOT NULL,
    "CountyId" character varying(100) NOT NULL,
    "LevyMeasureId" uuid NOT NULL,
    "DistrictId" uuid,
    "Rate" numeric(10,6) NOT NULL,
    "AssessedValue" numeric(18,2) NOT NULL,
    "LevyAmount" numeric(18,2) NOT NULL,
    "EffectiveDate" timestamp with time zone NOT NULL,
    "ExpirationDate" timestamp with time zone,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone,
    "CreatedBy" character varying(200) NOT NULL,
    "UpdatedBy" character varying(200),
    "AiOptimalRate" numeric(10,6),
    "ConfidenceScore" numeric(5,4),
    CONSTRAINT "PK_LevyRates" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_LevyRates_Districts_DistrictId" FOREIGN KEY ("DistrictId") REFERENCES "Districts" ("Id") ON DELETE SET NULL,
    CONSTRAINT "FK_LevyRates_LevyMeasures_LevyMeasureId" FOREIGN KEY ("LevyMeasureId") REFERENCES "LevyMeasures" ("Id") ON DELETE CASCADE
);

CREATE TABLE "LevyScenarios" (
    "Id" uuid NOT NULL,
    "CountyId" character varying(100) NOT NULL,
    "LevyMeasureId" uuid NOT NULL,
    "Name" character varying(200) NOT NULL,
    "Description" character varying(2000),
    "ScenarioType" character varying(50) NOT NULL,
    "AssessedValue" numeric(18,2) NOT NULL,
    "LevyRate" numeric(10,6) NOT NULL,
    "CalculatedAmount" numeric(18,2) NOT NULL,
    "ProjectedRevenue" numeric(18,2) NOT NULL,
    "CollectionRate" numeric(5,4) NOT NULL,
    "IsActive" boolean NOT NULL,
    "Assumptions" jsonb,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone,
    "CreatedBy" character varying(200) NOT NULL,
    "UpdatedBy" character varying(200),
    "AiInsights" jsonb,
    "QuantumOptimized" boolean NOT NULL,
    "ConfidenceScore" numeric(5,4),
    CONSTRAINT "PK_LevyScenarios" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_LevyScenarios_LevyMeasures_LevyMeasureId" FOREIGN KEY ("LevyMeasureId") REFERENCES "LevyMeasures" ("Id") ON DELETE CASCADE
);

CREATE TABLE "RevenueProjections" (
    "Id" uuid NOT NULL,
    "CountyId" character varying(100) NOT NULL,
    "LevyScenarioId" uuid NOT NULL,
    "FiscalYear" integer NOT NULL,
    "ProjectedAssessedValue" numeric(18,2) NOT NULL,
    "ProjectedLevyAmount" numeric(18,2) NOT NULL,
    "ProjectedCollectionRate" numeric(5,4) NOT NULL,
    "ProjectedNetRevenue" numeric(18,2) NOT NULL,
    "GrowthRate" numeric(5,4) NOT NULL,
    "ConfidenceLevel" numeric(5,4),
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone,
    "CreatedBy" character varying(200) NOT NULL,
    "UpdatedBy" character varying(200),
    "AiProjectedRevenue" numeric(18,2),
    "RiskFactors" jsonb,
    CONSTRAINT "PK_RevenueProjections" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_RevenueProjections_LevyScenarios_LevyScenarioId" FOREIGN KEY ("LevyScenarioId") REFERENCES "LevyScenarios" ("Id") ON DELETE CASCADE
);

CREATE INDEX "IX_DistrictParcels_CountyId" ON "DistrictParcels" ("CountyId");

CREATE UNIQUE INDEX "IX_DistrictParcels_CountyId_DistrictId_ParcelNumber" ON "DistrictParcels" ("CountyId", "DistrictId", "ParcelNumber");

CREATE INDEX "IX_DistrictParcels_DistrictId" ON "DistrictParcels" ("DistrictId");

CREATE INDEX "IX_DistrictParcels_ParcelNumber" ON "DistrictParcels" ("ParcelNumber");

CREATE INDEX "IX_Districts_CountyId" ON "Districts" ("CountyId");

CREATE UNIQUE INDEX "IX_Districts_CountyId_DistrictCode" ON "Districts" ("CountyId", "DistrictCode");

CREATE INDEX "IX_Districts_DistrictType" ON "Districts" ("DistrictType");

CREATE INDEX "IX_LevyMeasureDistricts_LevyMeasuresId" ON "LevyMeasureDistricts" ("LevyMeasuresId");

CREATE INDEX "IX_LevyMeasures_CountyId" ON "LevyMeasures" ("CountyId");

CREATE INDEX "IX_LevyMeasures_CountyId_LevyYear" ON "LevyMeasures" ("CountyId", "LevyYear");

CREATE INDEX "IX_LevyMeasures_Status" ON "LevyMeasures" ("Status");

CREATE INDEX "IX_LevyRates_CountyId" ON "LevyRates" ("CountyId");

CREATE INDEX "IX_LevyRates_DistrictId" ON "LevyRates" ("DistrictId");

CREATE INDEX "IX_LevyRates_LevyMeasureId" ON "LevyRates" ("LevyMeasureId");

CREATE INDEX "IX_LevyScenarios_CountyId" ON "LevyScenarios" ("CountyId");

CREATE INDEX "IX_LevyScenarios_IsActive" ON "LevyScenarios" ("IsActive");

CREATE INDEX "IX_LevyScenarios_LevyMeasureId" ON "LevyScenarios" ("LevyMeasureId");

CREATE INDEX "IX_RevenueProjections_CountyId" ON "RevenueProjections" ("CountyId");

CREATE INDEX "IX_RevenueProjections_FiscalYear" ON "RevenueProjections" ("FiscalYear");

CREATE INDEX "IX_RevenueProjections_LevyScenarioId" ON "RevenueProjections" ("LevyScenarioId");

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20251027190328_InitialLevy', '8.0.0');

COMMIT;

