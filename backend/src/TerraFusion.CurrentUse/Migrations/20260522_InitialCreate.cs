using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable enable

namespace TerraFusion.CurrentUse.Migrations;

/// <summary>
/// Initial migration for the CurrentUse schema.
/// Creates tables for Classifications, InterestRates, Removals, and AuditEntries.
/// All tables are in the 'currentuse' schema.
/// </summary>
public partial class InitialCreate : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.EnsureSchema(name: "currentuse");

        migrationBuilder.CreateTable(
            name: "Classifications",
            schema: "currentuse",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                ParcelId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                ClassificationCode = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                EnrollmentDate = table.Column<DateOnly>(type: "date", nullable: false),
                Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "Active"),
                Acreage = table.Column<decimal>(type: "numeric(12,2)", nullable: true),
                CurrentMarketValue = table.Column<decimal>(type: "numeric(14,2)", nullable: true),
                CurrentUseValue = table.Column<decimal>(type: "numeric(14,2)", nullable: true),
                TaxSavings = table.Column<decimal>(type: "numeric(14,2)", nullable: true),
                CountyId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Classifications", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "InterestRates",
            schema: "currentuse",
            columns: table => new
            {
                Year = table.Column<int>(type: "integer", nullable: false),
                Rate = table.Column<decimal>(type: "numeric(6,4)", nullable: false),
                Source = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                EffectiveDate = table.Column<DateOnly>(type: "date", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_InterestRates", x => x.Year);
            });

        migrationBuilder.CreateTable(
            name: "Removals",
            schema: "currentuse",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                ParcelId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                ClassificationCode = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                Reason = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                InitiatedDate = table.Column<DateOnly>(type: "date", nullable: false),
                Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "Pending"),
                RemovalDate = table.Column<DateOnly>(type: "date", nullable: true),
                RollbackAmount = table.Column<decimal>(type: "numeric(14,2)", nullable: true),
                InterestAmount = table.Column<decimal>(type: "numeric(14,2)", nullable: true),
                PenaltyAmount = table.Column<decimal>(type: "numeric(14,2)", nullable: true),
                TotalDue = table.Column<decimal>(type: "numeric(14,2)", nullable: true),
                PenaltyExceptionCode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Removals", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "AuditEntries",
            schema: "currentuse",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                ParcelId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                Action = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                Details = table.Column<string>(type: "text", nullable: false),
                PerformedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                Timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                PreviousHash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                Hash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_AuditEntries", x => x.Id);
            });

        // Indexes for common query patterns
        migrationBuilder.CreateIndex(
            name: "IX_Classifications_ParcelId",
            schema: "currentuse",
            table: "Classifications",
            column: "ParcelId");

        migrationBuilder.CreateIndex(
            name: "IX_Classifications_Status",
            schema: "currentuse",
            table: "Classifications",
            column: "Status");

        migrationBuilder.CreateIndex(
            name: "IX_Classifications_ClassificationCode",
            schema: "currentuse",
            table: "Classifications",
            column: "ClassificationCode");

        migrationBuilder.CreateIndex(
            name: "IX_Removals_ParcelId",
            schema: "currentuse",
            table: "Removals",
            column: "ParcelId");

        migrationBuilder.CreateIndex(
            name: "IX_Removals_Status",
            schema: "currentuse",
            table: "Removals",
            column: "Status");

        migrationBuilder.CreateIndex(
            name: "IX_AuditEntries_ParcelId",
            schema: "currentuse",
            table: "AuditEntries",
            column: "ParcelId");

        migrationBuilder.CreateIndex(
            name: "IX_AuditEntries_Timestamp",
            schema: "currentuse",
            table: "AuditEntries",
            column: "Timestamp");

        // Seed interest rates (WA DOR published rates)
        migrationBuilder.InsertData(
            schema: "currentuse",
            table: "InterestRates",
            columns: new[] { "Year", "Rate", "Source", "EffectiveDate" },
            values: new object[,]
            {
                { 2016, 0.0553m, "WA DOR", new DateOnly(2016, 1, 1) },
                { 2017, 0.0553m, "WA DOR", new DateOnly(2017, 1, 1) },
                { 2018, 0.0600m, "WA DOR", new DateOnly(2018, 1, 1) },
                { 2019, 0.0700m, "WA DOR", new DateOnly(2019, 1, 1) },
                { 2020, 0.0600m, "WA DOR", new DateOnly(2020, 1, 1) },
                { 2021, 0.0500m, "WA DOR", new DateOnly(2021, 1, 1) },
                { 2022, 0.0486m, "WA DOR", new DateOnly(2022, 1, 1) },
                { 2023, 0.0700m, "WA DOR", new DateOnly(2023, 1, 1) },
                { 2024, 0.0800m, "WA DOR", new DateOnly(2024, 1, 1) },
                { 2025, 0.0750m, "WA DOR", new DateOnly(2025, 1, 1) },
                { 2026, 0.0700m, "WA DOR", new DateOnly(2026, 1, 1) }
            });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "AuditEntries", schema: "currentuse");
        migrationBuilder.DropTable(name: "Removals", schema: "currentuse");
        migrationBuilder.DropTable(name: "InterestRates", schema: "currentuse");
        migrationBuilder.DropTable(name: "Classifications", schema: "currentuse");
        migrationBuilder.DropSchema(name: "currentuse");
    }
}
