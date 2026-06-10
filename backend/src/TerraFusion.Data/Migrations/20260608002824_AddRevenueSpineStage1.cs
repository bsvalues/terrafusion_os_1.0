using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddRevenueSpineStage1 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "tax_bill_line",
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
                    LevyCd = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    TaxDistrictId = table.Column<int>(type: "integer", nullable: false),
                    TaxAreaId = table.Column<int>(type: "integer", nullable: false),
                    TaxableVal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    CurrentAmountDue = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    AmountPaid = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    LoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceQueryHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    SourceRowHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    LandedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tax_bill_line", x => x.LandedRowId);
                });

            migrationBuilder.CreateTable(
                name: "tf_levy_rate",
                schema: "canonical_tf",
                columns: table => new
                {
                    TfLevyRateId = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    TaxYr = table.Column<short>(type: "smallint", nullable: false),
                    TaxDistrictId = table.Column<int>(type: "integer", nullable: false),
                    LevyCd = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    LevyRate = table.Column<decimal>(type: "numeric(18,8)", precision: 18, scale: 8, nullable: true),
                    LoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceQueryHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tf_levy_rate", x => x.TfLevyRateId);
                });

            migrationBuilder.CreateTable(
                name: "tf_tax_bill_current",
                schema: "canonical_tf",
                columns: table => new
                {
                    TfTaxBillCurrentId = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    TfParcelId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourcePropId = table.Column<int>(type: "integer", nullable: false),
                    TaxYr = table.Column<short>(type: "smallint", nullable: false),
                    BillCount = table.Column<int>(type: "integer", nullable: false),
                    DistrictCount = table.Column<int>(type: "integer", nullable: false),
                    TotalTaxableVal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
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
                    table.PrimaryKey("PK_tf_tax_bill_current", x => x.TfTaxBillCurrentId);
                });

            migrationBuilder.CreateTable(
                name: "tf_tax_bill_line",
                schema: "canonical_tf",
                columns: table => new
                {
                    TfTaxBillLineId = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    TfParcelId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourcePropId = table.Column<int>(type: "integer", nullable: false),
                    TaxYr = table.Column<short>(type: "smallint", nullable: false),
                    BillId = table.Column<long>(type: "bigint", nullable: false),
                    BillType = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: true),
                    TaxAreaId = table.Column<int>(type: "integer", nullable: false),
                    TaxDistrictId = table.Column<int>(type: "integer", nullable: false),
                    LevyCd = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    TaxableVal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    LevyRate = table.Column<decimal>(type: "numeric(18,8)", precision: 18, scale: 8, nullable: true),
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
                    table.PrimaryKey("PK_tf_tax_bill_line", x => x.TfTaxBillLineId);
                });

            migrationBuilder.CreateIndex(
                name: "ix_legacy_pacs_raw_tax_bill_line_loadbatch",
                schema: "legacy_pacs_raw",
                table: "tax_bill_line",
                column: "LoadBatchId");

            migrationBuilder.CreateIndex(
                name: "ix_legacy_pacs_raw_tax_bill_line_prop_year",
                schema: "legacy_pacs_raw",
                table: "tax_bill_line",
                columns: new[] { "PropId", "TaxYr" });

            migrationBuilder.CreateIndex(
                name: "ux_tf_levy_rate_key",
                schema: "canonical_tf",
                table: "tf_levy_rate",
                columns: new[] { "CountyId", "TaxYr", "TaxDistrictId", "LevyCd" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_tf_tax_bill_current_county_year",
                schema: "canonical_tf",
                table: "tf_tax_bill_current",
                columns: new[] { "CountyId", "TaxYr" });

            migrationBuilder.CreateIndex(
                name: "ix_tf_tax_bill_current_parcel_year",
                schema: "canonical_tf",
                table: "tf_tax_bill_current",
                columns: new[] { "TfParcelId", "TaxYr" });

            migrationBuilder.CreateIndex(
                name: "ix_tf_tax_bill_current_promotion_batch",
                schema: "canonical_tf",
                table: "tf_tax_bill_current",
                column: "PromotionLoadBatchId");

            migrationBuilder.CreateIndex(
                name: "ix_tf_tax_bill_line_billid",
                schema: "canonical_tf",
                table: "tf_tax_bill_line",
                column: "BillId");

            migrationBuilder.CreateIndex(
                name: "ix_tf_tax_bill_line_county_year_district",
                schema: "canonical_tf",
                table: "tf_tax_bill_line",
                columns: new[] { "CountyId", "TaxYr", "TaxDistrictId" });

            migrationBuilder.CreateIndex(
                name: "ix_tf_tax_bill_line_parcel_year",
                schema: "canonical_tf",
                table: "tf_tax_bill_line",
                columns: new[] { "TfParcelId", "TaxYr" });

            migrationBuilder.CreateIndex(
                name: "ix_tf_tax_bill_line_promotion_batch",
                schema: "canonical_tf",
                table: "tf_tax_bill_line",
                column: "PromotionLoadBatchId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "tax_bill_line",
                schema: "legacy_pacs_raw");

            migrationBuilder.DropTable(
                name: "tf_levy_rate",
                schema: "canonical_tf");

            migrationBuilder.DropTable(
                name: "tf_tax_bill_current",
                schema: "canonical_tf");

            migrationBuilder.DropTable(
                name: "tf_tax_bill_line",
                schema: "canonical_tf");
        }
    }
}
