// Wave 2 Contract Tests: Write-Lane Guard for GPTController
// Verifies via reflection that GPTController does NOT take Dais, Forge, or Dossier
// service interfaces in its constructor. Cross-suite writes from TerraGPT are prohibited.
//
// This is a static analysis test — no mocks or async needed.
// If any of these assertions fail, a cross-lane dependency was introduced.

using System.Linq;
using TerraFusion.API.Controllers;
using Xunit;

namespace TerraFusion.Unit.Tests.Wave2;

public sealed class GptWriteLaneGuardTests
{
    private static System.Collections.Generic.List<string> GetConstructorParamTypeNames()
    {
        var controllerType = typeof(GPTController);
        return controllerType.GetConstructors()
            .SelectMany(c => c.GetParameters())
            .Select(p => p.ParameterType.Name)
            .ToList();
    }

    // ── Dais lane guard ───────────────────────────────────────────────────────
    // Dais manages appeals, exemptions, certifications, notices, queue items.
    // GPTController must not inject any of these services.

    [Fact]
    public void GptController_Does_Not_Reference_DaisService()
    {
        var paramNames = GetConstructorParamTypeNames();

        Assert.DoesNotContain(paramNames, p =>
            p.Contains("Dais") ||
            p.Contains("Appeal") ||
            p.Contains("Exemption") ||
            p.Contains("Certification") ||
            p.Contains("Notice") ||
            p.Contains("QueueItem"));
    }

    // ── Forge lane guard ──────────────────────────────────────────────────────
    // Forge manages cost models, valuations, regression, mass appraisal.
    // GPTController must not inject any Forge-owned services.

    [Fact]
    public void GptController_Does_Not_Reference_ForgeService()
    {
        var paramNames = GetConstructorParamTypeNames();

        Assert.DoesNotContain(paramNames, p =>
            p.Contains("Forge") ||
            p.Contains("Valuation") ||
            p.Contains("CostModel") ||
            p.Contains("MassAppraisal") ||
            p.Contains("Regression") ||
            p.Contains("CostForge"));
    }

    // ── Dossier lane guard ────────────────────────────────────────────────────
    // Dossier manages property documents, narratives, reports.
    // GPTController must not inject any Dossier-owned services.

    [Fact]
    public void GptController_Does_Not_Reference_DossierService()
    {
        var paramNames = GetConstructorParamTypeNames();

        Assert.DoesNotContain(paramNames, p =>
            p.Contains("Dossier") ||
            p.Contains("Narrative") ||
            p.Contains("PropertyDocument") ||
            p.Contains("ReportGen"));
    }

    // ── Atlas lane guard ──────────────────────────────────────────────────────
    // ISystemGptAtlasService IS allowed (it's the GPT atlas, not the property atlas).
    // The property Atlas suite services are off-limits.

    [Fact]
    public void GptController_Atlas_References_Are_Gpt_Atlas_Only()
    {
        var controllerType = typeof(GPTController);
        var paramTypes = controllerType.GetConstructors()
            .SelectMany(c => c.GetParameters())
            .Select(p => p.ParameterType)
            .ToList();

        // Allowed: ISystemGptAtlasService and ISystemGptAtlasLiveService (from TerraFusion.AI)
        // Not allowed: IAtlasPropertyService, ISchoolDistrictService, IGeoEquityService etc.
        foreach (var t in paramTypes.Where(t => t.Name.Contains("Atlas")))
        {
            Assert.True(
                t.Namespace?.StartsWith("TerraFusion.AI") == true,
                $"Atlas service {t.FullName} is not from TerraFusion.AI namespace — possible cross-lane reference");
        }
    }

    // ── Positive guard: GPT-owned services ARE present ────────────────────────
    // Verifies the required services are still in the constructor (smoke test).

    [Fact]
    public void GptController_Has_Required_Gpt_Services()
    {
        var paramNames = GetConstructorParamTypeNames();

        // These three are required (non-nullable in constructor)
        Assert.Contains(paramNames, p => p.Contains("IGPTConfigurationService"));
        Assert.Contains(paramNames, p => p.Contains("IGPTOrchestrationService"));
        Assert.Contains(paramNames, p => p.Contains("IRAGService"));
    }

    // ── Total parameter count guard ───────────────────────────────────────────
    // Detects if someone added a service to the constructor without review.
    // Current count: 17 (3 required + 13 optional + ILogger).
    // If this fails, update the count and verify no cross-lane service was added.

    [Fact]
    public void GptController_Constructor_Parameter_Count_Is_Known()
    {
        var controllerType = typeof(GPTController);
        var paramCount = controllerType.GetConstructors()
            .Max(c => c.GetParameters().Length);

        // 17 parameters: configService, orchestrationService, ragService, logger,
        // + 13 optional phase services (healthEvaluator, modeService, bentonRagService,
        //   eventService, metricsService, federatedOverviewService, policyService,
        //   policyEvaluator, guardrailService, ragFleetService, atlasService,
        //   atlasLiveService, sseWriter)
        Assert.Equal(17, paramCount);
    }
}
