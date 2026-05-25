using Microsoft.EntityFrameworkCore;

namespace TerraFusion.Modules.CurrentUse.Persistence;

public static class CurrentUseCanonicalDbContextExtensions
{
    public static void ConfigureCurrentUseCanonicalIndexes(this ModelBuilder modelBuilder)
    {
        // Add to the real DbContext once canonical entity classes are merged.
        //
        // modelBuilder.Entity<CurrentUseClassification>()
        //   .HasIndex(x => new { x.CountyId, x.ParcelId, x.Active });
        //
        // modelBuilder.Entity<RollbackCalculation>()
        //   .HasIndex(x => new { x.CountyId, x.ParcelId, x.CreatedAt });
        //
        // modelBuilder.Entity<CurrentUseTraceEvent>()
        //   .HasIndex(x => new { x.CountyId, x.ParcelId, x.Timestamp });
    }
}
