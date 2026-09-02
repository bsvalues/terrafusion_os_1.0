using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations;

[DbContext(typeof(TerraFusionDbContext))]
[Migration("20260902000000_WAL002GCountyCsvUploadAdmissionLedger")]
public partial class WAL002GCountyCsvUploadAdmissionLedger : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "CountyCsvUploadBatches",
            columns: table => new
            {
                BatchId = table.Column<Guid>(type: "uuid", nullable: false),
                CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                ActorId = table.Column<string>(
                    type: "character varying(200)",
                    maxLength: 200,
                    nullable: false),
                Dataset = table.Column<string>(
                    type: "character varying(16)",
                    maxLength: 16,
                    nullable: false),
                SourceFileName = table.Column<string>(
                    type: "character varying(255)",
                    maxLength: 255,
                    nullable: false),
                Format = table.Column<string>(
                    type: "character varying(16)",
                    maxLength: 16,
                    nullable: false),
                MediaType = table.Column<string>(
                    type: "character varying(64)",
                    maxLength: 64,
                    nullable: false),
                ContentSha256 = table.Column<string>(
                    type: "character(64)",
                    fixedLength: true,
                    maxLength: 64,
                    nullable: false),
                ContentByteLength = table.Column<long>(type: "bigint", nullable: false),
                AcceptedRowCount = table.Column<int>(type: "integer", nullable: false),
                IdempotencyKey = table.Column<string>(
                    type: "character(64)",
                    fixedLength: true,
                    maxLength: 64,
                    nullable: false),
                ApiAdmissionContractId = table.Column<string>(
                    type: "character varying(128)",
                    maxLength: 128,
                    nullable: false),
                CountyContextContractId = table.Column<string>(
                    type: "character varying(128)",
                    maxLength: 128,
                    nullable: false),
                CountyBoundIntakeContractId = table.Column<string>(
                    type: "character varying(128)",
                    maxLength: 128,
                    nullable: false),
                EnvelopeContractId = table.Column<string>(
                    type: "character varying(128)",
                    maxLength: 128,
                    nullable: false),
                ParserContractId = table.Column<string>(
                    type: "character varying(128)",
                    maxLength: 128,
                    nullable: false),
                IdempotencyContractId = table.Column<string>(
                    type: "character varying(128)",
                    maxLength: 128,
                    nullable: false),
                LedgerContractId = table.Column<string>(
                    type: "character varying(128)",
                    maxLength: 128,
                    nullable: false),
                Status = table.Column<string>(
                    type: "character varying(16)",
                    maxLength: 16,
                    nullable: false),
                ReceivedAtUtc = table.Column<DateTimeOffset>(
                    type: "timestamp with time zone",
                    nullable: false),
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_CountyCsvUploadBatches", batch => batch.BatchId);
                table.ForeignKey(
                    name: "FK_CountyCsvUploadBatches_Counties_CountyId",
                    column: batch => batch.CountyId,
                    principalTable: "Counties",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateIndex(
            name: "IX_CountyCsvUploadBatches_CountyId_Dataset_ReceivedAtUtc",
            table: "CountyCsvUploadBatches",
            columns: new[] { "CountyId", "Dataset", "ReceivedAtUtc" });

        migrationBuilder.CreateIndex(
            name: "IX_CountyCsvUploadBatches_IdempotencyKey",
            table: "CountyCsvUploadBatches",
            column: "IdempotencyKey",
            unique: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "CountyCsvUploadBatches");
    }
}
