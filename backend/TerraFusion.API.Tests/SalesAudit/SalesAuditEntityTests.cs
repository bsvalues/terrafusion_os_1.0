// backend/TerraFusion.API.Tests/SalesAudit/SalesAuditEntityTests.cs
using Microsoft.EntityFrameworkCore;
using TerraFusion.AI.Data;
using TerraFusion.API.Tests.TestHelpers;
using TerraFusion.Core.Entities;
using Xunit;
using SystemTask = System.Threading.Tasks.Task;

namespace TerraFusion.API.Tests.SalesAudit;

public sealed class SalesAuditEntityTests : IDisposable
{
    private readonly TerraFusion.Data.TerraFusionDbContext _db;

    public SalesAuditEntityTests()
    {
        // Wire the extension hook so InMemory DB sees the new entities
        TerraFusion.Data.TerraFusionDbContext.OnModelCreatingExtensions =
            (mb, provider) => GptAiEntityConfigurations.Apply(mb, provider);
        _db = TestDbContextFactory.CreateInMemoryContext();
    }

    public void Dispose() => _db.Dispose();

    [Fact]
    public async SystemTask SaleAuditDiagnosis_CanBeCreatedAndQueried()
    {
        var entity = new SaleAuditDiagnosis
        {
            Id = Guid.NewGuid(),
            CountyId = Guid.Parse("19190019-1919-1919-1919-191919191919"),
            TaxYear = 2026,
            StratumKey = "400",
            PrimaryDiagnosis = "DATA_PROBLEM",
            Confidence = 0.94m,
            FindingsJson = "[]",
            RecommendedAction = "DISQUALIFY_SALES",
            DiagnosedAt = DateTime.UtcNow,
            IsStale = false
        };
        _db.Set<SaleAuditDiagnosis>().Add(entity);
        await _db.SaveChangesAsync();

        var loaded = await _db.Set<SaleAuditDiagnosis>()
            .FirstOrDefaultAsync(d => d.StratumKey == "400");
        Assert.NotNull(loaded);
        Assert.Equal("DATA_PROBLEM", loaded.PrimaryDiagnosis);
    }

    [Fact]
    public async SystemTask SalesAuditAdjustmentProposal_CanBeCreatedAndQueried()
    {
        var proposal = new SalesAuditAdjustmentProposal
        {
            Id = Guid.NewGuid(),
            CountyId = Guid.Parse("19190019-1919-1919-1919-191919191919"),
            TaxYear = 2026,
            StratumKey = "400",
            ProposedFactor = 1.04m,
            ProjectedCod = 14.3m,
            ProjectedMedianRatio = 0.949m,
            ProjectedPrd = 1.009m,
            Status = "draft",
            CreatedBy = "test-user",
            CreatedAt = DateTime.UtcNow
        };
        _db.Set<SalesAuditAdjustmentProposal>().Add(proposal);
        await _db.SaveChangesAsync();

        var loaded = await _db.Set<SalesAuditAdjustmentProposal>()
            .FirstOrDefaultAsync(p => p.StratumKey == "400");
        Assert.NotNull(loaded);
        Assert.Equal(1.04m, loaded.ProposedFactor);
    }
}
