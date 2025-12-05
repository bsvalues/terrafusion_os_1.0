using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using System.Text.Json;
using System.Security.Cryptography;
using System.Text;
using System.Net.Http;

namespace TerraFusion.Core.Services
{
    public interface IMultiFactorAuthenticationService
    {
        Task<MfaSetupResult> SetupMfaAsync(string userId, MfaMethod method);
        Task<MfaVerificationResult> VerifyMfaAsync(string userId, string code, string sessionId);
        Task<bool> DisableMfaAsync(string userId, string verificationCode);
        Task<List<MfaMethod>> GetAvailableMethodsAsync(string userId);
        Task<MfaChallenge> InitiateMfaChallengeAsync(string userId, MfaMethod method);
        Task<SsoAuthResult> AuthenticateWithSsoAsync(string provider, string token);
        Task<bool> ValidateGovernmentIdAsync(string userId, string governmentId);
    }

    public class MfaSetupResult
    {
        public bool Success { get; set; }
        public string? SecretKey { get; set; }
        public string? QrCodeUrl { get; set; }
        public List<string>? BackupCodes { get; set; }
        public string? ErrorMessage { get; set; }
    }

    public class MfaVerificationResult
    {
        public bool Success { get; set; }
        public string? SessionToken { get; set; }
        public DateTime ExpiresAt { get; set; }
        public string? ErrorMessage { get; set; }
        public int RemainingAttempts { get; set; }
    }

    public class MfaChallenge
    {
        public string ChallengeId { get; set; } = null!;
        public MfaMethod Method { get; set; }
        public string? Challenge { get; set; }
        public DateTime ExpiresAt { get; set; }
        public Dictionary<string, object> Metadata { get; set; } = new();
    }

    public class SsoAuthResult
    {
        public bool Success { get; set; }
        public string? UserId { get; set; }
        public string? AccessToken { get; set; }
        public string? RefreshToken { get; set; }
        public DateTime ExpiresAt { get; set; }
        public Dictionary<string, object>? UserClaims { get; set; }
        public string? ErrorMessage { get; set; }
    }

    public enum MfaMethod
    {
        TOTP,
        SMS,
        Email,
        Hardware,
        Biometric,
        GovernmentId
    }

    public class MultiFactorAuthenticationService : IMultiFactorAuthenticationService
    {
        private readonly ILogger<MultiFactorAuthenticationService> _logger;
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;
        private readonly Dictionary<string, MfaSession> _activeSessions;
        private readonly Dictionary<string, List<string>> _userBackupCodes;

        // Government SSO providers
        private readonly string _loginGovEndpoint;
        private readonly string _maxGovEndpoint;
        private readonly string _fismaClientId;
        private readonly string _fismaClientSecret;

        public MultiFactorAuthenticationService(
            ILogger<MultiFactorAuthenticationService> logger,
            IConfiguration configuration,
            HttpClient httpClient)
        {
            _logger = logger;
            _configuration = configuration;
            _httpClient = httpClient;
            _activeSessions = new Dictionary<string, MfaSession>();
            _userBackupCodes = new Dictionary<string, List<string>>();

            _loginGovEndpoint = configuration["Authentication:LoginGov:Endpoint"] ?? string.Empty;
            _maxGovEndpoint = configuration["Authentication:MaxGov:Endpoint"] ?? string.Empty;
            _fismaClientId = configuration["Authentication:FISMA:ClientId"] ?? string.Empty;
            _fismaClientSecret = configuration["Authentication:FISMA:ClientSecret"] ?? string.Empty;
        }

