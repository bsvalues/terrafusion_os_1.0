namespace TerraFusion.API.Services.Valuation.KernelContracts;

public enum KernelFailureMode
{
    ExecutableNotFound,
    ProcessStartFailure,
    InputLimitExceeded,
    OutputLimitExceeded,
    Cancellation,
    Timeout,
    ProvenanceFailure,
    NonZeroExit,
    InvalidJsonResponse,
    KernelReportedError
}
