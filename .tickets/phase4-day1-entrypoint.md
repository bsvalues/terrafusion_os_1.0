# Phase 4: Day 1 Entry Point (NIST 800-63B Auth Hardening)

**Status:** ✅ Ready to Start  
**Context:** PR #315 merged, governance restored, orphan scanner enforced  
**Branch:** `main` @ `c83393d0c`  
**Created:** 2026-02-13

---

## 🎯 Executive Summary

Phase 4 proper implementation adds NIST 800-63B authentication hardening to the **existing compiled auth infrastructure** in `TerraFusion.Core`. This is NOT a standalone project – all changes integrate into the current auth service, controllers, and database context.

**Key Architectural Findings:**
- ✅ Auth infrastructure is production-ready (`IAuthenticationService`, `AuthenticationService`)
- ✅ Redis already wired via `IDistributedCache` (token blacklisting works)
- ✅ SQL audit log exists (`AuditLog` entity with comprehensive fields)
- ✅ All required packages present (StackExchange.Redis, EF Core, JWT)

**What's Missing (Phase 4 Scope):**
- ❌ Account lockout tracking (progressive: 3→15min, 5→1hr, 10→admin)
- ❌ Password history validation (reject last 5 hashes)
- ❌ Common password deny list
- ❌ Enhanced audit logging for auth events (LOGIN_FAILED, ACCOUNT_LOCKED, etc.)
- ❌ FIPS crypto validation health check

---

## 📁 Existing Infrastructure Audit

### Primary Auth Service

**Location:** `backend/src/TerraFusion.Core/Services/`

**Interface:** `IAuthenticationService.cs`
```csharp
public interface IAuthenticationService
{
    Task<string> GenerateJwtTokenAsync(string userId, string email, IEnumerable<string> roles);
    Task<ClaimsPrincipal?> ValidateTokenAsync(string token);
    Task<(string AccessToken, string RefreshToken)> GenerateTokenPairAsync(...);
    Task<bool> ValidateRefreshTokenAsync(string userId, string refreshToken);
    Task RevokeRefreshTokenAsync(string userId, string refreshToken);
    Task RevokeAllUserTokensAsync(string userId, string reason);
    Task<bool> IsTokenBlacklistedAsync(string token);
    Task BlacklistTokenAsync(string token, DateTime expiresAt);
}
```

**Implementation:** `AuthenticationService.cs`
- Uses `IDistributedCache` (Redis-backed)
- Already has token blacklisting (AC-2(5) partial implementation)
- Already has refresh token revocation

**Phase 4 Addition:** Extend service with lockout/password history methods.

---

### Controllers & Endpoints

**Location:** `backend/src/TerraFusion.API/Controllers/AuthController.cs`

**Existing Endpoints:**
- `POST /api/auth/login` → Login with credentials
- `POST /api/auth/refresh-token` → Refresh access token

**Phase 4 Addition:**
- Hook lockout check before login attempt
- Hook password history validation on password change
- Emit audit events for all auth operations

---

### Database Entities

**Location:** `backend/src/TerraFusion.Core/Entities/CoreEntities.cs`

**GovernmentUser Entity:**
```csharp
public class GovernmentUser
{
    public Guid Id { get; set; }
    public required string Email { get; set; }
    public string? PasswordHash { get; set; }
    public DateTime LastLoginAt { get; set; }
    public Guid? CountyId { get; set; }
    // ... (FirstName, LastName, Role, etc.)
}
```

**AuditLog Entity:**
```csharp
public class AuditLog
{
    public Guid Id { get; set; }
    public required string Type { get; set; }      // e.g., "LOGIN_FAILED", "ACCOUNT_LOCKED"
    public string? Data { get; set; }              // JSON metadata
    public DateTime Timestamp { get; set; }
    public string? UserId { get; set; }
    public string? UserEmail { get; set; }
    public string? IpAddress { get; set; }
    public string? CorrelationId { get; set; }
    public string? Severity { get; set; }          // Info, Warning, Error, Critical
    // ... (UserAgent, RequestPath, ResponseStatusCode, etc.)
}
```

