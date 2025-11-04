using Npgsql;

var connectionString = "Host=localhost;Database=terrafusion_production;Username=terrafusion;Password=terrafusion_production_secure_2025";

var sql = @"
-- Create AuditLogs table for TerraFusion Production Database
CREATE TABLE IF NOT EXISTS ""AuditLogs"" (
    ""Id"" uuid NOT NULL,
    ""Type"" character varying(100) NOT NULL,
    ""Data"" TEXT,
    ""Timestamp"" timestamp with time zone NOT NULL,
    ""UserId"" character varying(450),
    ""UserEmail"" character varying(256),
    ""IpAddress"" character varying(45),
    ""UserAgent"" character varying(500),
    ""RequestPath"" character varying(500),
    ""RequestMethod"" character varying(10),
    ""CorrelationId"" character varying(100),
    ""ResponseStatusCode"" integer,
    ""DurationMs"" bigint,
    ""MachineName"" text,
    ""ProcessId"" integer,
    ""Severity"" character varying(20),
    ""Source"" character varying(100),
    CONSTRAINT ""PK_AuditLogs"" PRIMARY KEY (""Id"")
);

-- Create indices
CREATE INDEX IF NOT EXISTS ""IX_AuditLogs_Timestamp"" ON ""AuditLogs"" (""Timestamp"");
CREATE INDEX IF NOT EXISTS ""IX_AuditLogs_Type"" ON ""AuditLogs"" (""Type"");
CREATE INDEX IF NOT EXISTS ""IX_AuditLogs_UserId"" ON ""AuditLogs"" (""UserId"");
";

try
{
    using var conn = new NpgsqlConnection(connectionString);
    await conn.OpenAsync();

    using var cmd = new NpgsqlCommand(sql, conn);
    await cmd.ExecuteNonQueryAsync();

    Console.WriteLine("✅ SUCCESS: AuditLogs table created successfully in terrafusion_production database");

    // Verify table exists
    using var verifyCmd = new NpgsqlCommand(@"
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'AuditLogs'", conn);

    var result = await verifyCmd.ExecuteScalarAsync();
    if (result != null)
    {
        Console.WriteLine($"✅ VERIFIED: Table 'AuditLogs' exists in database");
    }
}
catch (Exception ex)
{
    Console.WriteLine($"❌ ERROR: {ex.Message}");
    return 1;
}

return 0;