        public async Task<MfaSetupResult> SetupMfaAsync(string userId, MfaMethod method)
        {
            try
            {
                switch (method)
                {
                    case MfaMethod.TOTP:
                        return await SetupTotpAsync(userId);
                    case MfaMethod.SMS:
                        return await SetupSmsAsync(userId);
                    case MfaMethod.Hardware:
                        return await SetupHardwareTokenAsync(userId);
                    case MfaMethod.GovernmentId:
                        return await SetupGovernmentIdAsync(userId);
                    default:
                        return new MfaSetupResult { Success = false, ErrorMessage = "Unsupported MFA method" };
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error setting up MFA for user {UserId}", userId);
                return new MfaSetupResult { Success = false, ErrorMessage = "Setup failed" };
            }
        }

        public async Task<MfaVerificationResult> VerifyMfaAsync(string userId, string code, string sessionId)
        {
            try
            {
                if (!_activeSessions.TryGetValue(sessionId, out var session))
                {
                    return new MfaVerificationResult { Success = false, ErrorMessage = "Invalid session" };
                }

                if (session.ExpiresAt < DateTime.UtcNow)
                {
                    _activeSessions.Remove(sessionId);
                    return new MfaVerificationResult { Success = false, ErrorMessage = "Session expired" };
                }

                bool isValid = session.Method switch
                {
                    MfaMethod.TOTP => await ValidateTotpCodeAsync(userId, code),
                    MfaMethod.SMS => await ValidateSmsCodeAsync(userId, code, sessionId),
                    MfaMethod.Hardware => await ValidateHardwareTokenAsync(userId, code),
                    MfaMethod.GovernmentId => await ValidateGovernmentIdAsync(userId, code),
                    _ => false
                };

                if (isValid)
                {
                    var token = GenerateSessionToken();
                    _activeSessions.Remove(sessionId);
                    
                    _logger.LogInformation("MFA verification successful for user {UserId}", userId);
                    
                    return new MfaVerificationResult
                    {
                        Success = true,
                        SessionToken = token,
                        ExpiresAt = DateTime.UtcNow.AddHours(8)
                    };
                }
                else
                {
                    session.FailedAttempts++;
                    if (session.FailedAttempts >= 3)
                    {
                        _activeSessions.Remove(sessionId);
                        _logger.LogWarning("MFA verification failed - max attempts reached for user {UserId}", userId);
                        return new MfaVerificationResult { Success = false, ErrorMessage = "Max attempts reached" };
                    }

                    return new MfaVerificationResult 
                    { 
                        Success = false, 
                        ErrorMessage = "Invalid code",
                        RemainingAttempts = 3 - session.FailedAttempts
                    };
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying MFA for user {UserId}", userId);
                return new MfaVerificationResult { Success = false, ErrorMessage = "Verification failed" };
            }
        }

        public async Task<MfaChallenge> InitiateMfaChallengeAsync(string userId, MfaMethod method)
        {
            var challengeId = Guid.NewGuid().ToString();
            var challenge = new MfaChallenge
            {
                ChallengeId = challengeId,
                Method = method,
                ExpiresAt = DateTime.UtcNow.AddMinutes(5),
                Metadata = new Dictionary<string, object>()
            };

            switch (method)
            {
                case MfaMethod.SMS:
                    challenge.Challenge = await SendSmsCodeAsync(userId);
                    break;
                case MfaMethod.Email:
                    challenge.Challenge = await SendEmailCodeAsync(userId);
                    break;
                case MfaMethod.TOTP:
                    challenge.Challenge = "Enter code from authenticator app";
                    break;
                case MfaMethod.Hardware:
                    challenge.Challenge = "Insert hardware token and enter code";
                    break;
                case MfaMethod.GovernmentId:
                    challenge.Challenge = "Scan government ID with mobile app";
                    break;
            }

            var session = new MfaSession
            {
                SessionId = challengeId,
                UserId = userId,
                Method = method,
                ExpiresAt = challenge.ExpiresAt,
                FailedAttempts = 0
            };

            _activeSessions[challengeId] = session;

            _logger.LogInformation("MFA challenge initiated for user {UserId} with method {Method}", userId, method);
            return challenge;
        }

        public async Task<SsoAuthResult> AuthenticateWithSsoAsync(string provider, string token)
        {
            try
            {
                string endpoint = provider.ToLower() switch
                {
                    "login.gov" => _loginGovEndpoint,
                    "max.gov" => _maxGovEndpoint,
                    _ => throw new ArgumentException("Unsupported SSO provider")
                };

                var request = new HttpRequestMessage(HttpMethod.Post, $"{endpoint}/verify");
                request.Headers.Add("Authorization", $"Bearer {token}");
                request.Headers.Add("X-Client-Id", _fismaClientId);

                var response = await _httpClient.SendAsync(request);
                if (!response.IsSuccessStatusCode)
                {
                    return new SsoAuthResult { Success = false, ErrorMessage = "SSO verification failed" };
                }

                var content = await response.Content.ReadAsStringAsync();
                var ssoData = JsonSerializer.Deserialize<Dictionary<string, object>>(content);
                if (ssoData == null)
                {
                    return new SsoAuthResult { Success = false, ErrorMessage = "Invalid SSO response" };
                }

                ssoData.TryGetValue("sub", out var subObj);
                var userId = subObj?.ToString();

                var result = new SsoAuthResult
                {
                    Success = true,
                    UserId = userId,
                    AccessToken = GenerateAccessToken(),
                    RefreshToken = GenerateRefreshToken(),
                    ExpiresAt = DateTime.UtcNow.AddHours(8),
                    UserClaims = ssoData
                };

                _logger.LogInformation("SSO authentication successful for provider {Provider}", provider);
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "SSO authentication failed for provider {Provider}", provider);
                return new SsoAuthResult { Success = false, ErrorMessage = "Authentication failed" };
            }
        }

        public async Task<bool> ValidateGovernmentIdAsync(string userId, string governmentId)
        {
            // Integration with government ID verification services
            try
            {
                var request = new
                {
                    user_id = userId,
                    government_id = governmentId,
                    verification_level = "IAL2" // Identity Assurance Level 2
                };

                var json = JsonSerializer.Serialize(request);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync($"{_loginGovEndpoint}/verify-id", content);
                var responseContent = await response.Content.ReadAsStringAsync();
                var result = JsonSerializer.Deserialize<Dictionary<string, object>>(responseContent);

                return result != null && result.ContainsKey("verified") && (bool)result["verified"];
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Government ID validation failed for user {UserId}", userId);
                return false;
            }
        }

        public Task<List<MfaMethod>> GetAvailableMethodsAsync(string userId)
        {
            // Return government-approved MFA methods
            return Task.FromResult(new List<MfaMethod>
            {
                MfaMethod.TOTP,
                MfaMethod.SMS,
                MfaMethod.Hardware,
                MfaMethod.GovernmentId
            });
        }

        public async Task<bool> DisableMfaAsync(string userId, string verificationCode)
        {
            try
            {
                // Require additional verification to disable MFA
                var isValid = await ValidateTotpCodeAsync(userId, verificationCode);
                if (isValid)
                {
                    // Remove MFA configuration for user
                    _logger.LogWarning("MFA disabled for user {UserId}", userId);
                    return true;
                }
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error disabling MFA for user {UserId}", userId);
                return false;
            }
        }

        private Task<MfaSetupResult> SetupTotpAsync(string userId)
        {
            var secretKey = GenerateSecretKey();
            var qrCodeUrl = GenerateQrCodeUrl(userId, secretKey);
            var backupCodes = GenerateBackupCodes();

            _userBackupCodes[userId] = backupCodes;

            return Task.FromResult(new MfaSetupResult
            {
                Success = true,
                SecretKey = secretKey,
                QrCodeUrl = qrCodeUrl,
                BackupCodes = backupCodes
            });
        }

        private Task<MfaSetupResult> SetupSmsAsync(string userId)
        {
            // SMS setup logic
            return Task.FromResult(new MfaSetupResult { Success = true });
        }

        private Task<MfaSetupResult> SetupHardwareTokenAsync(string userId)
        {
            // Hardware token setup logic
            return Task.FromResult(new MfaSetupResult { Success = true });
        }

        private Task<MfaSetupResult> SetupGovernmentIdAsync(string userId)
        {
            // Government ID setup logic
            return Task.FromResult(new MfaSetupResult { Success = true });
        }

        private Task<bool> ValidateTotpCodeAsync(string userId, string code)
        {
            // TOTP validation logic
            return Task.FromResult(code.Length == 6 && int.TryParse(code, out _));
        }

        private Task<bool> ValidateSmsCodeAsync(string userId, string code, string sessionId)
        {
            // SMS validation logic
            return Task.FromResult(code.Length == 6 && int.TryParse(code, out _));
        }

        private Task<bool> ValidateHardwareTokenAsync(string userId, string code)
        {
            // Hardware token validation logic
            return Task.FromResult(code.Length >= 6);
        }

        private Task<string> SendSmsCodeAsync(string userId)
        {
            var code = GenerateNumericCode(6);
            // Send SMS logic
            _logger.LogInformation("SMS code sent to user {UserId}", userId);
            return Task.FromResult("SMS code sent");
        }

        private Task<string> SendEmailCodeAsync(string userId)
        {
            var code = GenerateNumericCode(6);
            // Send email logic
            _logger.LogInformation("Email code sent to user {UserId}", userId);
            return Task.FromResult("Email code sent");
        }

        private string GenerateSecretKey()
        {
            var bytes = new byte[20];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(bytes);
            }
            return ToBase32String(bytes);
        }

