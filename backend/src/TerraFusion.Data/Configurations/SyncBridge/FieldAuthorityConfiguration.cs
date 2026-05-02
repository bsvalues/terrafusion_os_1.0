using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.SyncBridge;

namespace TerraFusion.Data.Configurations.SyncBridge;

public sealed class FieldAuthorityConfiguration : IEntityTypeConfiguration<FieldAuthority>
{
    public void Configure(EntityTypeBuilder<FieldAuthority> builder)
    {
        builder.ToTable("field_authority", schema: "sync_bridge");
        builder.HasKey(x => x.AuthorityId);
        builder.Property(x => x.AuthorityId).ValueGeneratedOnAdd();

        builder.Property(x => x.DomainName).HasMaxLength(50).IsRequired();
        builder.Property(x => x.FieldName).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Phase).HasMaxLength(50).IsRequired();

        builder.Property(x => x.SystemOfRecord).HasMaxLength(50).IsRequired();
        builder.Property(x => x.PacsToTfAllowed).IsRequired();
        builder.Property(x => x.TfToPacsAllowed).IsRequired();

        builder.Property(x => x.ConflictStrategy).HasMaxLength(50).IsRequired();
        builder.Property(x => x.ApprovalRequired).IsRequired();
        builder.Property(x => x.RollbackRequired).IsRequired();

        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.UpdatedAt).IsRequired();

        builder.HasIndex(x => new { x.DomainName, x.FieldName, x.Phase }).IsUnique();
    }
}
