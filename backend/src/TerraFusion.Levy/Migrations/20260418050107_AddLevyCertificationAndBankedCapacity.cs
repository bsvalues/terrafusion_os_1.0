using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Levy.Migrations
{
    /// <inheritdoc />
    public partial class AddLevyCertificationAndBankedCapacity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BankedCapacities",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    DistrictCode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TaxYear = table.Column<int>(type: "integer", nullable: false),
                    OpeningBalance = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    AccruedThisYear = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    UsedThisYear = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    ClosingBalance = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    CertificationId = table.Column<Guid>(type: "uuid", nullable: true),
                    ResolutionReferenceId = table.Column<Guid>(type: "uuid", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    Notes = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BankedCapacities", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "LevyCertifications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    DistrictCode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TaxYear = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    AssessedValueRegular = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    LimitFactor = table.Column<decimal>(type: "numeric(10,6)", nullable: false),
                    HighestLawfulLevy = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    NewConstructionValue = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    NewConstructionLevy = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    AnnexationValue = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    AnnexationLevy = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    RefundFundAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    LidLiftAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    BankedCapacityUsed = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    BankedCapacityRemaining = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    LeviedAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    LevyRate = table.Column<decimal>(type: "numeric(10,6)", nullable: false),
                    IpdReferenceId = table.Column<Guid>(type: "uuid", nullable: true),
                    StateSchoolReferenceId = table.Column<Guid>(type: "uuid", nullable: true),
                    LidLiftReferenceId = table.Column<Guid>(type: "uuid", nullable: true),
                    RefundFundReferenceId = table.Column<Guid>(type: "uuid", nullable: true),
                    AttestationEnvelope = table.Column<string>(type: "jsonb", nullable: true),
                    AttestationHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    AttestationCorrelationId = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    CalculationSnapshot = table.Column<string>(type: "jsonb", nullable: true),
                    CertifiedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CertifiedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    SupersededByCertificationId = table.Column<Guid>(type: "uuid", nullable: true),
                    SupersededAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Notes = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LevyCertifications", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BankedCapacities_Lookup",
                table: "BankedCapacities",
                columns: new[] { "CountyId", "DistrictCode", "TaxYear", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_LevyCertifications_AttestationHash",
                table: "LevyCertifications",
                column: "AttestationHash");

            migrationBuilder.CreateIndex(
                name: "IX_LevyCertifications_CorrelationId",
                table: "LevyCertifications",
                column: "AttestationCorrelationId");

            migrationBuilder.CreateIndex(
                name: "IX_LevyCertifications_Lookup",
                table: "LevyCertifications",
                columns: new[] { "CountyId", "DistrictCode", "TaxYear", "Status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BankedCapacities");

            migrationBuilder.DropTable(
                name: "LevyCertifications");
        }
    }
}
