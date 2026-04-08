using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class FixPacsSaleDecimalOverflow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<decimal>(
                name: "SaleAdjSlPct",
                table: "pacs_sales",
                type: "numeric(8,4)",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(5,4)",
                oldNullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<decimal>(
                name: "SaleAdjSlPct",
                table: "pacs_sales",
                type: "numeric(5,4)",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(8,4)",
                oldNullable: true);
        }
    }
}
