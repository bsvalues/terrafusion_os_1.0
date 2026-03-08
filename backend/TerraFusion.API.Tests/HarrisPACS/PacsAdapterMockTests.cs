// =============================================================================
// Harris PACS Adapter Integration Tests (In-Memory Mocks)
// =============================================================================
// Tests the IPacsAdapter contract using an in-memory implementation.
// NO real PACS database connections are made.
// Contract reference: docs/spec-lock/locks/pacscontract/pacscontract.v1/
// =============================================================================

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using TerraFusion.Core.PACS;
using Xunit;

namespace TerraFusion.API.Tests.HarrisPACS;

#region InMemoryPacsAdapter

/// <summary>
/// In-memory implementation of <see cref="IPacsAdapter"/> seeded with
/// realistic Benton County test data.  Used exclusively for unit/integration
/// tests -- never connects to a real database.
/// </summary>
internal sealed class InMemoryPacsAdapter : IPacsAdapter
{
    private readonly List<PacsPropertyCore> _properties;
    private readonly List<PacsPropertyOwnership> _ownership;
    private readonly List<PacsAssessmentHistory> _assessments;
    private readonly bool _simulateConnectionFailure;

    public InMemoryPacsAdapter(bool simulateConnectionFailure = false)
    {
        _simulateConnectionFailure = simulateConnectionFailure;

        _properties = new List<PacsPropertyCore>
        {
            new()
            {
                PropId = 10001,
                GeoId = "1-0529-100-0001-000",
                PropTypeCd = "R",
                SitusAddr = "1234 Main St",
                SitusCity = "Kennewick",
                SitusZip = "99336",
                LegalDesc = "LOT 1 BLK 1 MAIN ADDITION",
                AssessedVal = 285000m,
                MarketVal = 310000m,
                LandVal = 95000m,
                ImprvVal = 190000m,
                ApprYear = 2025,
                LastModified = new DateTime(2025, 6, 15, 10, 30, 0, DateTimeKind.Utc)
            },
            new()
            {
                PropId = 10002,
                GeoId = "1-0529-100-0002-000",
                PropTypeCd = "R",
                SitusAddr = "5678 Oak Ave",
                SitusCity = "Richland",
                SitusZip = "99352",
                LegalDesc = "LOT 2 BLK 1 MAIN ADDITION",
                AssessedVal = 425000m,
                MarketVal = 460000m,
                LandVal = 130000m,
                ImprvVal = 295000m,
                ApprYear = 2025,
                LastModified = new DateTime(2025, 7, 1, 8, 0, 0, DateTimeKind.Utc)
            },
            new()
            {
                PropId = 10003,
                GeoId = "1-0529-200-0001-000",
                PropTypeCd = "C",
                SitusAddr = "900 Columbia Center Blvd",
                SitusCity = "Kennewick",
                SitusZip = "99336",
                LegalDesc = "LOT 1 BLK 2 COMMERCIAL PARK",
                AssessedVal = 1250000m,
                MarketVal = 1400000m,
                LandVal = 400000m,
                ImprvVal = 850000m,
                ApprYear = 2025,
                LastModified = new DateTime(2025, 8, 20, 14, 0, 0, DateTimeKind.Utc)
            }
        };

        _ownership = new List<PacsPropertyOwnership>
        {
            new()
            {
                PropId = 10001,
                OwnerName = "SMITH, JOHN A & JANE B",
                MailAddr1 = "1234 Main St",
                MailCity = "Kennewick",
                MailState = "WA",
                MailZip = "99336",
                PctOwnership = 100m,
                DeedDate = new DateTime(2018, 3, 15)
            },
            new()
            {
                PropId = 10002,
                OwnerName = "JOHNSON, ROBERT C",
                MailAddr1 = "PO Box 456",
                MailCity = "Richland",
                MailState = "WA",
                MailZip = "99352",
                PctOwnership = 100m,
                DeedDate = new DateTime(2020, 9, 1)
            },
            new()
            {
                PropId = 10003,
                OwnerName = "TRI-CITIES COMMERCIAL LLC",
                MailAddr1 = "900 Columbia Center Blvd Ste 200",
                MailCity = "Kennewick",
                MailState = "WA",
                MailZip = "99336",
                PctOwnership = 100m,
                DeedDate = new DateTime(2022, 1, 10)
            }
        };

        _assessments = new List<PacsAssessmentHistory>
        {
            // Property 10001 -- three years of history
            new() { PropId = 10001, PropValYr = 2025, AssessedVal = 285000m, MarketVal = 310000m, LandVal = 95000m, ImprvVal = 190000m, AppraisedBy = "ASSESSOR-A", AppraisalDt = new DateTime(2025, 1, 15) },
            new() { PropId = 10001, PropValYr = 2024, AssessedVal = 270000m, MarketVal = 295000m, LandVal = 90000m, ImprvVal = 180000m, AppraisedBy = "ASSESSOR-A", AppraisalDt = new DateTime(2024, 1, 10) },
            new() { PropId = 10001, PropValYr = 2023, AssessedVal = 255000m, MarketVal = 278000m, LandVal = 85000m, ImprvVal = 170000m, AppraisedBy = "ASSESSOR-B", AppraisalDt = new DateTime(2023, 1, 12) },

            // Property 10002
            new() { PropId = 10002, PropValYr = 2025, AssessedVal = 425000m, MarketVal = 460000m, LandVal = 130000m, ImprvVal = 295000m, AppraisedBy = "ASSESSOR-A", AppraisalDt = new DateTime(2025, 2, 1) },
            new() { PropId = 10002, PropValYr = 2024, AssessedVal = 400000m, MarketVal = 430000m, LandVal = 120000m, ImprvVal = 280000m, AppraisedBy = "ASSESSOR-A", AppraisalDt = new DateTime(2024, 2, 5) },
        };
    }

