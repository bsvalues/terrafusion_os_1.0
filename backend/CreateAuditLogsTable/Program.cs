using System;
using Npgsql;

var connectionString = "Host=localhost;Database=terrafusion_production;Username=terrafusion;Password=terrafusion_production_secure_2025";

var sql = @"
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
    Console.WriteLine("✅ AuditLogs table created successfully");
    return 0;
}
catch (Exception ex)
{
    Console.WriteLine($"❌ ERROR: {ex.Message}");
    return 1;
}
