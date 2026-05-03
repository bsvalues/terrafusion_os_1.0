using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddAttributeIdNullableFkToFeatureAndLand : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "AttributeId",
                schema: "canonical_tf",
                table: "tf_land",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "AttributeId",
                schema: "canonical_tf",
                table: "tf_improvement_feature",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_tf_land_attribute_id",
                schema: "canonical_tf",
                table: "tf_land",
                column: "AttributeId");

            migrationBuilder.CreateIndex(
                name: "ix_tf_improvement_feature_attribute_id",
                schema: "canonical_tf",
                table: "tf_improvement_feature",
                column: "AttributeId");

            migrationBuilder.AddForeignKey(
                name: "fk_tf_improvement_feature_attribute_definition",
                schema: "canonical_tf",
                table: "tf_improvement_feature",
                column: "AttributeId",
                principalSchema: "canonical_tf",
                principalTable: "attribute_definition",
                principalColumn: "AttributeDefinitionId");

            migrationBuilder.AddForeignKey(
                name: "fk_tf_land_attribute_definition",
                schema: "canonical_tf",
                table: "tf_land",
                column: "AttributeId",
                principalSchema: "canonical_tf",
                principalTable: "attribute_definition",
                principalColumn: "AttributeDefinitionId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_tf_improvement_feature_attribute_definition",
                schema: "canonical_tf",
                table: "tf_improvement_feature");

            migrationBuilder.DropForeignKey(
                name: "fk_tf_land_attribute_definition",
                schema: "canonical_tf",
                table: "tf_land");

            migrationBuilder.DropIndex(
                name: "ix_tf_land_attribute_id",
                schema: "canonical_tf",
                table: "tf_land");

            migrationBuilder.DropIndex(
                name: "ix_tf_improvement_feature_attribute_id",
                schema: "canonical_tf",
                table: "tf_improvement_feature");

            migrationBuilder.DropColumn(
                name: "AttributeId",
                schema: "canonical_tf",
                table: "tf_land");

            migrationBuilder.DropColumn(
                name: "AttributeId",
                schema: "canonical_tf",
                table: "tf_improvement_feature");
        }
    }
}