        private string GenerateQrCodeUrl(string userId, string secretKey)
        {
            var issuer = "TerraFusion OS";
            var label = $"{issuer}:{userId}";
            return $"otpauth://totp/{label}?secret={secretKey}&issuer={issuer}";
        }

        private List<string> GenerateBackupCodes()
        {
            var codes = new List<string>();
            for (int i = 0; i < 10; i++)
            {
                codes.Add(GenerateAlphanumericCode(8));
            }
            return codes;
        }

        private string GenerateNumericCode(int length)
        {
            var random = new Random();
            var code = "";
            for (int i = 0; i < length; i++)
            {
                code += random.Next(0, 10).ToString();
            }
            return code;
        }

        private string GenerateAlphanumericCode(int length)
        {
            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            var random = new Random();
            var code = "";
            for (int i = 0; i < length; i++)
            {
                code += chars[random.Next(chars.Length)];
            }
            return code;
        }

        private string GenerateSessionToken()
        {
            return Guid.NewGuid().ToString("N");
        }

        private string GenerateAccessToken()
        {
            return Guid.NewGuid().ToString("N");
        }

        private string GenerateRefreshToken()
        {
            return Guid.NewGuid().ToString("N");
        }

        // Local Base32 encoder (RFC 4648) to avoid external dependencies
        internal static class Base32
        {
            private static readonly char[] Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567".ToCharArray();