    private void ThrowIfSimulatingFailure()
    {
        if (_simulateConnectionFailure)
        {
            throw new PacsContractViolationException(
                PacsErrorCodes.ConnectionFailed,
                "Simulated PACS connection failure for testing");
        }
    }

    // ── Contract Proof & Health ──────────────────────────────────────

    public Task<PacsContractProof> ValidateContractAsync(CancellationToken cancellationToken = default)
    {
        ThrowIfSimulatingFailure();

        return Task.FromResult(new PacsContractProof
        {
            IsValid = true,
            ContractId = "pacscontract.v1",
            ValidatedAt = DateTime.UtcNow,
            DatabaseConnection = new PacsProofItem { Name = "DatabaseConnection", Passed = true, Details = "In-memory adapter" },
            RequiredViews = new PacsProofItem { Name = "RequiredViews", Passed = true, Details = "All 3 required views present (mock)" },
            RequiredIndexes = new PacsProofItem { Name = "RequiredIndexes", Passed = true, Severity = "warning", Details = "All 3 required indexes present (mock)" },
            HealthCheckProcedure = new PacsProofItem { Name = "HealthCheckProcedure", Passed = true, Details = "sp_TerraFusion_HealthCheck exists (mock)" },
            HealthCheckExecution = new PacsProofItem { Name = "HealthCheckExecution", Passed = true, Details = "Health check executed successfully (mock)" },
            Errors = Array.Empty<string>(),
            Warnings = Array.Empty<string>()
        });
    }

    public Task<PacsConnectionStatus> GetConnectionStatusAsync(CancellationToken cancellationToken = default)
    {
        if (_simulateConnectionFailure)
        {
            return Task.FromResult(new PacsConnectionStatus
            {
                IsConnected = false,
                ErrorMessage = "Simulated connection failure",
                ErrorCode = PacsErrorCodes.ConnectionFailed
            });
        }

        return Task.FromResult(new PacsConnectionStatus
        {
            IsConnected = true,
            DatabaseName = "pacs_oltp",
            ServerName = "IN***RY",
            LastConnectedAt = DateTime.UtcNow,
            LatencyMs = 0.1
        });
    }

