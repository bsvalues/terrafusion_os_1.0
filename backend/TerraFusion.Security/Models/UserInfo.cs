namespace TerraFusion.Security.Models;

public class UserInfo
{
    public string Id { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? County { get; set; }
    public List<string> Roles { get; set; } = new();
    public List<string> Permissions { get; set; } = new();

    public static UserInfo FromApplicationUser(ApplicationUser user)
    {
        return new UserInfo
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            County = user.County,
            Roles = user.Roles,
            Permissions = user.Permissions
        };
    }
}