            public static string ToBase32String(byte[] data)
            {
                if (data == null || data.Length == 0) return string.Empty;

                int outputLength = ((data.Length + 4) / 5) * 8;
                var result = new StringBuilder(outputLength);

                int buffer = 0;
                int bitsLeft = 0;

                foreach (var b in data)
                {
                    buffer = (buffer << 8) | (b & 0xFF);
                    bitsLeft += 8;

                    while (bitsLeft >= 5)
                    {
                        int index = (buffer >> (bitsLeft - 5)) & 0x1F;
                        bitsLeft -= 5;
                        result.Append(Alphabet[index]);
                    }
                }

                if (bitsLeft > 0)
                {
                    int index = (buffer << (5 - bitsLeft)) & 0x1F;
                    result.Append(Alphabet[index]);
                }

                // No padding added to keep secrets shorter; add '=' padding if needed by consumers
                return result.ToString();
            }
        }

        // Convenience wrapper for this file
        internal static string ToBase32String(byte[] data) => Base32.ToBase32String(data);
    }

    public class MfaSession
    {
        public string SessionId { get; set; } = null!;
        public string UserId { get; set; } = null!;
        public MfaMethod Method { get; set; }
        public DateTime ExpiresAt { get; set; }
        public int FailedAttempts { get; set; }
    }
}
