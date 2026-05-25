using TerraFusion.Modules.CurrentUse.AI;
using Xunit;

namespace TerraFusion.Modules.CurrentUse.Tests;

public sealed class CurrentUseAiGuardrailsTests
{
    [Fact]
    public void Forbidden_Action_Is_Blocked()
    {
        Assert.Throws<InvalidOperationException>(() =>
            CurrentUseAiGuardrails.AssertAllowed("APPROVE_CLASSIFICATION"));
    }

    [Fact]
    public void Explain_Action_Is_Allowed()
    {
        CurrentUseAiGuardrails.AssertAllowed("ExplainCalculation");
    }
}
