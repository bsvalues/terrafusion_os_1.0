using Microsoft.Extensions.Logging;
using Moq;
using TerraFusion.API.Services;
using TerraFusion.API.Tests.TestHelpers;
using TerraFusion.Core.Entities;
using TerraFusion.Data;
using Xunit;

namespace TerraFusion.API.Tests.Unit;

/// <summary>
/// Unit tests for the Muse template engine (MuseService).
/// Tests all 6 service methods across 4 audience types.
/// Verifies deterministic template output, engine metadata, and
/// audience-specific tone differences.
/// </summary>
public class MuseServiceTests : IDisposable
{
    private readonly TerraFusionDbContext _db;
    private readonly MuseService _sut;
    private readonly Guid _countyId = Guid.Parse("00000000-0000-0000-0000-000000000001");

    public MuseServiceTests()
    {
        _db = TestDbContextFactory.CreateInMemoryContext();
        var logger = new Mock<ILogger<MuseService>>();
        _sut = new MuseService(_db, logger.Object);

        SeedTestData();
    }

    public void Dispose()
    {
        _db.Dispose();
    }

    private void SeedTestData()
    {
        _db.Counties.Add(new County
        {
            Id = _countyId,
            Name = "Benton",
            State = "WA",
            FipsCode = "53005",
            Population = 210_000,
        });

        _db.Properties.Add(new Property
        {
            Id = Guid.NewGuid(),
            PropertyId = "PROP-UNIT-001",
            ParcelId = "UNIT-001",
            ParcelNumber = "UNIT-001",
            CountyId = _countyId,
            Address = "100 Test Ave, Kennewick, WA 99336",
            PropertyType = "Residential",
            AssessedValue = 400_000m,
            LandValue = 120_000m,
            ImprovementValue = 280_000m,
            MarketValue = 420_000m,
            TaxYear = 2025,
            YearBuilt = 2000,
        });

        _db.Properties.Add(new Property
        {
            Id = Guid.NewGuid(),
            PropertyId = "PROP-UNIT-002",
            ParcelId = "UNIT-COMM-001",
            ParcelNumber = "UNIT-COMM-001",
            CountyId = _countyId,
            Address = "200 Commerce Blvd, Richland, WA 99352",
            PropertyType = "Commercial",
            AssessedValue = 2_000_000m,
            LandValue = 600_000m,
            ImprovementValue = 1_400_000m,
            MarketValue = 2_200_000m,
            TaxYear = 2025,
            YearBuilt = 2010,
        });

        _db.SaveChanges();
    }

    // ── GetCapabilities ───────────────────────────────────────────────

    [Fact]
    public void GetCapabilities_Returns_TemplateEngine_Metadata()
    {
        var caps = _sut.GetCapabilities();

        Assert.Equal("muse-template-v1", caps.Engine);
        Assert.False(caps.AiPowered);
        Assert.Contains("explain_value_change", caps.SupportedTypes);
        Assert.Contains("explain_assessment", caps.SupportedTypes);
        Assert.Contains("draft_notice", caps.SupportedTypes);
        Assert.Contains("draft_appeal_response", caps.SupportedTypes);
        Assert.Contains("generate_memo", caps.SupportedTypes);
        Assert.Contains("synthesize_evidence", caps.SupportedTypes);
        Assert.Equal(6, caps.SupportedTypes.Length);
    }

    [Fact]
    public void GetCapabilities_Returns_All_Four_Audiences()
    {
        var caps = _sut.GetCapabilities();

        Assert.Contains("taxpayer", caps.Audiences);
        Assert.Contains("appraiser", caps.Audiences);
        Assert.Contains("commissioner", caps.Audiences);
        Assert.Contains("internal", caps.Audiences);
        Assert.Equal(4, caps.Audiences.Length);
    }

    // ── ExplainValueChangeAsync ─── Audience variations ──────────────

