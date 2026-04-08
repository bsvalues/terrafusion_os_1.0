using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddReetWacCodesLookup : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ReetWacCodes",
                columns: table => new
                {
                    WacCd = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    WacDesc = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Inactive = table.Column<bool>(type: "boolean", nullable: false),
                    SysFlag = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReetWacCodes", x => x.WacCd);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ReetWacCodes");
        }
    }
}
