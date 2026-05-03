using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddSyncDatabaseAtlas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SyncProfileCodes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    SyncBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceSystem = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    SchemaName = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    TableName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    ColumnName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    DistinctValueCount = table.Column<int>(type: "integer", nullable: false),
                    IsCodeTableCandidate = table.Column<bool>(type: "boolean", nullable: false),
                    SampleValues = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    LookupTableName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    Notes = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SyncProfileCodes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SyncProfileCodes_Counties_CountyId",
                        column: x => x.CountyId,
                        principalTable: "Counties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SyncProfileCodes_SyncBatches_SyncBatchId",
                        column: x => x.SyncBatchId,
                        principalTable: "SyncBatches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SyncProfileColumns",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    SyncBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceSystem = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    SchemaName = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    TableName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    ColumnName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    OrdinalPosition = table.Column<int>(type: "integer", nullable: false),
                    DataType = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    MaxLength = table.Column<int>(type: "integer", nullable: true),
                    NumericPrecision = table.Column<int>(type: "integer", nullable: true),
                    NumericScale = table.Column<int>(type: "integer", nullable: true),
                    IsNullable = table.Column<bool>(type: "boolean", nullable: false),
                    IsPrimaryKey = table.Column<bool>(type: "boolean", nullable: false),
                    IsForeignKey = table.Column<bool>(type: "boolean", nullable: false),
                    DefaultValue = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: true),
                    Notes = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SyncProfileColumns", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SyncProfileColumns_Counties_CountyId",
                        column: x => x.CountyId,
                        principalTable: "Counties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SyncProfileColumns_SyncBatches_SyncBatchId",
                        column: x => x.SyncBatchId,
                        principalTable: "SyncBatches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SyncProfileConstraints",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    SyncBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceSystem = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    SchemaName = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    TableName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    ConstraintName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    ConstraintType = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Definition = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    ReferencedTable = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    ReferencedColumns = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: true),
                    Notes = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SyncProfileConstraints", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SyncProfileConstraints_Counties_CountyId",
                        column: x => x.CountyId,
                        principalTable: "Counties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SyncProfileConstraints_SyncBatches_SyncBatchId",
                        column: x => x.SyncBatchId,
                        principalTable: "SyncBatches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SyncProfileFunctions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    SyncBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceSystem = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    SchemaName = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    FunctionName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    FunctionType = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Definition = table.Column<string>(type: "text", nullable: false),
                    Notes = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SyncProfileFunctions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SyncProfileFunctions_Counties_CountyId",
                        column: x => x.CountyId,
                        principalTable: "Counties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SyncProfileFunctions_SyncBatches_SyncBatchId",
                        column: x => x.SyncBatchId,
                        principalTable: "SyncBatches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SyncProfileProcedures",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    SyncBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceSystem = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    SchemaName = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    ProcedureName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    Definition = table.Column<string>(type: "text", nullable: false),
                    Notes = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SyncProfileProcedures", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SyncProfileProcedures_Counties_CountyId",
                        column: x => x.CountyId,
                        principalTable: "Counties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SyncProfileProcedures_SyncBatches_SyncBatchId",
                        column: x => x.SyncBatchId,
                        principalTable: "SyncBatches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SyncProfileTables",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    SyncBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceSystem = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    SchemaName = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    TableName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    IsView = table.Column<bool>(type: "boolean", nullable: false),
                    RowCountEstimate = table.Column<long>(type: "bigint", nullable: true),
                    ColumnCount = table.Column<int>(type: "integer", nullable: false),
                    Notes = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SyncProfileTables", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SyncProfileTables_Counties_CountyId",
                        column: x => x.CountyId,
                        principalTable: "Counties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SyncProfileTables_SyncBatches_SyncBatchId",
                        column: x => x.SyncBatchId,
                        principalTable: "SyncBatches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SyncProfileTriggers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    SyncBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceSystem = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    SchemaName = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    TriggerName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    ParentTableName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    IsInsteadOf = table.Column<bool>(type: "boolean", nullable: false),
                    IsAfter = table.Column<bool>(type: "boolean", nullable: false),
                    Events = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Definition = table.Column<string>(type: "text", nullable: false),
                    Notes = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SyncProfileTriggers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SyncProfileTriggers_Counties_CountyId",
                        column: x => x.CountyId,
                        principalTable: "Counties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SyncProfileTriggers_SyncBatches_SyncBatchId",
                        column: x => x.SyncBatchId,
                        principalTable: "SyncBatches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SyncProfileViews",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    SyncBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceSystem = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    SchemaName = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    ViewName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    Definition = table.Column<string>(type: "text", nullable: false),
                    Notes = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    UpdatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SyncProfileViews", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SyncProfileViews_Counties_CountyId",
                        column: x => x.CountyId,
                        principalTable: "Counties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SyncProfileViews_SyncBatches_SyncBatchId",
                        column: x => x.SyncBatchId,
                        principalTable: "SyncBatches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SyncProfileCodes_CountyId_SourceSystem_IsCodeTableCandidate",
                table: "SyncProfileCodes",
                columns: new[] { "CountyId", "SourceSystem", "IsCodeTableCandidate" });

            migrationBuilder.CreateIndex(
                name: "IX_SyncProfileCodes_SyncBatchId_TableName_ColumnName",
                table: "SyncProfileCodes",
                columns: new[] { "SyncBatchId", "TableName", "ColumnName" });

            migrationBuilder.CreateIndex(
                name: "IX_SyncProfileColumns_CountyId_SourceSystem_TableName_ColumnNa~",
                table: "SyncProfileColumns",
                columns: new[] { "CountyId", "SourceSystem", "TableName", "ColumnName" });

            migrationBuilder.CreateIndex(
                name: "IX_SyncProfileColumns_SyncBatchId_SchemaName_TableName_Ordinal~",
                table: "SyncProfileColumns",
                columns: new[] { "SyncBatchId", "SchemaName", "TableName", "OrdinalPosition" });

            migrationBuilder.CreateIndex(
                name: "IX_SyncProfileConstraints_CountyId_SourceSystem_TableName",
                table: "SyncProfileConstraints",
                columns: new[] { "CountyId", "SourceSystem", "TableName" });

            migrationBuilder.CreateIndex(
                name: "IX_SyncProfileConstraints_SyncBatchId_TableName_ConstraintType",
                table: "SyncProfileConstraints",
                columns: new[] { "SyncBatchId", "TableName", "ConstraintType" });

            migrationBuilder.CreateIndex(
                name: "IX_SyncProfileFunctions_CountyId_SourceSystem_FunctionName",
                table: "SyncProfileFunctions",
                columns: new[] { "CountyId", "SourceSystem", "FunctionName" });

            migrationBuilder.CreateIndex(
                name: "IX_SyncProfileFunctions_SyncBatchId_SchemaName_FunctionName",
                table: "SyncProfileFunctions",
                columns: new[] { "SyncBatchId", "SchemaName", "FunctionName" });

            migrationBuilder.CreateIndex(
                name: "IX_SyncProfileProcedures_CountyId_SourceSystem_ProcedureName",
                table: "SyncProfileProcedures",
                columns: new[] { "CountyId", "SourceSystem", "ProcedureName" });

            migrationBuilder.CreateIndex(
                name: "IX_SyncProfileProcedures_SyncBatchId_SchemaName_ProcedureName",
                table: "SyncProfileProcedures",
                columns: new[] { "SyncBatchId", "SchemaName", "ProcedureName" });

            migrationBuilder.CreateIndex(
                name: "IX_SyncProfileTables_CountyId_SourceSystem_TableName",
                table: "SyncProfileTables",
                columns: new[] { "CountyId", "SourceSystem", "TableName" });

            migrationBuilder.CreateIndex(
                name: "IX_SyncProfileTables_SyncBatchId_SchemaName_TableName",
                table: "SyncProfileTables",
                columns: new[] { "SyncBatchId", "SchemaName", "TableName" });

            migrationBuilder.CreateIndex(
                name: "IX_SyncProfileTriggers_CountyId_SourceSystem_ParentTableName",
                table: "SyncProfileTriggers",
                columns: new[] { "CountyId", "SourceSystem", "ParentTableName" });

            migrationBuilder.CreateIndex(
                name: "IX_SyncProfileTriggers_SyncBatchId_ParentTableName_TriggerName",
                table: "SyncProfileTriggers",
                columns: new[] { "SyncBatchId", "ParentTableName", "TriggerName" });

            migrationBuilder.CreateIndex(
                name: "IX_SyncProfileViews_CountyId_SourceSystem_ViewName",
                table: "SyncProfileViews",
                columns: new[] { "CountyId", "SourceSystem", "ViewName" });

            migrationBuilder.CreateIndex(
                name: "IX_SyncProfileViews_SyncBatchId_SchemaName_ViewName",
                table: "SyncProfileViews",
                columns: new[] { "SyncBatchId", "SchemaName", "ViewName" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SyncProfileCodes");

            migrationBuilder.DropTable(
                name: "SyncProfileColumns");

            migrationBuilder.DropTable(
                name: "SyncProfileConstraints");

            migrationBuilder.DropTable(
                name: "SyncProfileFunctions");

            migrationBuilder.DropTable(
                name: "SyncProfileProcedures");

            migrationBuilder.DropTable(
                name: "SyncProfileTables");

            migrationBuilder.DropTable(
                name: "SyncProfileTriggers");

            migrationBuilder.DropTable(
                name: "SyncProfileViews");
        }
    }
}