    [Fact]
    public async Task ExplainValueChange_Taxpayer_Returns_PlainLanguage()
    {
        var request = new ExplainValueChangeRequest
        {
            ParcelId = "UNIT-001",
            FromYear = 2024,
            ToYear = 2025,
            FromValue = 350_000m,
            ToValue = 400_000m,
            Audience = "taxpayer",
        };

        var result = await _sut.ExplainValueChangeAsync(request, _countyId);

        Assert.Equal("UNIT-001", result.ParcelId);
        Assert.Contains("Your property", result.Explanation);
        Assert.Contains("increased", result.Explanation);
        Assert.Equal("muse-template-v1", result.Engine);
        Assert.Null(result.Fallback);
        Assert.True(result.Confidence > 0);
        Assert.NotEmpty(result.Drivers);
    }

    [Fact]
    public async Task ExplainValueChange_Commissioner_Returns_ExecutiveSummary()
    {
        var request = new ExplainValueChangeRequest
        {
            ParcelId = "UNIT-001",
            FromYear = 2024,
            ToYear = 2025,
            FromValue = 350_000m,
            ToValue = 400_000m,
            Audience = "commissioner",
        };

        var result = await _sut.ExplainValueChangeAsync(request, _countyId);

        Assert.Contains("USPAP", result.Explanation);
        Assert.Contains("IAAO", result.Explanation);
        Assert.Contains("Primary drivers", result.Explanation);
        Assert.Equal("muse-template-v1", result.Engine);
    }

    [Fact]
    public async Task ExplainValueChange_Internal_Returns_TechnicalDetail()
    {
        var request = new ExplainValueChangeRequest
        {
            ParcelId = "UNIT-001",
            FromYear = 2024,
            ToYear = 2025,
            FromValue = 350_000m,
            ToValue = 400_000m,
            Audience = "internal",
        };

        var result = await _sut.ExplainValueChangeAsync(request, _countyId);

        Assert.Contains("[UNIT-001]", result.Explanation);
        Assert.Contains("Drivers:", result.Explanation);
        Assert.Contains("Engine: muse-template-v1", result.Explanation);
        Assert.Equal("muse-template-v1", result.Engine);
    }

    [Fact]
    public async Task ExplainValueChange_Appraiser_Falls_Through_To_Internal()
    {
        // "appraiser" is not a distinct case in the switch -- falls to default (internal)
        var request = new ExplainValueChangeRequest
        {
            ParcelId = "UNIT-001",
            FromValue = 350_000m,
            ToValue = 400_000m,
            Audience = "appraiser",
        };

        var result = await _sut.ExplainValueChangeAsync(request, _countyId);

        Assert.Contains("[UNIT-001]", result.Explanation);
        Assert.Equal("muse-template-v1", result.Engine);
    }

    [Fact]
    public async Task ExplainValueChange_Decrease_Reports_Decreased()
    {
        var request = new ExplainValueChangeRequest
        {
            ParcelId = "UNIT-001",
            FromValue = 400_000m,
            ToValue = 350_000m,
            Audience = "taxpayer",
        };

        var result = await _sut.ExplainValueChangeAsync(request, _countyId);

        Assert.Contains("decreased", result.Explanation);
        Assert.Contains("market_decline", result.Drivers);
    }

    [Fact]
    public async Task ExplainValueChange_LargeChange_Includes_SignificantAdjustment_Driver()
    {
        var request = new ExplainValueChangeRequest
        {
            ParcelId = "UNIT-001",
            FromValue = 200_000m,
            ToValue = 400_000m,
            Audience = "internal",
        };

        var result = await _sut.ExplainValueChangeAsync(request, _countyId);

        Assert.Contains("significant_adjustment", result.Drivers);
        Assert.Contains("market_appreciation", result.Drivers);
    }

