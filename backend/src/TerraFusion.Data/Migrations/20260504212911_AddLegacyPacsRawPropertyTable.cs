using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <summary>
    /// SYNC-POP-4a: adds <c>legacy_pacs_raw.property</c> — the raw landing
    /// zone for Harris PACS <c>dbo.property</c>. The doctrine parcel
    /// pipeline's S1 destination. SYNC-POP-4b (truth_pacs.parcel_spine)
    /// and SYNC-POP-4c (canonical_tf.tf_parcel) follow in their own
    /// migrations.
    ///
    /// <para>NOTE: AlterColumn statements scaffolded by EF for SlCountyRatioCd
    /// (8→10) and WacCd (8→32) were intentionally REMOVED here because
    /// those alterations are already in production via the prior
    /// SYNC-POP-2 migration (<c>20260504000000_WidenLegacyPacsRawSaleCodeColumns</c>),
    /// which was hand-written without a Designer.cs and therefore left
    /// the model snapshot temporarily ahead of the migration history.
    /// Re-applying the AlterColumn would be a no-op against a correctly-
    /// migrated database, but its Down() would silently narrow live
    /// columns back to varchar(8). Removing avoids that footgun.</para>
    /// </summary>
    public partial class AddLegacyPacsRawPropertyTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "property",
                schema: "legacy_pacs_raw",
                columns: table => new
                {
                    LandedRowId = table.Column<Guid>(type: "uuid", nullable: false),
                    PropId = table.Column<int>(type: "integer", nullable: false),
                    PropTypeCd = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: true),
                    GeoId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    RefId1 = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    RefId2 = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    DbaName = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    AltDbaName = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    PropCreateDt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LoadBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceQueryHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    SourceRowHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    LandedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_property", x => x.LandedRowId);
                });

            migrationBuilder.CreateIndex(
                name: "ix_legacy_pacs_raw_property_loadbatch",
                schema: "legacy_pacs_raw",
                table: "property",
                column: "LoadBatchId");

            migrationBuilder.CreateIndex(
                name: "ix_legacy_pacs_raw_property_prop_id",
                schema: "legacy_pacs_raw",
                table: "property",
                column: "PropId");

            migrationBuilder.CreateIndex(
                name: "ix_legacy_pacs_raw_property_prop_type_cd",
                schema: "legacy_pacs_raw",
                table: "property",
                column: "PropTypeCd");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "property",
                schema: "legacy_pacs_raw");
        }
    }
}
