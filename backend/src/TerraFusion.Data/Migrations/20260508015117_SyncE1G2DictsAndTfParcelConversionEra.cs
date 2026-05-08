using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class SyncE1G2DictsAndTfParcelConversionEra : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ConversionEra",
                schema: "canonical_tf",
                table: "tf_parcel",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "dict_exemption_type",
                schema: "canonical_tf",
                columns: table => new
                {
                    DictExemptionTypeId = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    ExemptionTypeCd = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    LoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceQueryHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_dict_exemption_type", x => x.DictExemptionTypeId);
                });

            migrationBuilder.CreateTable(
                name: "dict_imprv_state",
                schema: "canonical_tf",
                columns: table => new
                {
                    DictImprvStateId = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    ImprvStateCd = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    LoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceQueryHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_dict_imprv_state", x => x.DictImprvStateId);
                });

            migrationBuilder.CreateTable(
                name: "dict_imprv_type",
                schema: "canonical_tf",
                columns: table => new
                {
                    DictImprvTypeId = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    ImprvTypeCd = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    LoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceQueryHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_dict_imprv_type", x => x.DictImprvTypeId);
                });

            migrationBuilder.CreateTable(
                name: "dict_land_state",
                schema: "canonical_tf",
                columns: table => new
                {
                    DictLandStateId = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    LandStateCd = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    LoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceQueryHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_dict_land_state", x => x.DictLandStateId);
                });

            migrationBuilder.CreateTable(
                name: "dict_land_use",
                schema: "canonical_tf",
                columns: table => new
                {
                    DictLandUseId = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    LandUseCd = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    LoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceQueryHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_dict_land_use", x => x.DictLandUseId);
                });

            migrationBuilder.CreateTable(
                name: "dict_situs_legal",
                schema: "canonical_tf",
                columns: table => new
                {
                    DictSitusLegalId = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    SitusLegalCd = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    LoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceQueryHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_dict_situs_legal", x => x.DictSitusLegalId);
                });

            migrationBuilder.CreateIndex(
                name: "ix_tf_parcel_conversion_era",
                schema: "canonical_tf",
                table: "tf_parcel",
                column: "ConversionEra");

            migrationBuilder.CreateIndex(
                name: "ix_dict_exemption_type_county_code_active",
                schema: "canonical_tf",
                table: "dict_exemption_type",
                columns: new[] { "CountyId", "ExemptionTypeCd", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "ix_dict_exemption_type_load_batch",
                schema: "canonical_tf",
                table: "dict_exemption_type",
                column: "LoadBatchId");

            migrationBuilder.CreateIndex(
                name: "ux_dict_exemption_type_county_code",
                schema: "canonical_tf",
                table: "dict_exemption_type",
                columns: new[] { "CountyId", "ExemptionTypeCd" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_dict_imprv_state_county_code_active",
                schema: "canonical_tf",
                table: "dict_imprv_state",
                columns: new[] { "CountyId", "ImprvStateCd", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "ix_dict_imprv_state_load_batch",
                schema: "canonical_tf",
                table: "dict_imprv_state",
                column: "LoadBatchId");

            migrationBuilder.CreateIndex(
                name: "ux_dict_imprv_state_county_code",
                schema: "canonical_tf",
                table: "dict_imprv_state",
                columns: new[] { "CountyId", "ImprvStateCd" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_dict_imprv_type_county_code_active",
                schema: "canonical_tf",
                table: "dict_imprv_type",
                columns: new[] { "CountyId", "ImprvTypeCd", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "ix_dict_imprv_type_load_batch",
                schema: "canonical_tf",
                table: "dict_imprv_type",
                column: "LoadBatchId");

            migrationBuilder.CreateIndex(
                name: "ux_dict_imprv_type_county_code",
                schema: "canonical_tf",
                table: "dict_imprv_type",
                columns: new[] { "CountyId", "ImprvTypeCd" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_dict_land_state_county_code_active",
                schema: "canonical_tf",
                table: "dict_land_state",
                columns: new[] { "CountyId", "LandStateCd", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "ix_dict_land_state_load_batch",
                schema: "canonical_tf",
                table: "dict_land_state",
                column: "LoadBatchId");

            migrationBuilder.CreateIndex(
                name: "ux_dict_land_state_county_code",
                schema: "canonical_tf",
                table: "dict_land_state",
                columns: new[] { "CountyId", "LandStateCd" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_dict_land_use_county_code_active",
                schema: "canonical_tf",
                table: "dict_land_use",
                columns: new[] { "CountyId", "LandUseCd", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "ix_dict_land_use_load_batch",
                schema: "canonical_tf",
                table: "dict_land_use",
                column: "LoadBatchId");

            migrationBuilder.CreateIndex(
                name: "ux_dict_land_use_county_code",
                schema: "canonical_tf",
                table: "dict_land_use",
                columns: new[] { "CountyId", "LandUseCd" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_dict_situs_legal_county_code_active",
                schema: "canonical_tf",
                table: "dict_situs_legal",
                columns: new[] { "CountyId", "SitusLegalCd", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "ix_dict_situs_legal_load_batch",
                schema: "canonical_tf",
                table: "dict_situs_legal",
                column: "LoadBatchId");

            migrationBuilder.CreateIndex(
                name: "ux_dict_situs_legal_county_code",
                schema: "canonical_tf",
                table: "dict_situs_legal",
                columns: new[] { "CountyId", "SitusLegalCd" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "dict_exemption_type",
                schema: "canonical_tf");

            migrationBuilder.DropTable(
                name: "dict_imprv_state",
                schema: "canonical_tf");

            migrationBuilder.DropTable(
                name: "dict_imprv_type",
                schema: "canonical_tf");

            migrationBuilder.DropTable(
                name: "dict_land_state",
                schema: "canonical_tf");

            migrationBuilder.DropTable(
                name: "dict_land_use",
                schema: "canonical_tf");

            migrationBuilder.DropTable(
                name: "dict_situs_legal",
                schema: "canonical_tf");

            migrationBuilder.DropIndex(
                name: "ix_tf_parcel_conversion_era",
                schema: "canonical_tf",
                table: "tf_parcel");

            migrationBuilder.DropColumn(
                name: "ConversionEra",
                schema: "canonical_tf",
                table: "tf_parcel");
        }
    }
}
