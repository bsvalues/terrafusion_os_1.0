using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class LevyCertificationCanonicalUniqueKey : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
DELETE FROM ""LevyCertifications"" AS duplicate
USING (
    SELECT ""Id"",
           ROW_NUMBER() OVER (
               PARTITION BY ""CountyId"", ""TaxYear"", UPPER(BTRIM(""DistrictCode""))
               ORDER BY
                   CASE WHEN LOWER(""Status"") = 'certified' THEN 0 ELSE 1 END,
                   ""CreatedAt"" DESC,
                   ""Id"" DESC
           ) AS row_number
    FROM ""LevyCertifications""
) AS ranked
WHERE duplicate.""Id"" = ranked.""Id""
  AND ranked.row_number > 1;

UPDATE ""LevyCertifications""
SET ""DistrictCode"" = UPPER(BTRIM(""DistrictCode""))
WHERE ""DistrictCode"" <> UPPER(BTRIM(""DistrictCode""));
");

            migrationBuilder.CreateIndex(
                name: "UX_LevyCertifications_County_TaxYear_DistrictCode",
                table: "LevyCertifications",
                columns: new[] { "CountyId", "TaxYear", "DistrictCode" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "UX_LevyCertifications_County_TaxYear_DistrictCode",
                table: "LevyCertifications");
        }
    }
}
