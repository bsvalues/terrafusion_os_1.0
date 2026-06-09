using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using TerraFusion.Levy.Services;
using Xunit;

namespace TerraFusion.Levy.Tests;

public class LevyCertificationServiceTests
{
    private readonly Mock<ILogger<LevyCertificationService>> _logger = new();
    private readonly LevyCertificationService _service;

    public LevyCertificationServiceTests()
    {
        _service = new LevyCertificationService(_logger.Object);
    }

    [Fact]
    public async Task SubmitForReview_ValidLevyRun_TransitionsToPendingReview()
    {
        var levyRunId = Guid.NewGuid();

        var result = await _service.SubmitForReviewAsync(levyRunId, "assessor@benton.wa.gov");

        result.Success.Should().BeTrue();
        result.NewStatus.Should().Be("PendingReview");
    }

    [Fact]
    public async Task Certify_ValidLevyRun_TransitionsToCertified()
    {
        var levyRunId = Guid.NewGuid();

        var result = await _service.CertifyAsync(levyRunId, "treasurer@benton.wa.gov", "Annual certification");

        result.Success.Should().BeTrue();
        result.NewStatus.Should().Be("Certified");
    }

    [Fact]
    public async Task Reject_ValidLevyRun_TransitionsBackToDraft()
    {
        var levyRunId = Guid.NewGuid();

        var result = await _service.RejectAsync(levyRunId, "auditor@benton.wa.gov", "Rate exceeds statutory cap");

        result.Success.Should().BeTrue();
        result.NewStatus.Should().Be("Draft");
        result.Message.Should().Be("Rate exceeds statutory cap");
    }

    [Fact]
    public async Task GetStatus_NoDbBackedState_ReturnsNull()
    {
        var levyRunId = Guid.NewGuid();

        var result = await _service.GetStatusAsync(levyRunId);

        result.Should().BeNull(); // Stub returns null until DB-backed state machine
    }

    [Fact]
    public async Task FullWorkflow_Draft_PendingReview_Certified()
    {
        var levyRunId = Guid.NewGuid();

        var submit = await _service.SubmitForReviewAsync(levyRunId, "assessor@benton.wa.gov");
        submit.NewStatus.Should().Be("PendingReview");

        var certify = await _service.CertifyAsync(levyRunId, "treasurer@benton.wa.gov");
        certify.NewStatus.Should().Be("Certified");
    }

    [Fact]
    public async Task FullWorkflow_Draft_PendingReview_Rejected_BackToDraft()
    {
        var levyRunId = Guid.NewGuid();

        var submit = await _service.SubmitForReviewAsync(levyRunId, "assessor@benton.wa.gov");
        submit.NewStatus.Should().Be("PendingReview");

        var reject = await _service.RejectAsync(levyRunId, "auditor@benton.wa.gov", "Missing documentation");
        reject.NewStatus.Should().Be("Draft");
    }
}
