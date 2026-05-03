using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TerraFusion.API.Controllers;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Interfaces;
using TerraFusion.API.Tests.TestHelpers;
using Xunit;
using ICountyResolver = TerraFusion.Core.Services.ICountyResolver;
using SystemTask = System.Threading.Tasks.Task;

namespace TerraFusion.API.Tests.SalesAudit;

public sealed class SalesAuditControllerTests : IDisposable
{
    private static readonly Guid BentonId =
        Guid.Parse("19190019-1919-1919-1919-191919191919");

    private readonly TerraFusion.Data.TerraFusionDbContext _db;
    private readonly Mock<ISalesAiDiagnosticService> _diagSvc;
    private readonly Mock<ICountyResolver> _countyResolver;
    private readonly SalesAuditController _sut;

    public SalesAuditControllerTests()
    {
        _db = TestDbContextFactory.CreateInMemoryContext();
        _diagSvc = new Mock<ISalesAiDiagnosticService>();
        _countyResolver = new Mock<ICountyResolver>();
        _countyResolver
            .Setup(r => r.ResolveAsync(BentonId.ToString(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(BentonId);

        _sut = new SalesAuditController(_db, _diagSvc.Object,
            NullLogger<SalesAuditController>.Instance,
            _countyResolver.Object);

        var claims = new[]
        {
            new System.Security.Claims.Claim("county_id", BentonId.ToString()),
            new System.Security.Claims.Claim(
                System.Security.Claims.ClaimTypes.NameIdentifier, "test-user")
        };
        var identity = new System.Security.Claims.ClaimsIdentity(claims, "test");
        _sut.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new System.Security.Claims.ClaimsPrincipal(identity)
            }
        };
    }

    public void Dispose() => _db.Dispose();

    [Fact]
    public async SystemTask GetStrata_ReturnsDiagnosisSummaries()
    {
        _diagSvc
            .Setup(s => s.GetDiagnoseSummariesAsync(BentonId, 2026, default))
            .ReturnsAsync(new List<StratumDiagnosisSummaryDto>
            {
                new("400", "DATA_PROBLEM", 0.94m, "DISQUALIFY_SALES", false, DateTime.UtcNow)
            });

        var result = await _sut.GetStrata(2026);

        var ok = Assert.IsType<OkObjectResult>(result);
        var summaries = Assert.IsAssignableFrom<IEnumerable<StratumDiagnosisSummaryDto>>(ok.Value);
        Assert.Single(summaries);
    }

    [Fact]
    public async SystemTask GetStrata_ReturnsBadRequest_WhenCountyScopeMissing()
    {
        var sut = new SalesAuditController(_db, _diagSvc.Object,
            NullLogger<SalesAuditController>.Instance,
            _countyResolver.Object)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            }
        };

        var result = await sut.GetStrata(2026);

        Assert.IsType<BadRequestObjectResult>(result);
        _diagSvc.Verify(
            s => s.GetDiagnoseSummariesAsync(It.IsAny<Guid>(), It.IsAny<int>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async SystemTask BulkDecision_SetsQualificationDecisionOnSales()
    {
        var saleId = Guid.NewGuid();
        _db.ComparableSales.Add(new ComparableSale
        {
            Id = saleId,
            CountyId = BentonId,
            ParcelId = "P001",
            SaleDate = DateTime.UtcNow,
            SalePrice = 200_000,
            IngestedBy = "test",
            IngestedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();

        var result = await _sut.BulkDecision(
            new BulkDecisionRequest(new List<Guid> { saleId }, "disqualified", "test reason"));

        Assert.IsType<OkResult>(result);
        var sale = await _db.ComparableSales.FindAsync(saleId);
        Assert.Equal("disqualified", sale!.QualificationDecision);
    }

    [Fact]
    public async SystemTask BulkDecision_SetsDecisionAuditFields()
    {
        var saleId = Guid.NewGuid();
        _db.ComparableSales.Add(new ComparableSale
        {
            Id = saleId,
            CountyId = BentonId,
            ParcelId = "P002",
            SaleDate = DateTime.UtcNow,
            SalePrice = 150_000,
            IngestedBy = "test",
            IngestedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();

        await _sut.BulkDecision(
            new BulkDecisionRequest(new List<Guid> { saleId }, "qualified", "arms-length confirmed"));

        var sale = await _db.ComparableSales.FindAsync(saleId);
        Assert.Equal("qualified", sale!.QualificationDecision);
        Assert.Equal("arms-length confirmed", sale.DecisionReason);
        Assert.Equal("test-user", sale.DecisionBy);
        Assert.NotNull(sale.DecisionAt);
        Assert.Equal("AssessorOverride", sale.DecisionSource);
    }

    [Fact]
    public async SystemTask BulkDecision_ReturnsNotFound_WhenNoSalesMatch()
    {
        var result = await _sut.BulkDecision(
            new BulkDecisionRequest(new List<Guid> { Guid.NewGuid() }, "disqualified", null));

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async SystemTask ProposeAdjustment_CreatesDraftRecord()
    {
        var result = await _sut.ProposeAdjustment("400", 2026,
            new ProposeAdjustmentRequest(1.04m, 14.3m, 0.949m, 1.009m));

        Assert.IsType<OkObjectResult>(result);
        var proposal = await _db.SalesAuditAdjustmentProposals
            .FirstOrDefaultAsync(p => p.StratumKey == "400");
        Assert.NotNull(proposal);
        Assert.Equal(1.04m, proposal.ProposedFactor);
        Assert.Equal("draft", proposal.Status);
    }

    [Fact]
    public async SystemTask ProposeAdjustment_SupersedesPreviousDraft()
    {
        // Seed an existing draft
        _db.SalesAuditAdjustmentProposals.Add(new SalesAuditAdjustmentProposal
        {
            Id = Guid.NewGuid(),
            CountyId = BentonId,
            TaxYear = 2026,
            StratumKey = "400",
            ProposedFactor = 1.02m,
            ProjectedCod = 16m,
            ProjectedMedianRatio = 0.92m,
            ProjectedPrd = 1.01m,
            Status = "draft",
            CreatedBy = "test-user",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            UpdatedBy = "test-user"
        });
        await _db.SaveChangesAsync();

        // Propose a new one
        await _sut.ProposeAdjustment("400", 2026,
            new ProposeAdjustmentRequest(1.04m, 14.3m, 0.949m, 1.009m));

        var proposals = await _db.SalesAuditAdjustmentProposals
            .Where(p => p.StratumKey == "400" && p.CountyId == BentonId)
            .ToListAsync();

        Assert.Equal(2, proposals.Count);
        Assert.Single(proposals, p => p.Status == "draft");
        Assert.Single(proposals, p => p.Status == "superseded");
    }
}