**Phase 4 Addition:** Create `PasswordHistory` entity.

---

### Dependencies (Already Present)

**TerraFusion.Core.csproj** packages:
- ✅ `StackExchange.Redis` (lockout + revocation storage)
- ✅ `Microsoft.EntityFrameworkCore` (password history)
- ✅ `Npgsql.EntityFrameworkCore.PostgreSQL` (production SQL)
- ✅ `Microsoft.Data.Sqlite` (dev/test SQL)
- ✅ `System.IdentityModel.Tokens.Jwt` (token generation)

**No new packages required.**

---

## 📋 Phase 4 Implementation Checklist

### Sprint 1: Storage Layer + Plumbing (8 hours)

**Goal:** Add durable stores for lockout/history/revocation with feature flags OFF.

**Tasks:**
- [ ] Create `PasswordHistory` entity (SQL)
  ```csharp
  public class PasswordHistory
  {
      public Guid Id { get; set; }
      public Guid UserId { get; set; }
      public required string PasswordHash { get; set; }
      public DateTime CreatedAt { get; set; }
  }
  ```
  - EF Migration: `dotnet ef migrations add AddPasswordHistory`
  - Index: `(UserId, CreatedAt DESC)`

- [ ] Create storage interfaces:
  ```csharp
  public interface ILockoutStore
  {
      Task<int> GetFailedAttemptsAsync(Guid userId);
      Task IncrementFailedAttemptsAsync(Guid userId);
      Task ResetFailedAttemptsAsync(Guid userId);
      Task<DateTime?> GetLockoutExpiryAsync(Guid userId);
      Task SetLockoutAsync(Guid userId, DateTime expiresAt);
  }

  public interface IPasswordHistoryStore
  {
      Task AddPasswordHashAsync(Guid userId, string passwordHash);
      Task<List<string>> GetRecentPasswordHashesAsync(Guid userId, int count = 5);
  }
  ```

- [ ] Implement `RedisLockoutStore` (uses `IDistributedCache`)
  - Key pattern: `lockout:{userId}` → `{ attempts: 3, lockedUntil: "2026-02-13T10:00:00Z" }`
  - TTL: 1 hour after last lockout

- [ ] Implement `SqlPasswordHistoryStore` (uses `DbContext`)
  - Add password hash to history on password change
  - Query last 5 hashes for validation
  - Auto-prune history older than 90 days

- [ ] Add feature flags (appsettings.json):
  ```json
  "FeatureFlags": {
    "UseAccountLockout": false,
    "UsePasswordHistory": false,
    "UseCommonPasswordCheck": false,
    "EnforceFipsCompliance": false
  }
  ```

- [ ] Wire into DI container (`Program.cs` or DI extensions):
  ```csharp
  services.AddScoped<ILockoutStore, RedisLockoutStore>();
  services.AddScoped<IPasswordHistoryStore, SqlPasswordHistoryStore>();
  ```

- [ ] Write storage layer tests:
  - `RedisLockoutStoreTests.cs` (unit tests with Redis mock/testcontainers)
  - `SqlPasswordHistoryStoreTests.cs` (integration tests with SQLite)

**Acceptance:** Storage tests green, feature flags OFF (no behavior change yet).

---

### Sprint 2: Account Lockout (AC-2(4)) (16 hours)

**Goal:** Implement progressive lockout with Redis tracking.