    // ── Property Queries ────────────────────────────────────────────

    public Task<PacsPropertyCore?> GetPropertyByIdAsync(int propId, CancellationToken cancellationToken = default)
    {
        ThrowIfSimulatingFailure();
        return Task.FromResult(_properties.FirstOrDefault(p => p.PropId == propId));
    }

    public Task<PacsPropertyCore?> GetPropertyByGeoIdAsync(string geoId, CancellationToken cancellationToken = default)
    {
        ThrowIfSimulatingFailure();

        if (string.IsNullOrEmpty(geoId))
            return Task.FromResult<PacsPropertyCore?>(null);

        return Task.FromResult(_properties.FirstOrDefault(p =>
            p.GeoId.Equals(geoId, StringComparison.OrdinalIgnoreCase)));
    }

    public Task<PacsPagedResult<PacsPropertyCore>> GetPropertiesAsync(
        int page = 1, int pageSize = 100, CancellationToken cancellationToken = default)
    {
        ThrowIfSimulatingFailure();

        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 100;

        var items = _properties
            .OrderBy(p => p.PropId)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        return Task.FromResult(new PacsPagedResult<PacsPropertyCore>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = _properties.Count
        });
    }

    // ── Ownership Queries ───────────────────────────────────────────

    public Task<PacsPropertyOwnership?> GetOwnershipAsync(int propId, CancellationToken cancellationToken = default)
    {
        ThrowIfSimulatingFailure();
        return Task.FromResult(_ownership.FirstOrDefault(o => o.PropId == propId));
    }

    // ── Assessment Queries ──────────────────────────────────────────

    public Task<IReadOnlyList<PacsAssessmentHistory>> GetAssessmentHistoryAsync(
        int propId, int? yearFrom = null, int? yearTo = null,
        CancellationToken cancellationToken = default)
    {
        ThrowIfSimulatingFailure();

        var results = _assessments
            .Where(a => a.PropId == propId)
            .Where(a => !yearFrom.HasValue || a.PropValYr >= yearFrom.Value)
            .Where(a => !yearTo.HasValue || a.PropValYr <= yearTo.Value)
            .OrderByDescending(a => a.PropValYr)
            .ToList();

        return Task.FromResult<IReadOnlyList<PacsAssessmentHistory>>(results);
    }

    public Task<PacsAssessmentHistory?> GetCurrentAssessmentAsync(int propId, CancellationToken cancellationToken = default)
    {
        ThrowIfSimulatingFailure();

        var current = _assessments
            .Where(a => a.PropId == propId)
            .OrderByDescending(a => a.PropValYr)
            .FirstOrDefault();

        return Task.FromResult(current);
    }

    // ── Batch Operations ────────────────────────────────────────────

    public Task<IReadOnlyList<PacsPropertyCore>> GetPropertiesByIdsAsync(
        IEnumerable<int> propIds, CancellationToken cancellationToken = default)
    {
        ThrowIfSimulatingFailure();

        var idSet = propIds.ToHashSet();
        var results = _properties.Where(p => idSet.Contains(p.PropId)).ToList();
        return Task.FromResult<IReadOnlyList<PacsPropertyCore>>(results);
    }

    public Task<IReadOnlyList<PacsPropertyCore>> GetChangedPropertiesAsync(
        DateTime since, int maxResults = 1000, CancellationToken cancellationToken = default)
    {
        ThrowIfSimulatingFailure();

        var results = _properties
            .Where(p => p.LastModified.HasValue && p.LastModified.Value > since)
            .OrderBy(p => p.LastModified)
            .Take(maxResults)
            .ToList();

        return Task.FromResult<IReadOnlyList<PacsPropertyCore>>(results);
    }
}

#endregion

/// <summary>
/// xUnit integration tests for the Harris PACS adapter using in-memory mocks.
/// Validates the IPacsAdapter contract defined by pacscontract.v1 without
/// connecting to any real PACS database.
/// </summary>
public sealed class PacsAdapterMockTests
{
    private readonly IPacsAdapter _adapter = new InMemoryPacsAdapter();

