using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPacsLookupTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CountyRatioCodes",
                columns: table => new
                {
                    RatioCd = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    RatioDesc = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CountyRatioCodes", x => x.RatioCd);
                });

            migrationBuilder.CreateTable(
                name: "DeedTypes",
                columns: table => new
                {
                    CountyCd = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    DeedTypeCd = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    DeedTypeDesc = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    SalesRatioTypeCd = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    SysFlag = table.Column<bool>(type: "boolean", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DeedTypes", x => new { x.CountyCd, x.DeedTypeCd });
                });

            migrationBuilder.CreateTable(
                name: "SaleRatioTypes",
                columns: table => new
                {
                    SlRatioTypeCd = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    SlRatioDesc = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    InvalidSale = table.Column<bool>(type: "boolean", nullable: false),
                    RequiresReason = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SaleRatioTypes", x => x.SlRatioTypeCd);
                });

            migrationBuilder.CreateTable(
                name: "SlFinancings",
                columns: table => new
                {
                    SlFinancingCd = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    SlFinancingDesc = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    SysFlag = table.Column<bool>(type: "boolean", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SlFinancings", x => x.SlFinancingCd);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CountyRatioCodes");

            migrationBuilder.DropTable(
                name: "DeedTypes");

            migrationBuilder.DropTable(
                name: "SaleRatioTypes");

            migrationBuilder.DropTable(
                name: "SlFinancings");
        }
    }
}
