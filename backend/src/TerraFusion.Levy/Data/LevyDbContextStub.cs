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

        // B2 — Authoritative reference inputs (IPD, state-school, lid-lift, refund, banked capacity).
        public DbSet<ReferenceSource> ReferenceSources => Set<ReferenceSource>();

        // B3 — Certified levies + banked-capacity ledger.
        public DbSet<LevyCertification> LevyCertifications => Set<LevyCertification>();
        public DbSet<BankedCapacity> BankedCapacities => Set<BankedCapacity>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<ReferenceSource>(entity =>
            {
                // Primary lookup: one active row per (county, type, year, district).
                entity.HasIndex(r => new { r.CountyId, r.SourceType, r.TaxYear, r.DistrictCode, r.IsActive })
                      .HasDatabaseName("IX_ReferenceSources_Lookup");

                // Citation browse.
                entity.HasIndex(r => new { r.CountyId, r.Citation, r.TaxYear })
                      .HasDatabaseName("IX_ReferenceSources_Citation");
            });

            modelBuilder.Entity<LevyCertification>(entity =>
            {
                // Primary lookup: district + year within a county.
                entity.HasIndex(c => new { c.CountyId, c.DistrictCode, c.TaxYear, c.Status })
                      .HasDatabaseName("IX_LevyCertifications_Lookup");

                // Attestation hash browse (integrity audits).
                entity.HasIndex(c => c.AttestationHash)
                      .HasDatabaseName("IX_LevyCertifications_AttestationHash");

                // Correlation-id link to TerraTrace.
                entity.HasIndex(c => c.AttestationCorrelationId)
                      .HasDatabaseName("IX_LevyCertifications_CorrelationId");
            });

            modelBuilder.Entity<BankedCapacity>(entity =>
            {
                // Only one active ledger entry per (county, district, year).
                entity.HasIndex(b => new { b.CountyId, b.DistrictCode, b.TaxYear, b.IsActive })
                      .HasDatabaseName("IX_BankedCapacities_Lookup");
            });
        }
    }
}
