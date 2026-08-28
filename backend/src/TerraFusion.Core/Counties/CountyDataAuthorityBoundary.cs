namespace TerraFusion.Core.Counties;

/// <summary>
/// Pre-adoption county data modes authorized by Washington Assessor Launch V1.
/// This mode describes data posture; it does not grant visibility or authority.
/// </summary>
public enum CountyDataMode
{
    Unspecified = 0,
    Public = 1,
    CountyProvided = 2,
    Connected = 3,
}

/// <summary>
/// Explicit exposure classification for a county-scoped resource.
/// </summary>
public enum CountyDataExposure
{
    Unspecified = 0,
    Public = 1,
    Protected = 2,
}

/// <summary>
/// The bounded action being evaluated. This is not a role or capability model.
/// </summary>
public enum CountyDataAction
{
    Unspecified = 0,
    Read = 1,
    Operate = 2,
}

/// <summary>
/// A deliberately data-free result. All refusal paths return the same value so the
/// boundary does not disclose county identity, target existence or mismatch details.
/// </summary>
public enum CountyDataBoundaryDecision
{
    Denied = 0,
    Allowed = 1,
}

/// <summary>
/// Pure input to the county data authority boundary. County identities must be canonical
/// <see cref="WashingtonCountyIdentity"/> values, never raw request or claim strings.
/// </summary>
public sealed record CountyDataBoundaryRequest(
    WashingtonCountyIdentity? ResourceCounty,
    WashingtonCountyIdentity? AuthorityCounty,
    CountyDataMode DataMode,
    CountyDataExposure Exposure,
    CountyDataAction Action);

/// <summary>
/// Evaluates the necessary county-scope boundary for a data action. An allowed result is
/// not sufficient authorization; callers must still enforce authentication, roles,
/// capabilities, activation state and all resource-specific policy.
/// </summary>
public static class CountyDataAuthorityBoundary
{
    public static CountyDataBoundaryDecision Evaluate(CountyDataBoundaryRequest? request)
    {
        if (request is null
            || !IsCanonical(request.ResourceCounty)
            || !IsSupported(request.DataMode)
            || !IsSupported(request.Exposure)
            || !IsSupported(request.Action))
        {
            return CountyDataBoundaryDecision.Denied;
        }

        if (request.AuthorityCounty is not null && !IsCanonical(request.AuthorityCounty))
        {
            return CountyDataBoundaryDecision.Denied;
        }

        if (request.AuthorityCounty is not null
            && request.AuthorityCounty != request.ResourceCounty)
        {
            return CountyDataBoundaryDecision.Denied;
        }

        if (request.Action == CountyDataAction.Read
            && request.Exposure == CountyDataExposure.Public)
        {
            return CountyDataBoundaryDecision.Allowed;
        }

        return request.AuthorityCounty == request.ResourceCounty
            ? CountyDataBoundaryDecision.Allowed
            : CountyDataBoundaryDecision.Denied;
    }

    private static bool IsCanonical(WashingtonCountyIdentity? county)
    {
        if (county is null)
        {
            return false;
        }

        foreach (var canonicalCounty in WashingtonCountyRegistry.Counties)
        {
            if (canonicalCounty == county)
            {
                return true;
            }
        }

        return false;
    }

    private static bool IsSupported(CountyDataMode mode) =>
        mode is CountyDataMode.Public
            or CountyDataMode.CountyProvided
            or CountyDataMode.Connected;

    private static bool IsSupported(CountyDataExposure exposure) =>
        exposure is CountyDataExposure.Public or CountyDataExposure.Protected;

    private static bool IsSupported(CountyDataAction action) =>
        action is CountyDataAction.Read or CountyDataAction.Operate;
}
