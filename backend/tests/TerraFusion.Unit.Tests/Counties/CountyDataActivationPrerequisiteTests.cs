using TerraFusion.Core.Counties;
using Xunit;

namespace TerraFusion.Unit.Tests.Counties;

public sealed class CountyDataActivationPrerequisiteTests
{
    private static readonly WashingtonCountyIdentity Benton = Resolve("Benton");
    private static readonly WashingtonCountyIdentity Franklin = Resolve("Franklin");

    [Theory]
    [MemberData(nameof(SupportedAuthorityMatrix))]
    public void Evaluate_enforces_the_supported_mode_and_authority_matrix(
        CountyDataMode mode,
        AuthorityCase authorityCase,
        CountyDataActivationPrerequisiteDecision expected)
    {
        var authority = authorityCase switch
        {
            AuthorityCase.Absent => null,
            AuthorityCase.SameCounty => Benton,
            AuthorityCase.OtherCounty => Franklin,
            _ => throw new InvalidOperationException("Unknown authority case."),
        };
        var request = new CountyDataActivationPrerequisiteRequest(
            Benton,
            authority,
            mode,
            CompleteEvidence(mode));

        var decision = CountyDataActivationPrerequisite.Evaluate(request);

        Assert.Equal(expected, decision);
    }

    public static IEnumerable<object[]> SupportedAuthorityMatrix()
    {
        foreach (var mode in SupportedModes())
        {
            foreach (var authorityCase in Enum.GetValues<AuthorityCase>())
            {
                var expected = mode == CountyDataMode.Public
                    ? authorityCase is AuthorityCase.Absent or AuthorityCase.SameCounty
                    : authorityCase == AuthorityCase.SameCounty;
                yield return new object[]
                {
                    mode,
                    authorityCase,
                    expected
                        ? CountyDataActivationPrerequisiteDecision.Satisfied
                        : CountyDataActivationPrerequisiteDecision.NotSatisfied,
                };
            }
        }
    }

    [Theory]
    [MemberData(nameof(MissingFactCases))]
    public void Evaluate_denies_each_independently_missing_mode_fact(
        CountyDataMode mode,
        CountyDataActivationEvidence evidence)
    {
        var request = SatisfiableRequest(mode, evidence);

        Assert.Equal(
            CountyDataActivationPrerequisiteDecision.NotSatisfied,
            CountyDataActivationPrerequisite.Evaluate(request));
    }

    public static IEnumerable<object[]> MissingFactCases()
    {
        yield return Case(
            CountyDataMode.Public,
            new PublicCountyDataActivationEvidence(false, true, true));
        yield return Case(
            CountyDataMode.Public,
            new PublicCountyDataActivationEvidence(true, false, true));
        yield return Case(
            CountyDataMode.Public,
            new PublicCountyDataActivationEvidence(true, true, false));

        yield return Case(
            CountyDataMode.CountyProvided,
            new CountyProvidedDataActivationEvidence(
                false,
                true,
                CountyProvidedQuarantineDisposition.NotRequired,
                true,
                true));
        yield return Case(
            CountyDataMode.CountyProvided,
            new CountyProvidedDataActivationEvidence(
                true,
                false,
                CountyProvidedQuarantineDisposition.NotRequired,
                true,
                true));
        yield return Case(
            CountyDataMode.CountyProvided,
            new CountyProvidedDataActivationEvidence(
                true,
                true,
                CountyProvidedQuarantineDisposition.Unspecified,
                true,
                true));
        yield return Case(
            CountyDataMode.CountyProvided,
            new CountyProvidedDataActivationEvidence(
                true,
                true,
                CountyProvidedQuarantineDisposition.NotRequired,
                false,
                true));
        yield return Case(
            CountyDataMode.CountyProvided,
            new CountyProvidedDataActivationEvidence(
                true,
                true,
                CountyProvidedQuarantineDisposition.NotRequired,
                true,
                false));

        yield return Case(
            CountyDataMode.Connected,
            new ConnectedCountyDataActivationEvidence(false, true, true, true));
        yield return Case(
            CountyDataMode.Connected,
            new ConnectedCountyDataActivationEvidence(true, false, true, true));
        yield return Case(
            CountyDataMode.Connected,
            new ConnectedCountyDataActivationEvidence(true, true, false, true));
        yield return Case(
            CountyDataMode.Connected,
            new ConnectedCountyDataActivationEvidence(true, true, true, false));
    }

