using System.Linq;
using FluentAssertions;
using TerraFusion.API.Services;
using Xunit;

namespace TerraFusion.Unit.Tests.Audit;

// WO-AU2-4 (SW-09): ETL / bulk / sync / drain / projector paths must never emit
// AuditEvents trail rows. The exclusion is STRUCTURAL, not a runtime filter:
//   - The curated emission services (IAuditEventWriter, IGovernedToolAuditService)
//     live in TerraFusion.API.
//   - ETL/projector/drain/landing services live in the lower TerraFusion.Data and
//     TerraFusion.Sync layers, which do NOT reference TerraFusion.API.
//   => ETL code cannot even name, let alone invoke, the curated audit emitter.
// These guards fail the moment a future edit erodes that layering (e.g. someone
// makes TerraFusion.Data reference TerraFusion.API to emit audit rows from a drain).
[Trait("Category", "Audit")]
public sealed class AuditEtlExclusionGuardTests
{
    private const string ApiAssembly = "TerraFusion.API";

    [Fact]
    public void DataLayer_DoesNotReference_ApiEmissionLayer()
    {
        var data = typeof(TerraFusion.Data.TerraFusionDbContext).Assembly;
        data.GetReferencedAssemblies().Select(a => a.Name)
            .Should().NotContain(ApiAssembly,
                "ETL/projector/drain/landing services in TerraFusion.Data must not be able to call the API-layer audit emitter");
    }

    [Fact]
    public void SyncLayer_DoesNotReference_ApiEmissionLayer()
    {
        var sync = typeof(TerraFusion.Sync.Workbench.Readiness.WorkbenchSyncReadinessService).Assembly;
        sync.GetReferencedAssemblies().Select(a => a.Name)
            .Should().NotContain(ApiAssembly,
                "sync-workbench services in TerraFusion.Sync must not be able to call the API-layer audit emitter");
    }

    [Fact]
    public void EmissionServices_LiveInApiLayer()
    {
        // If these move to a lower layer, the structural exclusion above stops holding — force a re-review.
        typeof(IAuditEventWriter).Assembly.GetName().Name.Should().Be(ApiAssembly);
        typeof(IGovernedToolAuditService).Assembly.GetName().Name.Should().Be(ApiAssembly);
    }
}
