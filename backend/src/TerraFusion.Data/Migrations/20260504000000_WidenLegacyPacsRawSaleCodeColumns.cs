using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <summary>
    /// SYNC-POP-2 finding #6: real Harris PACS column widths exceed the
    /// original doctrine fixture's varchar(8) caps on
    /// <c>legacy_pacs_raw.sale</c>.
    ///
    /// Per the <see cref="TerraFusion.Core.Entities.Pacs.PacsSale"/> entity
    /// attributes (which already match real PACS):
    ///   sl_county_ratio_cd → varchar(10)
    ///   wac_cd             → varchar(32)
    /// </summary>
    public partial class WidenLegacyPacsRawSaleCodeColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "SlCountyRatioCd",
                schema: "legacy_pacs_raw",
                table: "sale",
                type: "character varying(10)",
                maxLength: 10,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(8)",
                oldMaxLength: 8,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "WacCd",
                schema: "legacy_pacs_raw",
                table: "sale",
                type: "character varying(32)",
                maxLength: 32,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(8)",
                oldMaxLength: 8,
                oldNullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Down is documented but lossy — values longer than 8 chars
            // would truncate. Operators should drain authoritative data
            // before rolling back.
            migrationBuilder.AlterColumn<string>(
                name: "WacCd",
                schema: "legacy_pacs_raw",
                table: "sale",
                type: "character varying(8)",
                maxLength: 8,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(32)",
                oldMaxLength: 32,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "SlCountyRatioCd",
                schema: "legacy_pacs_raw",
                table: "sale",
                type: "character varying(8)",
                maxLength: 8,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(10)",
                oldMaxLength: 10,
                oldNullable: true);
        }
    }
}
