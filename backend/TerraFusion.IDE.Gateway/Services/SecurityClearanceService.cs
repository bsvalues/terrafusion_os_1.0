using Microsoft.Extensions.Options;
using System.Text.Json;
using TerraFusion.Core.Models.Security;
using TerraFusion.Core.Models.Compliance;
using StackExchange.Redis;

namespace TerraFusion.IDE.Gateway.Services;

public interface ISecurityClearanceService
{
    Task<SecurityClearanceValidation> ValidateUserClearanceAsync(string? username);
    Task<SecurityClearanceInfo?> GetUserClearanceInfoAsync(string username);
    Task<List<SecurityClearanceInfo>> GetAllUserClearancesAsync();
    Task<AccessValidationResult> ValidateResourceAccessAsync(string username, string resource, string classification);
    Task<AccessRecord> LogAccessAttemptAsync(string username, string resource, string action, bool granted, string? reason = null);
    Task<List<AccessRecord>> GetUserAccessHistoryAsync(string username, int? limitDays = null);
    Task<SecurityClearanceAuditResult> GenerateClearanceAuditAsync(string username);
    Task<bool> ValidateCompartmentAccessAsync(string username, List<string> requiredCompartments);
    Task<SecurityRestriction[]> GetUserRestrictionsAsync(string username);
    Task<ClearanceRenewalStatus> CheckRenewalStatusAsync(string username);
    Task<SecurityClearanceMetrics> GetClearanceMetricsAsync();
}

public class SecurityClearanceService : ISecurityClearanceService
{
    private readonly IDatabase _redis;
    private readonly ILogger<SecurityClearanceService> _logger;
    private readonly IGovernmentAuditService _auditService;
    private readonly SecurityClearanceConfiguration _config;

    private readonly Dictionary<SecurityClearanceLevel, int> ClearanceLevelHierarchy = new()
    {
        { SecurityClearanceLevel.Public, 0 },
        { SecurityClearanceLevel.Confidential, 1 },
        { SecurityClearanceLevel.Secret, 2 },
        { SecurityClearanceLevel.TopSecret, 3 }
    };

    public SecurityClearanceService(
        IConnectionMultiplexer redis,
        ILogger<SecurityClearanceService> logger,
        IGovernmentAuditService auditService,
        IOptions<SecurityClearanceConfiguration> config)
    {
        _redis = redis.GetDatabase();
        _logger = logger;
        _auditService = auditService;
        _config = config.Value;
    }

