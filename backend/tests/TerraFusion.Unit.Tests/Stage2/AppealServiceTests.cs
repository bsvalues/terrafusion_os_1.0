using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.Abstractions.DTOs;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Services;
using TerraFusion.Unit.Tests.Dais;
using Xunit;
using DataDbContext = TerraFusion.Data.TerraFusionDbContext;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.Stage2;

[Trait("Category", "Stage2")]
public sealed class AppealServiceTests
{
    private static readonly Guid BentonCountyId = new("11111111-1111-1111-1111-111111111111");
    private static readonly Guid OtherCountyId = new("22222222-2222-2222-2222-222222222222");
    private static readonly DateTime EffectiveAt = new(2026, 2, 3, 4, 5, 6, DateTimeKind.Utc);

    private static DataDbContext CreateDbContext(string name)
    {
        var options = new DbContextOptionsBuilder<DataDbContext>()
            .UseInMemoryDatabase($"Stage2-{name}-{Guid.NewGuid()}")
            .Options;
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>())
            .Build();
        return new DataDbContext(options, config);
    }

    private static AppealService CreateService(
        DataDbContext db,
        FakeDaisAppealMutationDecisionPort? port = null) =>
        new(db, NullLogger<AppealService>.Instance, port ?? new());

    private static async Task SeedCounty(DataDbContext db, Guid countyId)
    {
        if (!await db.Counties.AnyAsync(c => c.Id == countyId))
        {
            db.Counties.Add(new County
            {
                Id = countyId,
                Name = countyId == BentonCountyId ? "Benton" : "Other",
                State = "WA",
                FipsCode = countyId == BentonCountyId ? "003" : "021",
            });
            await db.SaveChangesAsync();
        }
    }

    private static CreateAppealCommand Command(
        string parcelId = "PARCEL-001",
        string? ground = "MARKET_VALUE",
        int taxYear = 2026) =>
        new(parcelId, ground, "Synthetic Petitioner", 450_000m, 400_000m, taxYear);

    [Fact]
    public void AppealEntity_ConformsToAuditableCountyPattern()
    {
        typeof(Appeal).GetProperty(nameof(Appeal.Id))!.PropertyType.Should().Be(typeof(Guid));
        typeof(Appeal).GetProperty(nameof(Appeal.CountyId))!.PropertyType.Should().Be(typeof(Guid));
        typeof(Appeal).GetProperty(nameof(Appeal.County))!.PropertyType.Should().Be(typeof(County));
        typeof(Appeal).GetProperty(nameof(Appeal.CreatedAt))!.PropertyType.Should().Be(typeof(DateTime));
        typeof(Appeal).GetProperty(nameof(Appeal.UpdatedAt))!.PropertyType.Should().Be(typeof(DateTime));
        typeof(Appeal).GetProperty(nameof(Appeal.CreatedBy))!.PropertyType.Should().Be(typeof(string));
        typeof(Appeal).GetProperty(nameof(Appeal.UpdatedBy))!.PropertyType.Should().Be(typeof(string));
    }

    [Fact]
    public async Task CreateAsync_UsesExactSuiteMutation_AndKeepsPiiValuesAndParcelOutOfDecision()
    {
        await using var db = CreateDbContext(nameof(CreateAsync_UsesExactSuiteMutation_AndKeepsPiiValuesAndParcelOutOfDecision));
        await SeedCounty(db, BentonCountyId);
        var decidedAt = new DateTimeOffset(2026, 7, 8, 9, 10, 11, TimeSpan.Zero);
        var port = new FakeDaisAppealMutationDecisionPort(create: (request, _) =>
            Task.FromResult(new DaisAppealCreateDecisionResult
            {
                SchemaVersion = request.SchemaVersion,
                Operation = request.Operation,
                CommandId = request.CommandId,
                CountyId = request.CountyId,
                Decision = DaisAppealMutationDecision.accepted,
                Mutation = new DaisAppealCreateMutation
                {
                    Ground = DaisAppealGround.UNIFORMITY,
                    Status = DaisAppealStatus.filed,
                    TaxYear = 2031,
                    FiledAt = decidedAt,
                    UpdatedAt = decidedAt,
                },
                Violations = [],
            }));
        var service = CreateService(db, port);

        var created = await service.CreateAsync(
            BentonCountyId,
            Command("PRIVATE-PARCEL", "MARKET_VALUE", 2028),
            "synthetic-user",
            EffectiveAt);

        created.Should().BeEquivalentTo(new
        {
            ParcelId = "PRIVATE-PARCEL",
            PetitionerName = "Synthetic Petitioner",
            CurrentValue = 450_000m,
            RequestedValue = 400_000m,
            AppealGround = "UNIFORMITY",
            Status = "filed",
            TaxYear = 2031,
            CountyId = BentonCountyId,
            CreatedBy = "synthetic-user",
            UpdatedBy = "synthetic-user",
            CreatedAt = EffectiveAt,
            FiledDate = decidedAt.UtcDateTime,
            UpdatedAt = decidedAt.UtcDateTime,
        });
        db.Appeals.Should().ContainSingle(a => a.Id == created.Id);
        var sent = port.CreateRequests.Should().ContainSingle().Subject;
        sent.SchemaVersion.Should().Be("1.0.0");
        sent.Operation.Should().Be(DaisAppealMutationOperation.create);
        sent.CountyId.Should().Be(BentonCountyId.ToString("D"));
        sent.EffectiveAt.Should().Be(new DateTimeOffset(EffectiveAt));
        sent.Command.Should().BeEquivalentTo(new { Ground = "MARKET_VALUE", TaxYear = (int?)2028 });
        var serialized = System.Text.Json.JsonSerializer.Serialize(sent);
        serialized.Should().NotContain("PRIVATE-PARCEL").And.NotContain("Synthetic Petitioner")
            .And.NotContain("450000").And.NotContain("400000").And.NotContain("note");
    }

    [Theory]
    [InlineData(0, null)]
    [InlineData(-2026, -2026)]
    public async Task CreateAsync_OnlyZeroIsOmittedFromSuiteTaxYear(int input, int? expected)
    {
        await using var db = CreateDbContext($"{nameof(CreateAsync_OnlyZeroIsOmittedFromSuiteTaxYear)}-{input}");
        await SeedCounty(db, BentonCountyId);
        var port = new FakeDaisAppealMutationDecisionPort();
        var service = CreateService(db, port);

        await service.CreateAsync(BentonCountyId, Command(taxYear: input), utcNow: EffectiveAt);

        port.CreateRequests.Single().Command.TaxYear.Should().Be(expected);
    }

    [Fact]
    public async Task CreateAsync_RejectionDoesNotSaveOrTrackAppeal()
    {
        await using var db = CreateDbContext(nameof(CreateAsync_RejectionDoesNotSaveOrTrackAppeal));
        await SeedCounty(db, BentonCountyId);
        var port = new FakeDaisAppealMutationDecisionPort(create: (request, _) =>
            Task.FromResult(new DaisAppealCreateDecisionResult
            {
                SchemaVersion = request.SchemaVersion,
                Operation = request.Operation,
                CommandId = request.CommandId,
                CountyId = request.CountyId,
                Decision = DaisAppealMutationDecision.rejected,
                Mutation = null,
                Violations =
                [
                    new DaisAppealMutationViolation
                    {
                        Code = DaisAppealMutationViolationCode.INVALID_TAX_YEAR,
                        Message = "Synthetic rejection",
                    },
                ],
            }));
        var service = CreateService(db, port);

        var act = () => service.CreateAsync(BentonCountyId, Command(taxYear: -1), utcNow: EffectiveAt);

        await act.Should().ThrowAsync<DaisAppealMutationRejectedException>();
        db.ChangeTracker.Entries<Appeal>().Should().BeEmpty();
        (await db.Appeals.ToListAsync()).Should().BeEmpty();
    }

    [Fact]
    public async Task CreateAsync_UnavailableDoesNotSaveOrTrackAppeal()
    {
        await using var db = CreateDbContext(nameof(CreateAsync_UnavailableDoesNotSaveOrTrackAppeal));
        await SeedCounty(db, BentonCountyId);
        var port = new FakeDaisAppealMutationDecisionPort(create: (_, _) =>
            Task.FromException<DaisAppealCreateDecisionResult>(
                new DaisAppealMutationUnavailableException("Synthetic unavailable")));
        var service = CreateService(db, port);

        var act = () => service.CreateAsync(BentonCountyId, Command(), utcNow: EffectiveAt);

        await act.Should().ThrowAsync<DaisAppealMutationUnavailableException>();
        db.ChangeTracker.Entries<Appeal>().Should().BeEmpty();
        (await db.Appeals.ToListAsync()).Should().BeEmpty();
    }

    [Fact]
    public async Task UpdateStatusAsync_AppliesOnlySuiteLifecyclePatch_AndExcludesNotesAndValues()
    {
        await using var db = CreateDbContext(nameof(UpdateStatusAsync_AppliesOnlySuiteLifecyclePatch_AndExcludesNotesAndValues));
        await SeedCounty(db, BentonCountyId);
        var service = CreateService(db);
        var created = await service.CreateAsync(BentonCountyId, Command(), utcNow: EffectiveAt);
        var decisionAt = new DateTimeOffset(2026, 8, 9, 10, 11, 12, TimeSpan.Zero);
        var port = new FakeDaisAppealMutationDecisionPort(transition: (request, _) =>
            Task.FromResult(new DaisAppealTransitionDecisionResult
            {
                SchemaVersion = request.SchemaVersion,
                Operation = request.Operation,
                CommandId = request.CommandId,
                CountyId = request.CountyId,
                Decision = DaisAppealMutationDecision.accepted,
                Mutation = new DaisAppealTransitionMutation
                {
                    Status = DaisAppealStatus.decided,
                    UpdatedAt = decisionAt,
                    DecisionAt = decisionAt,
                },
                Violations = [],
            }));
        service = CreateService(db, port);

        var updated = await service.UpdateStatusAsync(
            created.Id, "decided", BentonCountyId, "Synthetic private note", 390_000m);

        updated.Status.Should().Be("decided");
        updated.UpdatedAt.Should().Be(decisionAt.UtcDateTime);
        updated.DecisionDate.Should().Be(decisionAt.UtcDateTime);
        updated.DecisionNotes.Should().Be("Synthetic private note");
        updated.DecidedValue.Should().Be(390_000m);
        updated.ParcelId.Should().Be("PARCEL-001");
        updated.PetitionerName.Should().Be("Synthetic Petitioner");
        var sent = port.TransitionRequests.Should().ContainSingle().Subject;
        sent.CountyId.Should().Be(BentonCountyId.ToString("D"));
        sent.Command.Current.Status.Should().Be("filed");
        sent.Command.Requested.Should().BeEquivalentTo(new { Status = "decided", HasDecidedValue = true });
        var serialized = System.Text.Json.JsonSerializer.Serialize(sent);
        serialized.Should().NotContain("Synthetic private note").And.NotContain("390000")
            .And.NotContain("PARCEL-001").And.NotContain("Synthetic Petitioner");
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task UpdateStatusAsync_RejectedOrUnavailable_DoesNotMutatePersistedAppeal(bool rejected)
    {
        await using var db = CreateDbContext($"{nameof(UpdateStatusAsync_RejectedOrUnavailable_DoesNotMutatePersistedAppeal)}-{rejected}");
        await SeedCounty(db, BentonCountyId);
        var accepted = CreateService(db);
        var created = await accepted.CreateAsync(BentonCountyId, Command(), utcNow: EffectiveAt);
        db.ChangeTracker.Clear();
        var port = new FakeDaisAppealMutationDecisionPort(transition: (request, _) =>
            rejected
                ? Task.FromResult(new DaisAppealTransitionDecisionResult
                {
                    SchemaVersion = request.SchemaVersion,
                    Operation = request.Operation,
                    CommandId = request.CommandId,
                    CountyId = request.CountyId,
                    Decision = DaisAppealMutationDecision.rejected,
                    Mutation = null,
                    Violations =
                    [
                        new DaisAppealMutationViolation
                        {
                            Code = DaisAppealMutationViolationCode.INVALID_TRANSITION,
                            Message = "Synthetic rejection",
                        },
                    ],
                })
                : Task.FromException<DaisAppealTransitionDecisionResult>(
                    new DaisAppealMutationUnavailableException("Synthetic unavailable")));
        var service = CreateService(db, port);

        var act = () => service.UpdateStatusAsync(
            created.Id, "decided", BentonCountyId, "must not persist", 1m);

        if (rejected)
            await act.Should().ThrowAsync<DaisAppealMutationRejectedException>();
        else
            await act.Should().ThrowAsync<DaisAppealMutationUnavailableException>();
        db.ChangeTracker.Clear();
        var persisted = await db.Appeals.SingleAsync(a => a.Id == created.Id);
        persisted.Status.Should().Be("filed");
        persisted.DecisionDate.Should().BeNull();
        persisted.DecisionNotes.Should().BeNull();
        persisted.DecidedValue.Should().BeNull();
    }

    [Fact]
    public async Task CountyScopedReadsAndMutation_DoNotCrossCountyBoundary()
    {
        await using var db = CreateDbContext(nameof(CountyScopedReadsAndMutation_DoNotCrossCountyBoundary));
        await SeedCounty(db, BentonCountyId);
        await SeedCounty(db, OtherCountyId);
        var service = CreateService(db);
        var benton = await service.CreateAsync(BentonCountyId, Command("SHARED"), utcNow: EffectiveAt);
        await service.CreateAsync(OtherCountyId, Command("SHARED", "UNIFORMITY"), utcNow: EffectiveAt);

        (await service.GetByParcelAsync("SHARED", BentonCountyId)).Should().ContainSingle()
            .Which.CountyId.Should().Be(BentonCountyId);
        (await service.GetByTaxYearAsync(2026, BentonCountyId)).Should().ContainSingle()
            .Which.CountyId.Should().Be(BentonCountyId);
        (await service.GetByIdAsync(benton.Id, OtherCountyId)).Should().BeNull();
        var act = () => service.UpdateStatusAsync(benton.Id, "heard", OtherCountyId);
        await act.Should().ThrowAsync<KeyNotFoundException>();
    }
}
