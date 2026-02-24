namespace TerraFusion.Core.Configuration;

/// <summary>
/// Phase 4 Sprint 1: Feature flags for NIST 800-63B hardening
/// All flags default OFF (no behavior change until explicitly enabled)
/// </summary>
public class FeatureFlagsOptions
{
    /// <summary>
    /// Enable progressive account lockout (NIST 800-63B AC-2(4))
    /// Default: false (Sprint 1 no behavior change)
    /// </summary>
    public bool UseAccountLockout { get; set; } = false;
    
    /// <summary>
    /// Enable password history validation (NIST 800-63B AC-2(7))
    /// Default: false (Sprint 1 no behavior change)
    /// </summary>
    public bool UsePasswordHistory { get; set; } = false;
    
    /// <summary>
    /// Enable common password deny list check
    /// Default: false (Sprint 1 no behavior change)
    /// </summary>
    public bool UseCommonPasswordCheck { get; set; } = false;
    
    /// <summary>
    /// Enforce FIPS 140-2 crypto validation at startup
    /// Default: false (dev), true (prod after validation)
    /// </summary>
    public bool EnforceFipsCompliance { get; set; } = false;
}
