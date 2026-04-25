using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Levy.Migrations
{
    /// <summary>
    /// B2 — Adds the ReferenceSources table: authoritative reference inputs
    /// (IPD, state-school, lid-lift, refund-fund, banked-capacity) with citation,
    /// issuer, ingest metadata, and specialist review fields.
    /// </summary>
    /// <remarks>
    /// Hand-authored migration — scoped intentionally to ONLY the new entity.
    /// EF auto-generation produces unrelated drops/recreates because the stub
    /// <c>LevyDbContext</c> is narrower than the historical model snapshot.
    /// That drift is pre-existing tech debt and is not addressed here.
    /// </remarks>
    public partial class AddReferenceSourceTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ReferenceSources",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    SourceType = table.Column<int>(type: "integer", nullable: false),
                    TaxYear = table.Column<int>(type: "integer", nullable: false),
                    Citation = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    DistrictCode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Value = table.Column<decimal>(type: "decimal(18,6)", nullable: true),
                    ValueUnit = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    ValueJson = table.Column<string>(type: "jsonb", nullable: true),
                    SourceUrl = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    IssuedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    IssuedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IngestedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IngestedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    ReviewedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    ReviewedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    Notes = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReferenceSources", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ReferenceSources_Citation",
                table: "ReferenceSources",
                columns: new[] { "CountyId", "Citation", "TaxYear" });

            migrationBuilder.CreateIndex(
                name: "IX_ReferenceSources_Lookup",
                table: "ReferenceSources",
                columns: new[] { "CountyId", "SourceType", "TaxYear", "DistrictCode", "IsActive" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ReferenceSources");
        }
    }
}
