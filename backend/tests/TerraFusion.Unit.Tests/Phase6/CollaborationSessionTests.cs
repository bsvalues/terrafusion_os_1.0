using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Interfaces;
using TerraFusion.Core.Services;
using Xunit;

namespace TerraFusion.Unit.Tests.Phase6;

[Trait("Phase", "6")]
[Trait("Component", "CollaborationSession")]
[Trait("Category", "Collaboration")]
public sealed class CollaborationSessionTests : IDisposable
{
    private readonly CollaborationService _sut;

    public CollaborationSessionTests()
    {
        // Clear static state between tests
        CollaborationService.ClearAllSessions();

        var mockContext = new Mock<ITerraFusionDbContext>();
        var mockPermissions = new Mock<IPermissionService>();
        _sut = new CollaborationService(
            mockContext.Object,
            NullLogger<CollaborationService>.Instance,
            mockPermissions.Object);
    }

    public void Dispose() => CollaborationService.ClearAllSessions();

    [Fact]
    public async Task StartSession_CreatesActiveSession()
    {
        var dto = new CreateSessionDto { ProjectId = "proj-1", Type = SessionType.Meeting };
        var session = await _sut.StartSessionAsync(dto, "host-user");

        session.Should().NotBeNull();
        session.Id.Should().NotBeNullOrWhiteSpace();
        session.ProjectId.Should().Be("proj-1");
        session.Type.Should().Be(SessionType.Meeting);
        session.Status.Should().Be(SessionStatus.Active);
        session.StartTime.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
        session.EndTime.Should().BeNull();
        session.Participants.Should().HaveCount(1);
        session.Participants[0].Role.Should().Be(SessionRole.Host);
        session.Participants[0].User.UserId.Should().Be("host-user");
    }

    [Fact]
    public async Task GetSession_ReturnsCorrectSession()
    {
        var dto = new CreateSessionDto { ProjectId = "proj-2" };
        var created = await _sut.StartSessionAsync(dto, "host");

        var found = await _sut.GetSessionAsync(created.Id);

        found.Should().NotBeNull();
        found!.Id.Should().Be(created.Id);
        found.ProjectId.Should().Be("proj-2");
    }

    [Fact]
    public async Task GetSession_ReturnsNull_WhenNotFound()
    {
        var found = await _sut.GetSessionAsync("nonexistent-id");
        found.Should().BeNull();
    }

    [Fact]
    public async Task GetProjectSessions_FiltersCorrectly()
    {
        await _sut.StartSessionAsync(new CreateSessionDto { ProjectId = "proj-A" }, "host");
        await _sut.StartSessionAsync(new CreateSessionDto { ProjectId = "proj-B" }, "host");
        await _sut.StartSessionAsync(new CreateSessionDto { ProjectId = "proj-A" }, "host");

        var sessions = await _sut.GetProjectSessionsAsync("proj-A");
        sessions.Should().HaveCount(2);
        sessions.All(s => s.ProjectId == "proj-A").Should().BeTrue();
    }

    [Fact]
    public async Task EndSession_SetsEndTimeAndStatus()
    {
        var session = await _sut.StartSessionAsync(new CreateSessionDto { ProjectId = "proj-3" }, "host");
        var result = await _sut.EndSessionAsync(session.Id);

        result.Should().BeTrue();
        var ended = await _sut.GetSessionAsync(session.Id);
        ended!.Status.Should().Be(SessionStatus.Ended);
        ended.EndTime.Should().NotBeNull();
    }

    [Fact]
    public async Task EndSession_ReturnsFalse_WhenNotFound()
    {
        var result = await _sut.EndSessionAsync("nonexistent");
        result.Should().BeFalse();
    }

    [Fact]
    public async Task JoinSession_AddsParticipant()
    {
        var session = await _sut.StartSessionAsync(new CreateSessionDto { ProjectId = "proj-4" }, "host");

        var result = await _sut.JoinSessionAsync(session.Id, "user-2", SessionRole.Participant);

        result.Should().BeTrue();
        var updated = await _sut.GetSessionAsync(session.Id);
        updated!.Participants.Should().HaveCount(2);
        updated.Participants.Last().User.UserId.Should().Be("user-2");
        updated.Participants.Last().Role.Should().Be(SessionRole.Participant);
    }