    [Fact]
    public async Task ExplainValueChange_Commercial_Includes_CommercialFactor_Driver()
    {
        var request = new ExplainValueChangeRequest
        {
            ParcelId = "UNIT-COMM-001",
            FromValue = 1_800_000m,
            ToValue = 2_000_000m,
            Audience = "internal",
        };

        var result = await _sut.ExplainValueChangeAsync(request, _countyId);

        Assert.Contains("commercial_market_factor", result.Drivers);
    }

    // ── ExplainAssessmentAsync ── Audience variations ─────────────────

    [Fact]
    public async Task ExplainAssessment_KnownParcel_Returns_DetailedExplanation()
    {
        var request = new ExplainAssessmentRequest { ParcelId = "UNIT-001" };

        var result = await _sut.ExplainAssessmentAsync(request, _countyId);

        Assert.Equal("UNIT-001", result.ParcelId);
        Assert.Contains("100 Test Ave", result.Explanation);
        Assert.Contains("Residential", result.Explanation);
        Assert.Contains("$400,000", result.Explanation);
        Assert.Contains("USPAP", result.Explanation);
        Assert.Contains("RCW 84.40.030", result.Explanation);
        Assert.Equal(0.95, result.Confidence);
        Assert.Equal("muse-template-v1", result.Engine);
    }

    [Fact]
    public async Task ExplainAssessment_UnknownParcel_Returns_NotFoundMessage()
    {
        var request = new ExplainAssessmentRequest { ParcelId = "NONEXIST-999" };

        var result = await _sut.ExplainAssessmentAsync(request, _countyId);

        Assert.Equal("NONEXIST-999", result.ParcelId);
        Assert.Contains("No property record found", result.Explanation);
        Assert.Contains("not_found", result.Drivers);
        Assert.Equal(0.0, result.Confidence);
        Assert.Equal("muse-template-v1", result.Engine);
    }

    [Fact]
    public async Task ExplainAssessment_CrossCounty_Returns_NotFoundMessage()
    {
        // Query with a different county ID -- property belongs to _countyId
        var otherCountyId = Guid.Parse("00000000-0000-0000-0000-000000000099");
        var request = new ExplainAssessmentRequest { ParcelId = "UNIT-001" };

        var result = await _sut.ExplainAssessmentAsync(request, otherCountyId);

        Assert.Contains("No property record found", result.Explanation);
        Assert.Equal(0.0, result.Confidence);
    }

    // ── DraftNoticeAsync ─────────────────────────────────────────────

    [Fact]
    public async Task DraftNotice_KnownParcel_Returns_FormalNotice()
    {
        var request = new DraftNoticeRequest
        {
            ParcelId = "UNIT-001",
            NoticeType = "value_change",
            TaxYear = 2025,
        };

        var result = await _sut.DraftNoticeAsync(request, _countyId);

        Assert.Equal("UNIT-001", result.ParcelId);
        Assert.Contains("NOTICE OF ASSESSED VALUE", result.Draft);
        Assert.Contains("Tax Year 2025", result.Draft);
        Assert.Contains("100 Test Ave", result.Draft);
        Assert.Contains("$400,000", result.Draft);
        Assert.Contains("RCW 84.40.030", result.Draft);
        Assert.Contains("RCW 84.40.038", result.Draft);
        Assert.Contains("Board of Equalization", result.Draft);
        Assert.Equal("value_change", result.NoticeType);
        Assert.Equal("muse-template-v1", result.Engine);
        Assert.Null(result.Fallback);
    }

    [Fact]
    public async Task DraftNotice_UnknownParcel_Returns_GenericNotice()
    {
        var request = new DraftNoticeRequest
        {
            ParcelId = "NONEXIST-999",
            TaxYear = 2025,
        };

        var result = await _sut.DraftNoticeAsync(request, _countyId);

        Assert.Equal("NONEXIST-999", result.ParcelId);
        Assert.Contains("NOTICE OF ASSESSED VALUE", result.Draft);
        Assert.Contains("address on file", result.Draft);
        Assert.Equal("muse-template-v1", result.Engine);
    }

