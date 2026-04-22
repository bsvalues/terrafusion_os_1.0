namespace TerraFusion.API.Services.Valuation.KernelContracts;

public enum KernelFailureMode
{
    ExecutableNotFound,
    Timeout,
    NonZeroExit,
    InvalidJsonResponse,
    KernelReportedError
}
