using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable enable

namespace TerraFusion.CurrentUse.Migrations;

/// <summary>
/// Persists CUForge case desk human workflow state only.
/// Derived program facts remain sourced from Current Use classification, removal, and interest records.
/// </summary>
public partial class CaseStatePersistence : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.EnsureSchema(name: "currentuse");

        migrationBuilder.CreateTable(
            name: "case_states",
            schema: "currentuse",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                CaseId = table.Column<Guid>(type: "uuid", nullable: false),
                CaseStage = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                AssignedAppraiser = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                ChiefReviewStatus = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                NoticeApprovalStatus = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                LocalCaseNotes = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
                AgingBasisDate = table.Column<DateOnly>(type: "date", nullable: false),
                LastTouchedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_case_states", x => x.Id);
            });

        migrationBuilder.CreateIndex(
            name: "IX_case_states_AssignedAppraiser",
            schema: "currentuse",
            table: "case_states",
            column: "AssignedAppraiser");

        migrationBuilder.CreateIndex(
            name: "IX_case_states_CaseId",
            schema: "currentuse",
            table: "case_states",
            column: "CaseId",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_case_states_CaseStage",
            schema: "currentuse",
            table: "case_states",
            column: "CaseStage");

        migrationBuilder.CreateIndex(
            name: "IX_case_states_LastTouchedAt",
            schema: "currentuse",
            table: "case_states",
            column: "LastTouchedAt");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "case_states", schema: "currentuse");
    }
}
