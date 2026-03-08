using Microsoft.EntityFrameworkCore;
using TerraFusion.Levy.Models;

namespace TerraFusion.Levy.Data
{
    /// <summary>
    /// Entity Framework Core DbContext for the Levy module.
    /// Manages tax levy districts, measures, scenarios, revenue projections,
    /// levy rates, and district-parcel associations.
    /// </summary>
    public class LevyDbContext : DbContext
    {
        public LevyDbContext(DbContextOptions<LevyDbContext> options)
            : base(options)
        {
        }

        public LevyDbContext()
        {
        }

        public DbSet<District> Districts => Set<District>();
        public DbSet<LevyMeasure> LevyMeasures => Set<LevyMeasure>();
        public DbSet<LevyScenario> LevyScenarios => Set<LevyScenario>();
        public DbSet<RevenueProjection> RevenueProjections => Set<RevenueProjection>();
        public DbSet<LevyRate> LevyRates => Set<LevyRate>();
        public DbSet<DistrictParcel> DistrictParcels => Set<DistrictParcel>();
    }
}
