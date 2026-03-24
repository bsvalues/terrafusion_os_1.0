using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using System.Text.Json;
using TerraFusion.API.Services;
using Xunit;

namespace TerraFusion.Unit.Tests.Stage3;

[Trait("Category", "Stage3")]
public sealed class ServiceRegistryTests : IDisposable
{
    private readonly string _tempDir;

    public ServiceRegistryTests()
    {
        _tempDir = Path.Combine(Path.GetTempPath(), $"tf-registry-test-{Guid.NewGuid():N}");
        Directory.CreateDirectory(_tempDir);
    }

    public void Dispose()
    {
        if (Directory.Exists(_tempDir))
            Directory.Delete(_tempDir, recursive: true);
    }

    private string RegistryPath => Path.Combine(_tempDir, "service-registry.json");
    private string PlatformPath => Path.Combine(_tempDir, "platform.json");

    private const string MinimalPlatformJson = """
        {
          "ports": {
            "api": { "env": "TF_API_PORT", "default": 5046 },
            "frontend": { "env": "TF_FRONTEND_PORT", "default": 3102 },
            "consciousness": { "env": "TF_CONSCIOUSNESS_PORT", "default": 8080 }
          }
        }
        """;

    private ServiceRegistry MakeRegistry() =>
        new(NullLogger<ServiceRegistry>.Instance, RegistryPath);

    [Fact]
    public async Task EnsureSeededAsync_CreatesRegistryFileWhenMissing()
    {
        // Arrange
        await File.WriteAllTextAsync(PlatformPath, MinimalPlatformJson);
        var registry = MakeRegistry();

        File.Exists(RegistryPath).Should().BeFalse("registry should not exist yet");

        // Act
        await registry.EnsureSeededAsync(PlatformPath);

        // Assert
        File.Exists(RegistryPath).Should().BeTrue("registry file should have been created");
    }

    [Fact]
    public async Task EnsureSeededAsync_SeedsAllServicesFromPlatformJson()
    {
        // Arrange
        await File.WriteAllTextAsync(PlatformPath, MinimalPlatformJson);
        var registry = MakeRegistry();

        // Act
        await registry.EnsureSeededAsync(PlatformPath);

        // Assert
        var json = await File.ReadAllTextAsync(RegistryPath);
        var model = JsonSerializer.Deserialize<ServiceRegistryModel>(json,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        model.Should().NotBeNull();
        model!.Services.Should().ContainKey("api");
        model.Services.Should().ContainKey("frontend");
        model.Services.Should().ContainKey("consciousness");
    }

    [Fact]
    public async Task EnsureSeededAsync_SetsDefaultPortsFromPlatformJson()
    {
        // Arrange
        await File.WriteAllTextAsync(PlatformPath, MinimalPlatformJson);
        var registry = MakeRegistry();

        // Act
        await registry.EnsureSeededAsync(PlatformPath);

        // Assert
        var json = await File.ReadAllTextAsync(RegistryPath);
        var model = JsonSerializer.Deserialize<ServiceRegistryModel>(json,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true })!;

        model.Services["api"].Port.Should().Be(5046);
        model.Services["frontend"].Port.Should().Be(3102);
        model.Services["consciousness"].Port.Should().Be(8080);
    }

    [Fact]
    public async Task EnsureSeededAsync_IsIdempotent_DoesNotOverwriteExistingFile()
    {
        // Arrange
        await File.WriteAllTextAsync(PlatformPath, MinimalPlatformJson);
        var registry = MakeRegistry();

        // First call
        await registry.EnsureSeededAsync(PlatformPath);

        var firstWriteTime = File.GetLastWriteTimeUtc(RegistryPath);

        // Ensure a small delay so timestamp would differ if file were rewritten
        await Task.Delay(10);

        // Act — second call
        await registry.EnsureSeededAsync(PlatformPath);

        var secondWriteTime = File.GetLastWriteTimeUtc(RegistryPath);

        // Assert — file was NOT touched on second call
        secondWriteTime.Should().Be(firstWriteTime,
            "EnsureSeededAsync should be idempotent and not overwrite an existing file");
    }

    [Fact]
    public async Task RegisterServiceAsync_AddsNewServiceIfNotInRegistry()
    {
        // Arrange — seed registry without "backend"
        await File.WriteAllTextAsync(PlatformPath, MinimalPlatformJson);
        var registry = MakeRegistry();
        await registry.EnsureSeededAsync(PlatformPath);

        // Verify "backend" is NOT in the seeded registry
        var beforeJson = await File.ReadAllTextAsync(RegistryPath);
        var before = JsonSerializer.Deserialize<ServiceRegistryModel>(beforeJson,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true })!;
        before.Services.Should().NotContainKey("backend");

        // Act
        await registry.RegisterServiceAsync("backend", 5099, 42);

        // Assert
        var afterJson = await File.ReadAllTextAsync(RegistryPath);
        var after = JsonSerializer.Deserialize<ServiceRegistryModel>(afterJson,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true })!;

        after.Services.Should().ContainKey("backend");
        after.Services["backend"].Port.Should().Be(5099);
        after.Services["backend"].Status.Should().Be("running");
        after.Services["backend"].Pid.Should().Be(42);
    }

    [Fact]
    public async Task RegisterServiceAsync_UpdatesExistingService()
    {
        // Arrange — "api" is seeded as stopped/5046
        await File.WriteAllTextAsync(PlatformPath, MinimalPlatformJson);
        var registry = MakeRegistry();
        await registry.EnsureSeededAsync(PlatformPath);

        // Act — register api at a different port
        await registry.RegisterServiceAsync("api", 5099, 123);

        // Assert
        var json = await File.ReadAllTextAsync(RegistryPath);
        var model = JsonSerializer.Deserialize<ServiceRegistryModel>(json,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true })!;

        model.Services["api"].Port.Should().Be(5099);
        model.Services["api"].Status.Should().Be("running");
        model.Services["api"].Pid.Should().Be(123);
    }

    [Fact]
    public async Task RegisterServiceAsync_HandlesFileMissingGracefully()
    {
        // Arrange — NO registry file exists
        File.Exists(RegistryPath).Should().BeFalse();
        var registry = MakeRegistry();

        // Act — should NOT throw
        var act = async () => await registry.RegisterServiceAsync("backend", 5000, 1);
        await act.Should().NotThrowAsync("RegisterServiceAsync must handle missing file gracefully");

        // Assert — file should now exist (created from scratch)
        File.Exists(RegistryPath).Should().BeTrue("file should be created if it was missing");

        var json = await File.ReadAllTextAsync(RegistryPath);
        var model = JsonSerializer.Deserialize<ServiceRegistryModel>(json,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true })!;

        model.Services.Should().ContainKey("backend");
        model.Services["backend"].Port.Should().Be(5000);
    }

    [Fact]
    public async Task GetServiceUrlAsync_ReturnsSeedUrl()
    {
        // Arrange
        await File.WriteAllTextAsync(PlatformPath, MinimalPlatformJson);
        var registry = MakeRegistry();
        await registry.EnsureSeededAsync(PlatformPath);

        // Act
        var url = await registry.GetServiceUrlAsync("api");

        // Assert
        url.Should().Be("http://localhost:5046");
    }
}
