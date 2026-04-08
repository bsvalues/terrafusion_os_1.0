using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class FixImprvDetailDecimalOverflow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "WacCd",
                table: "ReetWacCodes",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(20)",
                oldMaxLength: 20);

            migrationBuilder.AlterColumn<decimal>(
                name: "SizeAdjPct",
                table: "pacs_improvement_details",
                type: "numeric(8,4)",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(5,4)",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "PhysicalPct",
                table: "pacs_improvement_details",
                type: "numeric(6,2)",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(5,4)",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "ImprvDetAdjFactor",
                table: "pacs_improvement_details",
                type: "numeric(8,4)",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(5,4)",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "FunctionalPct",
                table: "pacs_improvement_details",
                type: "numeric(6,2)",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(5,4)",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "EconomicPct",
                table: "pacs_improvement_details",
                type: "numeric(6,2)",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(5,4)",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "DepPct",
                table: "pacs_improvement_details",
                type: "numeric(6,2)",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(5,4)",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "AddFactor",
                table: "pacs_improvement_details",
                type: "numeric(8,4)",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(5,4)",
                oldNullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "WacCd",
                table: "ReetWacCodes",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<decimal>(
                name: "SizeAdjPct",
                table: "pacs_improvement_details",
                type: "numeric(5,4)",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(8,4)",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "PhysicalPct",
                table: "pacs_improvement_details",
                type: "numeric(5,4)",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(6,2)",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "ImprvDetAdjFactor",
                table: "pacs_improvement_details",
                type: "numeric(5,4)",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(8,4)",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "FunctionalPct",
                table: "pacs_improvement_details",
                type: "numeric(5,4)",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(6,2)",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "EconomicPct",
                table: "pacs_improvement_details",
                type: "numeric(5,4)",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(6,2)",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "DepPct",
                table: "pacs_improvement_details",
                type: "numeric(5,4)",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(6,2)",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "AddFactor",
                table: "pacs_improvement_details",
                type: "numeric(5,4)",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(8,4)",
                oldNullable: true);
        }
    }
}
