using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class RefactorQualification3Layer : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SaleQualification",
                table: "ComparableSales");

            migrationBuilder.AddColumn<DateTime>(
                name: "DecisionAt",
                table: "ComparableSales",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DecisionBy",
                table: "ComparableSales",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DecisionReason",
                table: "ComparableSales",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DecisionSource",
                table: "ComparableSales",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "QualificationDecision",
                table: "ComparableSales",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "QualificationRecommendation",
                table: "ComparableSales",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RecommendationReason",
                table: "ComparableSales",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RecommendationSource",
                table: "ComparableSales",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RecommendationVersion",
                table: "ComparableSales",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ComparableSales_CountyId_QualificationDecision_Qualificatio~",
                table: "ComparableSales",
                columns: new[] { "CountyId", "QualificationDecision", "QualificationRecommendation" });

            // ── Data backfill: seed QualificationRecommendation from raw PACS codes ──
            // Applies the same 5-layer logic as SaleQualificationService.Qualify() so
            // existing records have a recommendation and remain visible to ValuationService.
            // Post-migration, run SaleQualificationService.ComputeRecommendations() for a full refresh.
            migrationBuilder.Sql(@"
UPDATE ""ComparableSales""
SET ""QualificationRecommendation"" = CASE
    WHEN UPPER(TRIM(""RawSaleQualifier"")) IN ('Q','1','VALID') THEN 'qualified'
    WHEN UPPER(TRIM(""RawSaleQualifier"")) IN ('U','N')          THEN 'non-arms-length'
    WHEN UPPER(TRIM(""RawSaleQualifier"")) IN ('E','FC','FORECLOSURE') THEN 'foreclosure'
    WHEN UPPER(TRIM(""RawSaleQualifier"")) IN ('A','ESTATE','EST') THEN 'estate'
    WHEN UPPER(TRIM(""RawCountyRatioCd"")) IN ('Q','QA','1')     THEN 'qualified'
    WHEN UPPER(TRIM(""RawCountyRatioCd"")) IN ('U','UNQ')         THEN 'non-arms-length'
    WHEN UPPER(TRIM(""RawCountyRatioCd"")) IN ('E','EX','EXC')    THEN 'excluded'
    WHEN ""RawCountyRatioCd"" IS NOT NULL AND ""RawCountyRatioCd"" <> '' THEN 'non-arms-length'
    WHEN ""RawExcludeCalcCd"" IS NOT NULL AND ""RawExcludeCalcCd"" <> '' THEN 'excluded'
    WHEN ""RawWacCd"" IS NOT NULL AND ""RawWacCd"" <> ''           THEN 'exempt'
    ELSE 'qualified'
END,
    ""RecommendationSource""  = 'TerraFusionRuleEngine',
    ""RecommendationVersion"" = '1.0'
WHERE ""QualificationRecommendation"" IS NULL;
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ComparableSales_CountyId_QualificationDecision_Qualificatio~",
                table: "ComparableSales");

            migrationBuilder.DropColumn(
                name: "DecisionAt",
                table: "ComparableSales");

            migrationBuilder.DropColumn(
                name: "DecisionBy",
                table: "ComparableSales");

            migrationBuilder.DropColumn(
                name: "DecisionReason",
                table: "ComparableSales");

            migrationBuilder.DropColumn(
                name: "DecisionSource",
                table: "ComparableSales");

            migrationBuilder.DropColumn(
                name: "QualificationDecision",
                table: "ComparableSales");

            migrationBuilder.DropColumn(
                name: "QualificationRecommendation",
                table: "ComparableSales");

            migrationBuilder.DropColumn(
                name: "RecommendationReason",
                table: "ComparableSales");

            migrationBuilder.DropColumn(
                name: "RecommendationSource",
                table: "ComparableSales");

            migrationBuilder.DropColumn(
                name: "RecommendationVersion",
                table: "ComparableSales");

            migrationBuilder.AddColumn<string>(
                name: "SaleQualification",
                table: "ComparableSales",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "");
        }
    }
}