    // ═══════════════════════════════════════════════════════════════
    // 1. Property lookup by parcel ID returns correct data
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public async Task GetPropertyByGeoId_KnownParcel_ReturnsCorrectData()
    {
        var result = await _adapter.GetPropertyByGeoIdAsync("1-0529-100-0001-000");

        result.Should().NotBeNull();
        result!.PropId.Should().Be(10001);
        result.GeoId.Should().Be("1-0529-100-0001-000");
        result.SitusCity.Should().Be("Kennewick");
        result.AssessedVal.Should().Be(285000m);
        result.PropTypeCd.Should().Be("R");
    }

    [Fact]
    public async Task GetPropertyById_KnownId_ReturnsCorrectData()
    {
        var result = await _adapter.GetPropertyByIdAsync(10002);

        result.Should().NotBeNull();
        result!.GeoId.Should().Be("1-0529-100-0002-000");
        result.SitusAddr.Should().Be("5678 Oak Ave");
        result.SitusCity.Should().Be("Richland");
        result.MarketVal.Should().Be(460000m);
    }

    // ═══════════════════════════════════════════════════════════════
    // 2. Property lookup with invalid parcel returns null/empty
    // ═══════════════════════════════════════════════════════════════

    [Theory]
    [InlineData("9-9999-999-9999-999")]
    [InlineData("INVALID-PARCEL")]
    [InlineData("")]
    public async Task GetPropertyByGeoId_InvalidParcel_ReturnsNull(string geoId)
    {
        var result = await _adapter.GetPropertyByGeoIdAsync(geoId);

        result.Should().BeNull();
    }

    [Fact]
    public async Task GetPropertyById_NonexistentId_ReturnsNull()
    {
        var result = await _adapter.GetPropertyByIdAsync(99999);

        result.Should().BeNull();
    }

    // ═══════════════════════════════════════════════════════════════
    // 3. Ownership query returns owner records
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public async Task GetOwnership_KnownProperty_ReturnsOwnerRecord()
    {
        var result = await _adapter.GetOwnershipAsync(10001);

        result.Should().NotBeNull();
        result!.PropId.Should().Be(10001);
        result.OwnerName.Should().Be("SMITH, JOHN A & JANE B");
        result.MailState.Should().Be("WA");
        result.PctOwnership.Should().Be(100m);
        result.DeedDate.Should().NotBeNull();
    }

    [Fact]
    public async Task GetOwnership_NonexistentProperty_ReturnsNull()
    {
        var result = await _adapter.GetOwnershipAsync(99999);

        result.Should().BeNull();
    }

    // ═══════════════════════════════════════════════════════════════
    // 4. Assessment history returns ordered by year descending
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public async Task GetAssessmentHistory_ReturnsOrderedByYearDescending()
    {
        var results = await _adapter.GetAssessmentHistoryAsync(10001);

        results.Should().HaveCount(3);
        results[0].PropValYr.Should().Be(2025);
        results[1].PropValYr.Should().Be(2024);
        results[2].PropValYr.Should().Be(2023);

        // Verify values increase over time (most recent first)
        results[0].AssessedVal.Should().BeGreaterThan(results[1].AssessedVal!.Value);
        results[1].AssessedVal.Should().BeGreaterThan(results[2].AssessedVal!.Value);
    }

    [Fact]
    public async Task GetAssessmentHistory_WithYearFilter_ReturnsFilteredResults()
    {
        var results = await _adapter.GetAssessmentHistoryAsync(10001, yearFrom: 2024, yearTo: 2025);

        results.Should().HaveCount(2);
        results.All(a => a.PropValYr >= 2024 && a.PropValYr <= 2025).Should().BeTrue();
    }

    [Fact]
    public async Task GetCurrentAssessment_ReturnsLatestYear()
    {
        var result = await _adapter.GetCurrentAssessmentAsync(10001);

        result.Should().NotBeNull();
        result!.PropValYr.Should().Be(2025);
        result.AssessedVal.Should().Be(285000m);
    }

