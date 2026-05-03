using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTfImprovementAndFeature : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "imprv_current",
                schema: "legacy_tf_unproven",
                columns: table => new
                {
                    UnprovenRowId = table.Column<Guid>(type: "uuid", nullable: false),
                    PropValYr = table.Column<short>(type: "smallint", nullable: false),
                    SupNum = table.Column<short>(type: "smallint", nullable: false),
                    PropId = table.Column<int>(type: "integer", nullable: false),
                    ImprvId = table.Column<long>(type: "bigint", nullable: false),
                    ImprvTypeCd = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: true),
                    ImprvDesc = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ImprvVal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    SourceTruthImprvId = table.Column<Guid>(type: "uuid", nullable: false),
                    PromotionLoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    QuarantineReason = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_imprv_current", x => x.UnprovenRowId);
                });

            migrationBuilder.CreateTable(
                name: "tf_improvement",
                schema: "canonical_tf",
                columns: table => new
                {
                    TfImprovementId = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    TfParcelId = table.Column<Guid>(type: "uuid", nullable: false),
                    ImprvTypeCd = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: true),
                    ImprvClassCd = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: true),
                    IsHomesite = table.Column<bool>(type: "boolean", nullable: false),
                    ImprvVal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    ImprvDesc = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    YearBuilt = table.Column<short>(type: "smallint", nullable: true),
                    EffectiveYearBuilt = table.Column<short>(type: "smallint", nullable: true),
                    ActualYearBuilt = table.Column<short>(type: "smallint", nullable: true),
                    PromotionLoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tf_improvement", x => x.TfImprovementId);
                });

            migrationBuilder.CreateTable(
                name: "tf_improvement_feature",
                schema: "canonical_tf",
                columns: table => new
                {
                    TfImprovementFeatureId = table.Column<Guid>(type: "uuid", nullable: false),
                    TfImprovementId = table.Column<Guid>(type: "uuid", nullable: false),
                    FeatureCode = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    MethodCd = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: true),
                    ClassCd = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: true),
                    SubClassCd = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: true),
                    ConditionCd = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: true),
                    Area = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    Value = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    NumUnits = table.Column<int>(type: "integer", nullable: true),
                    YrBuilt = table.Column<short>(type: "smallint", nullable: true),
                    SourceImprvDetailLandedRowId = table.Column<Guid>(type: "uuid", nullable: false),
                    PromotionLoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tf_improvement_feature", x => x.TfImprovementFeatureId);
                });

            migrationBuilder.CreateIndex(
                name: "ix_legacy_tf_unproven_imprv_promotion_batch",
                schema: "legacy_tf_unproven",
                table: "imprv_current",
                column: "PromotionLoadBatchId");

            migrationBuilder.CreateIndex(
                name: "ix_legacy_tf_unproven_imprv_propid",
                schema: "legacy_tf_unproven",
                table: "imprv_current",
                column: "PropId");

            migrationBuilder.CreateIndex(
                name: "ix_legacy_tf_unproven_imprv_reason",
                schema: "legacy_tf_unproven",
                table: "imprv_current",
                column: "QuarantineReason");

            migrationBuilder.CreateIndex(
                name: "ix_tf_improvement_county",
                schema: "canonical_tf",
                table: "tf_improvement",
                column: "CountyId");

            migrationBuilder.CreateIndex(
                name: "ix_tf_improvement_parcel",
                schema: "canonical_tf",
                table: "tf_improvement",
                column: "TfParcelId");

            migrationBuilder.CreateIndex(
                name: "ix_tf_improvement_promotion_batch",
                schema: "canonical_tf",
                table: "tf_improvement",
                column: "PromotionLoadBatchId");

            migrationBuilder.CreateIndex(
                name: "ix_tf_improvement_type",
                schema: "canonical_tf",
                table: "tf_improvement",
                column: "ImprvTypeCd");

            migrationBuilder.CreateIndex(
                name: "ix_tf_improvement_feature_code",
                schema: "canonical_tf",
                table: "tf_improvement_feature",
                column: "FeatureCode");

            migrationBuilder.CreateIndex(
                name: "ix_tf_improvement_feature_imprv",
                schema: "canonical_tf",
                table: "tf_improvement_feature",
                column: "TfImprovementId");

            migrationBuilder.CreateIndex(
                name: "ix_tf_improvement_feature_promotion_batch",
                schema: "canonical_tf",
                table: "tf_improvement_feature",
                column: "PromotionLoadBatchId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "imprv_current",
                schema: "legacy_tf_unproven");

            migrationBuilder.DropTable(
                name: "tf_improvement",
                schema: "canonical_tf");

            migrationBuilder.DropTable(
                name: "tf_improvement_feature",
                schema: "canonical_tf");
        }
    }
}
