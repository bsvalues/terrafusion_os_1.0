using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace TerraFusion.Core.Services
{
    /// <summary>
    /// DbContext stub for dependency injection
    /// </summary>
    public abstract class TerraFusionDbContext : DbContext
    {
        protected TerraFusionDbContext(DbContextOptions options) : base(options) { }
    }

    /// <summary>
    /// Audit Logger interface for dependency injection
    /// </summary>
    public interface IAuditLogger
    {
        Task LogAsync(string message, object? data = null);
    }

    /// <summary>
    /// Production security service for TerraFusion OS
    /// Handles user validation, security events, and access control
    /// </summary>
    public class SecurityService : ISecurityService
    {
        private readonly TerraFusionDbContext _context;
        private readonly IAuditLogger _auditLogger;
        private readonly IDistributedCache _cache;
        private readonly ILogger<SecurityService> _logger;
        private readonly IConfiguration _configuration;
        
        private const int MAX_FAILED_ATTEMPTS = 5;
        private const int LOCKOUT_DURATION_MINUTES = 30;
        private const string FAILED_ATTEMPTS_PREFIX = "failed_attempts:";
        private const string ACCOUNT_LOCK_PREFIX = "account_lock:";

        // Valid government domains
        private readonly HashSet<string> _governmentDomains = new()
        {
            ".gov", ".mil", ".state.", ".county.", ".city.",
            "@terrafusionmarket.com", "@dhs.gov", "@fema.gov", "@treasury.gov",
            "@irs.gov", "@usda.gov", "@hud.gov", "@census.gov"
        };

        public SecurityService(
            TerraFusionDbContext context,
            IAuditLogger auditLogger,
            IDistributedCache cache,
            ILogger<SecurityService> logger,
            IConfiguration configuration)
        {
            _context = context;
            _auditLogger = auditLogger;
            _cache = cache;
            _logger = logger;
            _configuration = configuration;
        }

        /// <summary>
        /// Validate if email belongs to a government user
        /// </summary>
        public async Task<bool> IsValidGovernmentUserAsync(string email)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(email))
                    return false;

                email = email.ToLowerInvariant();

                // Check if email ends with any government domain
                var isGovernmentDomain = _governmentDomains.Any(domain => 
                    email.EndsWith(domain, StringComparison.OrdinalIgnoreCase));

                if (!isGovernmentDomain)
                {
                    // Check if user is in whitelist (for contractors or special cases)
                    var whitelistKey = $"whitelist:{email}";
                    var isWhitelisted = await _cache.GetStringAsync(whitelistKey);
                    
                    if (!string.IsNullOrEmpty(isWhitelisted))
                    {
                        _logger.LogInformation("Whitelisted user {Email} validated", email);
                        return true;
                    }

                    _logger.LogWarning("Non-government email attempted: {Email}", email);
                    return false;
                }

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating government user {Email}", email);
                return false;
            }
        }

        /// <summary>
        /// Log security event for audit trail
        /// </summary>
        public async Task LogSecurityEventAsync(string eventType, string description, string? details = null)
        {
            try
            {
                var securityEvent = new
                {
                    EventType = eventType,
                    Description = description,
                    Details = details,
                    Timestamp = DateTime.UtcNow,
                    MachineName = Environment.MachineName,
                    ProcessId = Environment.ProcessId
                };

                await _auditLogger.LogAsync($"SECURITY:{eventType}", securityEvent);
                
                // For critical events, also log to database
                if (IsCriticalEvent(eventType))
                {
                    // Store in database for permanent record
                    // This would use the AuditLog entity we'll create
                    _logger.LogWarning("Critical security event: {EventType} - {Description}", eventType, description);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error logging security event {EventType}", eventType);
            }
        }

        /// <summary>
        /// Validate user credentials
        /// </summary>
        public async Task<bool> ValidateUserCredentialsAsync(string email, string password)
        {
            try
            {
                // Check if account is locked
                if (await IsAccountLockedAsync(email))
                {
                    await LogSecurityEventAsync("LOGIN_BLOCKED", $"Locked account login attempt: {email}");
                    return false;
                }

                // In production, integrate with:
                // 1. Active Directory / LDAP
                // 2. Government authentication systems
                // 3. Multi-factor authentication
                
                // For now, simulate authentication with hash validation
                var passwordHash = HashPassword(password);
                
                // Demo validation - replace with real authentication
                var isValid = await Task.Run(() =>
                {
                    // Simulate authentication delay
                    Task.Delay(100).Wait();
                    
                    // For demo: accept specific test accounts
                    var testAccounts = new Dictionary<string, string>
                    {
                        { "admin@terrafusionmarket.com", HashPassword("Admin123!@#") },
                        { "assessor@benton.county.gov", HashPassword("Assessor123!") },
                        { "auditor@washington.state.gov", HashPassword("Auditor123!") }
                    };
                    
                    return testAccounts.ContainsKey(email.ToLower()) && 
                           testAccounts[email.ToLower()] == passwordHash;
                });

                if (!isValid)
                {
                    await RecordFailedLoginAttemptAsync(email);
                    return false;
                }

                await ResetFailedLoginAttemptsAsync(email);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating credentials for {Email}", email);
                return false;
            }
        }

        /// <summary>
        /// Get user roles from the system
        /// </summary>
        public async Task<IEnumerable<string>> GetUserRolesAsync(string email)
        {
            try
            {
                var roles = new List<string> { "GovernmentUser" };

                // Role determination based on email patterns
                email = email.ToLowerInvariant();

                if (email.Contains("admin"))
                    roles.Add("Administrator");
                
                if (email.Contains("assessor"))
                {
                    roles.Add("PropertyAssessor");
                    roles.Add("ValuationSpecialist");
                }
                
                if (email.Contains("auditor"))
                {
                    roles.Add("CountyAuditor");
                    roles.Add("FinancialOversight");
                }
                
                if (email.Contains("treasurer"))
                {
                    roles.Add("CountyTreasurer");
                    roles.Add("TaxCollection");
                }
                
                if (email.Contains("clerk"))
                {
                    roles.Add("CountyClerk");
                    roles.Add("RecordsManagement");
                }

                // Check for special permissions
                if (email.EndsWith("@terrafusionmarket.com"))
                {
                    roles.Add("SystemAdministrator");
                    roles.Add("AIModuleAccess");
                    roles.Add("FullSystemAccess");
                }

                return await Task.FromResult(roles);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting roles for {Email}", email);
                return new[] { "GovernmentUser" };
            }
        }

        /// <summary>
        /// Check if account is locked
        /// </summary>
        public async Task<bool> IsAccountLockedAsync(string email)
        {
            try
            {
                var lockKey = $"{ACCOUNT_LOCK_PREFIX}{email}";
                var lockData = await _cache.GetStringAsync(lockKey);
                
                return !string.IsNullOrEmpty(lockData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking account lock for {Email}", email);
                return false;
            }
        }

        /// <summary>
        /// Record failed login attempt
        /// </summary>
        public async Task RecordFailedLoginAttemptAsync(string email)
        {
            try
            {
                var attemptsKey = $"{FAILED_ATTEMPTS_PREFIX}{email}";
                var attemptsStr = await _cache.GetStringAsync(attemptsKey);
                
                var attempts = string.IsNullOrEmpty(attemptsStr) ? 0 : int.Parse(attemptsStr);
                attempts++;
                
                var options = new DistributedCacheEntryOptions
                {
                    SlidingExpiration = TimeSpan.FromHours(1)
                };
                
                await _cache.SetStringAsync(attemptsKey, attempts.ToString(), options);
                
                await LogSecurityEventAsync("FAILED_LOGIN", $"Failed attempt #{attempts} for {email}");
                
                if (attempts >= MAX_FAILED_ATTEMPTS)
                {
                    await LockAccountAsync(email, TimeSpan.FromMinutes(LOCKOUT_DURATION_MINUTES), 
                        $"Exceeded maximum failed login attempts ({MAX_FAILED_ATTEMPTS})");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error recording failed login for {Email}", email);
            }
        }

        /// <summary>
        /// Reset failed login attempts
        /// </summary>
        public async Task ResetFailedLoginAttemptsAsync(string email)
        {
            try
            {
                var attemptsKey = $"{FAILED_ATTEMPTS_PREFIX}{email}";
                await _cache.RemoveAsync(attemptsKey);
                
                _logger.LogInformation("Reset failed login attempts for {Email}", email);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error resetting failed attempts for {Email}", email);
            }
        }

        /// <summary>
        /// Get number of failed login attempts
        /// </summary>
        public async Task<int> GetFailedLoginAttemptsAsync(string email)
        {
            try
            {
                var attemptsKey = $"{FAILED_ATTEMPTS_PREFIX}{email}";
                var attemptsStr = await _cache.GetStringAsync(attemptsKey);
                
                return string.IsNullOrEmpty(attemptsStr) ? 0 : int.Parse(attemptsStr);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting failed attempts for {Email}", email);
                return 0;
            }
        }

        /// <summary>
        /// Lock an account for security
        /// </summary>
        public async Task LockAccountAsync(string email, TimeSpan duration, string reason)
        {
            try
            {
                var lockKey = $"{ACCOUNT_LOCK_PREFIX}{email}";
                var lockData = new
                {
                    LockedAt = DateTime.UtcNow,
                    LockedUntil = DateTime.UtcNow.Add(duration),
                    Reason = reason
                };
                
                var options = new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = duration
                };
                
                await _cache.SetStringAsync(lockKey, JsonSerializer.Serialize(lockData), options);
                
                await LogSecurityEventAsync("ACCOUNT_LOCKED", $"Account {email} locked for {duration.TotalMinutes} minutes", reason);
                
                _logger.LogWarning("Account {Email} locked. Reason: {Reason}", email, reason);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error locking account {Email}", email);
            }
        }

        /// <summary>
        /// Unlock an account
        /// </summary>
        public async Task UnlockAccountAsync(string email)
        {
            try
            {
                var lockKey = $"{ACCOUNT_LOCK_PREFIX}{email}";
                await _cache.RemoveAsync(lockKey);
                
                await ResetFailedLoginAttemptsAsync(email);
                
                await LogSecurityEventAsync("ACCOUNT_UNLOCKED", $"Account {email} unlocked");
                
                _logger.LogInformation("Account {Email} unlocked", email);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error unlocking account {Email}", email);
            }
        }

        /// <summary>
        /// Validate IP address
        /// </summary>
        public async Task<bool> IsIpAddressAllowedAsync(string ipAddress)
        {
            try
            {
                // Check if IP filtering is enabled
                var enableIpFilter = _configuration.GetValue<bool>("Security:EnableIPWhitelist");
                
                if (!enableIpFilter)
                    return true;
                
                // Check IP whitelist
                var whitelistKey = $"ip_whitelist:{ipAddress}";
                var isWhitelisted = await _cache.GetStringAsync(whitelistKey);
                
                if (!string.IsNullOrEmpty(isWhitelisted))
                    return true;
                
                // Check IP blacklist
                var blacklistKey = $"ip_blacklist:{ipAddress}";
                var isBlacklisted = await _cache.GetStringAsync(blacklistKey);
                
                if (!string.IsNullOrEmpty(isBlacklisted))
                {
                    await LogSecurityEventAsync("BLOCKED_IP", $"Blocked access from IP: {ipAddress}");
                    return false;
                }
                
                // For government networks, check IP ranges
                // This would include checking government IP ranges
                
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating IP address {IP}", ipAddress);
                return true; // Fail open for now
            }
        }

        /// <summary>
        /// Check user permission
        /// </summary>
        public async Task<bool> HasPermissionAsync(string userId, string permission)
        {
            try
            {
                // Check cached permissions first
                var permKey = $"permissions:{userId}:{permission}";
                var cached = await _cache.GetStringAsync(permKey);
                
                if (!string.IsNullOrEmpty(cached))
                {
                    return cached == "1";
                }
                
                // In production, check database for user permissions
                // For now, grant basic permissions
                var hasPermission = permission switch
                {
                    "system.view" => true,
                    "modules.access" => true,
                    "ai.execute" => userId.Contains("admin"),
                    _ => false
                };
                
                // Cache the result
                await _cache.SetStringAsync(permKey, hasPermission ? "1" : "0",
                    new DistributedCacheEntryOptions
                    {
                        SlidingExpiration = TimeSpan.FromMinutes(15)
                    });
                
                return hasPermission;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking permission {Permission} for user {UserId}", permission, userId);
                return false;
            }
        }

        /// <summary>
        /// Check module access
        /// </summary>
        public async Task<bool> HasModuleAccessAsync(string userId, string moduleId)
        {
            try
            {
                // Check cached module access
                var accessKey = $"module_access:{userId}:{moduleId}";
                var cached = await _cache.GetStringAsync(accessKey);
                
                if (!string.IsNullOrEmpty(cached))
                {
                    return cached == "1";
                }
                
                // In production, check database for module access rights
                // For now, grant access to core modules
                var coreModules = new[]
                {
                    "government-edition",
                    "ai-command-brain",
                    "costforge-ai",
                    "marketplace"
                };
                
                var hasAccess = coreModules.Contains(moduleId.ToLower()) || userId.Contains("admin");
                
                // Cache the result
                await _cache.SetStringAsync(accessKey, hasAccess ? "1" : "0",
                    new DistributedCacheEntryOptions
                    {
                        SlidingExpiration = TimeSpan.FromMinutes(30)
                    });
                
                return hasAccess;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking module access for user {UserId}, module {ModuleId}", userId, moduleId);
                return false;
            }
        }

        /// <summary>
        /// Helper method to hash passwords
        /// </summary>
        private string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password + "TerraFusion2025"));
            return Convert.ToBase64String(hashedBytes);
        }

        /// <summary>
        /// Check if an event is critical
        /// </summary>
        private bool IsCriticalEvent(string eventType)
        {
            var criticalEvents = new[]
            {
                "ACCOUNT_LOCKED",
                "MULTIPLE_FAILED_LOGINS",
                "UNAUTHORIZED_ACCESS",
                "SECURITY_BREACH",
                "DATA_EXFILTRATION_ATTEMPT",
                "PRIVILEGE_ESCALATION",
                "SUSPICIOUS_ACTIVITY"
            };
            
            return criticalEvents.Contains(eventType.ToUpper());
        }
    }
}