    // ═══════════════════════════════════════════════════════════════
    // 5. Health check returns healthy status
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public async Task ValidateContract_HealthyAdapter_ReturnsValidProof()
    {
        var proof = await _adapter.ValidateContractAsync();

        proof.IsValid.Should().BeTrue();
        proof.ContractId.Should().Be("pacscontract.v1");
        proof.DatabaseConnection.Passed.Should().BeTrue();
        proof.RequiredViews.Passed.Should().BeTrue();
        proof.RequiredIndexes.Passed.Should().BeTrue();
        proof.HealthCheckProcedure.Passed.Should().BeTrue();
        proof.HealthCheckExecution.Passed.Should().BeTrue();
        proof.Errors.Should().BeEmpty();
    }

    [Fact]
    public async Task GetConnectionStatus_HealthyAdapter_ReturnsConnected()
    {
        var status = await _adapter.GetConnectionStatusAsync();

        status.IsConnected.Should().BeTrue();
        status.DatabaseName.Should().Be("pacs_oltp");
        status.LatencyMs.Should().BeGreaterOrEqualTo(0);
        status.ErrorMessage.Should().BeNull();
    }

    // ═══════════════════════════════════════════════════════════════
    // 6. Batch property lookup handles multiple parcels
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public async Task GetPropertiesByIds_MultipleParcels_ReturnsAll()
    {
        var ids = new[] { 10001, 10002, 10003 };

        var results = await _adapter.GetPropertiesByIdsAsync(ids);

        results.Should().HaveCount(3);
        results.Select(r => r.PropId).Should().BeEquivalentTo(ids);
    }

    [Fact]
    public async Task GetPropertiesByIds_MixedExistingAndNonexistent_ReturnsOnlyExisting()
    {
        var ids = new[] { 10001, 99999, 10003 };

        var results = await _adapter.GetPropertiesByIdsAsync(ids);

        results.Should().HaveCount(2);
        results.Select(r => r.PropId).Should().Contain(10001).And.Contain(10003);
        results.Select(r => r.PropId).Should().NotContain(99999);
    }

    [Fact]
    public async Task GetPropertiesByIds_EmptyList_ReturnsEmpty()
    {
        var results = await _adapter.GetPropertiesByIdsAsync(Array.Empty<int>());

        results.Should().BeEmpty();
    }

    // ═══════════════════════════════════════════════════════════════
    // 7. County isolation: queries are scoped to single county
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public async Task AllProperties_BelongToBentonCounty_GeoIdPrefix()
    {
        // All seeded properties use Benton County geo_id prefix "1-0529"
        var paged = await _adapter.GetPropertiesAsync(page: 1, pageSize: 100);

        paged.Items.Should().NotBeEmpty();
        paged.Items.Should().AllSatisfy(p =>
            p.GeoId.Should().StartWith("1-0529",
                because: "all test data represents Benton County parcels"));
    }

    [Fact]
    public async Task AllProperties_SitusInBentonCountyCities()
    {
        var paged = await _adapter.GetPropertiesAsync(page: 1, pageSize: 100);
        var bentonCities = new[] { "Kennewick", "Richland", "West Richland", "Benton City", "Prosser" };

        paged.Items.Should().AllSatisfy(p =>
            bentonCities.Should().Contain(p.SitusCity,
                because: "property addresses should be within Benton County"));
    }

