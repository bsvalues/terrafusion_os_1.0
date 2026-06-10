using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddJurisdictionSpineLane : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "property_tax_area",
                schema: "legacy_pacs_raw",
                columns: table => new
                {
                    LandedRowId = table.Column<Guid>(type: "uuid", nullable: false),
                    PropId = table.Column<int>(type: "integer", nullable: false),
                    TaxYr = table.Column<short>(type: "smallint", nullable: false),
                    SupNum = table.Column<short>(type: "smallint", nullable: false),
                    TaxAreaId = table.Column<int>(type: "integer", nullable: false),
                    LoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceQueryHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    SourceRowHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    LandedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_property_tax_area", x => x.LandedRowId);
                });

            migrationBuilder.CreateTable(
                name: "tf_parcel_tax_area",
                schema: "canonical_tf",
                columns: table => new
                {
                    TfParcelTaxAreaId = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    TfParcelId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourcePropId = table.Column<int>(type: "integer", nullable: false),
                    TaxYr = table.Column<short>(type: "smallint", nullable: false),
                    TaxAreaId = table.Column<int>(type: "integer", nullable: false),
                    SupNum = table.Column<short>(type: "smallint", nullable: false),
                    PromotionLoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tf_parcel_tax_area", x => x.TfParcelTaxAreaId);
                });

            migrationBuilder.CreateTable(
                name: "tf_tax_area",
                schema: "canonical_tf",
                columns: table => new
                {
                    TfTaxAreaId = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    TaxAreaId = table.Column<int>(type: "integer", nullable: false),
                    TaxAreaNumber = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    TaxAreaState = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: true),
                    TaxAreaDescription = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    InactiveAfterYear = table.Column<short>(type: "smallint", nullable: true),
                    IsInactiveAfterYear = table.Column<bool>(type: "boolean", nullable: false),
                    LoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceQueryHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tf_tax_area", x => x.TfTaxAreaId);
                });

            migrationBuilder.CreateTable(
                name: "tf_tax_area_district",
                schema: "canonical_tf",
                columns: table => new
                {
                    TfTaxAreaDistrictId = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    TaxYr = table.Column<short>(type: "smallint", nullable: false),
                    TaxAreaId = table.Column<int>(type: "integer", nullable: false),
                    TaxDistrictId = table.Column<int>(type: "integer", nullable: false),
                    LoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceQueryHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tf_tax_area_district", x => x.TfTaxAreaDistrictId);
                });

            migrationBuilder.CreateTable(
                name: "tf_tax_district",
                schema: "canonical_tf",
                columns: table => new
                {
                    TfTaxDistrictId = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    TaxDistrictId = table.Column<int>(type: "integer", nullable: false),
                    TaxDistrictCd = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    TaxDistrictDesc = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    TaxDistrictTypeCd = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    LocationCode = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    LoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceQueryHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tf_tax_district", x => x.TfTaxDistrictId);
                });

            migrationBuilder.CreateIndex(
                name: "ix_legacy_pacs_raw_property_tax_area_loadbatch",
                schema: "legacy_pacs_raw",
                table: "property_tax_area",
                column: "LoadBatchId");

            migrationBuilder.CreateIndex(
                name: "ix_legacy_pacs_raw_property_tax_area_prop_year",
                schema: "legacy_pacs_raw",
                table: "property_tax_area",
                columns: new[] { "PropId", "TaxYr" });

            migrationBuilder.CreateIndex(
                name: "ix_tf_parcel_tax_area_county_year_taxarea",
                schema: "canonical_tf",
                table: "tf_parcel_tax_area",
                columns: new[] { "CountyId", "TaxYr", "TaxAreaId" });

            migrationBuilder.CreateIndex(
                name: "ix_tf_parcel_tax_area_parcel_year",
                schema: "canonical_tf",
                table: "tf_parcel_tax_area",
                columns: new[] { "TfParcelId", "TaxYr" });

            migrationBuilder.CreateIndex(
                name: "ix_tf_parcel_tax_area_promotion_batch",
                schema: "canonical_tf",
                table: "tf_parcel_tax_area",
                column: "PromotionLoadBatchId");

            migrationBuilder.CreateIndex(
                name: "ux_tf_tax_area_county_taxarea",
                schema: "canonical_tf",
                table: "tf_tax_area",
                columns: new[] { "CountyId", "TaxAreaId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_tf_tax_area_district_area",
                schema: "canonical_tf",
                table: "tf_tax_area_district",
                columns: new[] { "CountyId", "TaxYr", "TaxAreaId" });

            migrationBuilder.CreateIndex(
                name: "ux_tf_tax_area_district_key",
                schema: "canonical_tf",
                table: "tf_tax_area_district",
                columns: new[] { "CountyId", "TaxYr", "TaxAreaId", "TaxDistrictId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_tf_tax_district_type",
                schema: "canonical_tf",
                table: "tf_tax_district",
                column: "TaxDistrictTypeCd");

            migrationBuilder.CreateIndex(
                name: "ux_tf_tax_district_county_district",
                schema: "canonical_tf",
                table: "tf_tax_district",
                columns: new[] { "CountyId", "TaxDistrictId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "property_tax_area",
                schema: "legacy_pacs_raw");

            migrationBuilder.DropTable(
                name: "tf_parcel_tax_area",
                schema: "canonical_tf");

            migrationBuilder.DropTable(
                name: "tf_tax_area",
                schema: "canonical_tf");

            migrationBuilder.DropTable(
                name: "tf_tax_area_district",
                schema: "canonical_tf");

            migrationBuilder.DropTable(
                name: "tf_tax_district",
                schema: "canonical_tf");
        }
    }
}
