using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TerraFusion.API.Controllers;
using TerraFusion.API.Services;
using TerraFusion.Core.Auth;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Services;
using TerraFusion.Data;
using Xunit;

namespace TerraFusion.Unit.Tests.Dais;

public sealed class DaisTruthfulRetirementTests
{
  [Fact]
  public void AppealGrounds_ReturnsExact501WithoutDependenciesOrDatabaseMutation()
  {
    using var harness = new Harness(nameof(AppealGrounds_ReturnsExact501WithoutDependenciesOrDatabaseMutation));

    var result = harness.Controller.GetAppealGrounds();

    AssertCanonicalUnavailable(result, "appeal grounds");
    harness.AssertNoSideEffects();
  }

  [Fact]
  public void AppealTimeline_ReturnsExact501WithoutDependenciesOrDatabaseMutation()
  {
    using var harness = new Harness(nameof(AppealTimeline_ReturnsExact501WithoutDependenciesOrDatabaseMutation));

    var result = harness.Controller.GetAppealTimeline(2026);

    AssertCanonicalUnavailable(result, "appeal timeline");
    harness.AssertNoSideEffects();
  }

  [Fact]
  public void AppealEvidenceChecklist_ReturnsExact501WithoutDependenciesOrDatabaseMutation()
  {
    using var harness = new Harness(nameof(AppealEvidenceChecklist_ReturnsExact501WithoutDependenciesOrDatabaseMutation));

    var result = harness.Controller.GetAppealEvidenceChecklist("MARKET_VALUE");

    AssertCanonicalUnavailable(result, "appeal evidence checklist");
    harness.AssertNoSideEffects();
  }

  [Fact]
  public async Task ScheduleBoeHearing_ReturnsExact501WithoutServiceAuditOrPersistence()
  {
    using var harness = new Harness(nameof(ScheduleBoeHearing_ReturnsExact501WithoutServiceAuditOrPersistence));
    var appealId = Guid.NewGuid();
    var filedAt = new DateTime(2026, 8, 1, 12, 0, 0, DateTimeKind.Utc);
    var updatedAt = new DateTime(2026, 8, 2, 12, 0, 0, DateTimeKind.Utc);
    harness.Db.Appeals.Add(new Appeal
    {
      Id = appealId,
      CountyId = harness.CountyId,
      ParcelId = "RETIREMENT-PARCEL-001",
      AppealGround = "MARKET_VALUE",
      Status = "filed",
      FiledDate = filedAt,
      HearingDate = null,
      TaxYear = 2026,
      CreatedAt = filedAt,
      UpdatedAt = updatedAt,
    });
    await harness.Db.SaveChangesAsync();
    harness.Db.ChangeTracker.Clear();

    var request = new DaisController.ScheduleHearingRequest(
      "2026-09-15T16:00:00Z",
      ["member-1", "member-2", "member-3"]);
    var result = await harness.Controller.ScheduleBoeHearing(appealId.ToString("D"), request);

    AssertCanonicalUnavailable(result, "BOE hearing scheduling");
    harness.AssertNoDependencyCalls();
    harness.Db.ChangeTracker.HasChanges().Should().BeFalse();

    var persisted = await harness.Db.Appeals.AsNoTracking().SingleAsync(a => a.Id == appealId);
    persisted.Status.Should().Be("filed");
    persisted.HearingDate.Should().BeNull();
    persisted.FiledDate.Should().Be(filedAt);
    persisted.UpdatedAt.Should().Be(updatedAt);
  }

  private static void AssertCanonicalUnavailable(IActionResult result, string capability)
  {
    result.Should().NotBeOfType<OkObjectResult>();
    var objectResult = result.Should().BeOfType<ObjectResult>().Subject;
    objectResult.StatusCode.Should().Be(StatusCodes.Status501NotImplemented);

    var problem = objectResult.Value.Should().BeOfType<ProblemDetails>().Subject;
    problem.Type.Should().Be("https://terrafusion.local/problems/dais-canonical-capability-unavailable");
    problem.Title.Should().Be("Canonical Dais-backed implementation unavailable");
    problem.Detail.Should().Be($"No canonical Dais-backed implementation exists for {capability}.");
    problem.Status.Should().Be(StatusCodes.Status501NotImplemented);
    problem.Extensions.Should().ContainSingle(pair =>
      pair.Key == "capability" && string.Equals(pair.Value as string, capability, StringComparison.Ordinal));
  }

  private sealed class Harness : IDisposable
  {
    internal Harness(string databaseName)
    {
      CountyId = Guid.NewGuid();
      var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
        .UseInMemoryDatabase($"{databaseName}-{Guid.NewGuid():N}")
        .Options;
      var configuration = new ConfigurationBuilder()
        .AddInMemoryCollection(new Dictionary<string, string?>())
        .Build();
      Db = new TerraFusionDbContext(options, configuration);

      Exemptions = new Mock<IExemptionService>(MockBehavior.Strict);
      Appeals = new Mock<IAppealService>(MockBehavior.Strict);
      Certifications = new Mock<ICertificationService>(MockBehavior.Strict);
      Notices = new Mock<INoticeService>(MockBehavior.Strict);
      Queue = new Mock<IQueueService>(MockBehavior.Strict);
      UserContext = new Mock<IRequestUserContextAccessor>(MockBehavior.Strict);
      Audit = new Mock<IGovernedToolAuditService>(MockBehavior.Strict);

      Controller = new DaisController(
        Db,
        NullLogger<DaisController>.Instance,
        Exemptions.Object,
        Appeals.Object,
        Certifications.Object,
        Notices.Object,
        Queue.Object,
        UserContext.Object,
        Audit.Object);
      Controller.ControllerContext = new ControllerContext
      {
        HttpContext = new DefaultHttpContext
        {
          User = new ClaimsPrincipal(new ClaimsIdentity(
          [
            new Claim("countyId", CountyId.ToString("D")),
            new Claim("countyCode", "BENTON"),
            new Claim("sub", "truthful-retirement-test"),
          ], "TestAuth")),
        },
      };
    }

    internal Guid CountyId { get; }
    internal TerraFusionDbContext Db { get; }
    internal DaisController Controller { get; }
    private Mock<IExemptionService> Exemptions { get; }
    private Mock<IAppealService> Appeals { get; }
    private Mock<ICertificationService> Certifications { get; }
    private Mock<INoticeService> Notices { get; }
    private Mock<IQueueService> Queue { get; }
    private Mock<IRequestUserContextAccessor> UserContext { get; }
    private Mock<IGovernedToolAuditService> Audit { get; }

    internal void AssertNoSideEffects()
    {
      AssertNoDependencyCalls();
      Db.ChangeTracker.HasChanges().Should().BeFalse();
      Db.Appeals.AsNoTracking().Should().BeEmpty();
    }

    internal void AssertNoDependencyCalls()
    {
      Exemptions.VerifyNoOtherCalls();
      Appeals.VerifyNoOtherCalls();
      Certifications.VerifyNoOtherCalls();
      Notices.VerifyNoOtherCalls();
      Queue.VerifyNoOtherCalls();
      UserContext.VerifyNoOtherCalls();
      Audit.VerifyNoOtherCalls();
    }

    public void Dispose() => Db.Dispose();
  }
}