    [Theory]
    [InlineData(CountyProvidedQuarantineDisposition.NotRequired, true)]
    [InlineData(CountyProvidedQuarantineDisposition.Completed, true)]
    [InlineData(CountyProvidedQuarantineDisposition.Unspecified, false)]
    [InlineData((CountyProvidedQuarantineDisposition)(-1), false)]
    [InlineData((CountyProvidedQuarantineDisposition)int.MaxValue, false)]
    public void Evaluate_requires_an_explicit_supported_quarantine_disposition(
        CountyProvidedQuarantineDisposition disposition,
        bool expectedSatisfied)
    {
        var evidence = new CountyProvidedDataActivationEvidence(
            true,
            true,
            disposition,
            true,
            true);
        var request = SatisfiableRequest(CountyDataMode.CountyProvided, evidence);

        Assert.Equal(
            expectedSatisfied
                ? CountyDataActivationPrerequisiteDecision.Satisfied
                : CountyDataActivationPrerequisiteDecision.NotSatisfied,
            CountyDataActivationPrerequisite.Evaluate(request));
    }

    [Theory]
    [MemberData(nameof(MismatchedEvidenceCases))]
    public void Evaluate_denies_every_mode_and_evidence_mismatch(
        CountyDataMode mode,
        CountyDataActivationEvidence evidence)
    {
        var request = SatisfiableRequest(mode, evidence);

        Assert.Equal(
            CountyDataActivationPrerequisiteDecision.NotSatisfied,
            CountyDataActivationPrerequisite.Evaluate(request));
    }

    public static IEnumerable<object[]> MismatchedEvidenceCases()
    {
        foreach (var mode in SupportedModes())
        {
            foreach (var evidenceMode in SupportedModes().Where(candidate => candidate != mode))
            {
                yield return Case(mode, CompleteEvidence(evidenceMode));
            }
        }
    }

    [Fact]
    public void Evaluate_denies_null_or_noncanonical_identity_and_evidence()
    {
        var forgedResource = Benton with { FipsCode = "53099" };
        var forgedAuthority = Benton with { Name = "Benton County" };
        var requests = new CountyDataActivationPrerequisiteRequest?[]
        {
            null,
            new(Benton, null, CountyDataMode.Public, null),
            new(null, null, CountyDataMode.Public, CompleteEvidence(CountyDataMode.Public)),
            new(forgedResource, null, CountyDataMode.Public, CompleteEvidence(CountyDataMode.Public)),
            new(Benton, forgedAuthority, CountyDataMode.Public, CompleteEvidence(CountyDataMode.Public)),
            new(
                Benton,
                Franklin,
                CountyDataMode.Connected,
                CompleteEvidence(CountyDataMode.Connected)),
        };

        Assert.All(
            requests,
            request => Assert.Equal(
                CountyDataActivationPrerequisiteDecision.NotSatisfied,
                CountyDataActivationPrerequisite.Evaluate(request)));
    }

    [Theory]
    [InlineData(CountyDataMode.Unspecified)]
    [InlineData((CountyDataMode)(-1))]
    [InlineData((CountyDataMode)int.MaxValue)]
    public void Evaluate_denies_unspecified_or_unknown_modes(CountyDataMode mode)
    {
        var request = new CountyDataActivationPrerequisiteRequest(
            Benton,
            Benton,
            mode,
            CompleteEvidence(CountyDataMode.Public));

        Assert.Equal(
            CountyDataActivationPrerequisiteDecision.NotSatisfied,
            CountyDataActivationPrerequisite.Evaluate(request));
    }

    [Fact]
    public void Official_adoption_is_not_representable()
    {
        Assert.False(
            Enum.TryParse<CountyDataMode>(
                "OFFICIAL_TERRAFUSION_ADOPTION",
                ignoreCase: true,
                out _));
    }

    [Fact]
    public void Every_canonical_county_can_satisfy_complete_mode_prerequisites()
    {
        Assert.Equal(39, WashingtonCountyRegistry.Counties.Count);

        foreach (var county in WashingtonCountyRegistry.Counties)
        {
            foreach (var mode in SupportedModes())
            {
                var authority = mode == CountyDataMode.Public ? null : county;
                var request = new CountyDataActivationPrerequisiteRequest(
                    county,
                    authority,
                    mode,
                    CompleteEvidence(mode));

                Assert.Equal(
                    CountyDataActivationPrerequisiteDecision.Satisfied,
                    CountyDataActivationPrerequisite.Evaluate(request));
            }
        }
    }

