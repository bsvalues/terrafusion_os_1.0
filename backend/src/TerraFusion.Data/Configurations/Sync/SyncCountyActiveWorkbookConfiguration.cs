using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.Sync;
using TerraFusion.Core.Entities.Sync.Mapping;

namespace TerraFusion.Data.Configurations.Sync;

/// <summary>
/// Slice C41-B EF configuration for
/// <see cref="SyncCountyActiveWorkbook"/> per the C41-A policy.
///
/// <para>Schema invariants:
/// <list type="bullet">
/// <item>PK is <c>CountyId</c> alone (Hard Guard 1: singleton per
///   county).</item>
/// <item>FK to <c>SyncMappingWorkbooks.Id</c> with
///   <c>OnDelete(DeleteBehavior.Restrict)</c> (Hard Guard 8: a
///   pointed-to workbook can't be deleted out from under the
///   pointer).</item>
/// <item>Property max-lengths match the policy
///   (SetBy ≤ 200, SetReason ≤ 1000, audit fields ≤ 200).</item>
/// </list>
/// </para>
/// </summary>
public sealed class SyncCountyActiveWorkbookConfiguration
    : IEntityTypeConfiguration<SyncCountyActiveWorkbook>
{
    public void Configure(EntityTypeBuilder<SyncCountyActiveWorkbook> builder)
    {
        builder.ToTable("SyncCountyActiveWorkbooks");

        // PK = CountyId (singleton per county, Hard Guard 1).
        builder.HasKey(x => x.CountyId);

        builder.Property(x => x.SetBy).HasMaxLength(200).IsRequired();
        builder.Property(x => x.SetReason).HasMaxLength(1000);

        builder.Property(x => x.CreatedBy).HasMaxLength(200);
        builder.Property(x => x.UpdatedBy).HasMaxLength(200);

        // FK to SyncMappingWorkbook.Id. WithMany() because this
        // table doesn't have a navigation back; we only enforce
        // the constraint. Restrict per Hard Guard 8.
        builder.HasOne<SyncMappingWorkbook>()
               .WithMany()
               .HasForeignKey(x => x.ActiveWorkbookId)
               .OnDelete(DeleteBehavior.Restrict);

        // Index on ActiveWorkbookId so "find every county pointing
        // at workbook X" is cheap (used by C41-B service when
        // validating that a workbook can be deleted, and by future
        // diagnostics).
        builder.HasIndex(x => x.ActiveWorkbookId);
    }
}
