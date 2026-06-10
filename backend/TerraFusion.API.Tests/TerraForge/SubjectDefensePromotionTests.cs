// TERRAFORGE-COMPS-SUBJECT-DEFENSE-PROMOTION-CONTRACT
//
// Behavioral tests for promoting a persisted draft market_search comp set into
// a NEW derived draft subject_defense comp set bound to a subject parcel.
//
// Spec: docs/superpowers/specs/2026-06-08-terraforge-comps-subject-defense-promotion-design.md
//
// Slice rules under test:
//   - Derive, do not mutate: original market_search set stays intact.
//   - Bind only: candidates preserved verbatim; no scoring/adjustment/reconciliation.
//   - subjectParcelId is REQUIRED.
//   - status = draft, officialStatus = not_official (never official, never "defended").
//   - County isolation: cross-county source is not promotable.
//   - Only a market_search set is a valid promotion source.
//   - Response declares the actions that remain unavailable.

using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TerraFusion.API.Controllers;
using TerraFusion.API.Services;
using TerraFusion.API.Tests.TestHelpers;
using TerraFusion.Core.Entities.TerraForge;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.API.Tests.TerraForge;

/// <summary>
/// Unit/behavioral tests for
/// TerraForgeController.PromoteCompSetToSubjectDefense.
/// </summary>
public sealed class SubjectDefensePromotionTests : IDisposable
{
    private static readonly Guid BentonId =
        Guid.Parse("19190019-1919-1919-1919-191919191919");
    private static readonly Guid OtherCountyId = Guid.NewGuid();

    private const string SubjectParcel = "101974030000025";

    private readonly TerraFusion.Data.TerraFusionDbContext _db;
    private readonly TerraForgeController _sut;

    public SubjectDefensePromotionTests()
    {
        _db = TestDbContextFactory.CreateInMemoryContext();
        _sut = new TerraForgeController(
            _db,
            NullLogger<TerraForgeController>.Instance,
            Mock.Of<IOlsRegressionService>(),
            Mock.Of<ISaleQualificationService>(),
            ControllerTestSetup.CountyResolverFor(BentonId))
        {
            ControllerContext = ControllerTestSetup.WithCountyClaim(BentonId),
        };
    }

    public void Dispose() => _db.Dispose();

    // ── Helpers ──────────────────────────────────────────────────────────────

    private CompSet SeedMarketSearchSet(
        Guid? countyId = null,
        int candidateCount = 3,
        string mode = "market_search")
    {
        var county = countyId ?? BentonId;
        var set = new CompSet
        {
            CountyId = county,
            Name = "Session Market Basket",
            Mode = mode,
            Status = "draft",
            OfficialStatus = "not_official",
            SubjectParcelId = null,
            Candidates = Enumerable.Range(1, candidateCount)
                .Select(rank => new CompSetCandidate
                {
                    CountyId = county,
                    ParcelId = $"1000000{rank}",
                    SalePrice = 300_000m + (rank * 1_000m),
                    SaleDate = new DateTime(2025, 6, rank, 0, 0, 0, DateTimeKind.Utc),
                    PricePerSqft = 150m + rank,
                    Qualification = "qualified",
                    Rank = rank,
                })
                .ToList(),
        };
        _db.CompSets.Add(set);
        _db.SaveChanges();
        return set;
    }

    private CompSetPromoteSubjectDefenseRequestDto Request(
        string? subjectParcelId = SubjectParcel,
        string? reason = "Prepare subject defense review") =>
        new()
        {
            subjectParcelId = subjectParcelId,
            promotionReason = reason,
            preserveCandidates = true,
        };

    private static CompSetPromotionResponseDto CreatedBody(IActionResult result)
    {
        var created = Assert.IsType<CreatedAtActionResult>(result);
        return Assert.IsType<CompSetPromotionResponseDto>(created.Value);
    }

    // ── Tests: happy path ────────────────────────────────────────────────────

    [Fact]
    public async Task Promote_FromMarketSearch_CreatesDerivedSubjectDefenseDraft()
    {
        var source = SeedMarketSearchSet(candidateCount: 3);

        var result = await _sut.PromoteCompSetToSubjectDefense(
            source.CompSetId.ToString("D"), Request());

        var body = CreatedBody(result);
        Assert.Equal("subject_defense", body.mode);
        Assert.Equal("draft", body.status);
        Assert.Equal("not_official", body.officialStatus);
        Assert.Equal(SubjectParcel, body.subjectParcelId);
        Assert.Equal(source.CompSetId.ToString("D"), body.sourceCompSetId);
        Assert.Equal(3, body.candidateCount);
        Assert.Equal("promoted", body.promotionStatus);
        Assert.NotEqual(source.CompSetId.ToString("D"), body.compSetId);
    }

    [Fact]
    public async Task Promote_PersistsNewSubjectDefenseSet_WithLineage()
    {
        var source = SeedMarketSearchSet(candidateCount: 2);

        await _sut.PromoteCompSetToSubjectDefense(
            source.CompSetId.ToString("D"), Request());

        var derived = _db.CompSets
            .Where(x => x.Mode == "subject_defense")
            .ToList();

        Assert.Single(derived);
        var set = derived[0];
        Assert.Equal(BentonId, set.CountyId);
        Assert.Equal(SubjectParcel, set.SubjectParcelId);
        Assert.Equal("draft", set.Status);
        Assert.Equal("not_official", set.OfficialStatus);
        Assert.Equal(source.CompSetId, set.SourceCompSetId);
        Assert.Equal("market_search", set.PromotedFromMode);
        Assert.NotNull(set.PromotedAtUtc);
    }

