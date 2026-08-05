namespace TerraFusion.API.Services.Valuation.KernelContracts;

/// <summary>Caller-owned identity for one kernel invocation.</summary>
public sealed record KernelExecutionContext(string RequestId)
{
    public static KernelExecutionContext Create(string requestId)
    {
        if (requestId is not { Length: >= 1 and <= 128 }
            || requestId.Any(character =>
                !char.IsAsciiLetterOrDigit(character) && character is not '.' and not '_' and not '-'))
        {
            throw new InvalidOperationException(
                "Kernel request identity must be 1-128 safe ASCII characters.");
        }

        return new KernelExecutionContext(requestId);
    }
}