**Tasks:**
- [ ] Extend `AuthenticationService` with lockout methods:
  ```csharp
  public async Task<bool> IsLockedOutAsync(Guid userId)
  {
      if (!_featureFlags.UseAccountLockout) return false;
      var expiry = await _lockoutStore.GetLockoutExpiryAsync(userId);
      return expiry.HasValue && expiry.Value > DateTime.UtcNow;
  }

  private async Task HandleFailedLoginAsync(Guid userId)
  {
      if (!_featureFlags.UseAccountLockout) return;
      
      var attempts = await _lockoutStore.IncrementFailedAttemptsAsync(userId);
      
      if (attempts >= 10) // Admin unlock required
      {
          await _lockoutStore.SetLockoutAsync(userId, DateTime.MaxValue);
          await _auditLogger.LogAsync("ACCOUNT_LOCKED_PERMANENT", new { userId, attempts });
      }
      else if (attempts >= 5) // 1 hour
      {
          await _lockoutStore.SetLockoutAsync(userId, DateTime.UtcNow.AddHours(1));
          await _auditLogger.LogAsync("ACCOUNT_LOCKED_1HR", new { userId, attempts });
      }
      else if (attempts >= 3) // 15 minutes
      {
          await _lockoutStore.SetLockoutAsync(userId, DateTime.UtcNow.AddMinutes(15));
          await _auditLogger.LogAsync("ACCOUNT_LOCKED_15MIN", new { userId, attempts });
      }
  }
  ```

- [ ] Hook into `AuthController.Login`:
  ```csharp
  // Before credential validation
  if (await _authService.IsLockedOutAsync(user.Id))
  {
      await _auditLogger.LogAsync("LOGIN_DENIED_LOCKOUT", new { userId = user.Id });
      return Unauthorized(new { error = "Account temporarily locked" });
  }

  // After failed login
  if (credentialsFailed)
  {
      await _authService.HandleFailedLoginAsync(user.Id);
      return Unauthorized(new { error = "Invalid credentials" });
  }

  // After successful login
  await _authService.ResetFailedAttemptsAsync(user.Id);
  ```

- [ ] Add admin unlock endpoint:
  ```csharp
  [HttpPost("unlock/{userId}")]
  [Authorize(Roles = "Admin")]
  public async Task<IActionResult> UnlockAccount(Guid userId)
  {
      await _lockoutStore.ResetFailedAttemptsAsync(userId);
      await _auditLogger.LogAsync("ACCOUNT_UNLOCKED_ADMIN", new { userId, adminId = User.FindFirst("sub")?.Value });
      return Ok();
  }
  ```

- [ ] Write lockout tests:
  - `AccountLockoutTests.cs` (unit tests: 3/5/10 attempt thresholds)
  - `LockoutIntegrationTests.cs` (E2E: login fails → locked → wait → retry)

**Acceptance:** Feature flag ON → 3 failed logins = 15min lockout, audit events emitted.

---

### Sprint 3: Password History (AC-2(7)) (12 hours)

**Goal:** Reject reuse of last 5 passwords.

**Tasks:**
- [ ] Extend `AuthenticationService` with password history validation:
  ```csharp
  public async Task<bool> IsPasswordInHistoryAsync(Guid userId, string newPassword)
  {
      if (!_featureFlags.UsePasswordHistory) return false;
      
      var recentHashes = await _passwordHistoryStore.GetRecentPasswordHashesAsync(userId, 5);
      
      foreach (var oldHash in recentHashes)
      {
          if (_passwordHasher.VerifyHashedPassword(null, oldHash, newPassword) == PasswordVerificationResult.Success)
          {
              return true;
          }
      }
      
      return false;
  }

  public async Task AddPasswordToHistoryAsync(Guid userId, string passwordHash)
  {
      if (!_featureFlags.UsePasswordHistory) return;
      await _passwordHistoryStore.AddPasswordHashAsync(userId, passwordHash);
  }
  ```

- [ ] Hook into password change endpoint (create if missing):
  ```csharp
  [HttpPost("change-password")]
  [Authorize]
  public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
  {
      var userId = Guid.Parse(User.FindFirst("sub")?.Value);
      
      if (await _authService.IsPasswordInHistoryAsync(userId, request.NewPassword))
      {
          await _auditLogger.LogAsync("PASSWORD_CHANGE_DENIED_HISTORY", new { userId });
          return BadRequest(new { error = "Cannot reuse recent passwords" });
      }
      
      var newHash = _passwordHasher.HashPassword(null, request.NewPassword);
      await _userService.UpdatePasswordAsync(userId, newHash);
      await _authService.AddPasswordToHistoryAsync(userId, newHash);
      
      await _auditLogger.LogAsync("PASSWORD_CHANGED", new { userId });
      return Ok();
  }
  ```

