using TerraFusion.Core.Counties;

namespace TerraFusion.Core.Import;

/// <summary>
/// Closed dataset vocabulary admitted by <c>wal.county-upload.csv-county-bound-intake.v1</c>.
/// This value is explicit and is never inferred from a file name, header, or content.
/// </summary>
public enum CountyCsvDataset
{
    Unspecified = 0,
    Parcels = 1,
    Sales = 2,
}

/// <summary>
/// Pure local-memory request. County authority must already be represented by canonical county
/// identity objects; raw request, route, header, body, tenant, or claim values are not accepted.
/// </summary>
public sealed record CountyCsvCountyBoundIntakeRequest(
    WashingtonCountyIdentity? ResourceCounty,
    WashingtonCountyIdentity? AuthorityCounty,
    CountyCsvDataset Dataset,
    CountyCsvIntakeDeclaration Declaration,
    ReadOnlyMemory<byte> Content);

/// <summary>
/// Immutable evidence of the exact county, dataset, and non-configurable authority posture used
/// for one protected CSV envelope admission.
/// </summary>
public sealed record CountyCsvCountyBinding(
    WashingtonCountyIdentity County,
    CountyCsvDataset Dataset,
    CountyDataMode DataMode,
    CountyDataExposure Exposure,
    CountyDataAction Action);

/// <summary>
/// County/dataset binding plus the immutable receipt returned by the protected CSV envelope.
/// </summary>
public sealed record CountyCsvCountyBoundIntakeReceipt(
    string ContractId,
    CountyCsvCountyBinding Binding,
    CountyCsvIntakeReceipt IntakeReceipt);

public enum CountyCsvCountyBoundIntakeErrorCode
{
    AuthorityDenied,
    UnsupportedDataset,
}

public sealed class CountyCsvCountyBoundIntakeException : InvalidOperationException
{
    public CountyCsvCountyBoundIntakeException(
        CountyCsvCountyBoundIntakeErrorCode errorCode,
        string message)
        : base(message)
    {
        ErrorCode = errorCode;
    }

    public CountyCsvCountyBoundIntakeErrorCode ErrorCode { get; }
}

/// <summary>
/// Local-memory contract <c>wal.county-upload.csv-county-bound-intake.v1</c>. It requires one
/// canonical same-county COUNTY_PROVIDED/PROTECTED/OPERATE decision before invoking the concrete
/// protected CSV envelope exactly once. It performs no authentication, transport, persistence,
/// promotion, activation, or production behavior.
/// </summary>
public sealed class CountyCsvCountyBoundIntake
{
    public const string ContractId = "wal.county-upload.csv-county-bound-intake.v1";

    private const CountyDataMode RequiredDataMode = CountyDataMode.CountyProvided;
    private const CountyDataExposure RequiredExposure = CountyDataExposure.Protected;
    private const CountyDataAction RequiredAction = CountyDataAction.Operate;

    private readonly CountyCsvIntakeEnvelope _envelope;

    public CountyCsvCountyBoundIntake(CountyCsvParserOptions parserOptions)
    {
        _envelope = new CountyCsvIntakeEnvelope(parserOptions);
    }

    public async Task<CountyCsvCountyBoundIntakeReceipt> AdmitAsync(
        CountyCsvCountyBoundIntakeRequest? request,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var boundaryRequest = request is null
            ? null
            : new CountyDataBoundaryRequest(
                request.ResourceCounty,
                request.AuthorityCounty,
                RequiredDataMode,
                RequiredExposure,
                RequiredAction);

        if (CountyDataAuthorityBoundary.Evaluate(boundaryRequest)
                != CountyDataBoundaryDecision.Allowed
            || !TryGetCanonicalCounty(request!.ResourceCounty, out var canonicalCounty))
        {
            throw new CountyCsvCountyBoundIntakeException(
                CountyCsvCountyBoundIntakeErrorCode.AuthorityDenied,
                "County CSV intake authority is denied.");
        }

        if (request.Dataset is not CountyCsvDataset.Parcels and not CountyCsvDataset.Sales)
        {
            throw new CountyCsvCountyBoundIntakeException(
                CountyCsvCountyBoundIntakeErrorCode.UnsupportedDataset,
                "County CSV intake dataset is unsupported.");
        }

        var intakeReceipt = await _envelope
            .AdmitAsync(request.Declaration, request.Content, cancellationToken)
            .ConfigureAwait(false);

        return new CountyCsvCountyBoundIntakeReceipt(
            ContractId,
            new CountyCsvCountyBinding(
                canonicalCounty,
                request.Dataset,
                RequiredDataMode,
                RequiredExposure,
                RequiredAction),
            intakeReceipt);
    }

    private static bool TryGetCanonicalCounty(
        WashingtonCountyIdentity? candidate,
        out WashingtonCountyIdentity canonicalCounty)
    {
        foreach (var county in WashingtonCountyRegistry.Counties)
        {
            if (county == candidate)
            {
                canonicalCounty = county;
                return true;
            }
        }

        canonicalCounty = null!;
        return false;
    }
}
