using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCanonicalLandingSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ImprovementDetails",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    PropertyId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceSystem = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    SourceImprvId = table.Column<int>(type: "integer", nullable: false),
                    SourceImprvDetId = table.Column<int>(type: "integer", nullable: false),
                    AssessmentYear = table.Column<int>(type: "integer", nullable: false),
                    SupplementNumber = table.Column<int>(type: "integer", nullable: false),
                    TypeCode = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    ClassCode = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    MethodCode = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    AreaSqFt = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: true),
                    Value = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: true),
                    ValueSource = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: true),
                    ConditionCode = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    YearBuilt = table.Column<int>(type: "integer", nullable: true),
                    PhysicalPercent = table.Column<decimal>(type: "numeric(7,4)", precision: 7, scale: 4, nullable: true),
                    FunctionalPercent = table.Column<decimal>(type: "numeric(7,4)", precision: 7, scale: 4, nullable: true),
                    EconomicPercent = table.Column<decimal>(type: "numeric(7,4)", precision: 7, scale: 4, nullable: true),
                    PercentComplete = table.Column<decimal>(type: "numeric(7,4)", precision: 7, scale: 4, nullable: true),
                    DepreciationPercent = table.Column<decimal>(type: "numeric(7,4)", precision: 7, scale: 4, nullable: true),
                    IsNewValue = table.Column<bool>(type: "boolean", nullable: false),
                    PayloadHash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ImprovementDetails", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ImprovementDetails_Counties_CountyId",
                        column: x => x.CountyId,
                        principalTable: "Counties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ImprovementDetails_Properties_PropertyId",
                        column: x => x.PropertyId,
                        principalTable: "Properties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "LandSegments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    PropertyId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceSystem = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    SourceLandSegmentId = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    AssessmentYear = table.Column<int>(type: "integer", nullable: false),
                    SupplementNumber = table.Column<int>(type: "integer", nullable: false),
                    LandTypeCode = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Acreage = table.Column<decimal>(type: "numeric(14,4)", precision: 14, scale: 4, nullable: true),
                    SizeSquareFeet = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: true),
                    MarketValue = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: true),
                    AssessedValue = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: true),
                    PayloadHash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LandSegments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LandSegments_Counties_CountyId",
                        column: x => x.CountyId,
                        principalTable: "Counties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_LandSegments_Properties_PropertyId",
                        column: x => x.PropertyId,
                        principalTable: "Properties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Owners",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceSystem = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    SourceOwnerId = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    RawName = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    NormalizedName = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    RawMailingAddress = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    NormalizedMailingAddress = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Owners", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Owners_Counties_CountyId",
                        column: x => x.CountyId,
                        principalTable: "Counties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "OwnershipEvents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    OwnerId = table.Column<Guid>(type: "uuid", nullable: false),
                    PropertyId = table.Column<Guid>(type: "uuid", nullable: false),
                    EffectiveFrom = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    EffectiveThrough = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    SourceSystem = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    SourceOwnerId = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    SourceChangeOfOwnerId = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OwnershipEvents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OwnershipEvents_Counties_CountyId",
                        column: x => x.CountyId,
                        principalTable: "Counties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_OwnershipEvents_Owners_OwnerId",
                        column: x => x.OwnerId,
                        principalTable: "Owners",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_OwnershipEvents_Properties_PropertyId",
                        column: x => x.PropertyId,
                        principalTable: "Properties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ImprovementDetails_CountyId_PropertyId_AssessmentYear_Suppl~",
                table: "ImprovementDetails",
                columns: new[] { "CountyId", "PropertyId", "AssessmentYear", "SupplementNumber" });

            migrationBuilder.CreateIndex(
                name: "IX_ImprovementDetails_CountyId_SourceSystem_SourceImprvId_Sour~",
                table: "ImprovementDetails",
                columns: new[] { "CountyId", "SourceSystem", "SourceImprvId", "SourceImprvDetId" });

            migrationBuilder.CreateIndex(
                name: "IX_ImprovementDetails_CountyId_TypeCode",
                table: "ImprovementDetails",
                columns: new[] { "CountyId", "TypeCode" });

            migrationBuilder.CreateIndex(
                name: "IX_ImprovementDetails_PropertyId",
                table: "ImprovementDetails",
                column: "PropertyId");

            migrationBuilder.CreateIndex(
                name: "IX_LandSegments_CountyId_PropertyId_AssessmentYear_SupplementN~",
                table: "LandSegments",
                columns: new[] { "CountyId", "PropertyId", "AssessmentYear", "SupplementNumber" });

            migrationBuilder.CreateIndex(
                name: "IX_LandSegments_CountyId_SourceSystem_SourceLandSegmentId_Asse~",
                table: "LandSegments",
                columns: new[] { "CountyId", "SourceSystem", "SourceLandSegmentId", "AssessmentYear" });

            migrationBuilder.CreateIndex(
                name: "IX_LandSegments_PropertyId",
                table: "LandSegments",
                column: "PropertyId");

            migrationBuilder.CreateIndex(
                name: "IX_Owners_CountyId_NormalizedName",
                table: "Owners",
                columns: new[] { "CountyId", "NormalizedName" });

            migrationBuilder.CreateIndex(
                name: "IX_Owners_CountyId_SourceSystem_SourceOwnerId",
                table: "Owners",
                columns: new[] { "CountyId", "SourceSystem", "SourceOwnerId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OwnershipEvents_CountyId_OwnerId",
                table: "OwnershipEvents",
                columns: new[] { "CountyId", "OwnerId" });

            migrationBuilder.CreateIndex(
                name: "IX_OwnershipEvents_CountyId_PropertyId_EffectiveFrom",
                table: "OwnershipEvents",
                columns: new[] { "CountyId", "PropertyId", "EffectiveFrom" });

            migrationBuilder.CreateIndex(
                name: "IX_OwnershipEvents_CountyId_PropertyId_EffectiveThrough",
                table: "OwnershipEvents",
                columns: new[] { "CountyId", "PropertyId", "EffectiveThrough" });

            migrationBuilder.CreateIndex(
                name: "IX_OwnershipEvents_OwnerId",
                table: "OwnershipEvents",
                column: "OwnerId");

            migrationBuilder.CreateIndex(
                name: "IX_OwnershipEvents_PropertyId",
                table: "OwnershipEvents",
                column: "PropertyId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ImprovementDetails");

            migrationBuilder.DropTable(
                name: "LandSegments");

            migrationBuilder.DropTable(
                name: "OwnershipEvents");

            migrationBuilder.DropTable(
                name: "Owners");
        }
    }
}