    // ═══════════════════════════════════════════════════════════════
    // 8. Read-only enforcement: no write operations exposed
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public void IPacsAdapter_ExposesNoWriteMethods()
    {
        // pacscontract.v1: "Write operations (read-only by default, writes require amendment)"
        var interfaceType = typeof(IPacsAdapter);
        var methods = interfaceType.GetMethods();

        // All methods should be query-oriented (Get*, Validate*)
        methods.Should().AllSatisfy(m =>
        {
            var name = m.Name;
            var isReadOnly = name.StartsWith("Get") || name.StartsWith("Validate");
            isReadOnly.Should().BeTrue(
                because: $"method '{name}' should be read-only per pacscontract.v1");
        });

        // Explicitly verify no write-like method names exist
        var writeIndicators = new[] { "Create", "Update", "Delete", "Insert", "Save", "Remove", "Set", "Put", "Post" };
        foreach (var indicator in writeIndicators)
        {
            methods.Should().NotContain(m => m.Name.StartsWith(indicator),
                because: $"IPacsAdapter must not expose '{indicator}*' methods per pacscontract.v1 read-only contract");
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // 9. Connection failure handling (mock throws, service degrades)
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public async Task ConnectionFailure_GetProperty_ThrowsPacsContractViolation()
    {
        var failingAdapter = new InMemoryPacsAdapter(simulateConnectionFailure: true);

        var act = () => failingAdapter.GetPropertyByIdAsync(10001);

        var ex = await act.Should().ThrowAsync<PacsContractViolationException>();
        ex.Which.ErrorCode.Should().Be(PacsErrorCodes.ConnectionFailed);
        ex.Which.Behavior.Should().Be("fail_closed");
    }

    [Fact]
    public async Task ConnectionFailure_GetConnectionStatus_ReturnsDegradedStatus()
    {
        var failingAdapter = new InMemoryPacsAdapter(simulateConnectionFailure: true);

        // GetConnectionStatus should degrade gracefully, not throw
        var status = await failingAdapter.GetConnectionStatusAsync();

        status.IsConnected.Should().BeFalse();
        status.ErrorCode.Should().Be(PacsErrorCodes.ConnectionFailed);
        status.ErrorMessage.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task ConnectionFailure_ValidateContract_ThrowsPacsContractViolation()
    {
        var failingAdapter = new InMemoryPacsAdapter(simulateConnectionFailure: true);

        var act = () => failingAdapter.ValidateContractAsync();

        await act.Should().ThrowAsync<PacsContractViolationException>();
    }

    // ═══════════════════════════════════════════════════════════════
    // 10. Null/empty parameter handling
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public async Task GetPropertyByGeoId_NullGeoId_ReturnsNull()
    {
        var result = await _adapter.GetPropertyByGeoIdAsync(null!);

        result.Should().BeNull();
    }

    [Fact]
    public async Task GetAssessmentHistory_NonexistentProperty_ReturnsEmptyList()
    {
        var results = await _adapter.GetAssessmentHistoryAsync(99999);

        results.Should().NotBeNull();
        results.Should().BeEmpty();
    }

    [Fact]
    public async Task GetChangedProperties_FutureDate_ReturnsEmpty()
    {
        var results = await _adapter.GetChangedPropertiesAsync(DateTime.UtcNow.AddYears(10));

        results.Should().BeEmpty();
    }

    [Fact]
    public async Task GetChangedProperties_PastDate_ReturnsAllModified()
    {
        var results = await _adapter.GetChangedPropertiesAsync(new DateTime(2020, 1, 1, 0, 0, 0, DateTimeKind.Utc));

        results.Should().HaveCount(3);
        // Should be ordered by LastModified ascending
        results[0].LastModified.Should().BeBefore(results[1].LastModified!.Value);
        results[1].LastModified.Should().BeBefore(results[2].LastModified!.Value);
    }

    [Fact]
    public async Task GetPropertiesAsync_Pagination_ReturnsCorrectPage()
    {
        var page1 = await _adapter.GetPropertiesAsync(page: 1, pageSize: 2);
        var page2 = await _adapter.GetPropertiesAsync(page: 2, pageSize: 2);

        page1.Items.Should().HaveCount(2);
        page1.Page.Should().Be(1);
        page1.PageSize.Should().Be(2);
        page1.TotalCount.Should().Be(3);
        page1.TotalPages.Should().Be(2);
        page1.HasMore.Should().BeTrue();

        page2.Items.Should().HaveCount(1);
        page2.HasMore.Should().BeFalse();

        // No overlap between pages
        page1.Items.Select(p => p.PropId)
            .Intersect(page2.Items.Select(p => p.PropId))
            .Should().BeEmpty();
    }
}
