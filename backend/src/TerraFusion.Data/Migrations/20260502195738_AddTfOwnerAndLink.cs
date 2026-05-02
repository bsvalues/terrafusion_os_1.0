using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTfOwnerAndLink : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "owner_current",
                schema: "legacy_tf_unproven",
                columns: table => new
                {
                    UnprovenRowId = table.Column<Guid>(type: "uuid", nullable: false),
                    PropId = table.Column<int>(type: "integer", nullable: false),
                    OwnerTaxYr = table.Column<short>(type: "smallint", nullable: false),
                    SupNum = table.Column<short>(type: "smallint", nullable: false),
                    OwnerId = table.Column<long>(type: "bigint", nullable: false),
                    AcctId = table.Column<long>(type: "bigint", nullable: false),
                    FileAsName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    ConfidentialFlag = table.Column<bool>(type: "boolean", nullable: false),
                    WebSuppression = table.Column<bool>(type: "boolean", nullable: false),
                    SourceTruthOwnerCurrentId = table.Column<Guid>(type: "uuid", nullable: false),
                    PromotionLoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    QuarantineReason = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_owner_current", x => x.UnprovenRowId);
                });

            migrationBuilder.CreateTable(
                name: "tf_owner",
                schema: "canonical_tf",
                columns: table => new
                {
                    TfOwnerId = table.Column<Guid>(type: "uuid", nullable: false),
                    CountyId = table.Column<Guid>(type: "uuid", nullable: false),
                    AcctId = table.Column<long>(type: "bigint", nullable: false),
                    DisplayName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    FirstName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    LastName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    BirthDt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ConfidentialFlag = table.Column<bool>(type: "boolean", nullable: false),
                    WebSuppression = table.Column<bool>(type: "boolean", nullable: false),
                    TypeOfOwner = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: true),
                    PromotionLoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tf_owner", x => x.TfOwnerId);
                });

            migrationBuilder.CreateTable(
                name: "tf_parcel_owner_link",
                schema: "canonical_tf",
                columns: table => new
                {
                    TfParcelOwnerLinkId = table.Column<Guid>(type: "uuid", nullable: false),
                    TfParcelId = table.Column<Guid>(type: "uuid", nullable: false),
                    TfOwnerId = table.Column<Guid>(type: "uuid", nullable: false),
                    OwnerTaxYr = table.Column<short>(type: "smallint", nullable: false),
                    PctOwnership = table.Column<decimal>(type: "numeric(7,4)", precision: 7, scale: 4, nullable: true),
                    IsPrimary = table.Column<bool>(type: "boolean", nullable: false),
                    SourceTruthOwnerCurrentId = table.Column<Guid>(type: "uuid", nullable: false),
                    PromotionLoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tf_parcel_owner_link", x => x.TfParcelOwnerLinkId);
                });

            migrationBuilder.CreateIndex(
                name: "ix_legacy_tf_unproven_owner_current_promotion_batch",
                schema: "legacy_tf_unproven",
                table: "owner_current",
                column: "PromotionLoadBatchId");

            migrationBuilder.CreateIndex(
                name: "ix_legacy_tf_unproven_owner_current_propid",
                schema: "legacy_tf_unproven",
                table: "owner_current",
                column: "PropId");

            migrationBuilder.CreateIndex(
                name: "ix_legacy_tf_unproven_owner_current_reason",
                schema: "legacy_tf_unproven",
                table: "owner_current",
                column: "QuarantineReason");

            migrationBuilder.CreateIndex(
                name: "ix_tf_owner_acctid",
                schema: "canonical_tf",
                table: "tf_owner",
                column: "AcctId");

            migrationBuilder.CreateIndex(
                name: "ix_tf_owner_confidential",
                schema: "canonical_tf",
                table: "tf_owner",
                column: "ConfidentialFlag");

            migrationBuilder.CreateIndex(
                name: "ix_tf_owner_county",
                schema: "canonical_tf",
                table: "tf_owner",
                column: "CountyId");

            migrationBuilder.CreateIndex(
                name: "ix_tf_owner_promotion_batch",
                schema: "canonical_tf",
                table: "tf_owner",
                column: "PromotionLoadBatchId");

            migrationBuilder.CreateIndex(
                name: "ix_tf_parcel_owner_link_owner_year",
                schema: "canonical_tf",
                table: "tf_parcel_owner_link",
                columns: new[] { "TfOwnerId", "OwnerTaxYr" });

            migrationBuilder.CreateIndex(
                name: "ix_tf_parcel_owner_link_parcel_year",
                schema: "canonical_tf",
                table: "tf_parcel_owner_link",
                columns: new[] { "TfParcelId", "OwnerTaxYr" });

            migrationBuilder.CreateIndex(
                name: "ix_tf_parcel_owner_link_promotion_batch",
                schema: "canonical_tf",
                table: "tf_parcel_owner_link",
                column: "PromotionLoadBatchId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "owner_current",
                schema: "legacy_tf_unproven");

            migrationBuilder.DropTable(
                name: "tf_owner",
                schema: "canonical_tf");

            migrationBuilder.DropTable(
                name: "tf_parcel_owner_link",
                schema: "canonical_tf");
        }
    }
}
