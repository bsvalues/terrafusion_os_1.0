using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class SyncDoctrine4PropertyUniverseAndAttributeDictionary : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "QuarantineReasonDetail",
                schema: "legacy_tf_unproven",
                table: "unresolved_imprv_attr",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UniverseCode",
                schema: "legacy_tf_unproven",
                table: "unresolved_imprv_attr",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "UniverseRuleId",
                schema: "legacy_tf_unproven",
                table: "unresolved_imprv_attr",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UniverseCode",
                schema: "canonical_tf",
                table: "tf_improvement",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UniverseConfidence",
                schema: "canonical_tf",
                table: "tf_improvement",
                type: "character varying(8)",
                maxLength: 8,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UniverseReason",
                schema: "canonical_tf",
                table: "tf_improvement",
                type: "character varying(1024)",
                maxLength: 1024,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "UniverseRuleId",
                schema: "canonical_tf",
                table: "tf_improvement",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UniverseCode",
                schema: "truth_pacs",
                table: "imprv_current",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UniverseConfidence",
                schema: "truth_pacs",
                table: "imprv_current",
                type: "character varying(8)",
                maxLength: 8,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UniverseReason",
                schema: "truth_pacs",
                table: "imprv_current",
                type: "character varying(1024)",
                maxLength: 1024,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "UniverseRuleId",
                schema: "truth_pacs",
                table: "imprv_current",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "tf_doctrine_attribute_dictionary",
                schema: "doctrine_tf",
                columns: table => new
                {
                    DictionaryRowId = table.Column<Guid>(type: "uuid", nullable: false),
                    County = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    EffectiveStartYear = table.Column<int>(type: "integer", nullable: false),
                    EffectiveEndYear = table.Column<int>(type: "integer", nullable: true),
                    UniverseCode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ImprvAttrId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    IAttrValCd = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    AttributeDescription = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    AttributeGroup = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    SourceTable = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    SourceKey = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Reason = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: false),
                    EvidenceSource = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: false),
                    Confidence = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: false, defaultValue: "MED"),
                    Notes = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    ActiveFlag = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    ApprovedBy = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    ApprovedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tf_doctrine_attribute_dictionary", x => x.DictionaryRowId);
                });

            migrationBuilder.CreateTable(
                name: "tf_doctrine_property_universe",
                schema: "doctrine_tf",
                columns: table => new
                {
                    RuleId = table.Column<Guid>(type: "uuid", nullable: false),
                    County = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    EffectiveStartYear = table.Column<int>(type: "integer", nullable: false),
                    EffectiveEndYear = table.Column<int>(type: "integer", nullable: true),
                    Precedence = table.Column<int>(type: "integer", nullable: false),
                    UniverseCode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    PropTypeCdCsv = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    PropertyUseCdCsv = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    PropertyUseMode = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "ANY"),
                    AgApplyValue = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    AgUseCdCsv = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    RequiresLegacyMarker = table.Column<bool>(type: "boolean", nullable: false),
                    LegacyMarkerType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    LegacyMarkerValue = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Reason = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: false),
                    EvidenceSource = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: false),
                    Confidence = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: false, defaultValue: "MED"),
                    Notes = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    ActiveFlag = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    ApprovedBy = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    ApprovedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tf_doctrine_property_universe", x => x.RuleId);
                });

            migrationBuilder.CreateIndex(
                name: "ix_legacy_tf_unproven_imprv_attr_reason_detail",
                schema: "legacy_tf_unproven",
                table: "unresolved_imprv_attr",
                column: "QuarantineReasonDetail");

            migrationBuilder.CreateIndex(
                name: "ix_legacy_tf_unproven_imprv_attr_universe",
                schema: "legacy_tf_unproven",
                table: "unresolved_imprv_attr",
                column: "UniverseCode");

            migrationBuilder.CreateIndex(
                name: "ix_tf_improvement_universe",
                schema: "canonical_tf",
                table: "tf_improvement",
                column: "UniverseCode");

            migrationBuilder.CreateIndex(
                name: "ix_truth_pacs_imprv_universe",
                schema: "truth_pacs",
                table: "imprv_current",
                column: "UniverseCode");

            migrationBuilder.CreateIndex(
                name: "ix_tf_doctrine_attribute_dictionary_lookup",
                schema: "doctrine_tf",
                table: "tf_doctrine_attribute_dictionary",
                columns: new[] { "County", "UniverseCode", "ActiveFlag" });

            migrationBuilder.CreateIndex(
                name: "uq_tf_doctrine_attribute_dictionary",
                schema: "doctrine_tf",
                table: "tf_doctrine_attribute_dictionary",
                columns: new[] { "County", "UniverseCode", "ImprvAttrId", "IAttrValCd", "EffectiveStartYear" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_tf_doctrine_property_universe_county_active_prec",
                schema: "doctrine_tf",
                table: "tf_doctrine_property_universe",
                columns: new[] { "County", "ActiveFlag", "Precedence" });

            migrationBuilder.CreateIndex(
                name: "ix_tf_doctrine_property_universe_county_universe_start",
                schema: "doctrine_tf",
                table: "tf_doctrine_property_universe",
                columns: new[] { "County", "UniverseCode", "EffectiveStartYear" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "tf_doctrine_attribute_dictionary",
                schema: "doctrine_tf");

            migrationBuilder.DropTable(
                name: "tf_doctrine_property_universe",
                schema: "doctrine_tf");

            migrationBuilder.DropIndex(
                name: "ix_legacy_tf_unproven_imprv_attr_reason_detail",
                schema: "legacy_tf_unproven",
                table: "unresolved_imprv_attr");

            migrationBuilder.DropIndex(
                name: "ix_legacy_tf_unproven_imprv_attr_universe",
                schema: "legacy_tf_unproven",
                table: "unresolved_imprv_attr");

            migrationBuilder.DropIndex(
                name: "ix_tf_improvement_universe",
                schema: "canonical_tf",
                table: "tf_improvement");

            migrationBuilder.DropIndex(
                name: "ix_truth_pacs_imprv_universe",
                schema: "truth_pacs",
                table: "imprv_current");

            migrationBuilder.DropColumn(
                name: "QuarantineReasonDetail",
                schema: "legacy_tf_unproven",
                table: "unresolved_imprv_attr");

            migrationBuilder.DropColumn(
                name: "UniverseCode",
                schema: "legacy_tf_unproven",
                table: "unresolved_imprv_attr");

            migrationBuilder.DropColumn(
                name: "UniverseRuleId",
                schema: "legacy_tf_unproven",
                table: "unresolved_imprv_attr");

            migrationBuilder.DropColumn(
                name: "UniverseCode",
                schema: "canonical_tf",
                table: "tf_improvement");

            migrationBuilder.DropColumn(
                name: "UniverseConfidence",
                schema: "canonical_tf",
                table: "tf_improvement");

            migrationBuilder.DropColumn(
                name: "UniverseReason",
                schema: "canonical_tf",
                table: "tf_improvement");

            migrationBuilder.DropColumn(
                name: "UniverseRuleId",
                schema: "canonical_tf",
                table: "tf_improvement");

            migrationBuilder.DropColumn(
                name: "UniverseCode",
                schema: "truth_pacs",
                table: "imprv_current");

            migrationBuilder.DropColumn(
                name: "UniverseConfidence",
                schema: "truth_pacs",
                table: "imprv_current");

            migrationBuilder.DropColumn(
                name: "UniverseReason",
                schema: "truth_pacs",
                table: "imprv_current");

            migrationBuilder.DropColumn(
                name: "UniverseRuleId",
                schema: "truth_pacs",
                table: "imprv_current");
        }
    }
}
