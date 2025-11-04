-- Create AuditLogs table for TerraFusion Production Database
-- This table is required for government compliance audit logging (FISMA-High)

CREATE TABLE IF NOT EXISTS "AuditLogs" (
    "Id" uuid NOT NULL,
    "Type" character varying(100) NOT NULL,
    "Data" TEXT,
    "Timestamp" timestamp with time zone NOT NULL,
    "UserId" character varying(450),
    "UserEmail" character varying(256),
    "IpAddress" character varying(45),
    "UserAgent" character varying(500),
    "RequestPath" character varying(500),
    "RequestMethod" character varying(10),
    "CorrelationId" character varying(100),
    "ResponseStatusCode" integer,
    "DurationMs" bigint,
    "MachineName" text,
    "ProcessId" integer,
    "Severity" character varying(20),
    "Source" character varying(100),
    CONSTRAINT "PK_AuditLogs" PRIMARY KEY ("Id")
);

-- Create index on Timestamp for efficient querying
CREATE INDEX IF NOT EXISTS "IX_AuditLogs_Timestamp" ON "AuditLogs" ("Timestamp");

-- Create index on Type for filtering by audit log type
CREATE INDEX IF NOT EXISTS "IX_AuditLogs_Type" ON "AuditLogs" ("Type");

-- Create index on UserId for user-specific audit trails
CREATE INDEX IF NOT EXISTS "IX_AuditLogs_UserId" ON "AuditLogs" ("UserId");

-- Verify table was created
SELECT 'AuditLogs table created successfully' AS status;
