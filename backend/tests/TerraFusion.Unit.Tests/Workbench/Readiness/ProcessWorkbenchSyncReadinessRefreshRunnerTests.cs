using FluentAssertions;
using TerraFusion.Sync.Workbench.Readiness;
using Xunit;

namespace TerraFusion.Unit.Tests.Workbench.Readiness;

/// <summary>
/// Slice OPS-1-A-2 unit tests for the
/// <see cref="ProcessWorkbenchSyncReadinessRefreshRunner"/>
/// stderr-sanitization helper. The Process subprocess invocation
/// itself is not unit-tested at this seam (live integration is
/// proven under OPS-1-A-2-PROOF if/when that slice lands).
/// </summary>
public sealed class ProcessWorkbenchSyncReadinessRefreshRunnerTests
{
    [Fact]
    public void SanitizeStderr_EmptyInput_ReturnsEmpty()
    {
        ProcessWorkbenchSyncReadinessRefreshRunner.SanitizeStderr("")
            .Should().Be(string.Empty);
        ProcessWorkbenchSyncReadinessRefreshRunner.SanitizeStderr("   ")
            .Should().Be(string.Empty);
        ProcessWorkbenchSyncReadinessRefreshRunner.SanitizeStderr(null!)
            .Should().Be(string.Empty);
    }

    [Fact]
    public void SanitizeStderr_RedactsPasswordFragment()
    {
        var input = "Server=localhost,1433;Database=pacs_oltp;User Id=sa;Password=NotASecret123;Connect Timeout=15";
        var sanitized = ProcessWorkbenchSyncReadinessRefreshRunner.SanitizeStderr(input);

        sanitized.Should().NotContain("NotASecret123",
            "OPS-1-A-2 stderr sanitization MUST redact resolved passwords");
        sanitized.Should().Contain("Password=[REDACTED]");
    }

    [Fact]
    public void SanitizeStderr_RedactsMultiplePasswordFragments()
    {
        var input = "primary Password=secret1; fallback Password=secret2;";
        var sanitized = ProcessWorkbenchSyncReadinessRefreshRunner.SanitizeStderr(input);

        sanitized.Should().NotContain("secret1");
        sanitized.Should().NotContain("secret2");
    }

    [Fact]
    public void SanitizeStderr_TruncatesLongInput()
    {
        var input = new string('x', 1000);
        var sanitized = ProcessWorkbenchSyncReadinessRefreshRunner.SanitizeStderr(input);

        sanitized.Length.Should().BeLessThan(input.Length);
        sanitized.Should().EndWith("…(truncated)",
            "OPS-1-A-2: stderr is bounded to prevent unbounded log echoing");
    }

    [Fact]
    public void Constructor_EmptyArgs_Throws()
    {
        ((Action)(() => new ProcessWorkbenchSyncReadinessRefreshRunner("", "p", "w", "db")))
            .Should().Throw<ArgumentException>();
        ((Action)(() => new ProcessWorkbenchSyncReadinessRefreshRunner("dotnet", "", "w", "db")))
            .Should().Throw<ArgumentException>();
        ((Action)(() => new ProcessWorkbenchSyncReadinessRefreshRunner("dotnet", "p", "", "db")))
            .Should().Throw<ArgumentException>();
        ((Action)(() => new ProcessWorkbenchSyncReadinessRefreshRunner("dotnet", "p", "w", "")))
            .Should().Throw<ArgumentException>();
    }
}