    [Fact]
    public async Task Promote_PreservesOriginalMarketSearchSet_Unchanged()
    {
        var source = SeedMarketSearchSet(candidateCount: 3);

        await _sut.PromoteCompSetToSubjectDefense(
            source.CompSetId.ToString("D"), Request());

        var original = _db.CompSets.Single(x => x.CompSetId == source.CompSetId);
        Assert.Equal("market_search", original.Mode);
        Assert.Null(original.SubjectParcelId);
        Assert.Equal("not_official", original.OfficialStatus);
        Assert.Null(original.SourceCompSetId);
    }

    [Fact]
    public async Task Promote_PreservesCandidates_VerbatimWithRank()
    {
        var source = SeedMarketSearchSet(candidateCount: 3);
        var sourceCandidates = _db.CompSetCandidates
            .Where(c => c.CompSetId == source.CompSetId)
            .OrderBy(c => c.Rank)
            .ToList();

        var body = CreatedBody(await _sut.PromoteCompSetToSubjectDefense(
            source.CompSetId.ToString("D"), Request()));

        var derivedId = Guid.Parse(body.compSetId);
        var derivedCandidates = _db.CompSetCandidates
            .Where(c => c.CompSetId == derivedId)
            .OrderBy(c => c.Rank)
            .ToList();

        Assert.Equal(sourceCandidates.Count, derivedCandidates.Count);
        for (var i = 0; i < sourceCandidates.Count; i++)
        {
            Assert.Equal(sourceCandidates[i].ParcelId, derivedCandidates[i].ParcelId);
            Assert.Equal(sourceCandidates[i].SalePrice, derivedCandidates[i].SalePrice);
            Assert.Equal(sourceCandidates[i].Rank, derivedCandidates[i].Rank);
            Assert.Equal(BentonId, derivedCandidates[i].CountyId);
            // New candidate rows, not reparented originals.
            Assert.NotEqual(sourceCandidates[i].CompSetCandidateId, derivedCandidates[i].CompSetCandidateId);
        }
    }

    [Fact]
    public async Task Promote_Response_DeclaresUnavailableActions()
    {
        var source = SeedMarketSearchSet();

        var body = CreatedBody(await _sut.PromoteCompSetToSubjectDefense(
            source.CompSetId.ToString("D"), Request()));

        Assert.Contains("certify_official", body.unavailableActions);
        Assert.Contains("export_dossier_packet", body.unavailableActions);
        Assert.Contains("apply_adjustments", body.unavailableActions);
        Assert.Contains("reconcile_value", body.unavailableActions);
    }

    // ── Tests: required subject parcel ───────────────────────────────────────

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public async Task Promote_WithoutSubjectParcelId_ReturnsBadRequest_AndPersistsNothing(string? parcel)
    {
        var source = SeedMarketSearchSet();

        var result = await _sut.PromoteCompSetToSubjectDefense(
            source.CompSetId.ToString("D"), Request(subjectParcelId: parcel));

        Assert.IsType<BadRequestObjectResult>(result);
        Assert.Empty(_db.CompSets.Where(x => x.Mode == "subject_defense"));
    }

    // ── Tests: source validation ─────────────────────────────────────────────

    [Fact]
    public async Task Promote_InvalidCompSetId_ReturnsBadRequest()
    {
        var result = await _sut.PromoteCompSetToSubjectDefense("not-a-guid", Request());
        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task Promote_MissingSource_ReturnsNotFound()
    {
        var result = await _sut.PromoteCompSetToSubjectDefense(
            Guid.NewGuid().ToString("D"), Request());
        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task Promote_CrossCountySource_ReturnsNotFound_AndPersistsNothing()
    {
        // Source belongs to a different county than the caller's Benton scope.
        var source = SeedMarketSearchSet(countyId: OtherCountyId);

        var result = await _sut.PromoteCompSetToSubjectDefense(
            source.CompSetId.ToString("D"), Request());

        Assert.IsType<NotFoundObjectResult>(result);
        Assert.Empty(_db.CompSets.Where(x => x.Mode == "subject_defense"));
    }

    [Fact]
    public async Task Promote_NonMarketSearchSource_IsRejected_AndPersistsNothing()
    {
        // A subject_defense set is not a valid promotion source.
        var source = SeedMarketSearchSet(mode: "subject_defense");

        var result = await _sut.PromoteCompSetToSubjectDefense(
            source.CompSetId.ToString("D"), Request());

        Assert.IsType<ConflictObjectResult>(result);
        // No SECOND subject_defense set was derived.
        Assert.Single(_db.CompSets.Where(x => x.Mode == "subject_defense"));
    }

    [Fact]
    public async Task Promote_SourceWithNoCandidates_ReturnsBadRequest()
    {
        var source = SeedMarketSearchSet(candidateCount: 0);

        var result = await _sut.PromoteCompSetToSubjectDefense(
            source.CompSetId.ToString("D"), Request());

        Assert.IsType<BadRequestObjectResult>(result);
        Assert.Empty(_db.CompSets.Where(x => x.Mode == "subject_defense"));
    }

    [Fact]
    public async Task Promote_NeverMarksOfficialOrDefended()
    {
        var source = SeedMarketSearchSet();

        var body = CreatedBody(await _sut.PromoteCompSetToSubjectDefense(
            source.CompSetId.ToString("D"), Request()));

        Assert.NotEqual("official", body.officialStatus);
        Assert.NotEqual("defended", body.status);
    }
}
