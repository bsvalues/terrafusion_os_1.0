# Phase 4 Follow-Up Tickets

**Context**: PR #314 implements Phase 4 auth security hardening. Two critical production requirements must be addressed post-merge.

---

## Ticket 1: Auth Security State Storage Migration (CRITICAL - Production Blocker)

**Priority**: 🔴 **P0 - Production Blocker**  
**Labels**: `security`, `production-readiness`, `redis`, `infrastructure`  
**Assignee**: Backend Infrastructure Team  
**Milestone**: Pre-Production Deployment

### Problem Statement

Phase 4 authentication security features currently use **in-memory storage** for:
1. Account lockout counters (`_loginAttempts`)
2. Revoked token tracking (`_revokedTokens`)
3. Password history (`_passwordHistory`)

**Production Risk**: All security state is lost on application restart, creating:
- **Lockout bypass**: Users can circumvent account lockout by forcing restart
- **Token revocation bypass**: Revoked tokens become valid after restart
- **Password reuse vulnerability**: Password history is cleared on restart

### Acceptance Criteria

**MUST**:
- [ ] Migrate `_loginAttempts` to Redis with TTL (15-minute lockout duration)
- [ ] Migrate `_revokedTokens` to Redis HashSet (TTL = token expiration)
- [ ] Migrate `_passwordHistory` to SQL Server table with indexed lookups
- [ ] Add Redis health check to SEAL gate
- [ ] Add SQL health check for password history table
- [ ] All 7 Phase 4 security tests pass with Redis/SQL backing
- [ ] Load testing: 1000 concurrent auth requests maintain lockout integrity

**SHOULD**:
- [ ] Add Redis failover strategy (fallback to SQL for critical operations)
- [ ] Add metrics: redis operation latency, cache hit rate, SQL query time
- [ ] Add observability: lockout events, revocation events, password history queries

**WON'T** (explicitly out of scope):
- [ ] Distributed cache (multi-region) - defer to Phase 6

### Implementation Plan

#### 1. Redis Storage (Lockout + Revocation)

**File**: `backend/TerraFusion.Security/Storage/RedisAuthSecurityStore.cs`

```csharp
public class RedisAuthSecurityStore : IAuthSecurityStore
{
    private readonly IConnectionMultiplexer _redis;
    private readonly IDatabase _db;

    // Lockout: key = "lockout:{username}", value = JSON(attempts, lockedUntil)
    public async Task<LockoutState> GetLockoutStateAsync(string username)
    {
        var key = $"lockout:{username}";
        var value = await _db.StringGetAsync(key);
        return value.HasValue ? JsonSerializer.Deserialize<LockoutState>(value) : null;
    }

    public async Task SetLockoutStateAsync(string username, LockoutState state, TimeSpan ttl)
    {
        var key = $"lockout:{username}";
        await _db.StringSetAsync(key, JsonSerializer.Serialize(state), ttl);
    }

    // Revocation: key = "revoked:{jti}", value = "1" (flag), TTL = token lifetime
    public async Task<bool> IsTokenRevokedAsync(string jti)
    {
        var key = $"revoked:{jti}";
        return await _db.KeyExistsAsync(key);
    }

    public async Task RevokeTokenAsync(string jti, TimeSpan tokenLifetime)
    {
        var key = $"revoked:{jti}";
        await _db.StringSetAsync(key, "1", tokenLifetime);
    }
}
```

**Configuration** (`appsettings.Production.json`):

```json
{
  "Redis": {
    "ConnectionString": "${REDIS_CONNECTION_STRING}",
    "Database": 1,
    "HealthCheck": {
      "Enabled": true,
      "Timeout": "2s"
    }
  }
}
```

**Registration** (`Program.cs`):

```csharp
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration["Redis:ConnectionString"];
});
builder.Services.AddSingleton<IAuthSecurityStore, RedisAuthSecurityStore>();
```

#### 2. SQL Storage (Password History)

**Migration**:

```sql
CREATE TABLE PasswordHistory (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    UserId NVARCHAR(450) NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    INDEX IX_PasswordHistory_UserId_CreatedAt (UserId, CreatedAt DESC)
);
```

**Entity** (`TerraFusion.Core/Entities/PasswordHistory.cs`):

```csharp
public class PasswordHistory
{
    public long Id { get; set; }
    public string UserId { get; set; }
    public string PasswordHash { get; set; }
    public DateTime CreatedAt { get; set; }
}
```

**Repository** (`TerraFusion.Data/Repositories/PasswordHistoryRepository.cs`):

