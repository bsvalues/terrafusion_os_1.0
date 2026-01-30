// TEMPORARY STUB FOR BACKEND STRUCTURAL BUILD
// TODO: Replace with real LevyDbContext implementation (see WIP branch).

using Microsoft.EntityFrameworkCore;
using TerraFusion.Levy.Models;

namespace TerraFusion.Levy.Data
{
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
