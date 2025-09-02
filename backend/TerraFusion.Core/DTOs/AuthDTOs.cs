using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.DTOs;

public class LoginRequest
{
    [Required]
    [EmailAddress]
    public required string Email { get; set; }

    [Required]
    [MinLength(8)]
    public required string Password { get; set; }

    public bool RememberMe { get; set; } = false;
}

public class LoginResponse
{
    public required string Token { get; set; }
    public required string Email { get; set; }
    public required string[] Roles { get; set; }
    public DateTime ExpiresAt { get; set; }
    public string? RefreshToken { get; set; }
}

public class RefreshTokenRequest
{
    [Required]
    public required string Token { get; set; }
    
    public string? RefreshToken { get; set; }
}

public class UserProfile
{
    public required string Email { get; set; }
    public required string[] Roles { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Department { get; set; }
    public DateTime LastLogin { get; set; }
    public string? County { get; set; }
}

public class ChangePasswordRequest
{
    [Required]
    public required string CurrentPassword { get; set; }

    [Required]
    [MinLength(8)]
    public required string NewPassword { get; set; }

    [Required]
    [Compare("NewPassword")]
    public required string ConfirmPassword { get; set; }
}

public class ResetPasswordRequest
{
    [Required]
    [EmailAddress]
    public required string Email { get; set; }
}

public class ResetPasswordConfirmRequest
{
    [Required]
    public required string Token { get; set; }

    [Required]
    [EmailAddress]
    public required string Email { get; set; }

    [Required]
    [MinLength(8)]
    public required string NewPassword { get; set; }

    [Required]
    [Compare("NewPassword")]
    public required string ConfirmPassword { get; set; }
}