- [ ] Add common password check (NIST 800-63B Appendix A):
  ```csharp
  // Use NuGet package: "HaveIBeenPwned.Client" or maintain local list
  public async Task<bool> IsCommonPasswordAsync(string password)
  {
      if (!_featureFlags.UseCommonPasswordCheck) return false;
      
      // Check against top 10,000 common passwords
      return _commonPasswordList.Contains(password);
  }
  ```

- [ ] Write password history tests:
  - `PasswordHistoryValidationTests.cs` (reject last 5, accept 6th)
  - `CommonPasswordCheckTests.cs` (deny "password123", "admin", etc.)

**Acceptance:** Feature flag ON → Cannot reuse last 5 passwords, audit events emitted.

---

### Sprint 4: Enhanced Audit Logging (AU-12) (8 hours)

**Goal:** Emit audit events for all auth operations.

**Tasks:**
- [ ] Define auth event types (constants):
  ```csharp
  public static class AuthAuditEventTypes
  {
      public const string LOGIN_SUCCESS = "AUTH:LOGIN_SUCCESS";
      public const string LOGIN_FAILED = "AUTH:LOGIN_FAILED";
      public const string ACCOUNT_LOCKED_15MIN = "AUTH:ACCOUNT_LOCKED_15MIN";
      public const string ACCOUNT_LOCKED_1HR = "AUTH:ACCOUNT_LOCKED_1HR";
      public const string ACCOUNT_LOCKED_PERMANENT = "AUTH:ACCOUNT_LOCKED_PERMANENT";
      public const string ACCOUNT_UNLOCKED_ADMIN = "AUTH:ACCOUNT_UNLOCKED_ADMIN";
      public const string PASSWORD_CHANGED = "AUTH:PASSWORD_CHANGED";
      public const string PASSWORD_CHANGE_DENIED_HISTORY = "AUTH:PASSWORD_DENIED_HISTORY";
      public const string TOKEN_REVOKED = "AUTH:TOKEN_REVOKED";
      public const string TOKEN_REFRESHED = "AUTH:TOKEN_REFRESHED";
  }
  ```

- [ ] Hook audit logging into ALL auth endpoints:
  - `Login` → `LOGIN_SUCCESS` or `LOGIN_FAILED`
  - `RefreshToken` → `TOKEN_REFRESHED`
  - `ChangePassword` → `PASSWORD_CHANGED` or `PASSWORD_DENIED_HISTORY`
  - `UnlockAccount` → `ACCOUNT_UNLOCKED_ADMIN`
  - `RevokeToken` → `TOKEN_REVOKED`

- [ ] Ensure audit log includes:
  - `UserId` (if authenticated)
  - `UserEmail`
  - `IpAddress` (from `HttpContext.Connection.RemoteIpAddress`)
  - `UserAgent` (from request headers)
  - `Timestamp` (UTC)
  - `Severity` (Info for success, Warning for lockouts, Error for failures)
  - `CorrelationId` (from request trace)

- [ ] Write audit completeness tests:
  - `AuditLoggingTests.cs` (verify audit entry created for each event)
  - Query `AuditLog` table after test operations

**Acceptance:** All auth operations emit audit events with correlation IDs.

---

### Sprint 5: FIPS Crypto Validation (SC-13) (8 hours)

**Goal:** Runtime health check for FIPS 140-2 compliance.

**Tasks:**
- [ ] Create FIPS health check:
  ```csharp
  public class FipsCryptoHealthCheck : IHealthCheck
  {
      private readonly IConfiguration _configuration;

      public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken ct)
      {
          var enforceFips = _configuration.GetValue<bool>("FeatureFlags:EnforceFipsCompliance");
          
          if (!enforceFips)
          {
              return HealthCheckResult.Healthy("FIPS enforcement disabled");
          }

          try
          {
              // Validate AES crypto provider
              using var aes = Aes.Create();
              if (aes == null || !aes.LegalKeySizes.Any())
              {
                  return HealthCheckResult.Unhealthy("AES crypto provider not available");
              }

              // Check FIPS settings (Windows-specific)
              if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
              {
                  var fipsEnabled = Registry.GetValue(@"HKEY_LOCAL_MACHINE\System\CurrentControlSet\Control\Lsa\FipsAlgorithmPolicy", "Enabled", 0);
                  if (fipsEnabled?.ToString() != "1")
                  {
                      return HealthCheckResult.Degraded("FIPS not enabled in Windows registry");
                  }
              }

              return HealthCheckResult.Healthy("FIPS 140-2 compliant crypto available");
          }
          catch (Exception ex)
          {
              return HealthCheckResult.Unhealthy("FIPS validation failed", ex);
          }
      }
  }
  ```

