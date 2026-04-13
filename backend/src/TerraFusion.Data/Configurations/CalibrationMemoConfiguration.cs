using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities;

namespace TerraFusion.Data.Configurations;

public class CalibrationMemoConfiguration : IEntityTypeConfiguration<CalibrationMemo>
{
    public void Configure(EntityTypeBuilder<CalibrationMemo> builder)
    {
        builder.ToTable("CalibrationMemos");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Status).IsRequired().HasMaxLength(20);
        builder.Property(e => e.Section1Purpose).HasColumnType("text");
        builder.Property(e => e.Section2DataUsed).HasColumnType("text");
        builder.Property(e => e.Section3Diagnostics).HasColumnType("text");
        builder.Property(e => e.Section4ChangeMade).HasColumnType("text");
        builder.Property(e => e.Section5Impact).HasColumnType("text");
        builder.Property(e => e.Section6Verification).HasColumnType("text");
        builder.Property(e => e.Section7SignOff).HasColumnType("text");
        builder.Property(e => e.Section8Notes).HasColumnType("text");
        builder.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
        builder.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

        builder.HasIndex(e => e.CountyId).HasDatabaseName("IX_CalibrationMemos_CountyId");
    }
}
