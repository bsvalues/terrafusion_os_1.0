using Microsoft.EntityFrameworkCore;
using TerraFusion.Modules.CurrentUse.Entities;

namespace TerraFusion.Modules.CurrentUse.Persistence;

public static class CurrentUseDbContextExtensions
{
    public static void ConfigureCurrentUse(this ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfiguration(new Configurations.CurrentUseClassificationConfiguration());
        modelBuilder.ApplyConfiguration(new Configurations.CurrentUseRemovalConfiguration());
        modelBuilder.ApplyConfiguration(new Configurations.RollbackCalculationConfiguration());
        modelBuilder.ApplyConfiguration(new Configurations.CurrentUseEvidenceItemConfiguration());
        modelBuilder.ApplyConfiguration(new Configurations.CurrentUseTimelineEventConfiguration());
    }

    // Add these DbSet properties to your existing application DbContext:
    //
    // public DbSet<CurrentUseClassification> CurrentUseClassifications => Set<CurrentUseClassification>();
    // public DbSet<CurrentUseRemoval> CurrentUseRemovals => Set<CurrentUseRemoval>();
    // public DbSet<RollbackCalculation> CurrentUseRollbackCalculations => Set<RollbackCalculation>();
    // public DbSet<CurrentUseEvidenceItem> CurrentUseEvidenceItems => Set<CurrentUseEvidenceItem>();
    // public DbSet<CurrentUseTimelineEvent> CurrentUseTimelineEvents => Set<CurrentUseTimelineEvent>();
    //
    // Then inside OnModelCreating:
    //
    // modelBuilder.ConfigureCurrentUse();
}
