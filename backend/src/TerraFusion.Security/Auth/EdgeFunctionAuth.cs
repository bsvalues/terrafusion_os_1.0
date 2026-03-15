// TFR-081: Edge Function Authentication
// JWT validation and authenticated client creation for edge functions.

using System.IdentityModel.Tokens.Jwt;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;

namespace TerraFusion.Security.Auth;

/// <summary>
/// Provides JWT validation and authenticated HTTP client creation for edge functions.
/// Enforces county-scoped access control for FISMA-HIGH compliance.
/// </summary>
public interface IEdgeFunctionAuth
{
    /// <summary>Extracts the county identifier from a validated JWT token.</summary>
    string ExtractCountyId(string token);

    /// <summary>Validates a JWT token and returns the associated claims principal.</summary>
    ClaimsPrincipal ValidateToken(string token);

    /// <summary>Creates an authenticated HTTP client scoped to the given county.</summary>
    HttpClient CreateServiceClient(string countyId);
}

public sealed class EdgeFunctionAuth : IEdgeFunctionAuth
{
    private readonly IConfiguration _configuration;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<EdgeFunctionAuth> _logger;
    private readonly TokenValidationParameters _validationParameters;

    private const string CountyIdClaim = "county_id";
    private const string ServiceClientName = "EdgeFunctionClient";

    public EdgeFunctionAuth(
        IConfiguration configuration,
        IHttpClientFactory httpClientFactory,
        ILogger<EdgeFunctionAuth> logger)
    {
        _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
        _httpClientFactory = httpClientFactory ?? throw new ArgumentNullException(nameof(httpClientFactory));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));

        _validationParameters = BuildValidationParameters();
    }

    /// <inheritdoc />
    public string ExtractCountyId(string token)
    {
        if (string.IsNullOrWhiteSpace(token))
            throw new ArgumentException("Token must not be null or empty.", nameof(token));

        var principal = ValidateToken(token);
        var countyId = principal.FindFirstValue(CountyIdClaim);

        if (string.IsNullOrEmpty(countyId))
        {
            _logger.LogWarning("Token validated but missing {Claim} claim", CountyIdClaim);
            throw new SecurityTokenException($"Token does not contain required '{CountyIdClaim}' claim.");
        }

        _logger.LogDebug("Extracted county ID {CountyId} from edge function token", countyId);
        return countyId;
    }

    /// <inheritdoc />
    public ClaimsPrincipal ValidateToken(string token)
    {
        if (string.IsNullOrWhiteSpace(token))
            throw new ArgumentException("Token must not be null or empty.", nameof(token));

        // Strip "Bearer " prefix if present
        var rawToken = token.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
            ? token["Bearer ".Length..]
            : token;

        try
        {
            var handler = new JwtSecurityTokenHandler();
            var principal = handler.ValidateToken(rawToken, _validationParameters, out var validatedToken);

            if (validatedToken is not JwtSecurityToken jwtToken ||
                !jwtToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.OrdinalIgnoreCase))
            {
                throw new SecurityTokenException("Invalid token algorithm. Expected HS256.");
            }

            _logger.LogDebug("Edge function token validated for subject {Subject}",
                principal.FindFirstValue(ClaimTypes.NameIdentifier) ?? "unknown");

            return principal;
        }
        catch (SecurityTokenExpiredException ex)
        {
            _logger.LogWarning(ex, "Edge function token expired");
            throw;
        }
        catch (SecurityTokenException ex)
        {
            _logger.LogWarning(ex, "Edge function token validation failed");
            throw;
        }
    }

    /// <inheritdoc />
    public HttpClient CreateServiceClient(string countyId)
    {
        if (string.IsNullOrWhiteSpace(countyId))
            throw new ArgumentException("County ID must not be null or empty.", nameof(countyId));

        var client = _httpClientFactory.CreateClient(ServiceClientName);

        var serviceToken = GenerateServiceToken(countyId);
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", serviceToken);

        client.DefaultRequestHeaders.Add("X-County-Id", countyId);
        client.DefaultRequestHeaders.Add("X-Service-Origin", "edge-function");

        _logger.LogDebug("Created authenticated service client for county {CountyId}", countyId);
        return client;
    }

    private string GenerateServiceToken(string countyId)
    {
        var keyString = _configuration["JwtSettings:SecretKey"]
            ?? throw new InvalidOperationException("JwtSettings:SecretKey is not configured.");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(keyString));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, $"edge-service-{countyId}"),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64),
            new Claim(CountyIdClaim, countyId),
            new Claim(ClaimTypes.Role, "Service"),
        };

        var issuer = _configuration["JwtSettings:Issuer"] ?? "TerraFusion";
        var audience = _configuration["JwtSettings:Audience"] ?? "TerraFusionServices";

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(15),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private TokenValidationParameters BuildValidationParameters()
    {
        var keyString = _configuration["JwtSettings:SecretKey"]
            ?? throw new InvalidOperationException("JwtSettings:SecretKey is not configured.");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(keyString));

        return new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = _configuration["JwtSettings:Issuer"] ?? "TerraFusion",
            ValidateAudience = true,
            ValidAudience = _configuration["JwtSettings:Audience"] ?? "TerraFusionServices",
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = key,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30),
            RequireExpirationTime = true,
        };
    }
}