    [Fact]
    public async Task JoinSession_ReturnsFalse_WhenSessionEnded()
    {
        var session = await _sut.StartSessionAsync(new CreateSessionDto { ProjectId = "proj-5" }, "host");
        await _sut.EndSessionAsync(session.Id);

        var result = await _sut.JoinSessionAsync(session.Id, "user-2", SessionRole.Participant);
        result.Should().BeFalse();
    }

    [Fact]
    public async Task JoinSession_PreventsDoubleJoin()
    {
        var session = await _sut.StartSessionAsync(new CreateSessionDto { ProjectId = "proj-6" }, "host");
        await _sut.JoinSessionAsync(session.Id, "user-2", SessionRole.Participant);
        await _sut.JoinSessionAsync(session.Id, "user-2", SessionRole.Participant);

        var updated = await _sut.GetSessionAsync(session.Id);
        updated!.Participants.Count(p => p.User.UserId == "user-2").Should().Be(1);
    }

    [Fact]
    public async Task LeaveSession_SetsLeaveTime()
    {
        var session = await _sut.StartSessionAsync(new CreateSessionDto { ProjectId = "proj-7" }, "host");
        await _sut.JoinSessionAsync(session.Id, "user-2", SessionRole.Participant);

        var result = await _sut.LeaveSessionAsync(session.Id, "user-2");

        result.Should().BeTrue();
        var updated = await _sut.GetSessionAsync(session.Id);
        var participant = updated!.Participants.First(p => p.User.UserId == "user-2");
        participant.LeaveTime.Should().NotBeNull();
    }

    [Fact]
    public async Task LeaveSession_ReturnsFalse_WhenUserNotInSession()
    {
        var session = await _sut.StartSessionAsync(new CreateSessionDto { ProjectId = "proj-8" }, "host");
        var result = await _sut.LeaveSessionAsync(session.Id, "nonexistent-user");
        result.Should().BeFalse();
    }

    [Fact]
    public async Task SendMessage_StoresAndReturns()
    {
        var session = await _sut.StartSessionAsync(new CreateSessionDto { ProjectId = "proj-9" }, "host");
        var sendDto = new SendMessageDto
        {
            SessionId = session.Id,
            Content = "Hello, world!",
            Type = MessageType.Text
        };

        var message = await _sut.SendSessionMessageAsync(sendDto, "host");

        message.Should().NotBeNull();
        message.Id.Should().NotBeNullOrWhiteSpace();
        message.SessionId.Should().Be(session.Id);
        message.Content.Should().Be("Hello, world!");
        message.User.UserId.Should().Be("host");
        message.Timestamp.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public async Task GetMessages_ReturnsAllMessages()
    {
        var session = await _sut.StartSessionAsync(new CreateSessionDto { ProjectId = "proj-10" }, "host");
        await _sut.SendSessionMessageAsync(new SendMessageDto { SessionId = session.Id, Content = "msg1" }, "user1");
        await _sut.SendSessionMessageAsync(new SendMessageDto { SessionId = session.Id, Content = "msg2" }, "user2");
        await _sut.SendSessionMessageAsync(new SendMessageDto { SessionId = session.Id, Content = "msg3" }, "user1");

        var messages = await _sut.GetSessionMessagesAsync(session.Id);
        messages.Should().HaveCount(3);
    }

    [Fact]
    public async Task GetMessages_ReturnsEmptyList_WhenNoSession()
    {
        var messages = await _sut.GetSessionMessagesAsync("nonexistent");
        messages.Should().BeEmpty();
    }

    [Fact]
    public async Task ConcurrentAccess_NoDataCorruption()
    {
        var session = await _sut.StartSessionAsync(new CreateSessionDto { ProjectId = "concurrent-proj" }, "host");

        var tasks = Enumerable.Range(0, 50).Select(async i =>
        {
            await _sut.JoinSessionAsync(session.Id, $"user-{i}", SessionRole.Participant);
            await _sut.SendSessionMessageAsync(
                new SendMessageDto { SessionId = session.Id, Content = $"Message {i}" },
                $"user-{i}");
        });

        await Task.WhenAll(tasks);

        var messages = await _sut.GetSessionMessagesAsync(session.Id);
        messages.Should().HaveCount(50);

        var updated = await _sut.GetSessionAsync(session.Id);
        // Host + 50 unique users = 51
        updated!.Participants.Should().HaveCountGreaterOrEqualTo(50);
    }
}
