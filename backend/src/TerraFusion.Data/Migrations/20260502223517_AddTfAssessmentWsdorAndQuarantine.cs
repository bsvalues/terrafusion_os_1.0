using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTfAssessmentWsdorAndQuarantine : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "tf_assessment_wsdor",
                schema: "canonical_tf",
                columns: table => new
                {
                    TfAssessmentWsdorId = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    TfParcelId = table.Column<Guid>(type: "uuid", nullable: false),
                    TfOwnerId = table.Column<Guid>(type: "uuid", nullable: false),
                    AssessmentYear = table.Column<short>(type: "smallint", nullable: false),
                    SupNum = table.Column<short>(type: "smallint", nullable: false),
                    AssessedVal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    MarketVal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    AppraisedVal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    TaxableClassified = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    TaxableNonClassified = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    LandTaxableClassified = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    LandTaxableNonClassified = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    ImprvTaxableClassified = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    ImprvTaxableNonClassified = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    StateValueClassified = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    StateValueNonClassified = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    BoeStatus = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: true),
                    DisasterProrationPct = table.Column<decimal>(type: "numeric(7,4)", precision: 7, scale: 4, nullable: true),
                    SnrFrzImprvHs = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    SnrFrzLandHs = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    PromotionLoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tf_assessment_wsdor", x => x.TfAssessmentWsdorId);
                });

            migrationBuilder.CreateTable(
                name: "wash_prop_owner_val",
                schema: "legacy_tf_unproven",
                columns: table => new
                {
                    UnprovenRowId = table.Column<Guid>(type: "uuid", nullable: false),
                    PropValYr = table.Column<short>(type: "smallint", nullable: false),
                    SupNum = table.Column<short>(type: "smallint", nullable: false),
                    PropId = table.Column<int>(type: "integer", nullable: false),
                    OwnerId = table.Column<long>(type: "bigint", nullable: false),
                    AssessedVal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    MarketVal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    BoeStatus = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: true),
                    SourceTruthWpovId = table.Column<Guid>(type: "uuid", nullable: false),
                    PromotionLoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    QuarantineReason = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_wash_prop_owner_val", x => x.UnprovenRowId);
                });

            migrationBuilder.CreateIndex(
                name: "ix_tf_assessment_wsdor_boe_status",
                schema: "canonical_tf",
                table: "tf_assessment_wsdor",
                column: "BoeStatus");

            migrationBuilder.CreateIndex(
                name: "ix_tf_assessment_wsdor_county_year",
                schema: "canonical_tf",
                table: "tf_assessment_wsdor",
                columns: new[] { "CountyId", "AssessmentYear" });

            migrationBuilder.CreateIndex(
                name: "ix_tf_assessment_wsdor_owner_year",
                schema: "canonical_tf",
                table: "tf_assessment_wsdor",
                columns: new[] { "TfOwnerId", "AssessmentYear" });

            migrationBuilder.CreateIndex(
                name: "ix_tf_assessment_wsdor_parcel_year",
                schema: "canonical_tf",
                table: "tf_assessment_wsdor",
                columns: new[] { "TfParcelId", "AssessmentYear" });

            migrationBuilder.CreateIndex(
                name: "ix_tf_assessment_wsdor_promotion_batch",
                schema: "canonical_tf",
                table: "tf_assessment_wsdor",
                column: "PromotionLoadBatchId");

            migrationBuilder.CreateIndex(
                name: "ix_legacy_tf_unproven_wpov_promotion_batch",
                schema: "legacy_tf_unproven",
                table: "wash_prop_owner_val",
                column: "PromotionLoadBatchId");

            migrationBuilder.CreateIndex(
                name: "ix_legacy_tf_unproven_wpov_propid",
                schema: "legacy_tf_unproven",
                table: "wash_prop_owner_val",
                column: "PropId");

            migrationBuilder.CreateIndex(
                name: "ix_legacy_tf_unproven_wpov_reason",
                schema: "legacy_tf_unproven",
                table: "wash_prop_owner_val",
                column: "QuarantineReason");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "tf_assessment_wsdor",
                schema: "canonical_tf");

            migrationBuilder.DropTable(
                name: "wash_prop_owner_val",
                schema: "legacy_tf_unproven");
        }
    }
}
