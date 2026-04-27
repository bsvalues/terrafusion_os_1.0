using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.Sync.Mapping;

namespace TerraFusion.Data.Configurations.Sync.Mapping;

/// <summary>
/// EF configuration for <see cref="SyncMappingWorkbook"/> (Slice C2).
///
/// Conventions match the existing Sync/Profile configurations:
///   - Bracket-quoted PascalCase table name.
///   - County FK is Restrict (county deletion must not nuke workbooks
///     silently — the Sovereign County model wants explicit decommission).
///   - SourceConnectionId / ProfileBatchId are Guid fields without
///     foreign-key constraints; connections may be retired and profile
///     batches may eventually be archived, but the workbook keeps the
///     historical pointer either way.
///   - Unique on (CountyId, Name) so an operator can't create two
///     workbooks with the same name in the same county.
/// </summary>
public sealed class SyncMappingWorkbookConfiguration : IEntityTypeConfiguration<SyncMappingWorkbook>
{
    public void Configure(EntityTypeBuilder<SyncMappingWorkbook> builder)
    {
        builder.ToTable("SyncMappingWorkbooks");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Status).HasMaxLength(32).IsRequired();
        builder.Property(x => x.Notes).HasMaxLength(4000);
        builder.Property(x => x.CreatedBy).HasMaxLength(200);
        builder.Property(x => x.UpdatedBy).HasMaxLength(200);

        // Primary lookup: "all workbooks for this county" + "all workbooks
        // seeded off a given profile batch."
        builder.HasIndex(x => new { x.CountyId, x.Status });
        builder.HasIndex(x => x.ProfileBatchId);

        // Operator-friendly uniqueness: one workbook name per county.
        builder.HasIndex(x => new { x.CountyId, x.Name }).IsUnique();

        builder.HasOne(x => x.County)
            .WithMany()
            .HasForeignKey(x => x.CountyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.Columns)
            .WithOne(x => x.Workbook)
            .HasForeignKey(x => x.WorkbookId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
