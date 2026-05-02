using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCanonicalTfAndSyncBridgeV1 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "sync_bridge");

            migrationBuilder.EnsureSchema(
                name: "canonical_tf");

            migrationBuilder.CreateTable(
                name: "conflict_queue",
                schema: "sync_bridge",
                columns: table => new
                {
                    ConflictId = table.Column<Guid>(type: "uuid", nullable: false),
                    LoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    TfEntityType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TfEntityId = table.Column<Guid>(type: "uuid", nullable: false),
                    FieldName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    DomainName = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ProposedValue = table.Column<string>(type: "text", nullable: true),
                    CurrentValue = table.Column<string>(type: "text", nullable: true),
                    ConflictStrategy = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ResolutionStatus = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    ResolvedValue = table.Column<string>(type: "text", nullable: true),
                    ResolvedBy = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    ResolvedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_conflict_queue", x => x.ConflictId);
                });

            migrationBuilder.CreateTable(
                name: "diff_ledger",
                schema: "sync_bridge",
                columns: table => new
                {
                    DiffId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    LoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    TfEntityType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TfEntityId = table.Column<Guid>(type: "uuid", nullable: false),
                    FieldName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    DiffKind = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    BeforeValue = table.Column<string>(type: "text", nullable: true),
                    AfterValue = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_diff_ledger", x => x.DiffId);
                });

            migrationBuilder.CreateTable(
                name: "field_authority",
                schema: "sync_bridge",
                columns: table => new
                {
                    AuthorityId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    DomainName = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    FieldName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Phase = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    SystemOfRecord = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    PacsToTfAllowed = table.Column<bool>(type: "boolean", nullable: false),
                    TfToPacsAllowed = table.Column<bool>(type: "boolean", nullable: false),
                    ConflictStrategy = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ApprovalRequired = table.Column<bool>(type: "boolean", nullable: false),
                    RollbackRequired = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_field_authority", x => x.AuthorityId);
                });

            migrationBuilder.CreateTable(
                name: "load_batch",
                schema: "sync_bridge",
                columns: table => new
                {
                    LoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceFamily = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    SourceSystem = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    SourceFileOrDatabase = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    SourceQueryName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    SourceQueryHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    RestoreSource = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    Operator = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    ProofGateReportPath = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: true),
                    RowsExtracted = table.Column<long>(type: "bigint", nullable: true),
                    RowsPromoted = table.Column<long>(type: "bigint", nullable: true),
                    ErrorSummary = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_load_batch", x => x.LoadBatchId);
                });

            migrationBuilder.CreateTable(
                name: "promotion_gate_result",
                schema: "sync_bridge",
                columns: table => new
                {
                    GateResultId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    LoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    GateName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    GateStage = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Expected = table.Column<string>(type: "text", nullable: true),
                    Actual = table.Column<string>(type: "text", nullable: true),
                    Detail = table.Column<string>(type: "text", nullable: true),
                    ExecutedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_promotion_gate_result", x => x.GateResultId);
                });

            migrationBuilder.CreateTable(
                name: "rollback_package",
                schema: "sync_bridge",
                columns: table => new
                {
                    RollbackPackageId = table.Column<Guid>(type: "uuid", nullable: false),
                    LoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    PackagePayload = table.Column<string>(type: "text", nullable: false),
                    PackageSizeBytes = table.Column<long>(type: "bigint", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    RestorableUntil = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AppliedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AppliedBy = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_rollback_package", x => x.RollbackPackageId);
                });

            migrationBuilder.CreateTable(
                name: "source_xref",
                schema: "sync_bridge",
                columns: table => new
                {
                    XrefId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TfEntityType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TfEntityId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceSystem = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    SourceDatabase = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    SourceTable = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    SourceKeyJson = table.Column<string>(type: "text", nullable: false),
                    SourceQueryHash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    LoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    FirstSeenAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastSeenAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ConfidenceScore = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_source_xref", x => x.XrefId);
                });

            migrationBuilder.CreateTable(
                name: "tf_parcel",
                schema: "canonical_tf",
                columns: table => new
                {
                    TfParcelId = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    ParcelNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    SitusAddress = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    LegalDescription = table.Column<string>(type: "text", nullable: true),
                    ParcelStatus = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    PropertyType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    CurrentOwnerId = table.Column<Guid>(type: "uuid", nullable: true),
                    CurrentAssessmentId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tf_parcel", x => x.TfParcelId);
                });

            migrationBuilder.CreateTable(
                name: "writeback_journal",
                schema: "sync_bridge",
                columns: table => new
                {
                    JournalId = table.Column<Guid>(type: "uuid", nullable: false),
                    LoadBatchId = table.Column<Guid>(type: "uuid", nullable: true),
                    TfEntityType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TfEntityId = table.Column<Guid>(type: "uuid", nullable: false),
                    TargetSystem = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TargetTable = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    TargetKeyJson = table.Column<string>(type: "text", nullable: false),
                    FieldName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    NewValue = table.Column<string>(type: "text", nullable: true),
                    AuthorityId = table.Column<long>(type: "bigint", nullable: false),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    ExecutedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Operator = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_writeback_journal", x => x.JournalId);
                });

            migrationBuilder.InsertData(
                schema: "sync_bridge",
                table: "field_authority",
                columns: new[] { "AuthorityId", "ApprovalRequired", "ConflictStrategy", "CreatedAt", "DomainName", "FieldName", "PacsToTfAllowed", "Phase", "RollbackRequired", "SystemOfRecord", "TfToPacsAllowed", "UpdatedAt" },
                values: new object[,]
                {
                    { -8L, false, "APPEND_ONLY", new DateTime(2026, 5, 2, 0, 0, 0, 0, DateTimeKind.Utc), "parcel", "updated_at", false, "phase_0", false, "TF", false, new DateTime(2026, 5, 2, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { -7L, false, "APPEND_ONLY", new DateTime(2026, 5, 2, 0, 0, 0, 0, DateTimeKind.Utc), "parcel", "created_at", false, "phase_0", false, "TF", false, new DateTime(2026, 5, 2, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { -6L, false, "TF_WINS", new DateTime(2026, 5, 2, 0, 0, 0, 0, DateTimeKind.Utc), "parcel", "county_id", false, "phase_0", true, "TF", false, new DateTime(2026, 5, 2, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { -5L, false, "PACS_WINS", new DateTime(2026, 5, 2, 0, 0, 0, 0, DateTimeKind.Utc), "parcel", "parcel_status", true, "phase_0", true, "PACS", false, new DateTime(2026, 5, 2, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { -4L, false, "PACS_WINS", new DateTime(2026, 5, 2, 0, 0, 0, 0, DateTimeKind.Utc), "parcel", "property_type", true, "phase_0", true, "PACS", false, new DateTime(2026, 5, 2, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { -3L, false, "PACS_WINS", new DateTime(2026, 5, 2, 0, 0, 0, 0, DateTimeKind.Utc), "parcel", "legal_description", true, "phase_0", true, "PACS", false, new DateTime(2026, 5, 2, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { -2L, true, "MANUAL_REVIEW", new DateTime(2026, 5, 2, 0, 0, 0, 0, DateTimeKind.Utc), "parcel", "situs_address", true, "phase_0", true, "PACS", false, new DateTime(2026, 5, 2, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { -1L, false, "PACS_WINS", new DateTime(2026, 5, 2, 0, 0, 0, 0, DateTimeKind.Utc), "parcel", "parcel_number", true, "phase_0", true, "PACS", false, new DateTime(2026, 5, 2, 0, 0, 0, 0, DateTimeKind.Utc) }
                });

            migrationBuilder.CreateIndex(
                name: "IX_conflict_queue_LoadBatchId",
                schema: "sync_bridge",
                table: "conflict_queue",
                column: "LoadBatchId");

            migrationBuilder.CreateIndex(
                name: "IX_conflict_queue_ResolutionStatus_CreatedAt",
                schema: "sync_bridge",
                table: "conflict_queue",
                columns: new[] { "ResolutionStatus", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_diff_ledger_LoadBatchId",
                schema: "sync_bridge",
                table: "diff_ledger",
                column: "LoadBatchId");

            migrationBuilder.CreateIndex(
                name: "IX_diff_ledger_TfEntityType_TfEntityId_FieldName",
                schema: "sync_bridge",
                table: "diff_ledger",
                columns: new[] { "TfEntityType", "TfEntityId", "FieldName" });

            migrationBuilder.CreateIndex(
                name: "IX_field_authority_DomainName_FieldName_Phase",
                schema: "sync_bridge",
                table: "field_authority",
                columns: new[] { "DomainName", "FieldName", "Phase" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_load_batch_SourceFamily_StartedAt",
                schema: "sync_bridge",
                table: "load_batch",
                columns: new[] { "SourceFamily", "StartedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_load_batch_Status",
                schema: "sync_bridge",
                table: "load_batch",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_promotion_gate_result_LoadBatchId_GateStage",
                schema: "sync_bridge",
                table: "promotion_gate_result",
                columns: new[] { "LoadBatchId", "GateStage" });

            migrationBuilder.CreateIndex(
                name: "IX_promotion_gate_result_Status_ExecutedAt",
                schema: "sync_bridge",
                table: "promotion_gate_result",
                columns: new[] { "Status", "ExecutedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_rollback_package_LoadBatchId",
                schema: "sync_bridge",
                table: "rollback_package",
                column: "LoadBatchId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_rollback_package_Status_RestorableUntil",
                schema: "sync_bridge",
                table: "rollback_package",
                columns: new[] { "Status", "RestorableUntil" });

            migrationBuilder.CreateIndex(
                name: "IX_source_xref_LoadBatchId",
                schema: "sync_bridge",
                table: "source_xref",
                column: "LoadBatchId");

            migrationBuilder.CreateIndex(
                name: "IX_source_xref_SourceSystem_SourceTable",
                schema: "sync_bridge",
                table: "source_xref",
                columns: new[] { "SourceSystem", "SourceTable" });

            migrationBuilder.CreateIndex(
                name: "IX_source_xref_TfEntityType_TfEntityId_SourceSystem",
                schema: "sync_bridge",
                table: "source_xref",
                columns: new[] { "TfEntityType", "TfEntityId", "SourceSystem" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_tf_parcel_CountyId_ParcelNumber",
                schema: "canonical_tf",
                table: "tf_parcel",
                columns: new[] { "CountyId", "ParcelNumber" });

            migrationBuilder.CreateIndex(
                name: "IX_tf_parcel_CountyId_ParcelStatus",
                schema: "canonical_tf",
                table: "tf_parcel",
                columns: new[] { "CountyId", "ParcelStatus" });

            migrationBuilder.CreateIndex(
                name: "IX_writeback_journal_LoadBatchId",
                schema: "sync_bridge",
                table: "writeback_journal",
                column: "LoadBatchId");

            migrationBuilder.CreateIndex(
                name: "IX_writeback_journal_TargetSystem_Status",
                schema: "sync_bridge",
                table: "writeback_journal",
                columns: new[] { "TargetSystem", "Status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "conflict_queue",
                schema: "sync_bridge");

            migrationBuilder.DropTable(
                name: "diff_ledger",
                schema: "sync_bridge");

            migrationBuilder.DropTable(
                name: "field_authority",
                schema: "sync_bridge");

            migrationBuilder.DropTable(
                name: "load_batch",
                schema: "sync_bridge");

            migrationBuilder.DropTable(
                name: "promotion_gate_result",
                schema: "sync_bridge");

            migrationBuilder.DropTable(
                name: "rollback_package",
                schema: "sync_bridge");

            migrationBuilder.DropTable(
                name: "source_xref",
                schema: "sync_bridge");

            migrationBuilder.DropTable(
                name: "tf_parcel",
                schema: "canonical_tf");

            migrationBuilder.DropTable(
                name: "writeback_journal",
                schema: "sync_bridge");
        }
    }
}
