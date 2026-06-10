using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddDictNeighborhood : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "dict_neighborhood",
                schema: "canonical_tf",
                columns: table => new
                {
                    DictNeighborhoodId = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    HoodCd = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    HoodName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    HoodDescription = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    HoodGroupCd = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    LoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceQueryHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_dict_neighborhood", x => x.DictNeighborhoodId);
                });

            migrationBuilder.CreateTable(
                name: "land_current",
                schema: "legacy_tf_unproven",
                columns: table => new
                {
                    UnprovenRowId = table.Column<Guid>(type: "uuid", nullable: false),
                    PropValYr = table.Column<short>(type: "smallint", nullable: false),
                    SupNum = table.Column<short>(type: "smallint", nullable: false),
                    PropId = table.Column<int>(type: "integer", nullable: false),
                    LandSegId = table.Column<long>(type: "bigint", nullable: false),
                    LandSegTypeCd = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: true),
                    LandSegUseCd = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: true),
                    SizeAcres = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: true),
                    LandSegMarketVal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    SourceTruthLandId = table.Column<Guid>(type: "uuid", nullable: false),
                    PromotionLoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    QuarantineReason = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_land_current", x => x.UnprovenRowId);
                });

            migrationBuilder.CreateTable(
                name: "tf_land",
                schema: "canonical_tf",
                columns: table => new
                {
                    TfLandId = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    TfParcelId = table.Column<Guid>(type: "uuid", nullable: false),
                    LandSegTypeCd = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: true),
                    LandSegStateCd = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: true),
                    LandSegClassCd = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: true),
                    LandSegUseCd = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: true),
                    SoilCd = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: true),
                    IsHomesite = table.Column<bool>(type: "boolean", nullable: false),
                    SizeAcres = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: true),
                    SizeSquareFeet = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    LandSegMarketVal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    LandSegAgValue = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    LandSegAssessedVal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    LandSegEffAge = table.Column<short>(type: "smallint", nullable: true),
                    PromotionLoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tf_land", x => x.TfLandId);
                });

            migrationBuilder.CreateIndex(
                name: "ix_dict_neighborhood_county_active",
                schema: "canonical_tf",
                table: "dict_neighborhood",
                columns: new[] { "CountyId", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "ix_dict_neighborhood_county_group",
                schema: "canonical_tf",
                table: "dict_neighborhood",
                columns: new[] { "CountyId", "HoodGroupCd" });

            migrationBuilder.CreateIndex(
                name: "ix_dict_neighborhood_load_batch",
                schema: "canonical_tf",
                table: "dict_neighborhood",
                column: "LoadBatchId");

            migrationBuilder.CreateIndex(
                name: "ux_dict_neighborhood_county_hoodcd",
                schema: "canonical_tf",
                table: "dict_neighborhood",
                columns: new[] { "CountyId", "HoodCd" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_legacy_tf_unproven_land_promotion_batch",
                schema: "legacy_tf_unproven",
                table: "land_current",
                column: "PromotionLoadBatchId");

            migrationBuilder.CreateIndex(
                name: "ix_legacy_tf_unproven_land_propid",
                schema: "legacy_tf_unproven",
                table: "land_current",
                column: "PropId");

            migrationBuilder.CreateIndex(
                name: "ix_legacy_tf_unproven_land_reason",
                schema: "legacy_tf_unproven",
                table: "land_current",
                column: "QuarantineReason");

            migrationBuilder.CreateIndex(
                name: "ix_tf_land_county",
                schema: "canonical_tf",
                table: "tf_land",
                column: "CountyId");

            migrationBuilder.CreateIndex(
                name: "ix_tf_land_parcel",
                schema: "canonical_tf",
                table: "tf_land",
                column: "TfParcelId");

            migrationBuilder.CreateIndex(
                name: "ix_tf_land_promotion_batch",
                schema: "canonical_tf",
                table: "tf_land",
                column: "PromotionLoadBatchId");

            migrationBuilder.CreateIndex(
                name: "ix_tf_land_use",
                schema: "canonical_tf",
                table: "tf_land",
                column: "LandSegUseCd");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "dict_neighborhood",
                schema: "canonical_tf");

            migrationBuilder.DropTable(
                name: "land_current",
                schema: "legacy_tf_unproven");

            migrationBuilder.DropTable(
                name: "tf_land",
                schema: "canonical_tf");
        }
    }
}
