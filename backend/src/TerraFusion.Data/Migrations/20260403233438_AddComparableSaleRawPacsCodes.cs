using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddComparableSaleRawPacsCodes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Appeals_Counties_CountyId",
                table: "Appeals");

            migrationBuilder.DropForeignKey(
                name: "FK_CertificationSteps_Counties_CountyId",
                table: "CertificationSteps");

            migrationBuilder.DropForeignKey(
                name: "FK_Exemptions_Counties_CountyId",
                table: "Exemptions");

            migrationBuilder.DropForeignKey(
                name: "FK_Notices_Counties_CountyId",
                table: "Notices");

            migrationBuilder.DropForeignKey(
                name: "FK_QueueItems_Counties_CountyId",
                table: "QueueItems");

            migrationBuilder.DropIndex(
                name: "IX_QueueItems_CountyId",
                table: "QueueItems");

            migrationBuilder.DropIndex(
                name: "IX_Notices_CountyId",
                table: "Notices");

            migrationBuilder.DropIndex(
                name: "IX_Exemptions_CountyId",
                table: "Exemptions");

            migrationBuilder.DropIndex(
                name: "IX_CertificationSteps_CountyId",
                table: "CertificationSteps");

            migrationBuilder.DropIndex(
                name: "IX_Appeals_CountyId",
                table: "Appeals");

            migrationBuilder.AlterColumn<decimal>(
                name: "ExemptionAmount",
                table: "Exemptions",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AddColumn<string>(
                name: "RawCountyRatioCd",
                table: "ComparableSales",
                type: "character varying(10)",
                maxLength: 10,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RawExcludeCalcCd",
                table: "ComparableSales",
                type: "character varying(10)",
                maxLength: 10,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RawSaleQualifier",
                table: "ComparableSales",
                type: "character varying(10)",
                maxLength: 10,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RawWacCd",
                table: "ComparableSales",
                type: "character varying(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "DepreciationPct",
                table: "CamaCharacteristics",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ImprvVal",
                table: "CamaCharacteristics",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "PhysicalDepreciationPct",
                table: "CamaCharacteristics",
                type: "numeric",
                nullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "RequestedValue",
                table: "Appeals",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AlterColumn<decimal>(
                name: "DecidedValue",
                table: "Appeals",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "CurrentValue",
                table: "Appeals",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.CreateTable(
                name: "cama_improvement_details",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ParcelId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TaxYear = table.Column<int>(type: "integer", nullable: false),
                    SegmentType = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    SegmentDesc = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    MethodCode = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: true),
                    ClassCode = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    SubClassCode = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    ConditionCode = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: true),
                    Area = table.Column<decimal>(type: "numeric", nullable: true),
                    UnitPrice = table.Column<decimal>(type: "numeric", nullable: true),
                    CalcValue = table.Column<decimal>(type: "numeric", nullable: true),
                    DepreciatedRCN = table.Column<decimal>(type: "numeric", nullable: true),
                    PhysicalPct = table.Column<decimal>(type: "numeric", nullable: true),
                    DepPct = table.Column<decimal>(type: "numeric", nullable: true),
                    YearBuilt = table.Column<int>(type: "integer", nullable: true),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_cama_improvement_details", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_QueueItems_CountyId_AssignedTo_Status",
                table: "QueueItems",
                columns: new[] { "CountyId", "AssignedTo", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_QueueItems_CountyId_Id",
                table: "QueueItems",
                columns: new[] { "CountyId", "Id" });

            migrationBuilder.CreateIndex(
                name: "IX_QueueItems_CountyId_Status_CreatedAt",
                table: "QueueItems",
                columns: new[] { "CountyId", "Status", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_QueueItems_CountyId_TaskType_Status",
                table: "QueueItems",
                columns: new[] { "CountyId", "TaskType", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_Notices_CountyId_Id",
                table: "Notices",
                columns: new[] { "CountyId", "Id" });

            migrationBuilder.CreateIndex(
                name: "IX_Notices_CountyId_ParcelId_CreatedAt",
                table: "Notices",
                columns: new[] { "CountyId", "ParcelId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Notices_CountyId_Status_CreatedAt",
                table: "Notices",
                columns: new[] { "CountyId", "Status", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Notices_CountyId_TemplateId",
                table: "Notices",
                columns: new[] { "CountyId", "TemplateId" });

            migrationBuilder.CreateIndex(
                name: "IX_Exemptions_CountyId_Id",
                table: "Exemptions",
                columns: new[] { "CountyId", "Id" });

            migrationBuilder.CreateIndex(
                name: "IX_Exemptions_CountyId_ParcelId_ApplicationDate",
                table: "Exemptions",
                columns: new[] { "CountyId", "ParcelId", "ApplicationDate" });

            migrationBuilder.CreateIndex(
                name: "IX_Exemptions_CountyId_ProgramCode_Status",
                table: "Exemptions",
                columns: new[] { "CountyId", "ProgramCode", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_Exemptions_CountyId_Status",
                table: "Exemptions",
                columns: new[] { "CountyId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_CertificationSteps_CountyId_Id",
                table: "CertificationSteps",
                columns: new[] { "CountyId", "Id" });

            migrationBuilder.CreateIndex(
                name: "IX_CertificationSteps_CountyId_TaxYear_Status",
                table: "CertificationSteps",
                columns: new[] { "CountyId", "TaxYear", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_CertificationSteps_CountyId_TaxYear_StepCode",
                table: "CertificationSteps",
                columns: new[] { "CountyId", "TaxYear", "StepCode" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CertificationSteps_DependsOnStepId",
                table: "CertificationSteps",
                column: "DependsOnStepId");

            migrationBuilder.CreateIndex(
                name: "IX_Appeals_CountyId_Id",
                table: "Appeals",
                columns: new[] { "CountyId", "Id" });

            migrationBuilder.CreateIndex(
                name: "IX_Appeals_CountyId_ParcelId_FiledDate",
                table: "Appeals",
                columns: new[] { "CountyId", "ParcelId", "FiledDate" });

            migrationBuilder.CreateIndex(
                name: "IX_Appeals_CountyId_Status",
                table: "Appeals",
                columns: new[] { "CountyId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_Appeals_CountyId_TaxYear_FiledDate",
                table: "Appeals",
                columns: new[] { "CountyId", "TaxYear", "FiledDate" });

            migrationBuilder.CreateIndex(
                name: "IX_CamaImprvDet_ParcelYear",
                table: "cama_improvement_details",
                columns: new[] { "ParcelId", "TaxYear" });

            migrationBuilder.AddForeignKey(
                name: "FK_Appeals_Counties_CountyId",
                table: "Appeals",
                column: "CountyId",
                principalTable: "Counties",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_CertificationSteps_CertificationSteps_DependsOnStepId",
                table: "CertificationSteps",
                column: "DependsOnStepId",
                principalTable: "CertificationSteps",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_CertificationSteps_Counties_CountyId",
                table: "CertificationSteps",
                column: "CountyId",
                principalTable: "Counties",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Exemptions_Counties_CountyId",
                table: "Exemptions",
                column: "CountyId",
                principalTable: "Counties",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Notices_Counties_CountyId",
                table: "Notices",
                column: "CountyId",
                principalTable: "Counties",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_QueueItems_Counties_CountyId",
                table: "QueueItems",
                column: "CountyId",
                principalTable: "Counties",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Appeals_Counties_CountyId",
                table: "Appeals");

            migrationBuilder.DropForeignKey(
                name: "FK_CertificationSteps_CertificationSteps_DependsOnStepId",
                table: "CertificationSteps");

            migrationBuilder.DropForeignKey(
                name: "FK_CertificationSteps_Counties_CountyId",
                table: "CertificationSteps");

            migrationBuilder.DropForeignKey(
                name: "FK_Exemptions_Counties_CountyId",
                table: "Exemptions");

            migrationBuilder.DropForeignKey(
                name: "FK_Notices_Counties_CountyId",
                table: "Notices");

            migrationBuilder.DropForeignKey(
                name: "FK_QueueItems_Counties_CountyId",
                table: "QueueItems");

            migrationBuilder.DropTable(
                name: "cama_improvement_details");

            migrationBuilder.DropIndex(
                name: "IX_QueueItems_CountyId_AssignedTo_Status",
                table: "QueueItems");

            migrationBuilder.DropIndex(
                name: "IX_QueueItems_CountyId_Id",
                table: "QueueItems");

            migrationBuilder.DropIndex(
                name: "IX_QueueItems_CountyId_Status_CreatedAt",
                table: "QueueItems");

            migrationBuilder.DropIndex(
                name: "IX_QueueItems_CountyId_TaskType_Status",
                table: "QueueItems");

            migrationBuilder.DropIndex(
                name: "IX_Notices_CountyId_Id",
                table: "Notices");

            migrationBuilder.DropIndex(
                name: "IX_Notices_CountyId_ParcelId_CreatedAt",
                table: "Notices");

            migrationBuilder.DropIndex(
                name: "IX_Notices_CountyId_Status_CreatedAt",
                table: "Notices");

            migrationBuilder.DropIndex(
                name: "IX_Notices_CountyId_TemplateId",
                table: "Notices");

            migrationBuilder.DropIndex(
                name: "IX_Exemptions_CountyId_Id",
                table: "Exemptions");

            migrationBuilder.DropIndex(
                name: "IX_Exemptions_CountyId_ParcelId_ApplicationDate",
                table: "Exemptions");

            migrationBuilder.DropIndex(
                name: "IX_Exemptions_CountyId_ProgramCode_Status",
                table: "Exemptions");

            migrationBuilder.DropIndex(
                name: "IX_Exemptions_CountyId_Status",
                table: "Exemptions");

            migrationBuilder.DropIndex(
                name: "IX_CertificationSteps_CountyId_Id",
                table: "CertificationSteps");

            migrationBuilder.DropIndex(
                name: "IX_CertificationSteps_CountyId_TaxYear_Status",
                table: "CertificationSteps");

            migrationBuilder.DropIndex(
                name: "IX_CertificationSteps_CountyId_TaxYear_StepCode",
                table: "CertificationSteps");

            migrationBuilder.DropIndex(
                name: "IX_CertificationSteps_DependsOnStepId",
                table: "CertificationSteps");

            migrationBuilder.DropIndex(
                name: "IX_Appeals_CountyId_Id",
                table: "Appeals");

            migrationBuilder.DropIndex(
                name: "IX_Appeals_CountyId_ParcelId_FiledDate",
                table: "Appeals");

            migrationBuilder.DropIndex(
                name: "IX_Appeals_CountyId_Status",
                table: "Appeals");

            migrationBuilder.DropIndex(
                name: "IX_Appeals_CountyId_TaxYear_FiledDate",
                table: "Appeals");

            migrationBuilder.DropColumn(
                name: "RawCountyRatioCd",
                table: "ComparableSales");

            migrationBuilder.DropColumn(
                name: "RawExcludeCalcCd",
                table: "ComparableSales");

            migrationBuilder.DropColumn(
                name: "RawSaleQualifier",
                table: "ComparableSales");

            migrationBuilder.DropColumn(
                name: "RawWacCd",
                table: "ComparableSales");

            migrationBuilder.DropColumn(
                name: "DepreciationPct",
                table: "CamaCharacteristics");

            migrationBuilder.DropColumn(
                name: "ImprvVal",
                table: "CamaCharacteristics");

            migrationBuilder.DropColumn(
                name: "PhysicalDepreciationPct",
                table: "CamaCharacteristics");

            migrationBuilder.AlterColumn<decimal>(
                name: "ExemptionAmount",
                table: "Exemptions",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(18,2)",
                oldPrecision: 18,
                oldScale: 2);

            migrationBuilder.AlterColumn<decimal>(
                name: "RequestedValue",
                table: "Appeals",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(18,2)",
                oldPrecision: 18,
                oldScale: 2);

            migrationBuilder.AlterColumn<decimal>(
                name: "DecidedValue",
                table: "Appeals",
                type: "numeric",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(18,2)",
                oldPrecision: 18,
                oldScale: 2,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "CurrentValue",
                table: "Appeals",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(18,2)",
                oldPrecision: 18,
                oldScale: 2);

            migrationBuilder.CreateIndex(
                name: "IX_QueueItems_CountyId",
                table: "QueueItems",
                column: "CountyId");

            migrationBuilder.CreateIndex(
                name: "IX_Notices_CountyId",
                table: "Notices",
                column: "CountyId");

            migrationBuilder.CreateIndex(
                name: "IX_Exemptions_CountyId",
                table: "Exemptions",
                column: "CountyId");

            migrationBuilder.CreateIndex(
                name: "IX_CertificationSteps_CountyId",
                table: "CertificationSteps",
                column: "CountyId");

            migrationBuilder.CreateIndex(
                name: "IX_Appeals_CountyId",
                table: "Appeals",
                column: "CountyId");

            migrationBuilder.AddForeignKey(
                name: "FK_Appeals_Counties_CountyId",
                table: "Appeals",
                column: "CountyId",
                principalTable: "Counties",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_CertificationSteps_Counties_CountyId",
                table: "CertificationSteps",
                column: "CountyId",
                principalTable: "Counties",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Exemptions_Counties_CountyId",
                table: "Exemptions",
                column: "CountyId",
                principalTable: "Counties",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Notices_Counties_CountyId",
                table: "Notices",
                column: "CountyId",
                principalTable: "Counties",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_QueueItems_Counties_CountyId",
                table: "QueueItems",
                column: "CountyId",
                principalTable: "Counties",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
