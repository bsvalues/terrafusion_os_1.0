using System.Linq;
using System.Reflection;
using Xunit;

namespace TerraFusion.API.Tests.Services.Valuation;

/// <summary>
/// Guards that Forge-owned kernel clients are not referenced from Dais services.
/// Forge owns valuation math. Dais does not absorb it. Enforced via reflection.
/// </summary>
public class BoundaryGuardTests
{
    [Fact]
    public void DaisServices_DoNotReferenceKernelClients()
    {
        // Load TerraFusion.API assembly
        var apiAssembly = typeof(TerraFusion.API.Services.Valuation.CostKernelClient).Assembly;

        // Find all types in a Dais namespace (if any exist in this assembly)
        var daisTypes = apiAssembly.GetTypes()
            .Where(t => t.Namespace != null && t.Namespace.Contains(".Dais", System.StringComparison.OrdinalIgnoreCase))
            .ToList();

        // Find all methods on Dais types that reference a Kernel client
        foreach (var type in daisTypes)
        {
            var fields = type.GetFields(BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance);
            foreach (var f in fields)
            {
                var name = f.FieldType.FullName ?? "";
                Assert.False(
                    name.Contains("CostKernelClient") ||
                    name.Contains("ValuationKernelClient") ||
                    name.Contains("RustKernelProcessHost"),
                    $"Dais type {type.FullName} references kernel infrastructure via field {f.Name} ({name}) — Forge boundary violation");
            }
        }
    }

    [Fact]
    public void ControllerDoesNotInvokeKernelDirectly()
    {
        // The controller must delegate to IKernelValuationService, not to ICostKernelClient or IRustKernelProcessHost.
        var controllerType = typeof(TerraFusion.API.Controllers.ValuationController);
        var ctor = controllerType.GetConstructors().First();
        var paramTypes = ctor.GetParameters().Select(p => p.ParameterType.FullName ?? "").ToList();

        Assert.DoesNotContain(paramTypes, t => t.Contains("ICostKernelClient"));
        Assert.DoesNotContain(paramTypes, t => t.Contains("IValuationKernelClient"));
        Assert.DoesNotContain(paramTypes, t => t.Contains("IRustKernelProcessHost"));
    }

    [Fact]
    public void CanonicalConsumer_DependsOnlyOnValuationClient()
    {
        var fields = typeof(TerraFusion.API.Services.Valuation.ForgeCanonicalCostConsumer)
            .GetFields(BindingFlags.NonPublic | BindingFlags.Instance);

        Assert.Single(fields);
        Assert.Equal(typeof(TerraFusion.API.Services.Valuation.IValuationKernelClient), fields[0].FieldType);
        Assert.DoesNotContain(fields, field =>
            (field.FieldType.FullName ?? string.Empty).Contains("DbContext", System.StringComparison.Ordinal));
    }
}