    public async Task<SecurityClearanceValidation> ValidateUserClearanceAsync(string? username)
    {
        try
        {
            if (string.IsNullOrEmpty(username))
            {
                return new SecurityClearanceValidation
                {
                    IsValid = false,
                    ClearanceLevel = SecurityClearanceLevel.Public,
                    Reason = "No username provided",
                    ValidationTime = DateTime.UtcNow
                };
            }

            var clearanceInfo = await GetUserClearanceInfoAsync(username);
            if (clearanceInfo == null)
            {
                return new SecurityClearanceValidation
                {
                    IsValid = false,
                    ClearanceLevel = SecurityClearanceLevel.Public,
                    Reason = "Security clearance not found",
                    ValidationTime = DateTime.UtcNow
                };
            }

            // Check if clearance is active and not expired
            var isActive = clearanceInfo.Status == ClearanceStatus.Active;
            var isNotExpired = clearanceInfo.ExpirationDate > DateTime.UtcNow;

            // Check for any active restrictions
            var restrictions = await GetUserRestrictionsAsync(username);
            var hasBlockingRestrictions = restrictions.Any(r => r.Active && IsBlockingRestriction(r));

            return new SecurityClearanceValidation
            {
                IsValid = isActive && isNotExpired && !hasBlockingRestrictions,
                ClearanceLevel = clearanceInfo.ClearanceLevel,
                Compartments = clearanceInfo.Compartments,
                Caveats = clearanceInfo.Caveats,
                ExpirationDate = clearanceInfo.ExpirationDate,
                Restrictions = restrictions.Where(r => r.Active).ToList(),
                Reason = !isActive ? "Clearance not active" :
                        !isNotExpired ? "Clearance expired" :
                        hasBlockingRestrictions ? "Active restrictions prevent access" : null,
                ValidationTime = DateTime.UtcNow
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to validate user clearance for user: {Username}", username);
            return new SecurityClearanceValidation
            {
                IsValid = false,
                ClearanceLevel = SecurityClearanceLevel.Public,
                Reason = "Validation error occurred",
                ValidationTime = DateTime.UtcNow
            };
        }
    }

    public async Task<SecurityClearanceInfo?> GetUserClearanceInfoAsync(string username)
    {
        try
        {
            // Get clearance data from Redis
            var clearanceData = await _redis.StringGetAsync($"clearance:{username}");
            if (!clearanceData.HasValue)
            {
                // If not in cache, get from primary data source and cache it
                var clearanceInfo = await FetchUserClearanceFromPrimarySourceAsync(username);
                if (clearanceInfo != null)
                {
                    await _redis.StringSetAsync($"clearance:{username}", JsonSerializer.Serialize(clearanceInfo), TimeSpan.FromHours(1));
                }
                return clearanceInfo;
            }

            return JsonSerializer.Deserialize<SecurityClearanceInfo>(clearanceData);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get security clearance info for user: {Username}", username);
            return null;
        }
    }

    public async Task<List<SecurityClearanceInfo>> GetAllUserClearancesAsync()
    {
        try
        {
            // In a real implementation, this would query the primary security clearance database
            // For now, return sample data
            var sampleClearances = new List<SecurityClearanceInfo>
            {
                new()
                {
                    Id = "clearance-001",
                    UserId = "current-user",
                    UserName = "John Doe",
                    ClearanceLevel = SecurityClearanceLevel.Secret,
                    Compartments = new List<string> { "SCI", "SAP" },
                    Caveats = new List<string> { "NOFORN", "ORCON" },
                    GrantedDate = DateTime.UtcNow.AddMonths(-18),
                    ExpirationDate = DateTime.UtcNow.AddYears(3),
                    IssuingAuthority = "Defense Security Service (DSS)",
                    InvestigationType = "SSBI",
                    PolygraphRequired = true,
                    PolygraphDate = DateTime.UtcNow.AddMonths(-18).AddDays(-5),
                    Status = ClearanceStatus.Active,
                    RenewalDue = false
                },
                new()
                {
                    Id = "clearance-002",
                    UserId = "admin-user",
                    UserName = "Jane Smith",
                    ClearanceLevel = SecurityClearanceLevel.TopSecret,
                    Compartments = new List<string> { "SCI", "SAP", "TK", "G", "HCS" },
                    Caveats = new List<string> { "NOFORN", "ORCON", "PROPIN" },
                    GrantedDate = DateTime.UtcNow.AddYears(-2),
                    ExpirationDate = DateTime.UtcNow.AddYears(2),
                    IssuingAuthority = "Central Intelligence Agency (CIA)",
                    InvestigationType = "SSBI-PR",
                    PolygraphRequired = true,
                    PolygraphDate = DateTime.UtcNow.AddYears(-2).AddDays(-10),
                    Status = ClearanceStatus.Active,
                    RenewalDue = false
                },
                new()
                {
                    Id = "clearance-003",
                    UserId = "ops-user",
                    UserName = "Mike Johnson",
                    ClearanceLevel = SecurityClearanceLevel.Confidential,
                    Compartments = new List<string>(),
                    Caveats = new List<string> { "NOFORN" },
                    GrantedDate = DateTime.UtcNow.AddMonths(-6),
                    ExpirationDate = DateTime.UtcNow.AddYears(9),
                    IssuingAuthority = "Department of Defense (DoD)",
                    InvestigationType = "NACLC",
                    PolygraphRequired = false,
                    Status = ClearanceStatus.Active,
                    RenewalDue = true
                }
            };

            return sampleClearances;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get all user clearances");
            return new List<SecurityClearanceInfo>();
        }
    }

    public async Task<AccessValidationResult> ValidateResourceAccessAsync(string username, string resource, string classification)
    {
        try
        {
            var clearanceValidation = await ValidateUserClearanceAsync(username);
            if (!clearanceValidation.IsValid)
            {
                return new AccessValidationResult
                {
                    IsAuthorized = false,
                    Reason = clearanceValidation.Reason,
                    UserClearanceLevel = clearanceValidation.ClearanceLevel,
                    ResourceClassification = ParseClassificationLevel(classification),
                    ValidationTime = DateTime.UtcNow
                };
            }

            var resourceClassificationLevel = ParseClassificationLevel(classification);
            var hasRequiredClearance = HasSufficientClearanceLevel(clearanceValidation.ClearanceLevel, resourceClassificationLevel);

            // Check compartment requirements
            var requiredCompartments = ExtractCompartmentsFromClassification(classification);
            var hasRequiredCompartments = await ValidateCompartmentAccessAsync(username, requiredCompartments);

            // Check caveats and handling restrictions
            var caveatsValidation = ValidateCaveatsCompliance(clearanceValidation.Caveats, classification);

            var isAuthorized = hasRequiredClearance && hasRequiredCompartments && caveatsValidation.IsValid;

            return new AccessValidationResult
            {
                IsAuthorized = isAuthorized,
                UserClearanceLevel = clearanceValidation.ClearanceLevel,
                ResourceClassification = resourceClassificationLevel,
                RequiredCompartments = requiredCompartments,
                UserCompartments = clearanceValidation.Compartments,
                CaveatsValidation = caveatsValidation,
                Reason = !isAuthorized ? DetermineAccessDenialReason(hasRequiredClearance, hasRequiredCompartments, caveatsValidation) : null,
                ValidationTime = DateTime.UtcNow
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to validate resource access for user: {Username}, resource: {Resource}", username, resource);
            return new AccessValidationResult
            {
                IsAuthorized = false,
                Reason = "Access validation error",
                ValidationTime = DateTime.UtcNow
            };
        }
    }

    public async Task<AccessRecord> LogAccessAttemptAsync(string username, string resource, string action, bool granted, string? reason = null)
    {
        try
        {
            var accessRecord = new AccessRecord
            {
                Id = Guid.NewGuid().ToString(),
                Username = username,
                Resource = resource,
                Action = action,
                Timestamp = DateTime.UtcNow,
                Granted = granted,
                Reason = reason,
                IPAddress = GetClientIPAddress(),
                UserAgent = GetClientUserAgent(),
                Location = await DetermineUserLocationAsync(username)
            };

            // Store in Redis with expiration
            await _redis.StringSetAsync(
                $"access_log:{accessRecord.Id}",
                JsonSerializer.Serialize(accessRecord),
                TimeSpan.FromDays(2555) // 7 years for government compliance
            );

            // Add to user's access history
            await _redis.ListLeftPushAsync($"access_history:{username}", accessRecord.Id);
            await _redis.ListTrimAsync($"access_history:{username}", 0, 999); // Keep last 1000 records

            // Log to government audit service
            await _auditService.LogGovernmentAccess(
                "RESOURCE_ACCESS_ATTEMPT",
                $"Resource: {resource}, Action: {action}, Status: {(granted ? "GRANTED" : "DENIED")}" + (reason != null ? $", Reason: {reason}" : ""),
                username
            );

            return accessRecord;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to log access attempt");
            throw;
        }
    }

    public async Task<List<AccessRecord>> GetUserAccessHistoryAsync(string username, int? limitDays = null)
    {
        try
        {
            var accessRecordIds = await _redis.ListRangeAsync($"access_history:{username}");
            var accessRecords = new List<AccessRecord>();

            var cutoffDate = limitDays.HasValue ? DateTime.UtcNow.AddDays(-limitDays.Value) : DateTime.MinValue;

            foreach (var recordId in accessRecordIds)
            {
                var recordData = await _redis.StringGetAsync($"access_log:{recordId}");
                if (recordData.HasValue)
                {
                    var record = JsonSerializer.Deserialize<AccessRecord>(recordData);
                    if (record != null && record.Timestamp >= cutoffDate)
                    {
                        accessRecords.Add(record);
                    }
                }
            }

            return accessRecords.OrderByDescending(r => r.Timestamp).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get user access history for: {Username}", username);
            return new List<AccessRecord>();
        }
    }

    public async Task<SecurityClearanceAuditResult> GenerateClearanceAuditAsync(string username)
    {
        try
        {
            var clearanceInfo = await GetUserClearanceInfoAsync(username);
            var accessHistory = await GetUserAccessHistoryAsync(username, 30);
            var restrictions = await GetUserRestrictionsAsync(username);

            return new SecurityClearanceAuditResult
            {
                Username = username,
                ClearanceInfo = clearanceInfo,
                AccessHistory = accessHistory,
                Restrictions = restrictions,
                AuditFindings = GenerateAuditFindings(clearanceInfo, accessHistory, restrictions),
                ComplianceStatus = DetermineClearanceCompliance(clearanceInfo, accessHistory),
                GeneratedAt = DateTime.UtcNow
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate clearance audit for user: {Username}", username);
            throw;
        }
    }

    public async Task<bool> ValidateCompartmentAccessAsync(string username, List<string> requiredCompartments)
    {
        try
        {
            if (!requiredCompartments.Any())
                return true;

            var clearanceValidation = await ValidateUserClearanceAsync(username);
            if (!clearanceValidation.IsValid)
                return false;

            return requiredCompartments.All(required => 
                clearanceValidation.Compartments.Contains(required, StringComparer.OrdinalIgnoreCase));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to validate compartment access for user: {Username}", username);
            return false;
        }
    }

    public async Task<SecurityRestriction[]> GetUserRestrictionsAsync(string username)
    {
        try
        {
            var restrictionsData = await _redis.StringGetAsync($"restrictions:{username}");
            if (!restrictionsData.HasValue)
            {
                // Return default restrictions if none specified
                return new[]
                {
                    new SecurityRestriction
                    {
                        Type = RestrictionType.Location,
                        Description = "Access from approved facilities only",
                        Parameters = new Dictionary<string, string> { { "approvedFacilities", "Facility-A,Facility-B" } },
                        Active = true
                    }
                };
            }

            return JsonSerializer.Deserialize<SecurityRestriction[]>(restrictionsData) ?? new SecurityRestriction[0];
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get user restrictions for: {Username}", username);
            return new SecurityRestriction[0];
        }
    }

    public async Task<ClearanceRenewalStatus> CheckRenewalStatusAsync(string username)
    {
        try
        {
            var clearanceInfo = await GetUserClearanceInfoAsync(username);
            if (clearanceInfo == null)
            {
                return new ClearanceRenewalStatus
                {
                    Username = username,
                    RenewalRequired = false,
                    Status = "No clearance found"
                };
            }

            var daysUntilExpiration = (clearanceInfo.ExpirationDate - DateTime.UtcNow).Days;
            var renewalThresholdDays = GetRenewalThresholdDays(clearanceInfo.ClearanceLevel);

            return new ClearanceRenewalStatus
            {
                Username = username,
                ClearanceLevel = clearanceInfo.ClearanceLevel,
                ExpirationDate = clearanceInfo.ExpirationDate,
                DaysUntilExpiration = daysUntilExpiration,
                RenewalRequired = daysUntilExpiration <= renewalThresholdDays,
                RenewalThresholdDays = renewalThresholdDays,
                Status = daysUntilExpiration <= 0 ? "EXPIRED" :
                        daysUntilExpiration <= renewalThresholdDays ? "RENEWAL_REQUIRED" : "CURRENT"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to check renewal status for user: {Username}", username);
            throw;
        }
    }

    public async Task<SecurityClearanceMetrics> GetClearanceMetricsAsync()
    {
        try
        {
            var allClearances = await GetAllUserClearancesAsync();
            var totalUsers = allClearances.Count;

            return new SecurityClearanceMetrics
            {
                TotalUsers = totalUsers,
                ActiveClearances = allClearances.Count(c => c.Status == ClearanceStatus.Active),
                ExpiredClearances = allClearances.Count(c => c.ExpirationDate <= DateTime.UtcNow),
                ClearancesNearingRenewal = allClearances.Count(c => 
                    (c.ExpirationDate - DateTime.UtcNow).Days <= GetRenewalThresholdDays(c.ClearanceLevel)),
                ClearanceDistribution = allClearances.GroupBy(c => c.ClearanceLevel)
                    .ToDictionary(g => g.Key.ToString(), g => g.Count()),
                TopSecretUsers = allClearances.Count(c => c.ClearanceLevel == SecurityClearanceLevel.TopSecret),
                SecretUsers = allClearances.Count(c => c.ClearanceLevel == SecurityClearanceLevel.Secret),
                ConfidentialUsers = allClearances.Count(c => c.ClearanceLevel == SecurityClearanceLevel.Confidential),
                PublicUsers = allClearances.Count(c => c.ClearanceLevel == SecurityClearanceLevel.Public)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get clearance metrics");
            throw;
        }
    }

    // Helper Methods
    private async Task<SecurityClearanceInfo?> FetchUserClearanceFromPrimarySourceAsync(string username)
    {
        // In a real implementation, this would query the primary security clearance database
        // For demo purposes, return sample data for known users
        return username switch
        {
            "current-user" => new SecurityClearanceInfo
            {
                Id = "clearance-001",
                UserId = username,
                UserName = "John Doe",
                ClearanceLevel = SecurityClearanceLevel.Secret,
                Compartments = new List<string> { "SCI", "SAP" },
                Caveats = new List<string> { "NOFORN", "ORCON" },
                GrantedDate = DateTime.UtcNow.AddMonths(-18),
                ExpirationDate = DateTime.UtcNow.AddYears(3),
                IssuingAuthority = "Defense Security Service (DSS)",
                InvestigationType = "SSBI",
                PolygraphRequired = true,
                PolygraphDate = DateTime.UtcNow.AddMonths(-18).AddDays(-5),
                Status = ClearanceStatus.Active,
                RenewalDue = false
            },
            _ => null
        };
    }

    private bool IsBlockingRestriction(SecurityRestriction restriction)
    {
        return restriction.Type == RestrictionType.Time && IsOutsideAllowedTime(restriction) ||
               restriction.Type == RestrictionType.Location && !IsFromApprovedLocation(restriction) ||
               restriction.Type == RestrictionType.Network && !IsFromApprovedNetwork(restriction);
    }

    private SecurityClearanceLevel ParseClassificationLevel(string classification)
    {
        var level = classification.Split('/')[0].ToUpperInvariant();
        return level switch
        {
            "PUBLIC" or "UNCLASSIFIED" => SecurityClearanceLevel.Public,
            "CONFIDENTIAL" => SecurityClearanceLevel.Confidential,
            "SECRET" => SecurityClearanceLevel.Secret,
            "TOP SECRET" or "TOPSECRET" => SecurityClearanceLevel.TopSecret,
            _ => SecurityClearanceLevel.Public
        };
    }

    private bool HasSufficientClearanceLevel(SecurityClearanceLevel userLevel, SecurityClearanceLevel requiredLevel)
    {
        return ClearanceLevelHierarchy[userLevel] >= ClearanceLevelHierarchy[requiredLevel];
    }

    private List<string> ExtractCompartmentsFromClassification(string classification)
    {
        var parts = classification.Split('/', StringSplitOptions.RemoveEmptyEntries);
        return parts.Skip(1).ToList();
    }

    private CaveatsValidation ValidateCaveatsCompliance(List<string> userCaveats, string classification)
    {
        var requiredCaveats = ExtractCaveatsFromClassification(classification);
        var missingCaveats = requiredCaveats.Where(required => !userCaveats.Contains(required)).ToList();

        return new CaveatsValidation
        {
            IsValid = !missingCaveats.Any(),
            RequiredCaveats = requiredCaveats,
            UserCaveats = userCaveats,
            MissingCaveats = missingCaveats
        };
    }

    private List<string> ExtractCaveatsFromClassification(string classification)
    {
        // Extract caveats like NOFORN, ORCON from classification markings
        var caveats = new List<string>();
        if (classification.Contains("NOFORN")) caveats.Add("NOFORN");
        if (classification.Contains("ORCON")) caveats.Add("ORCON");
        if (classification.Contains("PROPIN")) caveats.Add("PROPIN");
        return caveats;
    }

    private string DetermineAccessDenialReason(bool hasRequiredClearance, bool hasRequiredCompartments, CaveatsValidation caveatsValidation)
    {
        if (!hasRequiredClearance) return "Insufficient clearance level";
        if (!hasRequiredCompartments) return "Missing required compartments";
        if (!caveatsValidation.IsValid) return $"Missing required caveats: {string.Join(", ", caveatsValidation.MissingCaveats)}";
        return "Access denied";
    }

    private string GetClientIPAddress() => "192.168.1.100"; // Placeholder
    private string GetClientUserAgent() => "TerraFusion-Client/1.0"; // Placeholder
    private async Task<string> DetermineUserLocationAsync(string username) => "Facility-A"; // Placeholder

    private List<AuditFinding> GenerateAuditFindings(SecurityClearanceInfo? clearanceInfo, List<AccessRecord> accessHistory, SecurityRestriction[] restrictions)
    {
        var findings = new List<AuditFinding>();

        // Check for unusual access patterns
        if (accessHistory.Any(r => !r.Granted && r.Reason?.Contains("clearance") == true))
        {
            findings.Add(new AuditFinding
            {
                Severity = "Medium",
                Description = "User attempted to access resources above their clearance level",
                Recommendation = "Review user training on classification levels and access protocols"
            });
        }

        return findings;
    }

    private string DetermineClearanceCompliance(SecurityClearanceInfo? clearanceInfo, List<AccessRecord> accessHistory)
    {
        if (clearanceInfo == null) return "Non-Compliant: No clearance found";
        if (clearanceInfo.ExpirationDate <= DateTime.UtcNow) return "Non-Compliant: Clearance expired";
        if (clearanceInfo.Status != ClearanceStatus.Active) return "Non-Compliant: Clearance not active";
        return "Compliant";
    }

    private int GetRenewalThresholdDays(SecurityClearanceLevel level)
    {
        return level switch
        {
            SecurityClearanceLevel.TopSecret => 365, // 1 year
            SecurityClearanceLevel.Secret => 180,    // 6 months
            SecurityClearanceLevel.Confidential => 90, // 3 months
            _ => 30
        };
    }

    private bool IsOutsideAllowedTime(SecurityRestriction restriction) => false; // Placeholder
    private bool IsFromApprovedLocation(SecurityRestriction restriction) => true; // Placeholder
    private bool IsFromApprovedNetwork(SecurityRestriction restriction) => true; // Placeholder
}