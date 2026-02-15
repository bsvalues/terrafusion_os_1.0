using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.API.Security.Services;
using Xunit;

namespace TerraFusion.Unit.Tests.Phase5;

[Trait("Phase", "5")]
[Trait("Component", "MfaService")]
[Trait("Category", "Security")]
public sealed class InMemoryMfaServiceTests
{
    private readonly InMemoryMfaService _sut;

    public InMemoryMfaServiceTests()
    {
        _sut = new InMemoryMfaService(NullLogger<InMemoryMfaService>.Instance);
    }

    [Fact]
    public async Task GenerateMfaSecretAsync_ReturnsNonEmptyBase32Secret()
    {
        var secret = await _sut.GenerateMfaSecretAsync("user-1");

        secret.Should().NotBeNullOrWhiteSpace();
        secret.Should().MatchRegex("^[A-Z2-7]+$", "secret should be Base32 encoded");
        secret.Length.Should().BeGreaterThanOrEqualTo(16);
    }

    [Fact]
    public async Task IsMfaEnabledAsync_WhenNotEnabled_ReturnsFalse()
    {
        await _sut.GenerateMfaSecretAsync("user-2");
        var enabled = await _sut.IsMfaEnabledAsync("user-2");
        enabled.Should().BeFalse();
    }

    [Fact]
    public async Task EnableMfa_ThenIsMfaEnabled_ReturnsTrue()
    {
        var secret = await _sut.GenerateMfaSecretAsync("user-3");
        await _sut.EnableMfaAsync("user-3", secret);
        var enabled = await _sut.IsMfaEnabledAsync("user-3");
        enabled.Should().BeTrue();
    }

    [Fact]
    public async Task DisableMfa_ThenIsMfaEnabled_ReturnsFalse()
    {
        var secret = await _sut.GenerateMfaSecretAsync("user-4");
        await _sut.EnableMfaAsync("user-4", secret);
        await _sut.DisableMfaAsync("user-4");
        var enabled = await _sut.IsMfaEnabledAsync("user-4");
        enabled.Should().BeFalse();
    }

    [Fact]
    public async Task ValidateMfaCodeAsync_WithCorrectCode_ReturnsTrue()
    {
        var secret = await _sut.GenerateMfaSecretAsync("user-5");
        await _sut.EnableMfaAsync("user-5", secret);
        var code = await _sut.GenerateTotpCodeAsync("user-5");
        var valid = await _sut.ValidateMfaCodeAsync("user-5", code);
        valid.Should().BeTrue();
    }

    [Fact]
    public async Task ValidateMfaCodeAsync_WithWrongCode_ReturnsFalse()
    {
        var secret = await _sut.GenerateMfaSecretAsync("user-6");
        await _sut.EnableMfaAsync("user-6", secret);
        var valid = await _sut.ValidateMfaCodeAsync("user-6", "000000");
        valid.Should().BeFalse();
    }

    [Fact]
    public async Task ValidateMfaCodeAsync_WhenMfaNotEnabled_ReturnsFalse()
    {
        await _sut.GenerateMfaSecretAsync("user-7");
        var valid = await _sut.ValidateMfaCodeAsync("user-7", "123456");
        valid.Should().BeFalse();
    }

    [Fact]
    public async Task GenerateTotpCodeAsync_ReturnsSixDigitCode()
    {
        var secret = await _sut.GenerateMfaSecretAsync("user-8");
        await _sut.EnableMfaAsync("user-8", secret);
        var code = await _sut.GenerateTotpCodeAsync("user-8");
        code.Should().HaveLength(6);
        code.Should().MatchRegex("^[0-9]{6}$");
    }

    [Fact]
    public async Task GenerateTotpCodeAsync_ForUnknownUser_ReturnsEmpty()
    {
        var code = await _sut.GenerateTotpCodeAsync("nonexistent");
        code.Should().BeEmpty();
    }

    [Fact]
    public void Base32_RoundTrip_PreservesData()
    {
        var original = new byte[] { 0xDE, 0xAD, 0xBE, 0xEF, 0x42 };
        var encoded = InMemoryMfaService.ToBase32(original);
        var decoded = InMemoryMfaService.FromBase32(encoded);
        decoded.Should().BeEquivalentTo(original);
    }

    [Fact]
    public void ComputeTotp_DeterministicForSameInputs()
    {
        var secret = new byte[] { 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x30,
                                  0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x30 };
        var counter = 1234567890L / 30;
        var code1 = InMemoryMfaService.ComputeTotp(secret, counter);
        var code2 = InMemoryMfaService.ComputeTotp(secret, counter);
        code1.Should().Be(code2);
        code1.Should().HaveLength(6);
    }
}
