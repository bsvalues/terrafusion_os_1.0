// backend/TerraFusion.API.Tests/CountyStudyHubTests.cs
using Microsoft.AspNetCore.SignalR;
using Moq;
using TerraFusion.API.Hubs;
using Xunit;

namespace TerraFusion.API.Tests;

public class CountyStudyHubTests
{
    [Fact]
    public void CountyStudyHub_Instantiates_WithNoErrors()
    {
        var hub = new CountyStudyHub();
        Assert.NotNull(hub);
    }

    [Fact]
    public async Task JoinStudy_AddsConnectionToGroup()
    {
        var hub = new CountyStudyHub();
        var mockGroups = new Mock<IGroupManager>();
        mockGroups.Setup(g => g.AddToGroupAsync(It.IsAny<string>(), It.IsAny<string>(), default))
                  .Returns(Task.CompletedTask);
        var mockContext = new Mock<HubCallerContext>();
        mockContext.Setup(c => c.ConnectionId).Returns("conn-123");

        // Also need to mock Clients for the SurfaceConnected notification
        var mockOthers = new Mock<IClientProxy>();
        mockOthers.Setup(c => c.SendCoreAsync(It.IsAny<string>(), It.IsAny<object[]>(), default))
                  .Returns(Task.CompletedTask);
        var mockClients = new Mock<IHubCallerClients>();
        mockClients.Setup(c => c.OthersInGroup(It.IsAny<string>())).Returns(mockOthers.Object);

        hub.Context = mockContext.Object;
        hub.Groups = mockGroups.Object;
        hub.Clients = mockClients.Object;

        await hub.JoinStudy("study-abc");

        mockGroups.Verify(g => g.AddToGroupAsync("conn-123", "Study_study-abc", default), Times.Once);
    }
}
