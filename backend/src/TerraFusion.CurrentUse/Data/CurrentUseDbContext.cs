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
    public DbSet<CurrentUseCaseState> CaseStates => Set<CurrentUseCaseState>();

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

        modelBuilder.Entity<CurrentUseCaseState>(e =>
        {
            e.ToTable("case_states");
            e.HasIndex(s => s.CaseId).IsUnique();
            e.HasIndex(s => s.CaseStage);
            e.HasIndex(s => s.AssignedAppraiser);
            e.HasIndex(s => s.LastTouchedAt);
            e.Property(s => s.CaseStage).HasMaxLength(40);
            e.Property(s => s.AssignedAppraiser).HasMaxLength(120);
            e.Property(s => s.ChiefReviewStatus).HasMaxLength(40);
            e.Property(s => s.NoticeApprovalStatus).HasMaxLength(40);
            e.Property(s => s.LocalCaseNotes).HasMaxLength(4000);
        });

        // Seed WAC 458-30-590 inflation rates (official WA DOR current use interest rates)
        // Source: https://app.leg.wa.gov/wac/default.aspx?cite=458-30-590
        // These are the "rate of inflation" per RCW 84.34.330 used for current use rollback interest.
        // Also used per RCW 84.34.108(4) for additional tax interest calculation.
        modelBuilder.Entity<InterestRate>().HasData(
            new InterestRate { Year = 2010, Rate = 0.01539m, Source = "WAC 458-30-590", EffectiveDate = new DateOnly(2010, 1, 1) },
            new InterestRate { Year = 2011, Rate = 0.02755m, Source = "WAC 458-30-590", EffectiveDate = new DateOnly(2011, 1, 1) },
            new InterestRate { Year = 2012, Rate = 0.01295m, Source = "WAC 458-30-590", EffectiveDate = new DateOnly(2012, 1, 1) },
            new InterestRate { Year = 2013, Rate = 0.01314m, Source = "WAC 458-30-590", EffectiveDate = new DateOnly(2013, 1, 1) },
            new InterestRate { Year = 2014, Rate = 0.01591m, Source = "WAC 458-30-590", EffectiveDate = new DateOnly(2014, 1, 1) },
            new InterestRate { Year = 2015, Rate = 0.00251m, Source = "WAC 458-30-590", EffectiveDate = new DateOnly(2015, 1, 1) },
            new InterestRate { Year = 2016, Rate = 0.00953m, Source = "WAC 458-30-590", EffectiveDate = new DateOnly(2016, 1, 1) },
            new InterestRate { Year = 2017, Rate = 0.01553m, Source = "WAC 458-30-590", EffectiveDate = new DateOnly(2017, 1, 1) },
            new InterestRate { Year = 2018, Rate = 0.02169m, Source = "WAC 458-30-590", EffectiveDate = new DateOnly(2018, 1, 1) },
            new InterestRate { Year = 2019, Rate = 0.01396m, Source = "WAC 458-30-590", EffectiveDate = new DateOnly(2019, 1, 1) },
            new InterestRate { Year = 2020, Rate = 0.00602m, Source = "WAC 458-30-590", EffectiveDate = new DateOnly(2020, 1, 1) },
            new InterestRate { Year = 2021, Rate = 0.03860m, Source = "WAC 458-30-590", EffectiveDate = new DateOnly(2021, 1, 1) },
            new InterestRate { Year = 2022, Rate = 0.06457m, Source = "WAC 458-30-590", EffectiveDate = new DateOnly(2022, 1, 1) },
            new InterestRate { Year = 2023, Rate = 0.03670m, Source = "WAC 458-30-590", EffectiveDate = new DateOnly(2023, 1, 1) },
            new InterestRate { Year = 2024, Rate = 0.02570m, Source = "WAC 458-30-590", EffectiveDate = new DateOnly(2024, 1, 1) },
            new InterestRate { Year = 2025, Rate = 0.02440m, Source = "WAC 458-30-590", EffectiveDate = new DateOnly(2025, 1, 1) },
            new InterestRate { Year = 2026, Rate = 0.02440m, Source = "WAC 458-30-590", EffectiveDate = new DateOnly(2026, 1, 1) }
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

        // Seed sample removal (CUTL parcel enrolled 2012, removed 2025 = 10-year rollback window)
        // Interest calculated using WAC 458-30-590 rates over 10 years ≈ ~2.5% avg × 10 years
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
                InterestAmount = 12842.18m,
                PenaltyAmount = 16470.00m,
                TotalDue = 111662.18m,
                PenaltyExceptionCode = null
            }
        );
    }
}
