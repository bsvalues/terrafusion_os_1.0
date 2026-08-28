using TerraFusion.Core.Counties;
using Xunit;

namespace TerraFusion.Unit.Tests.Counties;

public sealed class CountyDataAuthorityBoundaryTests
{
    private static readonly WashingtonCountyIdentity Benton = Resolve("Benton");
    private static readonly WashingtonCountyIdentity Franklin = Resolve("Franklin");

    [Theory]
    [MemberData(nameof(SupportedDecisionMatrix))]
    public void Evaluate_enforces_the_complete_supported_decision_matrix(
        CountyDataMode mode,
        CountyDataExposure exposure,
        CountyDataAction action,
        AuthorityCase authorityCase,
        CountyDataBoundaryDecision expected)
    {
        var authority = authorityCase switch
        {
            AuthorityCase.Absent => null,
            AuthorityCase.SameCounty => Benton,
            AuthorityCase.OtherCounty => Franklin,
            _ => throw new InvalidOperationException("Unknown test authority case."),
        };
        var request = new CountyDataBoundaryRequest(Benton, authority, mode, exposure, action);

        var decision = CountyDataAuthorityBoundary.Evaluate(request);

        Assert.Equal(expected, decision);
    }

    public static IEnumerable<object[]> SupportedDecisionMatrix()
    {
        var modes = new[]
        {
            CountyDataMode.Public,
            CountyDataMode.CountyProvided,
            CountyDataMode.Connected,
        };
        var exposures = new[]
        {
            CountyDataExposure.Public,
            CountyDataExposure.Protected,
        };
        var actions = new[]
        {
            CountyDataAction.Read,
            CountyDataAction.Operate,
        };
        var authorityCases = new[]
        {
            AuthorityCase.Absent,
            AuthorityCase.SameCounty,
            AuthorityCase.OtherCounty,
        };

        foreach (var mode in modes)
        {
            foreach (var exposure in exposures)
            {
                foreach (var action in actions)
                {
                    foreach (var authorityCase in authorityCases)
                    {
                        var explicitlyPublicRead =
                            exposure == CountyDataExposure.Public
                            && action == CountyDataAction.Read;
                        var sameCounty = authorityCase == AuthorityCase.SameCounty;
                        var anonymousPublicRead =
                            explicitlyPublicRead && authorityCase == AuthorityCase.Absent;
                        var expected = anonymousPublicRead || sameCounty
                            ? CountyDataBoundaryDecision.Allowed
                            : CountyDataBoundaryDecision.Denied;

                        yield return new object[]
                        {
                            mode,
                            exposure,
                            action,
                            authorityCase,
                            expected,
                        };
                    }
                }
            }
        }
    }

    [Fact]
    public void Evaluate_denies_absent_or_noncanonical_resource_identity()
    {
        var forged = Benton with { FipsCode = "53099" };
        var requests = new CountyDataBoundaryRequest?[]
        {
            null,
            new(null, Benton, CountyDataMode.Public, CountyDataExposure.Public, CountyDataAction.Read),
            new(forged, Benton, CountyDataMode.Public, CountyDataExposure.Public, CountyDataAction.Read),
        };

        Assert.All(
            requests,
            request => Assert.Equal(
                CountyDataBoundaryDecision.Denied,
                CountyDataAuthorityBoundary.Evaluate(request)));
    }

    [Fact]
    public void Evaluate_denies_noncanonical_authority_even_for_public_read()
    {
        var forgedAuthority = Benton with { Name = "Benton County" };
        var request = new CountyDataBoundaryRequest(
            Benton,
            forgedAuthority,
            CountyDataMode.Public,
            CountyDataExposure.Public,
            CountyDataAction.Read);

        Assert.Equal(
            CountyDataBoundaryDecision.Denied,
            CountyDataAuthorityBoundary.Evaluate(request));
    }

    [Theory]
    [InlineData(CountyDataMode.Unspecified)]
    [InlineData((CountyDataMode)(-1))]
    [InlineData((CountyDataMode)int.MaxValue)]
    public void Evaluate_denies_unknown_data_modes(CountyDataMode mode)
    {
        var request = PublicRead(mode: mode);

        Assert.Equal(
            CountyDataBoundaryDecision.Denied,
            CountyDataAuthorityBoundary.Evaluate(request));
    }

    [Theory]
    [InlineData(CountyDataExposure.Unspecified)]
    [InlineData((CountyDataExposure)(-1))]
    [InlineData((CountyDataExposure)int.MaxValue)]
    public void Evaluate_denies_unknown_exposures(CountyDataExposure exposure)
    {
        var request = PublicRead(exposure: exposure);

        Assert.Equal(
            CountyDataBoundaryDecision.Denied,
            CountyDataAuthorityBoundary.Evaluate(request));
    }

    [Theory]
    [InlineData(CountyDataAction.Unspecified)]
    [InlineData((CountyDataAction)(-1))]
    [InlineData((CountyDataAction)int.MaxValue)]
    public void Evaluate_denies_unknown_actions(CountyDataAction action)
    {
        var request = PublicRead(action: action);

        Assert.Equal(
            CountyDataBoundaryDecision.Denied,
            CountyDataAuthorityBoundary.Evaluate(request));
    }

    [Fact]
    public void Official_adoption_is_not_a_supported_data_mode()
    {
        var parsed = Enum.TryParse<CountyDataMode>(
            "OFFICIAL_TERRAFUSION_ADOPTION",
            ignoreCase: true,
            out _);

        Assert.False(parsed);
    }

    [Fact]
    public void Every_refusal_is_the_same_data_free_decision()
    {
        var denied = new[]
        {
            CountyDataAuthorityBoundary.Evaluate(null),
            CountyDataAuthorityBoundary.Evaluate(
                new CountyDataBoundaryRequest(
                    Benton,
                    null,
                    CountyDataMode.Connected,
                    CountyDataExposure.Protected,
                    CountyDataAction.Read)),
            CountyDataAuthorityBoundary.Evaluate(
                new CountyDataBoundaryRequest(
                    Benton,
                    Franklin,
                    CountyDataMode.CountyProvided,
                    CountyDataExposure.Public,
                    CountyDataAction.Operate)),
            CountyDataAuthorityBoundary.Evaluate(PublicRead(mode: (CountyDataMode)99)),
        };

        Assert.All(denied, decision => Assert.Equal(CountyDataBoundaryDecision.Denied, decision));
        Assert.Equal(new[] { "Denied", "Allowed" }, Enum.GetNames<CountyDataBoundaryDecision>());
        Assert.DoesNotContain("Benton", CountyDataBoundaryDecision.Denied.ToString());
        Assert.DoesNotContain("Franklin", CountyDataBoundaryDecision.Denied.ToString());
    }

    private static CountyDataBoundaryRequest PublicRead(
        CountyDataMode mode = CountyDataMode.Public,
        CountyDataExposure exposure = CountyDataExposure.Public,
        CountyDataAction action = CountyDataAction.Read) =>
        new(Benton, null, mode, exposure, action);

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
