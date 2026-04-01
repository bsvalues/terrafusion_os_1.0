using System.Linq;
using TerraFusion.API.Controllers;
using TerraFusion.Core.Services;
using Xunit;

namespace TerraFusion.Unit.Tests.Stage2;

[Trait("Category", "Stage2")]
public sealed class AppealWriteLaneGuardTests
{
    private static string[] GetConstructorParameterNames<T>()
    {
        return typeof(T)
            .GetConstructors()
            .SelectMany(c => c.GetParameters())
            .Select(p => p.ParameterType.Name)
            .ToArray();
    }

    [Fact]
    public void WriteLaneGuard_DaisAppealService_DoesNotReferenceForgeWriteServices()
    {
        var paramNames = GetConstructorParameterNames<AppealService>();

        Assert.DoesNotContain(paramNames, p =>
            p.Contains("Forge") ||
            p.Contains("Valuation") ||
            p.Contains("CostForge") ||
            p.Contains("Regression") ||
            p.Contains("MarketAnalysis"));
    }

    [Fact]
    public void WriteLaneGuard_DaisAppealService_DoesNotReferenceDossierWriteServices()
    {
        var paramNames = GetConstructorParameterNames<AppealService>();

        Assert.DoesNotContain(paramNames, p =>
            p.Contains("Dossier") ||
            p.Contains("Document") ||
            p.Contains("Evidence") ||
            p.Contains("Packet") ||
            p.Contains("Narrative"));
    }

    [Fact]
    public void WriteLaneGuard_CrossLaneMutation_AttemptIsDenied_AndTraceIsRequired()
    {
        var controllerParamNames = GetConstructorParameterNames<DaisController>();

        Assert.Contains(controllerParamNames, p => p.Contains(nameof(IAppealService)));
        Assert.Contains(controllerParamNames, p => p.Contains("IGovernedToolAuditService"));

        Assert.DoesNotContain(controllerParamNames, p =>
            p.Contains("Forge") ||
            p.Contains("Valuation") ||
            p.Contains("CostForge") ||
            p.Contains("Dossier") ||
            p.Contains("Document") ||
            p.Contains("Evidence") ||
            p.Contains("Packet"));
    }
}