```csharp
public class PasswordHistoryRepository : IPasswordHistoryRepository
{
    private readonly TerraFusionDbContext _context;

    public async Task<List<string>> GetRecentPasswordHashesAsync(string userId, int count)
    {
        return await _context.PasswordHistories
            .Where(ph => ph.UserId == userId)
            .OrderByDescending(ph => ph.CreatedAt)
            .Take(count)
            .Select(ph => ph.PasswordHash)
            .ToListAsync();
    }

    public async Task SavePasswordHashAsync(string userId, string passwordHash)
    {
        _context.PasswordHistories.Add(new PasswordHistory
        {
            UserId = userId,
            PasswordHash = passwordHash,
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        // Cleanup: keep only last 5 per user
        var toDelete = await _context.PasswordHistories
            .Where(ph => ph.UserId == userId)
            .OrderByDescending(ph => ph.CreatedAt)
            .Skip(5)
            .ToListAsync();
        _context.PasswordHistories.RemoveRange(toDelete);
        await _context.SaveChangesAsync();
    }
}
```

#### 3. Feature Flag (Safe Rollout)

**Environment Variable**:

```bash
USE_REDIS_AUTH_STORE=true
USE_SQL_PASSWORD_HISTORY=true
```

**Registration Logic**:

```csharp
if (builder.Configuration.GetValue<bool>("USE_REDIS_AUTH_STORE"))
{
    services.AddSingleton<IAuthSecurityStore, RedisAuthSecurityStore>();
}
else
{
    services.AddSingleton<IAuthSecurityStore, InMemoryAuthSecurityStore>();
    _logger.LogWarning("Using in-memory auth store - NOT FOR PRODUCTION");
}
```

#### 4. Testing

**Integration Test** (`TerraFusion.Security.Tests/RedisAuthStoreTests.cs`):

```csharp
[Fact]
public async Task RevokeToken_PersistsAcrossRestarts()
{
    // Arrange
    var store = new RedisAuthSecurityStore(_redis);
    var jti = "test-jti-123";

    // Act: Revoke token
    await store.RevokeTokenAsync(jti, TimeSpan.FromHours(1));

    // Simulate restart: create new store instance
    var newStore = new RedisAuthSecurityStore(_redis);
    var isRevoked = await newStore.IsTokenRevokedAsync(jti);

    // Assert: Revocation persisted
    Assert.True(isRevoked);
}
```

**Load Test** (k6 script):

```javascript
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 100 },  // Ramp to 100 users
    { duration: '1m', target: 1000 },  // Ramp to 1000 users
    { duration: '30s', target: 0 }     // Ramp down
  ]
};

export default function() {
  // Test: 5 consecutive failed logins trigger lockout
  for (let i = 0; i < 5; i++) {
    http.post('https://api.terrafusion.gov/auth/login', {
      username: `user-${__VU}`,  // Unique per virtual user
      password: 'WrongPassword'
    });
  }

  // 6th attempt should be rejected due to lockout
  let res = http.post('https://api.terrafusion.gov/auth/login', {
    username: `user-${__VU}`,
    password: 'CorrectPassword'
  });

  check(res, {
    'lockout enforced': (r) => r.status === 429,  // Too Many Requests
    'lockout message': (r) => r.json('error') === 'Account is locked due to too many failed login attempts'
  });
}
```

### Testing Plan

**Pre-Deployment**:
1. Spin up Redis container: `docker run -d -p 6379:6379 redis:7-alpine`
2. Run integration tests: `dotnet test --filter "RedisAuthStoreTests"`
3. Run load test: `k6 run load-test-auth-lockout.js`
4. Verify Redis keys via `redis-cli KEYS lockout:*`
5. Verify SQL password history: `SELECT * FROM PasswordHistory ORDER BY CreatedAt DESC`

**Post-Deployment**:
1. Monitor Redis hit rate: `INFO stats` → `keyspace_hits / (keyspace_hits + keyspace_misses)`
2. Monitor SQL query latency: Application Insights → Dependency telemetry
3. Alert on Redis connection failures: `IConnectionMultiplexer.ConnectionFailed` event

### Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Redis connection failure | Medium | High | Fallback to SQL for lockout; alert + auto-scale |
| Redis memory exhaustion | Low | High | Set max memory policy (`allkeys-lru`), monitor via Prometheus |
| SQL table bloat (password history) | Medium | Low | Cleanup job: delete entries older than 1 year |
| Distributed cache inconsistency | Low | Medium | Use single Redis instance per region (no replication delay) |

### Definition of Done

