namespace TerraFusion.Core.Counties;

/// <summary>
/// A data-free prerequisite result. Satisfied means only that the explicitly supplied facts pass
/// this predicate; it does not mean a data mode or capability was activated.
/// </summary>
public enum CountyDataActivationPrerequisiteDecision
{
    NotSatisfied = 0,
    Satisfied = 1,
}

/// <summary>
/// Explicit quarantine disposition for county-provided input. Unspecified and unknown values fail
/// closed; NotRequired and Completed are the only satisfied dispositions.
/// </summary>
public enum CountyProvidedQuarantineDisposition
{
    Unspecified = 0,
    NotRequired = 1,
    Completed = 2,
}

/// <summary>
/// Marker for one closed, mode-specific set of data-free prerequisite facts.
/// </summary>
public abstract record CountyDataActivationEvidence
{
    private protected CountyDataActivationEvidence()
    {
    }
}

public sealed record PublicCountyDataActivationEvidence(
    bool UsablePublicBaselineObserved,
    bool ProvenanceObserved,
    bool FreshnessObserved) : CountyDataActivationEvidence;

public sealed record CountyProvidedDataActivationEvidence(
    bool UploadValidated,
    bool MappingCompleted,
    CountyProvidedQuarantineDisposition QuarantineDisposition,
    bool LineageBound,
    bool TerraFusionCountyScopedPromotionObserved) : CountyDataActivationEvidence;

public sealed record ConnectedCountyDataActivationEvidence(
    bool SourceAuthorizationObserved,
    bool ExternalSourceReadOnlyBoundaryObserved,
    bool SyncReadObserved,
    bool TerraFusionCountyScopedRefreshObserved) : CountyDataActivationEvidence;

/// <summary>
/// Pure input to the activation-prerequisite predicate. County identities must already be canonical
/// <see cref="WashingtonCountyIdentity"/> values; raw request or claim strings are never accepted.
/// </summary>
public sealed record CountyDataActivationPrerequisiteRequest(
    WashingtonCountyIdentity? ResourceCounty,
    WashingtonCountyIdentity? AuthorityCounty,
    CountyDataMode DataMode,
    CountyDataActivationEvidence? Evidence);

/// <summary>
/// Evaluates contract <c>wal.county-data-activation-prerequisite.v1</c> using only explicit,
/// caller-supplied facts and the protected county authority boundary. This class has no activation
/// state and performs no I/O or evidence discovery.
/// </summary>
public static class CountyDataActivationPrerequisite
{
    public const string ContractId = "wal.county-data-activation-prerequisite.v1";

    public static CountyDataActivationPrerequisiteDecision Evaluate(
        CountyDataActivationPrerequisiteRequest? request)
    {
        if (request is null || request.Evidence is null)
        {
            return CountyDataActivationPrerequisiteDecision.NotSatisfied;
        }

        var boundaryRequest = request.DataMode switch
        {
            CountyDataMode.Public => new CountyDataBoundaryRequest(
                request.ResourceCounty,
                request.AuthorityCounty,
                CountyDataMode.Public,
                CountyDataExposure.Public,
                CountyDataAction.Read),
            CountyDataMode.CountyProvided => new CountyDataBoundaryRequest(
                request.ResourceCounty,
                request.AuthorityCounty,
                CountyDataMode.CountyProvided,
                CountyDataExposure.Protected,
                CountyDataAction.Operate),
            CountyDataMode.Connected => new CountyDataBoundaryRequest(
                request.ResourceCounty,
                request.AuthorityCounty,
                CountyDataMode.Connected,
                CountyDataExposure.Protected,
                CountyDataAction.Operate),
            _ => null,
        };

        if (boundaryRequest is null
            || CountyDataAuthorityBoundary.Evaluate(boundaryRequest)
                != CountyDataBoundaryDecision.Allowed)
        {
            return CountyDataActivationPrerequisiteDecision.NotSatisfied;
        }

        var factsSatisfied = (request.DataMode, request.Evidence) switch
        {
            (CountyDataMode.Public, PublicCountyDataActivationEvidence evidence) =>
                evidence.UsablePublicBaselineObserved
                && evidence.ProvenanceObserved
                && evidence.FreshnessObserved,
            (CountyDataMode.CountyProvided, CountyProvidedDataActivationEvidence evidence) =>
                evidence.UploadValidated
                && evidence.MappingCompleted
                && IsSatisfied(evidence.QuarantineDisposition)
                && evidence.LineageBound
                && evidence.TerraFusionCountyScopedPromotionObserved,
            (CountyDataMode.Connected, ConnectedCountyDataActivationEvidence evidence) =>
                evidence.SourceAuthorizationObserved
                && evidence.ExternalSourceReadOnlyBoundaryObserved
                && evidence.SyncReadObserved
                && evidence.TerraFusionCountyScopedRefreshObserved,
            _ => false,
        };

        return factsSatisfied
            ? CountyDataActivationPrerequisiteDecision.Satisfied
            : CountyDataActivationPrerequisiteDecision.NotSatisfied;
    }

    private static bool IsSatisfied(CountyProvidedQuarantineDisposition disposition) =>
        disposition is CountyProvidedQuarantineDisposition.NotRequired
            or CountyProvidedQuarantineDisposition.Completed;
}
