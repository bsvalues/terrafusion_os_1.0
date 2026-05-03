using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddAttributeDefinition : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "attribute_definition",
                schema: "canonical_tf",
                columns: table => new
                {
                    AttributeDefinitionId = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    IAttrId = table.Column<long>(type: "bigint", nullable: false),
                    AttributeCode = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    AttributeName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    DataType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ValueDomain = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    AppliesTo = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    LoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceQueryHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_attribute_definition", x => x.AttributeDefinitionId);
                });

            migrationBuilder.CreateIndex(
                name: "ix_attribute_definition_county_active",
                schema: "canonical_tf",
                table: "attribute_definition",
                columns: new[] { "CountyId", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "ix_attribute_definition_county_applies",
                schema: "canonical_tf",
                table: "attribute_definition",
                columns: new[] { "CountyId", "AppliesTo" });

            migrationBuilder.CreateIndex(
                name: "ix_attribute_definition_load_batch",
                schema: "canonical_tf",
                table: "attribute_definition",
                column: "LoadBatchId");

            migrationBuilder.CreateIndex(
                name: "ux_attribute_definition_county_code",
                schema: "canonical_tf",
                table: "attribute_definition",
                columns: new[] { "CountyId", "AttributeCode" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ux_attribute_definition_county_iattr",
                schema: "canonical_tf",
                table: "attribute_definition",
                columns: new[] { "CountyId", "IAttrId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "attribute_definition",
                schema: "canonical_tf");
        }
    }
}
