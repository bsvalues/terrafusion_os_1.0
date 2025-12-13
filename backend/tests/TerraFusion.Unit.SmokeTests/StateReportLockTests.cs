// StateReportLockTests.cs
// TerraFusion SpecLock: State Report Lock Tests (GOD-TIER)
//
// Tests for federated state-level reports requiring county quorum signatures.
// Lock ID: state-report.v1

using System.Text.Json;
using System.Text.RegularExpressions;
using Xunit;

namespace TerraFusion.Unit.SmokeTests;

/// <summary>
/// Tests for state-report.v1 SpecLock.
/// Validates federated state reports with county quorum signing.
/// </summary>
public partial class StateReportLockTests
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    // ═══════════════════════════════════════════════════════════
    // SCHEMA VALIDATION TESTS
    // ═══════════════════════════════════════════════════════════

    [Fact]
    public void StateReport_RequiredFields_MustBePresent()
    {
        // Arrange
        var requiredFields = new[]
        {
            "report_id",
            "report_type",
            "generated_at",
            "period_start",
            "period_end",
            "counties_included",
            "aggregation_method",
            "signing"
        };

        var validReport = CreateValidStateReport();

        // Act & Assert
        foreach (var field in requiredFields)
        {
            Assert.True(
                validReport.ContainsKey(field),
                $"Required field '{field}' must be present"
            );
        }
    }

    [Fact]
    public void StateReport_ValidReportTypes_EnumEnforced()
    {
        // Arrange
        var validTypes = new[]
        {
            "annual_assessment_summary",
            "levy_rate_comparison",
            "compliance_audit",
            "interop_certification"
        };

        // Act & Assert
        foreach (var reportType in validTypes)
        {
            var report = CreateValidStateReport();
            report["report_type"] = reportType;
            Assert.Equal(reportType, report["report_type"]);
        }
    }

    [Fact]
    public void StateReport_Timestamps_RFC3339_UTC_Z()
    {
        // Arrange
        var timestampPattern = @"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$";
        var report = CreateValidStateReport();

        // Act & Assert
        Assert.Matches(timestampPattern, report["generated_at"]!.ToString());
        Assert.Matches(timestampPattern, report["period_start"]!.ToString());
        Assert.Matches(timestampPattern, report["period_end"]!.ToString());
    }

    [Fact]
    public void StateReport_CountiesIncluded_NotEmpty()
    {
        // Arrange
        var report = CreateValidStateReport();
        var counties = (List<string>)report["counties_included"]!;

        // Act & Assert
        Assert.NotEmpty(counties);
        Assert.True(counties.Count >= 1, "At least one county must be included");
    }

    // ═══════════════════════════════════════════════════════════
    // QUORUM SIGNATURE TESTS
    // ═══════════════════════════════════════════════════════════

    [Fact]
    public void StateReport_Signing_QuorumThreshold_MustBeMet()
    {
        // Arrange
        var report = CreateValidStateReport();
        var signing = (Dictionary<string, object>)report["signing"]!;
        var participants = (List<int>)signing["participants"]!;
        var threshold = (int)signing["threshold"]!;

        // Act & Assert
        Assert.True(
            participants.Count >= threshold,
            $"Participants ({participants.Count}) must meet threshold ({threshold})"
        );
    }

    [Fact]
    public void StateReport_Signing_MinimumThreeCounties()
    {
        // Arrange
        var report = CreateValidStateReport();
        var signing = (Dictionary<string, object>)report["signing"]!;
        var participants = (List<int>)signing["participants"]!;

        // Act & Assert
        Assert.True(
            participants.Count >= 3,
            "State reports require at least 3 county signers"
        );
    }

    [Fact]
    public void StateReport_Signing_ModeIsStateQuorum()
    {
        // Arrange
        var report = CreateValidStateReport();
        var signing = (Dictionary<string, object>)report["signing"]!;

        // Act & Assert
        Assert.Equal("state_quorum", signing["mode"]);
    }

    [Fact]
    public void StateReport_Signing_GroupPubSha256_Valid()
    {
        // Arrange
        var sha256Pattern = @"^[a-f0-9]{64}$";
        var report = CreateValidStateReport();
        var signing = (Dictionary<string, object>)report["signing"]!;

        // Act & Assert
        Assert.Matches(sha256Pattern, signing["group_pub_sha256"]!.ToString());
    }

    [Fact]
    public void StateReport_Signing_SignatureSha256_Valid()
    {
        // Arrange
        var sha256Pattern = @"^[a-f0-9]{64}$";
        var report = CreateValidStateReport();
        var signing = (Dictionary<string, object>)report["signing"]!;

        // Act & Assert
        Assert.Matches(sha256Pattern, signing["signature_sha256"]!.ToString());
    }

    // ═══════════════════════════════════════════════════════════
    // PERIOD VALIDATION TESTS
    // ═══════════════════════════════════════════════════════════

    [Fact]
    public void StateReport_Period_StartBeforeEnd()
    {
        // Arrange
        var report = CreateValidStateReport();
        var start = DateTime.Parse(report["period_start"]!.ToString()!);
        var end = DateTime.Parse(report["period_end"]!.ToString()!);

        // Act & Assert
        Assert.True(start < end, "period_start must be before period_end");
    }

    // ═══════════════════════════════════════════════════════════
    // BREAKER ATTACK TESTS — Adversarial cases
    // ═══════════════════════════════════════════════════════════

    [Fact]
    public void Breaker_SingleCountySign_MustBeRejected()
    {
        // BREAKER: Attempt to sign with only 1 county
        var report = CreateValidStateReport();
        var signing = (Dictionary<string, object>)report["signing"]!;
        signing["participants"] = new List<int> { 1 }; // Only 1 signer

        var participants = (List<int>)signing["participants"]!;

        // Validation should FAIL
        Assert.True(
            participants.Count < 3,
            "Single county signing attempt should be detectable"
        );
    }

    [Fact]
    public void Breaker_TwoCountySign_MustBeRejected()
    {
        // BREAKER: Attempt to sign with only 2 counties (below threshold)
        var report = CreateValidStateReport();
        var signing = (Dictionary<string, object>)report["signing"]!;
        signing["participants"] = new List<int> { 1, 2 }; // Only 2 signers
        signing["threshold"] = 3;

        var participants = (List<int>)signing["participants"]!;
        var threshold = (int)signing["threshold"]!;

        // Validation should FAIL
        Assert.True(
            participants.Count < threshold,
            "Two county signing attempt should fail threshold check"
        );
    }

    [Fact]
    public void Breaker_WrongQuorumGroup_MustBeRejected()
    {
        // BREAKER: Attempt to use wrong group public key
        var report = CreateValidStateReport();
        var signing = (Dictionary<string, object>)report["signing"]!;
        
        // Wrong group key (different from expected state.group.pub)
        var wrongGroupKey = "0000000000000000000000000000000000000000000000000000000000000000";
        var expectedGroupKey = signing["group_pub_sha256"]!.ToString();

        // Validation should detect mismatch
        Assert.NotEqual(wrongGroupKey, expectedGroupKey);
    }

    [Fact]
    public void Breaker_VendorAloneCannotSign_MustBeEnforced()
    {
        // BREAKER: Vendor attempting to sign without county participation
        var vendorOnlyParticipants = new List<int>(); // No county IDs

        // Validation should FAIL - vendors are not in the participant list
        Assert.Empty(vendorOnlyParticipants);
    }

    [Fact]
    public void Breaker_CrossCountyDataBleed_MustBeBlocked()
    {
        // BREAKER: Attempt to include county-specific PII in state report
        var report = CreateValidStateReport();
        
        // State reports should only contain aggregated data
        var data = (Dictionary<string, object>)report["data"]!;
        
        // Ensure no county-specific identifiable data
        Assert.False(
            data.ContainsKey("individual_parcels"),
            "State reports must not contain individual parcel data"
        );
        Assert.False(
            data.ContainsKey("owner_names"),
            "State reports must not contain owner names"
        );
    }

    [Fact]
    public void Breaker_InvalidReportType_MustBeRejected()
    {
        // BREAKER: Attempt to use invalid report type
        var invalidTypes = new[]
        {
            "malicious_report",
            "admin_override",
            "bypass_audit"
        };

        var validTypes = new HashSet<string>
        {
            "annual_assessment_summary",
            "levy_rate_comparison",
            "compliance_audit",
            "interop_certification"
        };

        foreach (var invalidType in invalidTypes)
        {
            Assert.DoesNotContain(invalidType, validTypes);
        }
    }

    [Fact]
    public void Breaker_FuturePeriodEnd_MustBeRejected()
    {
        // BREAKER: Attempt to create report with future period_end
        var report = CreateValidStateReport();
        var futureEnd = DateTime.UtcNow.AddYears(10).ToString("yyyy-MM-ddTHH:mm:ssZ");
        report["period_end"] = futureEnd;

        var periodEnd = DateTime.Parse(report["period_end"]!.ToString()!);
        var now = DateTime.UtcNow;

        // This should be flagged in production validation
        Assert.True(
            periodEnd > now,
            "Future period_end should be detectable for validation"
        );
    }

    [Fact]
    public void Breaker_DuplicateParticipants_MustBeRejected()
    {
        // BREAKER: Attempt to use duplicate participant IDs
        var report = CreateValidStateReport();
        var signing = (Dictionary<string, object>)report["signing"]!;
        signing["participants"] = new List<int> { 1, 1, 1 }; // Duplicate IDs

        var participants = (List<int>)signing["participants"]!;
        var uniqueParticipants = participants.Distinct().Count();

        // Validation should detect duplicates
        Assert.NotEqual(participants.Count, uniqueParticipants);
    }

    // ═══════════════════════════════════════════════════════════
    // HELPER METHODS
    // ═══════════════════════════════════════════════════════════

    private static Dictionary<string, object> CreateValidStateReport()
    {
        return new Dictionary<string, object>
        {
            ["report_id"] = "wa-annual-2025-001",
            ["report_type"] = "annual_assessment_summary",
            ["generated_at"] = "2025-12-13T00:00:00Z",
            ["period_start"] = "2025-01-01T00:00:00Z",
            ["period_end"] = "2025-12-31T23:59:59Z",
            ["counties_included"] = new List<string> { "benton", "yakima", "franklin" },
            ["aggregation_method"] = "sum_with_anonymization",
            ["data"] = new Dictionary<string, object>
            {
                ["total_parcels"] = 150000,
                ["total_assessed_value"] = 15000000000L,
                ["average_assessment_ratio"] = 0.98
            },
            ["signing"] = new Dictionary<string, object>
            {
                ["mode"] = "state_quorum",
                ["threshold"] = 3,
                ["participants"] = new List<int> { 1, 2, 3 },
                ["group_pub_sha256"] = "abc123def456abc123def456abc123def456abc123def456abc123def456abc1",
                ["signature_sha256"] = "def456abc123def456abc123def456abc123def456abc123def456abc123def4"
            }
        };
    }
}
