CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

START TRANSACTION;

CREATE TABLE "CountyDeployments" (
    "Id" TEXT NOT NULL,
    "CountyId" TEXT NOT NULL,
    "CountyName" TEXT NOT NULL,
    "State" TEXT NOT NULL,
    "Population" INTEGER NOT NULL,
    "DeploymentType" INTEGER NOT NULL,
    "RequestedModules" TEXT NOT NULL,
    "DeployedAt" TEXT NOT NULL,
    "CompletedAt" TEXT,
    "Status" INTEGER NOT NULL,
    "ErrorMessage" TEXT,
    "Configuration" TEXT,
    CONSTRAINT "PK_CountyDeployments" PRIMARY KEY ("Id")
);

CREATE TABLE "PluginAnalytics" (
    "Id" TEXT NOT NULL,
    "PluginId" TEXT NOT NULL,
    "CountyId" TEXT NOT NULL,
    "UsageCount" INTEGER NOT NULL,
    "RecordedAt" TEXT NOT NULL,
    "Metrics" TEXT,
    CONSTRAINT "PK_PluginAnalytics" PRIMARY KEY ("Id")
);

CREATE TABLE "PluginInstallations" (
    "Id" TEXT NOT NULL,
    "PluginId" TEXT NOT NULL,
    "CountyId" TEXT NOT NULL,
    "InstalledAt" TEXT NOT NULL,
    "UninstalledAt" TEXT,
    "Status" INTEGER NOT NULL,
    "Configuration" TEXT,
    CONSTRAINT "PK_PluginInstallations" PRIMARY KEY ("Id")
);

CREATE TABLE "PluginRevenue" (
    "Id" TEXT NOT NULL,
    "PluginId" TEXT NOT NULL,
    "CountyId" TEXT NOT NULL,
    "Revenue" TEXT NOT NULL,
    "GeneratedAt" TEXT NOT NULL,
    "TransactionId" TEXT,
    CONSTRAINT "PK_PluginRevenue" PRIMARY KEY ("Id")
);

CREATE TABLE "PluginSubmissions" (
    "Id" TEXT NOT NULL,
    "Name" TEXT NOT NULL,
    "Description" TEXT NOT NULL,
    "Version" TEXT NOT NULL,
    "Author" TEXT NOT NULL,
    "Category" TEXT NOT NULL,
    "Price" TEXT NOT NULL,
    "SubmittedAt" TEXT NOT NULL,
    "Status" INTEGER NOT NULL,
    "ReviewNotes" TEXT,
    "ReviewedAt" TEXT,
    CONSTRAINT "PK_PluginSubmissions" PRIMARY KEY ("Id")
);

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20250831030849_AddMarketplaceAndCountyDeploymentEntities', '8.0.0');

COMMIT;

START TRANSACTION;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20250901022357_InitialCreateWithRelationshipFixes', '8.0.0');

COMMIT;

