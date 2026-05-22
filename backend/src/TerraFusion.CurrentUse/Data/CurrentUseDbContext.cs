using Microsoft.EntityFrameworkCore;
using TerraFusion.CurrentUse.Models;

namespace TerraFusion.CurrentUse.Data;

public class CurrentUseDbContext : DbContext
{
    public CurrentUseDbContext(DbContextOptions<CurrentUseDbContext> options) : base(options) { }

    public DbSet<Classification> Classifications => Set<Classification>();
    public DbSet<InterestRate> InterestRates => Set<InterestRate>();
    public DbSet<Removal> Removals => Set<Removal>();
    public DbSet<CurrentUseAuditEntry> AuditEntries => Set<CurrentUseAuditEntry>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.HasDefaultSchema("currentuse");

        modelBuilder.Entity<Classification>(e =>
        {
            e.ToTable("classifications");
            e.HasIndex(c => c.ParcelId);
            e.HasIndex(c => c.ClassificationCode);
            e.HasIndex(c => c.Status);
        });

        modelBuilder.Entity<InterestRate>(e =>
        {
            e.ToTable("interest_rates");
            e.HasKey(r => r.Year);
        });

        modelBuilder.Entity<Removal>(e =>
        {
            e.ToTable("removals");
            e.HasIndex(r => r.ParcelId);
            e.HasIndex(r => r.Status);
        });

        modelBuilder.Entity<CurrentUseAuditEntry>(e =>
        {
            e.ToTable("audit_entries");
            e.HasIndex(a => a.ParcelId);
            e.HasIndex(a => a.Timestamp);
        });

        // Seed DOR interest rates (2016-2026)
        modelBuilder.Entity<InterestRate>().HasData(
            new InterestRate { Year = 2016, Rate = 0.0553m, Source = "WA DOR", EffectiveDate = new DateOnly(2016, 1, 1) },
            new InterestRate { Year = 2017, Rate = 0.0553m, Source = "WA DOR", EffectiveDate = new DateOnly(2017, 1, 1) },
            new InterestRate { Year = 2018, Rate = 0.0600m, Source = "WA DOR", EffectiveDate = new DateOnly(2018, 1, 1) },
            new InterestRate { Year = 2019, Rate = 0.0700m, Source = "WA DOR", EffectiveDate = new DateOnly(2019, 1, 1) },
            new InterestRate { Year = 2020, Rate = 0.0600m, Source = "WA DOR", EffectiveDate = new DateOnly(2020, 1, 1) },
            new InterestRate { Year = 2021, Rate = 0.0500m, Source = "WA DOR", EffectiveDate = new DateOnly(2021, 1, 1) },
            new InterestRate { Year = 2022, Rate = 0.0486m, Source = "WA DOR", EffectiveDate = new DateOnly(2022, 1, 1) },
            new InterestRate { Year = 2023, Rate = 0.0700m, Source = "WA DOR", EffectiveDate = new DateOnly(2023, 1, 1) },
            new InterestRate { Year = 2024, Rate = 0.0800m, Source = "WA DOR", EffectiveDate = new DateOnly(2024, 1, 1) },
            new InterestRate { Year = 2025, Rate = 0.0750m, Source = "WA DOR", EffectiveDate = new DateOnly(2025, 1, 1) },
            new InterestRate { Year = 2026, Rate = 0.0700m, Source = "WA DOR", EffectiveDate = new DateOnly(2026, 1, 1) }
        );

        // Seed sample classifications
        modelBuilder.Entity<Classification>().HasData(
            new Classification
            {
                Id = Guid.Parse("a1b2c3d4-0001-0001-0001-000000000001"),
                ParcelId = "1-0234-100-0001",
                ClassificationCode = "DFL",
                Description = "Designated Forest Land — 80 acres mixed conifer",
                EnrollmentDate = new DateOnly(2015, 3, 15),
                Status = "Active",
                Acreage = 80.0m,
                CurrentMarketValue = 450000m,
                CurrentUseValue = 52000m,
                TaxSavings = 4200m,
                CountyId = "benton"
            },
            new Classification
            {
                Id = Guid.Parse("a1b2c3d4-0001-0001-0001-000000000002"),
                ParcelId = "1-0567-200-0045",
                ClassificationCode = "CUFA",
                Description = "Current Use Farm/Agriculture — Irrigated vineyard",
                EnrollmentDate = new DateOnly(2018, 6, 1),
                Status = "Active",
                Acreage = 120.5m,
                CurrentMarketValue = 890000m,
                CurrentUseValue = 98000m,
                TaxSavings = 8500m,
                CountyId = "benton"
            },
            new Classification
            {
                Id = Guid.Parse("a1b2c3d4-0001-0001-0001-000000000003"),
                ParcelId = "1-0891-300-0012",
                ClassificationCode = "CUOS",
                Description = "Current Use Open Space — Riparian buffer zone",
                EnrollmentDate = new DateOnly(2020, 1, 10),
                Status = "Active",
                Acreage = 25.0m,
                CurrentMarketValue = 175000m,
                CurrentUseValue = 12000m,
                TaxSavings = 1750m,
                CountyId = "benton"
            },
            new Classification
            {
                Id = Guid.Parse("a1b2c3d4-0001-0001-0001-000000000004"),
                ParcelId = "1-1234-400-0008",
                ClassificationCode = "CUTL",
                Description = "Current Use Timber Land — Douglas fir plantation",
                EnrollmentDate = new DateOnly(2012, 9, 20),
                Status = "Removed",
                Acreage = 160.0m,
                CurrentMarketValue = 720000m,
                CurrentUseValue = 85000m,
                TaxSavings = 0m,
                CountyId = "benton"
            },
            new Classification
            {
                Id = Guid.Parse("a1b2c3d4-0001-0001-0001-000000000005"),
                ParcelId = "1-0345-500-0003",
                ClassificationCode = "CUFA",
                Description = "Current Use Farm/Agriculture — Dryland wheat",
                EnrollmentDate = new DateOnly(2019, 4, 1),
                Status = "Active",
                Acreage = 320.0m,
                CurrentMarketValue = 1200000m,
                CurrentUseValue = 145000m,
                TaxSavings = 11200m,
                CountyId = "benton"
            }
        );

        // Seed sample removal
        modelBuilder.Entity<Removal>().HasData(
            new Removal
            {
                Id = Guid.Parse("b2c3d4e5-0001-0001-0001-000000000001"),
                ParcelId = "1-1234-400-0008",
                ClassificationCode = "CUTL",
                Reason = "Voluntary withdrawal — land sold for development",
                InitiatedDate = new DateOnly(2025, 11, 1),
                Status = "Confirmed",
                RemovalDate = new DateOnly(2025, 12, 15),
                RollbackAmount = 82350.00m,
                InterestAmount = 31245.67m,
                PenaltyAmount = 16470.00m,
                TotalDue = 130065.67m,
                PenaltyExceptionCode = null
            }
        );
    }
}
