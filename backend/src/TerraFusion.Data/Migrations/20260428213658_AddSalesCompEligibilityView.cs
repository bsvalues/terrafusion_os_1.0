using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddSalesCompEligibilityView : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Slice C37-B: comp-eligibility filter SQL view per the
            // C37-A policy. Single selection rule:
            // ComputedDecision = 1 (Qualified). Excluded (2) and
            // Inconclusive (3) are NOT comp-eligible. The view exists
            // for ad-hoc analyst SQL; the EF
            // ISalesCompEligibilityReader is the canonical caller
            // surface for application code. Both must resolve to the
            // same row set for a given county.
            //
            // PII guard (C37-A Hard Guard 5): the view projects only
            // PII-free columns. CountyId, ChgOfOwnerId, the wac /
            // ratio source+canonical pairs, the sale date / price
            // snapshot, and workbook provenance — never grantor /
            // grantee / address.
            //
            // Read-only by construction: this is a SQL VIEW, not a
            // MATERIALIZED VIEW. There is no underlying storage to
            // mutate.
            migrationBuilder.Sql(@"
CREATE OR REPLACE VIEW vw_sales_comp_eligible AS
SELECT
    ""CountyId"",
    ""ChgOfOwnerId"",
    ""WacCdSourceValue"",
    ""WacCdCanonicalValue"",
    ""SlRatioTypeCdSourceValue"",
    ""SlRatioTypeCdCanonicalValue"",
    ""SaleDate"",
    ""SalePrice"",
    ""SourceWorkbookId"",
    ""SourceWorkbookLockedAt""
FROM    ""CanonicalSaleQualifications""
WHERE   ""ComputedDecision"" = 1;
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"DROP VIEW IF EXISTS vw_sales_comp_eligible;");
        }
    }
}
