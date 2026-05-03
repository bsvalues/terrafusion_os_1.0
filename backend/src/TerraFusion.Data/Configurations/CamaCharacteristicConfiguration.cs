/*
 * CamaCharacteristic Entity Configuration
 *
 * EF Core Fluent API configuration for CamaCharacteristic.
 * Declares stratum query indexes required by CostForge Benton Method v2:
 * neighborhood, city, property-use-stratum, vintage.
 *
 * @version 1.0.0 - Track 0 (CostForge Benton Method v2)
 */

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities;

namespace TerraFusion.Data.Configurations;

public class CamaCharacteristicConfiguration : IEntityTypeConfiguration<CamaCharacteristic>
{
    public void Configure(EntityTypeBuilder<CamaCharacteristic> builder)
    {
        builder.HasKey(e => e.Id);

        builder.Property(e => e.ParcelId)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(e => e.BuildingType)
            .IsRequired()
            .HasMaxLength(10);

        // T0 stratum query indexes — CostForge Benton Method v2 requires
        // fast slicing by these combinations at 75K+ parcel scale.
        builder.HasIndex(e => new { e.CountyId, e.TaxYear, e.NeighborhoodCode })
            .HasDatabaseName("IX_CamaChar_County_Year_Hood");

        builder.HasIndex(e => new { e.CountyId, e.TaxYear, e.City })
            .HasDatabaseName("IX_CamaChar_County_Year_City");

        builder.HasIndex(e => new { e.CountyId, e.TaxYear, e.PropertyUseStratum })
            .HasDatabaseName("IX_CamaChar_County_Year_Stratum");

        builder.HasIndex(e => new { e.CountyId, e.TaxYear, e.YearBuilt })
            .HasDatabaseName("IX_CamaChar_County_Year_Vintage");
    }
}
