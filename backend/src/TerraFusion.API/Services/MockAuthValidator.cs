using TerraFusion.API.Services;

namespace TerraFusion.API.Services;

public class MockAuthValidator : IAuthValidator
{
    public TimeSpan AllowedDrift => TimeSpan.FromMinutes(5);

    public bool Validate(AuthEnvelope envelope, out string? reason)
    {
        // Mock implementation - always validates successfully for development
        reason = null;
        return true;
    }
}