    [Fact]
    public async Task DraftNotice_DefaultNoticeType_Is_ValueChange()
    {
        var request = new DraftNoticeRequest { ParcelId = "UNIT-001" };

        var result = await _sut.DraftNoticeAsync(request, _countyId);

        Assert.Equal("value_change", result.NoticeType);
    }

    // ── DraftAppealResponseAsync ─────────────────────────────────────

    [Fact]
    public async Task DraftAppealResponse_Returns_FormalResponse()
    {
        var request = new DraftAppealResponseRequest
        {
            ParcelId = "UNIT-001",
            CaseId = "CASE-2025-042",
            AssessedValue = 400_000m,
        };

        var result = await _sut.DraftAppealResponseAsync(request, _countyId);

        Assert.Equal("UNIT-001", result.ParcelId);
        Assert.Contains("CASE-2025-042", result.Draft);
        Assert.Contains("Board of Equalization", result.Draft);
        Assert.Contains("USPAP", result.Draft);
        Assert.Contains("three-approach", result.Draft);
        Assert.Contains("RCW 84.40.030", result.Draft);
        Assert.Contains("$400,000", result.Draft);
        Assert.Equal("appeal_response", result.NoticeType);
        Assert.Equal("muse-template-v1", result.Engine);
        Assert.Null(result.Fallback);
    }

    // ── GenerateMemoAsync ────────────────────────────────────────────

    [Fact]
    public async Task GenerateMemo_Returns_FormalMemorandum()
    {
        var request = new GenerateMemoRequest
        {
            Topic = "Annual Valuation Review",
            Context = "Residential values increased by 5%.",
        };

        var result = await _sut.GenerateMemoAsync(request, _countyId);

        Assert.Null(result.ParcelId);
        Assert.Contains("MEMORANDUM", result.Draft);
        Assert.Contains("Board of County Commissioners", result.Draft);
        Assert.Contains("Annual Valuation Review", result.Draft);
        Assert.Contains("Residential values increased by 5%.", result.Draft);
        Assert.Contains("Benton", result.Draft);
        Assert.Contains("IAAO", result.Draft);
        Assert.Equal("commissioner_memo", result.NoticeType);
        Assert.Equal("muse-template-v1", result.Engine);
        Assert.Null(result.Fallback);
    }

    [Fact]
    public async Task GenerateMemo_WithoutContext_Omits_ContextText()
    {
        var request = new GenerateMemoRequest
        {
            Topic = "Tax Rate Analysis",
            Context = null,
        };

        var result = await _sut.GenerateMemoAsync(request, _countyId);

        Assert.Contains("MEMORANDUM", result.Draft);
        Assert.Contains("Tax Rate Analysis", result.Draft);
        Assert.Contains("tax rate analysis", result.Draft.ToLowerInvariant());
    }

    [Fact]
    public async Task GenerateMemo_UnknownCounty_Uses_FallbackName()
    {
        var unknownCountyId = Guid.Parse("99999999-9999-9999-9999-999999999999");
        var request = new GenerateMemoRequest { Topic = "Test Topic" };

        var result = await _sut.GenerateMemoAsync(request, unknownCountyId);

        Assert.Contains("the county", result.Draft);
    }

    // ── SynthesizeEvidenceAsync ──────────────────────────────────────

    [Fact]
    public async Task SynthesizeEvidence_KnownParcel_Returns_Synthesis()
    {
        var request = new SynthesizeEvidenceRequest { ParcelId = "UNIT-001" };

        var result = await _sut.SynthesizeEvidenceAsync(request, _countyId);

        Assert.Equal("UNIT-001", result.ParcelId);
        Assert.Contains("UNIT-001", result.Synthesis);
        Assert.Contains("100 Test Ave", result.Synthesis);
        Assert.Contains("Residential", result.Synthesis);
        Assert.Contains("USPAP", result.Synthesis);
        Assert.Contains("IAAO", result.Synthesis);
        Assert.Contains("property_record", result.Sources);
        Assert.True(result.Confidence > 0);
        Assert.Equal("muse-template-v1", result.Engine);
        Assert.Null(result.Fallback);
    }

