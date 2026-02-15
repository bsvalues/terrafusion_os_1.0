using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.API.Security.Services;
using Xunit;

namespace TerraFusion.Unit.Tests.Phase5;

[Trait("Phase", "5")]
[Trait("Component", "LdapService")]
[Trait("Category", "Security")]
public sealed class DevelopmentLdapServiceTests
{
    private readonly DevelopmentLdapService _sut;

    public DevelopmentLdapServiceTests()
    {
        _sut = new DevelopmentLdapService(NullLogger<DevelopmentLdapService>.Instance);
    }

    [Theory]
    [InlineData("admin", "admin123")]
    [InlineData("assessor", "assess123")]
    [InlineData("auditor", "audit123")]
    [InlineData("viewer", "view123")]
    public async Task AuthenticateAsync_WithValidCredentials_ReturnsSuccess(string username, string password)
    {
        var result = await _sut.AuthenticateAsync(username, password);
        result.Success.Should().BeTrue();
        result.User.Should().NotBeNull();
        result.User!.Username.Should().Be(username);
        result.Groups.Should().NotBeEmpty();
        result.ErrorMessage.Should().BeNull();
    }

    [Fact]
    public async Task AuthenticateAsync_WithInvalidPassword_ReturnsFailure()
    {
        var result = await _sut.AuthenticateAsync("admin", "wrong-password");
        result.Success.Should().BeFalse();
        result.ErrorMessage.Should().Be("Invalid credentials");
        result.User.Should().BeNull();
    }

    [Fact]
    public async Task AuthenticateAsync_WithNonexistentUser_ReturnsFailure()
    {
        var result = await _sut.AuthenticateAsync("nonexistent", "password");
        result.Success.Should().BeFalse();
        result.ErrorMessage.Should().Be("Invalid credentials");
    }

    [Fact]
    public async Task AuthenticateAsync_WithEmptyCredentials_ReturnsFailure()
    {
        var result = await _sut.AuthenticateAsync("", "");
        result.Success.Should().BeFalse();
        result.ErrorMessage.Should().Contain("required");
    }

    [Fact]
    public async Task AuthenticateAsync_IsCaseInsensitive()
    {
        var result = await _sut.AuthenticateAsync("ADMIN", "admin123");
        result.Success.Should().BeTrue();
    }

    [Fact]
    public async Task GetUserAsync_WithValidUsername_ReturnsUserInfo()
    {
        var user = await _sut.GetUserAsync("admin");
        user.Should().NotBeNull();
        user!.Username.Should().Be("admin");
        user.Email.Should().Be("admin@terrafusion.gov");
        user.DisplayName.Should().Be("System Administrator");
        user.County.Should().Be("Benton");
    }

    [Fact]
    public async Task GetUserAsync_WithInvalidUsername_ReturnsNull()
    {
        var user = await _sut.GetUserAsync("nonexistent");
        user.Should().BeNull();
    }

    [Fact]
    public async Task IsUserInGroupAsync_WithValidGroup_ReturnsTrue()
    {
        var result = await _sut.IsUserInGroupAsync("admin", "TF-Admins");
        result.Should().BeTrue();
    }

    [Fact]
    public async Task IsUserInGroupAsync_WithInvalidGroup_ReturnsFalse()
    {
        var result = await _sut.IsUserInGroupAsync("viewer", "TF-Admins");
        result.Should().BeFalse();
    }

    [Fact]
    public async Task IsUserInGroupAsync_WithNonexistentUser_ReturnsFalse()
    {
        var result = await _sut.IsUserInGroupAsync("nonexistent", "TF-Users");
        result.Should().BeFalse();
    }

    [Fact]
    public async Task GetUserGroupsAsync_ReturnsAllGroups()
    {
        var groups = await _sut.GetUserGroupsAsync("admin");
        groups.Should().Contain("TF-Admins");
        groups.Should().Contain("TF-Users");
        groups.Should().Contain("Domain Admins");
        groups.Should().HaveCount(3);
    }

    [Fact]
    public async Task GetUserGroupsAsync_ForNonexistentUser_ReturnsEmptyList()
    {
        var groups = await _sut.GetUserGroupsAsync("nonexistent");
        groups.Should().BeEmpty();
    }

    [Fact]
    public async Task AdminUser_HasCorrectGroupMappings()
    {
        var result = await _sut.AuthenticateAsync("admin", "admin123");
        result.Groups.Should().Contain("TF-Admins");
        result.Groups.Should().Contain("Domain Admins");
    }

    [Fact]
    public async Task AssessorUser_HasCorrectGroupMappings()
    {
        var result = await _sut.AuthenticateAsync("assessor", "assess123");
        result.Groups.Should().Contain("TF-Assessors");
        result.Groups.Should().Contain("TF-Users");
    }

    [Fact]
    public void HashPassword_IsDeterministic()
    {
        var hash1 = DevelopmentLdapService.HashPassword("test123");
        var hash2 = DevelopmentLdapService.HashPassword("test123");
        hash1.Should().Be(hash2);
    }

    [Fact]
    public void HashPassword_DifferentPasswordsProduceDifferentHashes()
    {
        var hash1 = DevelopmentLdapService.HashPassword("password1");
        var hash2 = DevelopmentLdapService.HashPassword("password2");
        hash1.Should().NotBe(hash2);
    }
}
