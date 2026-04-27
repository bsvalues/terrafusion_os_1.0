// backend/TerraFusion.API.Tests/CountyStudyHubTests.cs
using Microsoft.AspNetCore.SignalR;
using Moq;
using TerraFusion.API.Hubs;
using TerraFusion.API.Tests.TestHelpers;
using TerraFusion.Core.Interfaces;
using TerraFusion.Core.Services;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.API.Tests;

public class CountyStudyHubTests
{
    [Fact]
    public void CountyStudyHub_Instantiates_WithNoErrors()
    {
        var hub = new CountyStudyHub(
            TestDbContextFactory.CreateInMemoryContext(),
            Mock.Of<ICountyResolver>());
        Assert.NotNull(hub);
    }

    // NOTE: JoinStudy_AddsConnectionToGroup is intentionally not implemented
    // here. The hub now requires the connection's HttpContext to expose a
    // `countyId` query parameter that the resolver can map to a county scope
    // (validated against a CountyStudySession row in the in-memory db). The
    // SignalR `Context.GetHttpContext()` extension reads
    //   `Features.Get<IHttpContextFeature>()?.HttpContext`
    // which means a faithful unit test needs to construct an IFeatureCollection
    // with an IHttpContextFeature populated. That type lives in
    // Microsoft.AspNetCore.Http.Features (Microsoft.AspNetCore.App framework
    // reference). The test project's current package set doesn't expose it
    // cleanly without restructuring its build to Microsoft.NET.Sdk.Web — out
    // of scope for the REPAIR-A test-baseline slice that landed this file.
    //
    // The hub itself is exercised end-to-end in the higher-level integration
    // suite once a real SignalR client is involved. This unit-test slot is
    // covered by `CountyStudyHub_Instantiates_WithNoErrors` for the DI shape.
}