    [Fact]
    public async Task SynthesizeEvidence_UnknownParcel_Returns_NotFoundSynthesis()
    {
        var request = new SynthesizeEvidenceRequest { ParcelId = "NONEXIST-999" };

        var result = await _sut.SynthesizeEvidenceAsync(request, _countyId);

        Assert.Equal("NONEXIST-999", result.ParcelId);
        Assert.Contains("No property record found", result.Synthesis);
        Assert.Contains("USPAP", result.Synthesis);
        Assert.Equal("muse-template-v1", result.Engine);
    }

    // ── Engine field consistency ──────────────────────────────────────

    [Theory]
    [InlineData("taxpayer")]
    [InlineData("appraiser")]
    [InlineData("commissioner")]
    [InlineData("internal")]
    public async Task ExplainValueChange_AllAudiences_Return_TemplateEngine(string audience)
    {
        var request = new ExplainValueChangeRequest
        {
            ParcelId = "UNIT-001",
            FromValue = 300_000m,
            ToValue = 400_000m,
            Audience = audience,
        };

        var result = await _sut.ExplainValueChangeAsync(request, _countyId);

        Assert.Equal("muse-template-v1", result.Engine);
        Assert.Null(result.Fallback);
        Assert.False(string.IsNullOrWhiteSpace(result.Explanation));
    }

    // ── Audience tone differences ────────────────────────────────────

    [Fact]
    public async Task ExplainValueChange_Taxpayer_Differs_From_Internal()
    {
        var baseRequest = new ExplainValueChangeRequest
        {
            ParcelId = "UNIT-001",
            FromValue = 350_000m,
            ToValue = 400_000m,
        };

        var taxpayerReq = new ExplainValueChangeRequest
        {
            ParcelId = baseRequest.ParcelId,
            FromValue = baseRequest.FromValue,
            ToValue = baseRequest.ToValue,
            Audience = "taxpayer",
        };

        var internalReq = new ExplainValueChangeRequest
        {
            ParcelId = baseRequest.ParcelId,
            FromValue = baseRequest.FromValue,
            ToValue = baseRequest.ToValue,
            Audience = "internal",
        };

        var taxpayerResult = await _sut.ExplainValueChangeAsync(taxpayerReq, _countyId);
        var internalResult = await _sut.ExplainValueChangeAsync(internalReq, _countyId);

        // Taxpayer gets plain language; internal gets technical notation
        Assert.Contains("Your property", taxpayerResult.Explanation);
        Assert.Contains("[UNIT-001]", internalResult.Explanation);
        Assert.NotEqual(taxpayerResult.Explanation, internalResult.Explanation);
    }

    [Fact]
    public async Task ExplainValueChange_Commissioner_Differs_From_Taxpayer()
    {
        var taxpayerReq = new ExplainValueChangeRequest
        {
            ParcelId = "UNIT-001",
            FromYear = 2024,
            ToYear = 2025,
            FromValue = 350_000m,
            ToValue = 400_000m,
            Audience = "taxpayer",
        };

        var commissionerReq = new ExplainValueChangeRequest
        {
            ParcelId = "UNIT-001",
            FromYear = 2024,
            ToYear = 2025,
            FromValue = 350_000m,
            ToValue = 400_000m,
            Audience = "commissioner",
        };

        var taxpayerResult = await _sut.ExplainValueChangeAsync(taxpayerReq, _countyId);
        var commissionerResult = await _sut.ExplainValueChangeAsync(commissionerReq, _countyId);

        Assert.Contains("Your property", taxpayerResult.Explanation);
        Assert.Contains("Primary drivers", commissionerResult.Explanation);
        Assert.NotEqual(taxpayerResult.Explanation, commissionerResult.Explanation);
    }
}
