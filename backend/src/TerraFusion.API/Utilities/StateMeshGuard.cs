using System;
using System.Text.Json;

namespace TerraFusion.API.Utilities;

public static class StateMeshGuard
{
    public static bool IsStateHealthy(string? jsonState)
    {
        if (string.IsNullOrWhiteSpace(jsonState))
            return false;

        try
        {
            // Native verification logic
            using var doc = JsonDocument.Parse(jsonState);
            var root = doc.RootElement;

            // Pattern 1: { "status": "healthy" }
            if (root.TryGetProperty("status", out var status))
            {
                return status.GetString()?.Equals("healthy", StringComparison.OrdinalIgnoreCase) ?? false;
            }

            // Pattern 2: { "healthy": true }
            if (root.TryGetProperty("healthy", out var healthy))
            {
                return healthy.ValueKind == JsonValueKind.True;
            }
            
            return false;
        }
        catch (JsonException)
        {
            return false;
        }
    }

    /// <summary>
    /// Validates the AUTHORITIES.state.json content.
    /// Throws InvalidOperationException if validation fails.
    /// </summary>
    public static void ValidateAuthorityState(string jsonContent)
    {
        if (string.IsNullOrWhiteSpace(jsonContent))
            throw new InvalidOperationException("Authority state content is empty");

        using var doc = JsonDocument.Parse(jsonContent);
        var root = doc.RootElement;

        // 1. Validate Mesh Type
        if (!root.TryGetProperty("mesh", out var mesh) || 
            !mesh.TryGetProperty("type", out var type) ||
            !type.ValueEquals("federated_quorum"))
        {
            throw new InvalidOperationException("Invalid mesh.type (expected: federated_quorum)");
        }

        // 2. Validate Counties exist
        if (!root.TryGetProperty("counties", out var counties) || 
            counties.ValueKind != JsonValueKind.Array ||
            counties.GetArrayLength() == 0)
        {
            throw new InvalidOperationException("No counties defined in State Authority");
        }

        // 3. Validate at least one active signer
        bool hasActive = false;
        foreach (var county in counties.EnumerateArray())
        {
            if (county.TryGetProperty("status", out var status) && 
                status.ValueEquals("active"))
            {
                hasActive = true;
                break;
            }
        }

        if (!hasActive)
        {
            throw new InvalidOperationException("No active counties found in State Authority");
        }
    }
}
