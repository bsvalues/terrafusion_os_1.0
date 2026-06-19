using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
  /// <inheritdoc />
  public partial class AddLegacyPacsRawSaleCodeWidthAlignment : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
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
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
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
