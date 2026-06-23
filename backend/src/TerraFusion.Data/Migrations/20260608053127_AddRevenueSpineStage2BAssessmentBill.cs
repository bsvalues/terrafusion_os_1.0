using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddRevenueSpineStage2BAssessmentBill : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "assessment_bill_line",
                schema: "legacy_pacs_raw",
                columns: table => new
                {
                    LandedRowId = table.Column<Guid>(type: "uuid", nullable: false),
                    BillId = table.Column<long>(type: "bigint", nullable: false),
                    PropId = table.Column<int>(type: "integer", nullable: false),
                    TaxYr = table.Column<short>(type: "smallint", nullable: false),
                    SupNum = table.Column<short>(type: "smallint", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    BillType = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: true),
                    AgencyId = table.Column<int>(type: "integer", nullable: false),
                    CurrentAmountDue = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    AmountPaid = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    LoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceQueryHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    SourceRowHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    LandedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_assessment_bill_line", x => x.LandedRowId);
                });

            migrationBuilder.CreateTable(
                name: "tf_assessment_agency",
                schema: "canonical_tf",
                columns: table => new
                {
                    TfAssessmentAgencyId = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    AgencyId = table.Column<int>(type: "integer", nullable: false),
                    AssessmentCd = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    AssessmentTypeCd = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    AssessmentDescription = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    LoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceQueryHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tf_assessment_agency", x => x.TfAssessmentAgencyId);
                });

            migrationBuilder.CreateTable(
                name: "tf_assessment_bill_current",
                schema: "canonical_tf",
                columns: table => new
                {
                    TfAssessmentBillCurrentId = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    TfParcelId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourcePropId = table.Column<int>(type: "integer", nullable: false),
                    TaxYr = table.Column<short>(type: "smallint", nullable: false),
                    BillCount = table.Column<int>(type: "integer", nullable: false),
                    AgencyCount = table.Column<int>(type: "integer", nullable: false),
                    TotalCurrentAmountDue = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    TotalAmountPaid = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    TotalBalanceAmount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    SourceLineCount = table.Column<int>(type: "integer", nullable: false),
                    PromotionLoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tf_assessment_bill_current", x => x.TfAssessmentBillCurrentId);
                });

            migrationBuilder.CreateTable(
                name: "tf_assessment_bill_line",
                schema: "canonical_tf",
                columns: table => new
                {
                    TfAssessmentBillLineId = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    TfParcelId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourcePropId = table.Column<int>(type: "integer", nullable: false),
                    TaxYr = table.Column<short>(type: "smallint", nullable: false),
                    BillId = table.Column<long>(type: "bigint", nullable: false),
                    BillType = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: true),
                    AgencyId = table.Column<int>(type: "integer", nullable: false),
                    AssessmentCd = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    CurrentAmountDue = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    AmountPaid = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    BalanceAmount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    SupNum = table.Column<short>(type: "smallint", nullable: false),
                    PromotionLoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceQueryHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tf_assessment_bill_line", x => x.TfAssessmentBillLineId);
                });

            migrationBuilder.CreateIndex(
                name: "ix_legacy_pacs_raw_assessment_bill_line_loadbatch",
                schema: "legacy_pacs_raw",
                table: "assessment_bill_line",
                column: "LoadBatchId");

            migrationBuilder.CreateIndex(
                name: "ix_legacy_pacs_raw_assessment_bill_line_prop_year",
                schema: "legacy_pacs_raw",
                table: "assessment_bill_line",
                columns: new[] { "PropId", "TaxYr" });

            migrationBuilder.CreateIndex(
                name: "ux_tf_assessment_agency_key",
                schema: "canonical_tf",
                table: "tf_assessment_agency",
                columns: new[] { "CountyId", "AgencyId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_tf_assessment_bill_current_county_year",
                schema: "canonical_tf",
                table: "tf_assessment_bill_current",
                columns: new[] { "CountyId", "TaxYr" });

            migrationBuilder.CreateIndex(
                name: "ix_tf_assessment_bill_current_parcel_year",
                schema: "canonical_tf",
                table: "tf_assessment_bill_current",
                columns: new[] { "TfParcelId", "TaxYr" });

            migrationBuilder.CreateIndex(
                name: "ix_tf_assessment_bill_current_promotion_batch",
                schema: "canonical_tf",
                table: "tf_assessment_bill_current",
                column: "PromotionLoadBatchId");

            migrationBuilder.CreateIndex(
                name: "ix_tf_assessment_bill_line_billid",
                schema: "canonical_tf",
                table: "tf_assessment_bill_line",
                column: "BillId");

            migrationBuilder.CreateIndex(
                name: "ix_tf_assessment_bill_line_county_year_agency",
                schema: "canonical_tf",
                table: "tf_assessment_bill_line",
                columns: new[] { "CountyId", "TaxYr", "AgencyId" });

            migrationBuilder.CreateIndex(
                name: "ix_tf_assessment_bill_line_parcel_year",
                schema: "canonical_tf",
                table: "tf_assessment_bill_line",
                columns: new[] { "TfParcelId", "TaxYr" });

            migrationBuilder.CreateIndex(
                name: "ix_tf_assessment_bill_line_promotion_batch",
                schema: "canonical_tf",
                table: "tf_assessment_bill_line",
                column: "PromotionLoadBatchId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "assessment_bill_line",
                schema: "legacy_pacs_raw");

            migrationBuilder.DropTable(
                name: "tf_assessment_agency",
                schema: "canonical_tf");

            migrationBuilder.DropTable(
                name: "tf_assessment_bill_current",
                schema: "canonical_tf");

            migrationBuilder.DropTable(
                name: "tf_assessment_bill_line",
                schema: "canonical_tf");
        }
    }
}