    [Fact]
    public void Evidence_and_request_records_are_immutable_and_evaluation_is_pure()
    {
        var evidence = new PublicCountyDataActivationEvidence(true, true, true);
        var request = new CountyDataActivationPrerequisiteRequest(
            Benton,
            null,
            CountyDataMode.Public,
            evidence);
        var changedEvidence = evidence with { FreshnessObserved = false };
        var changedRequest = request with { Evidence = changedEvidence };

        Assert.NotSame(evidence, changedEvidence);
        Assert.NotSame(request, changedRequest);
        Assert.True(evidence.FreshnessObserved);
        Assert.Equal(
            CountyDataActivationPrerequisiteDecision.Satisfied,
            CountyDataActivationPrerequisite.Evaluate(request));
        Assert.Equal(
            CountyDataActivationPrerequisiteDecision.Satisfied,
            CountyDataActivationPrerequisite.Evaluate(request));
        Assert.Equal(
            CountyDataActivationPrerequisiteDecision.NotSatisfied,
            CountyDataActivationPrerequisite.Evaluate(changedRequest));
    }

    [Fact]
    public void Refusal_is_one_data_free_value_and_contract_identity_is_exact()
    {
        var denied = new[]
        {
            CountyDataActivationPrerequisite.Evaluate(null),
            CountyDataActivationPrerequisite.Evaluate(
                SatisfiableRequest(
                    CountyDataMode.Public,
                    new PublicCountyDataActivationEvidence(false, true, true))),
            CountyDataActivationPrerequisite.Evaluate(
                new CountyDataActivationPrerequisiteRequest(
                    Benton,
                    Franklin,
                    CountyDataMode.Connected,
                    CompleteEvidence(CountyDataMode.Connected))),
        };

        Assert.Equal(
            "wal.county-data-activation-prerequisite.v1",
            CountyDataActivationPrerequisite.ContractId);
        Assert.All(
            denied,
            decision => Assert.Equal(
                CountyDataActivationPrerequisiteDecision.NotSatisfied,
                decision));
        Assert.Equal(
            new[] { "NotSatisfied", "Satisfied" },
            Enum.GetNames<CountyDataActivationPrerequisiteDecision>());
        Assert.DoesNotContain("Benton", CountyDataActivationPrerequisiteDecision.NotSatisfied.ToString());
        Assert.DoesNotContain("Franklin", CountyDataActivationPrerequisiteDecision.NotSatisfied.ToString());
        Assert.DoesNotContain("Activated", string.Join(',', Enum.GetNames<CountyDataActivationPrerequisiteDecision>()));
    }

    private static CountyDataActivationPrerequisiteRequest SatisfiableRequest(
        CountyDataMode mode,
        CountyDataActivationEvidence evidence) =>
        new(
            Benton,
            mode == CountyDataMode.Public ? null : Benton,
            mode,
            evidence);

    private static CountyDataActivationEvidence CompleteEvidence(CountyDataMode mode) =>
        mode switch
        {
            CountyDataMode.Public => new PublicCountyDataActivationEvidence(true, true, true),
            CountyDataMode.CountyProvided => new CountyProvidedDataActivationEvidence(
                true,
                true,
                CountyProvidedQuarantineDisposition.NotRequired,
                true,
                true),
            CountyDataMode.Connected => new ConnectedCountyDataActivationEvidence(
                true,
                true,
                true,
                true),
            _ => throw new InvalidOperationException("Unsupported test data mode."),
        };

    private static IEnumerable<CountyDataMode> SupportedModes() =>
        new[]
        {
            CountyDataMode.Public,
            CountyDataMode.CountyProvided,
            CountyDataMode.Connected,
        };

    private static object[] Case(
        CountyDataMode mode,
        CountyDataActivationEvidence evidence) =>
        new object[] { mode, evidence };

    private static WashingtonCountyIdentity Resolve(string value)
    {
        Assert.True(WashingtonCountyRegistry.TryResolve(value, out var county));
        return county;
    }

    public enum AuthorityCase
    {
        Absent,
        SameCounty,
        OtherCounty,
    }
}
