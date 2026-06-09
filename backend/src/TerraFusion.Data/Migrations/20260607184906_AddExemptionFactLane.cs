using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddExemptionFactLane : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "exemption_current",
                schema: "truth_pacs",
                columns: table => new
                {
                    TruthExemptionId = table.Column<Guid>(type: "uuid", nullable: false),
                    PropId = table.Column<int>(type: "integer", nullable: false),
                    OwnerId = table.Column<long>(type: "bigint", nullable: false),
                    TaxYr = table.Column<short>(type: "smallint", nullable: false),
                    SupNum = table.Column<short>(type: "smallint", nullable: false),
                    ExmptTypeCd = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    ExmptSubtypeCd = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: true),
                    ExemptionPct = table.Column<decimal>(type: "numeric(9,4)", precision: 9, scale: 4, nullable: true),
                    EffectiveDt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    TerminationDt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    QualifyYr = table.Column<short>(type: "smallint", nullable: true),
                    OwnerTaxYr = table.Column<short>(type: "smallint", nullable: true),
                    EffectiveTaxYr = table.Column<short>(type: "smallint", nullable: true),
                    SourceExemptionLandedRowId = table.Column<Guid>(type: "uuid", nullable: false),
                    ExemptionLoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    PromotionLoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    ConversionEra = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    PromotedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_exemption_current", x => x.TruthExemptionId);
                });

            migrationBuilder.CreateTable(
                name: "property_exemption",
                schema: "legacy_pacs_raw",
                columns: table => new
                {
                    LandedRowId = table.Column<Guid>(type: "uuid", nullable: false),
                    PropId = table.Column<int>(type: "integer", nullable: false),
                    OwnerId = table.Column<long>(type: "bigint", nullable: false),
                    ExmptTaxYr = table.Column<short>(type: "smallint", nullable: false),
                    SupNum = table.Column<short>(type: "smallint", nullable: false),
                    ExmptTypeCd = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    ExmptSubtypeCd = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: true),
                    ExemptionPct = table.Column<decimal>(type: "numeric(9,4)", precision: 9, scale: 4, nullable: true),
                    EffectiveDt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    TerminationDt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    QualifyYr = table.Column<short>(type: "smallint", nullable: true),
                    OwnerTaxYr = table.Column<short>(type: "smallint", nullable: true),
                    EffectiveTaxYr = table.Column<short>(type: "smallint", nullable: true),
                    LoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceQueryHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    SourceRowHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    LandedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_property_exemption", x => x.LandedRowId);
                });

            migrationBuilder.CreateTable(
                name: "tf_exemption",
                schema: "canonical_tf",
                columns: table => new
                {
                    TfExemptionId = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    TfParcelId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourcePropId = table.Column<int>(type: "integer", nullable: false),
                    SourceOwnerId = table.Column<long>(type: "bigint", nullable: false),
                    TaxYr = table.Column<short>(type: "smallint", nullable: false),
                    ExmptTypeCd = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    ExmptSubtypeCd = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: true),
                    ExemptionPct = table.Column<decimal>(type: "numeric(9,4)", precision: 9, scale: 4, nullable: true),
                    EffectiveDt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    TerminationDt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    QualifyYr = table.Column<short>(type: "smallint", nullable: true),
                    OwnerTaxYr = table.Column<short>(type: "smallint", nullable: true),
                    EffectiveTaxYr = table.Column<short>(type: "smallint", nullable: true),
                    SupNum = table.Column<short>(type: "smallint", nullable: false),
                    PromotionLoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    ConversionEra = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tf_exemption", x => x.TfExemptionId);
                });

            migrationBuilder.CreateIndex(
                name: "ix_truth_pacs_exemption_natural_key",
                schema: "truth_pacs",
                table: "exemption_current",
                columns: new[] { "PropId", "TaxYr", "OwnerId", "ExmptTypeCd" });

            migrationBuilder.CreateIndex(
                name: "ix_truth_pacs_exemption_promotion_batch",
                schema: "truth_pacs",
                table: "exemption_current",
                column: "PromotionLoadBatchId");

            migrationBuilder.CreateIndex(
                name: "ix_legacy_pacs_raw_property_exemption_loadbatch",
                schema: "legacy_pacs_raw",
                table: "property_exemption",
                column: "LoadBatchId");

            migrationBuilder.CreateIndex(
                name: "ix_legacy_pacs_raw_property_exemption_prop_year",
                schema: "legacy_pacs_raw",
                table: "property_exemption",
                columns: new[] { "PropId", "ExmptTaxYr" });

            migrationBuilder.CreateIndex(
                name: "ix_tf_exemption_county_year",
                schema: "canonical_tf",
                table: "tf_exemption",
                columns: new[] { "CountyId", "TaxYr" });

            migrationBuilder.CreateIndex(
                name: "ix_tf_exemption_parcel_year",
                schema: "canonical_tf",
                table: "tf_exemption",
                columns: new[] { "TfParcelId", "TaxYr" });

            migrationBuilder.CreateIndex(
                name: "ix_tf_exemption_promotion_batch",
                schema: "canonical_tf",
                table: "tf_exemption",
                column: "PromotionLoadBatchId");

            migrationBuilder.CreateIndex(
                name: "ix_tf_exemption_type",
                schema: "canonical_tf",
                table: "tf_exemption",
                column: "ExmptTypeCd");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "exemption_current",
                schema: "truth_pacs");

            migrationBuilder.DropTable(
                name: "property_exemption",
                schema: "legacy_pacs_raw");

            migrationBuilder.DropTable(
                name: "tf_exemption",
                schema: "canonical_tf");
        }
    }
}