- [ ] Wire into health checks:
  ```csharp
  services.AddHealthChecks()
      .AddCheck<FipsCryptoHealthCheck>("fips-crypto", tags: new[] { "security", "compliance" });
  ```

- [ ] Document FIPS cert in compliance docs:
  - Create `/docs/compliance/phase4-fips-evidence.md`
  - Include FIPS 140-2 cert number for crypto module
  - Document validation approach

- [ ] Write FIPS tests:
  - `FipsCryptoHealthCheckTests.cs` (mock registry checks, test health results)

**Acceptance:** Startup logs show FIPS validation result, health check exposes `/health` endpoint.

---

## 🚦 Success Criteria (Definition of Done)

**Code Quality:**
- ✅ All code in `TerraFusion.Core` (in solution, no orphans)
- ✅ Feature flags control all new behaviors (default OFF)
- ✅ Redis + SQL storage (no in-memory hacks)
- ✅ Comprehensive audit logging for all auth events

**Testing:**
- ✅ Unit tests: 80%+ coverage on new storage/service methods
- ✅ Integration tests: Real Redis + SQL (testcontainers)
- ✅ E2E tests: Login → fail 3x → locked → wait → retry success

**CI/Validation:**
- ✅ `dotnet build TerraFusion.sln` → green
- ✅ `dotnet test TerraFusion.sln` → green
- ✅ `node tools/dx/orphan-cs-scan.mjs` → 0 orphans
- ✅ `node --test os-platform/core/tests/phase83-tools.test.mjs` → 32/32

**Documentation:**
- ✅ `/docs/compliance/phase4-nist-800-63b.md` (implementation guide)
- ✅ `/docs/compliance/phase4-fips-evidence.md` (FIPS cert proof)
- ✅ API docs: New endpoints (unlock account, change password)

**Deployment:**
- ✅ Dev: Feature flags OFF (safe default)
- ✅ Staging: Feature flags ON (validate with test traffic)
- ✅ Production: Feature flags ON + monitoring (Grafana dashboards)

---

## 🛠️ Day 1 Commands (Execute Immediately)

```powershell
# Switch to main and verify clean state
cd C:\Users\bsval\terrafusion_os_1.0
git checkout main
git pull origin main

# Verify backend compiles
cd backend
dotnet build TerraFusion.sln -warnaserror

# Verify tests pass
dotnet test TerraFusion.sln

# List solution projects
dotnet sln TerraFusion.sln list

# Locate auth service files
Get-ChildItem -Recurse -Path "src\TerraFusion.Core\Services" -Filter "*Auth*.cs"

# Create feature branch
git checkout -b feature/phase4-nist-800-63b-hardening

# Verify orphan scanner still green
cd ..
node tools/dx/orphan-cs-scan.mjs

# Phase 4 ready to start: ✅
```

---

## 📌 References

- **Full Implementation Plan:** [.tickets/phase4-proper-implementation.md](.tickets/phase4-proper-implementation.md)
- **Scanner Hardening (Optional):** [.tickets/pr-316-scanner-hardening.md](.tickets/pr-316-scanner-hardening.md)
- **NIST 800-63B:** https://pages.nist.gov/800-63-3/sp800-63b.html
- **FIPS 140-2:** https://csrc.nist.gov/publications/detail/fips/140/2/final
- **Governance Hotfix (PR #315):** `c83393d0c`

---

**Government. Transcended. (With storage-first architecture.)**