- [ ] Code changes merged to `main`
- [ ] Redis integration tests passing in CI
- [ ] Load test shows 1000 concurrent users maintain lockout integrity
- [ ] Deployment runbook updated with Redis/SQL prerequisites
- [ ] Production environment variables configured (`USE_REDIS_AUTH_STORE=true`)
- [ ] Monitoring dashboards include Redis + password history SQL metrics
- [ ] Incident response runbook includes "Redis down" scenario

---

## Ticket 2: FIPS 140-2 Cryptographic Validation Evidence (COMPLIANCE)

**Priority**: 🟡 **P1 - Pre-Audit Required**  
**Labels**: `security`, `compliance`, `fisma`, `crypto`, `documentation`  
**Assignee**: Security Compliance Team  
**Milestone**: FISMA-HIGH Accreditation

### Problem Statement

Phase 4 documentation claims **"FIPS 140-2 compliant cryptography"** based on algorithm choice (`HMAC-SHA512` for JWT signing, `PBKDF2` for password hashing). However:

**Gap**: Using FIPS-approved algorithms ≠ FIPS 140-2 compliance

**NIST Requirement** (FIPS 140-2 § 4.1): Cryptographic operations must be performed by a **validated cryptographic module** listed on the [NIST CMVP](https://csrc.nist.gov/projects/cryptographic-module-validation-program/validated-modules).

### Acceptance Criteria

**MUST**:
- [ ] Document the cryptographic module used in production (Windows: `bcrypt.dll`, Linux: OpenSSL FIPS module, Azure: KMS)
- [ ] Provide CMVP certificate number for the module in use
- [ ] Verify FIPS mode is enabled in production OS (Windows: `fips.bat`, Linux: `openssl fipsinstall`)
- [ ] Add startup validation: assert FIPS mode is enabled, fail to start if not
- [ ] Update `phase4-fisma-closure.md` with module evidence
- [ ] Add FIPS validation to quarterly security audit checklist

**SHOULD**:
- [ ] Add integration test: verify crypto calls use FIPS-validated module
- [ ] Document key rotation procedures (JWT signing key, password hash salt)

**WON'T** (explicitly out of scope):
- [ ] Hardware Security Module (HSM) integration - defer to Phase 7 (Federal Deployment)

### Implementation Plan

#### 1. Identify Cryptographic Module

**Windows Production Environment**:

```powershell
# Check if FIPS mode is enabled
Get-ItemProperty -Path "HKLM:\System\CurrentControlSet\Control\Lsa\FipsAlgorithmPolicy" -Name Enabled

# Expected output: Enabled = 1
```

**Module**: `bcrypt.dll` (Windows CNG)  
**CMVP Certificate**: [#3197](https://csrc.nist.gov/projects/cryptographic-module-validation-program/certificate/3197) (Windows 10/Server 2019 CNG)

**Linux Production Environment**:

```bash
# Check if OpenSSL is in FIPS mode
openssl version -a | grep FIPS

# Expected output: FIPS mode: enabled
```

**Module**: OpenSSL FIPS Object Module  
**CMVP Certificate**: [#4282](https://csrc.nist.gov/projects/cryptographic-module-validation-program/certificate/4282) (OpenSSL 3.0 FIPS Module)

**Azure Key Vault** (if used for JWT signing):

**Module**: Azure Key Vault (FIPS 140-2 Level 2 validated)  
**CMVP Certificate**: [#4218](https://csrc.nist.gov/projects/cryptographic-module-validation-program/certificate/4218)

#### 2. Startup Validation

**File**: `backend/TerraFusion.API/Extensions/FipsValidationExtensions.cs`

```csharp
public static class FipsValidationExtensions
{
    public static IServiceCollection AddFipsValidation(this IServiceCollection services)
    {
        services.AddHostedService<FipsValidationService>();
        return services;
    }
}

public class FipsValidationService : IHostedService
{
    private readonly ILogger<FipsValidationService> _logger;
    private readonly IConfiguration _configuration;

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        var requireFips = _configuration.GetValue<bool>("Security:RequireFipsMode", true);
        if (!requireFips)
        {
            _logger.LogWarning("FIPS mode validation DISABLED - not suitable for production");
            return;
        }

        bool isFipsModeEnabled = false;

        if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
        {
            // Check Windows FIPS registry key
            using var key = Registry.LocalMachine.OpenSubKey(
                @"System\CurrentControlSet\Control\Lsa\FipsAlgorithmPolicy");
            isFipsModeEnabled = key?.GetValue("Enabled") as int? == 1;
        }
        else if (RuntimeInformation.IsOSPlatform(OSPlatform.Linux))
        {
            // Check OpenSSL FIPS mode (requires native call or openssl CLI)
            var process = Process.Start(new ProcessStartInfo
            {
                FileName = "openssl",
                Arguments = "version -a",
                RedirectStandardOutput = true
            });
            var output = await process.StandardOutput.ReadToEndAsync(cancellationToken);
            isFipsModeEnabled = output.Contains("FIPS mode: enabled");
        }

        if (!isFipsModeEnabled)
        {
            _logger.LogCritical("FIPS mode is NOT enabled. Production deployment blocked.");
            throw new InvalidOperationException(
                "FIPS mode is required for FISMA-HIGH compliance. Enable FIPS mode on the host OS.");
        }

        _logger.LogInformation("✅ FIPS mode validated: Cryptographic module is FIPS 140-2 compliant");
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
```

**Registration** (`Program.cs`):

```csharp
builder.Services.AddFipsValidation();
```

#### 3. Update Compliance Documentation

**File**: `docs/compliance/phase4-fisma-closure.md`

Add section:

```markdown
### SC-13: Cryptographic Protection - FIPS 140-2 Validation Evidence

**Deployment Environment**: Windows Server 2022 on Azure Government Cloud

**Cryptographic Module**: Windows Cryptographic Next Generation (CNG)  
**Module Name**: `bcrypt.dll`  
**CMVP Certificate**: [#3197](https://csrc.nist.gov/projects/cryptographic-module-validation-program/certificate/3197)  
**Validation Date**: 2020-06-15  
**Level**: FIPS 140-2 Level 1

**FIPS Mode Configuration**:
- Registry Key: `HKLM:\System\CurrentControlSet\Control\Lsa\FipsAlgorithmPolicy`
- Enabled: `1`
- Verified at startup via `FipsValidationService`

**Algorithms in Use**:
| Algorithm | Purpose | FIPS Approved | CMVP Cert |
|-----------|---------|---------------|-----------|
| HMAC-SHA512 | JWT signing | ✅ Yes | [#3197](https://csrc.nist.gov/projects/cryptographic-module-validation-program/certificate/3197) |
| PBKDF2-SHA256 | Password hashing | ✅ Yes | [#3197](https://csrc.nist.gov/projects/cryptographic-module-validation-program/certificate/3197) |
| AES-256-GCM | Data encryption | ✅ Yes | [#3197](https://csrc.nist.gov/projects/cryptographic-module-validation-program/certificate/3197) |

**Audit Evidence**:
- Startup log: "✅ FIPS mode validated: Cryptographic module is FIPS 140-2 compliant"
- OS configuration screenshot: FIPS registry key enabled
- Module version: `bcrypt.dll` version 10.0.19041.1 (verified via `sigcheck.exe`)
```

#### 4. Testing

**Integration Test**:

```csharp
[Fact]
public void Startup_FailsIfFipsModeDisabled()
{
    // Arrange: Mock Registry to return FIPS disabled
    Environment.SetEnvironmentVariable("Security__RequireFipsMode", "true");

    // Act & Assert
    var ex = Assert.Throws<InvalidOperationException>(() =>
    {
        var host = Host.CreateDefaultBuilder()
            .ConfigureServices(services => services.AddFipsValidation())
            .Build();
        host.Start();
    });

    Assert.Contains("FIPS mode is required", ex.Message);
}
```

### Definition of Done

- [ ] Cryptographic module identified and documented (CMVP cert number)
- [ ] FIPS mode validation runs at startup (fails if disabled)
- [ ] `phase4-fisma-closure.md` updated with module evidence table
- [ ] Integration test verifies FIPS enforcement
- [ ] Deployment runbook includes "Enable FIPS mode" step (with OS-specific instructions)
- [ ] Quarterly audit checklist includes FIPS validation check

---

## Summary

**Ticket 1 (Redis/SQL migration)**: ⏳ **Estimated effort**: 40 hours (2 sprints)  
**Ticket 2 (FIPS validation)**: ⏳ **Estimated effort**: 16 hours (1 sprint)

**Total**: 56 hours (3 sprints) to bring Phase 4 to production-ready compliance standard.

**Dependencies**:
- Ticket 1 blocks production deployment
- Ticket 2 blocks FISMA-HIGH accreditation audit

**Next Steps** (after PR #314 merge):
1. ✅ Merge PR #314 to `main`
2. 🎫 Create GitHub issues from these tickets
3. 🔒 Mark Phase 4 branch as "deployed to staging, blocked for production pending Tickets 1 & 2"
4. 📊 Add to security roadmap dashboard
