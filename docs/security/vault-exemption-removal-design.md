# VaultSecretsService Trace Exemption Removal — Design Document

> **Classification:** Security — Trace Coverage Enhancement  
> **Exemption:** #1 in trace-exemptions-burndown.md  
> **Target:** Week 3-4 of Validation Period (2026-02-21 to 2026-03-07)  
> **Estimated Effort:** 2-3 hours (design + implementation + testing)  
> **Owner:** Agent D (Security Hardening Workstream)

---

## Current State

**File:** `backend/TerraFusion.Security/Services/VaultSecretsService.cs`

**Write Methods Requiring Audit:**
1. `SetSecretAsync(string secretPath, string value)` — Stores/updates secrets in Vault
2. `DeleteSecretAsync(string secretPath)` — Removes secrets from Vault

**Current Logging:** Uses `ILogger` for operational logging only (no structured audit trail)

**Exemption Reason:** "Vault secret lifecycle (Set/Delete) — audit remediation planned"

---

## Security Context

### Why Audit Coverage Matters

**FISMA-HIGH Requirement:** All security-critical write operations must emit structured audit events for:
- Compliance reporting (who created/modified/deleted secrets)
- Incident investigation (what secrets were accessed before a breach)
- Change tracking (secrets lifecycle audit trail)

**Threat Model:**
- **Insider threat:** Authorized user exfiltrates secrets → audit trail needed for forensics
- **Credential compromise:** Attacker uses stolen token to modify secrets → detection requires audit
- **Compliance audit:** Auditors require proof that secret lifecycle is logged and tamper-evident

---

## Design Approach

### 1. Add ISecurityAuditService Dependency

**Pattern:** Match LetsEncryptService implementation (already removed from exemptions)

```csharp
public class VaultSecretsService : ISecretsService
{
    private readonly ILogger<VaultSecretsService> _logger;
    private readonly IConfiguration _configuration;
    private readonly HttpClient _httpClient;
    private readonly ISecurityAuditService _auditService; // ✅ ADD

    public VaultSecretsService(
        ILogger<VaultSecretsService> logger,
        IConfiguration configuration,
        HttpClient httpClient,
        ISecurityAuditService auditService) // ✅ ADD
    {
        _logger = logger;
        _configuration = configuration;
        _httpClient = httpClient;
        _auditService = auditService; // ✅ ADD
        // ... existing initialization
    }
}
```

---

### 2. Emit Audit Events in Write Methods

#### SetSecretAsync Audit Pattern

```csharp
public async Task<bool> SetSecretAsync(string secretPath, string value)
{
    try
    {
        if (string.IsNullOrEmpty(_vaultToken))
        {
            _logger.LogWarning("Cannot store Vault entry - no token available");
            return false;
        }

        var secretData = new { data = new { value } };
        var json = JsonSerializer.Serialize(secretData);

        var request = new HttpRequestMessage(HttpMethod.Post, $"{_vaultUrl}/v1/{_vaultMountPath}/data/{secretPath}")
        {
            Content = new StringContent(json, System.Text.Encoding.UTF8, "application/json")
        };
        request.Headers.Add("X-Vault-Token", _vaultToken);

        var response = await _httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();

        _logger.LogInformation("Successfully stored Vault entry at path: {VaultPath}", secretPath);
        
        // ✅ ADD: Emit structured audit event
        await _auditService.LogSecurityEventAsync(
            "VaultSecretSet",
            new
            {
                SecretPath = secretPath,
                ValueLength = value.Length, // ⚠️ DO NOT log actual secret value
                VaultUrl = _vaultUrl,
                MountPath = _vaultMountPath,
                Timestamp = DateTime.UtcNow,
                Outcome = "Success"
            }
        );
        
        return true;
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Failed to store Vault entry at path: {VaultPath}", secretPath);
        
        // ✅ ADD: Audit failed attempts (security-relevant)
        await _auditService.LogSecurityEventAsync(
            "VaultSecretSetFailed",
            new
            {
                SecretPath = secretPath,
                VaultUrl = _vaultUrl,
                ErrorType = ex.GetType().Name,
                ErrorMessage = ex.Message,
                Timestamp = DateTime.UtcNow,
                Outcome = "Failed"
            }
        );
        
        return false;
    }
}
```

**Key Design Decisions:**
- ✅ Log secret path (needed for forensics)
- ✅ Log value length (proves write occurred without exposing secret)
- ❌ **DO NOT log actual secret value** (would defeat purpose of Vault)
- ✅ Audit both success and failure (failed attempts may indicate attack)

---

#### DeleteSecretAsync Audit Pattern

```csharp
public async Task<bool> DeleteSecretAsync(string secretPath)
{
    try
    {
        if (string.IsNullOrEmpty(_vaultToken))
        {
            _logger.LogWarning("Cannot remove Vault entry - no token available");
            return false;
        }

        var request = new HttpRequestMessage(HttpMethod.Delete, $"{_vaultUrl}/v1/{_vaultMountPath}/metadata/{secretPath}");
        request.Headers.Add("X-Vault-Token", _vaultToken);

        var response = await _httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();

        _logger.LogInformation("Successfully removed Vault entry at path: {VaultPath}", secretPath);
        
        // ✅ ADD: Emit structured audit event (deletion is high-risk operation)
        await _auditService.LogSecurityEventAsync(
            "VaultSecretDeleted",
            new
            {
                SecretPath = secretPath,
                VaultUrl = _vaultUrl,
                MountPath = _vaultMountPath,
                Timestamp = DateTime.UtcNow,
                Outcome = "Success"
            }
        );
        
        return true;
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Failed to remove Vault entry at path: {VaultPath}", secretPath);
        
        // ✅ ADD: Audit failed deletion attempts
        await _auditService.LogSecurityEventAsync(
            "VaultSecretDeleteFailed",
            new
            {
                SecretPath = secretPath,
                VaultUrl = _vaultUrl,
                ErrorType = ex.GetType().Name,
                ErrorMessage = ex.Message,
                Timestamp = DateTime.UtcNow,
                Outcome = "Failed"
            }
        );
        
        return false;
    }
}
```

---

### 3. Update Dependency Injection (if needed)

**Check:** `backend/TerraFusion.API/Program.cs` or DI configuration

If `VaultSecretsService` is registered, ensure `ISecurityAuditService` is available:

```csharp
// VaultSecretsService likely already registered:
builder.Services.AddScoped<ISecretsService, VaultSecretsService>();

// Ensure audit service is available (should already be registered):
builder.Services.AddScoped<ISecurityAuditService, SecurityAuditService>();
```

**Verification:** Run `dotnet build` to ensure DI resolves correctly.

---

## Testing Strategy

### Unit Tests (TerraFusion.Security.Tests)

Create: `VaultSecretsServiceAuditTests.cs`

```csharp
[Fact]
public async Task SetSecretAsync_Success_EmitsAuditEvent()
{
    // Arrange
    var mockAuditService = new Mock<ISecurityAuditService>();
    var service = CreateServiceWithMocks(mockAuditService.Object);
    
    // Act
    var result = await service.SetSecretAsync("test/secret", "value123");
    
    // Assert
    Assert.True(result);
    mockAuditService.Verify(a => a.LogSecurityEventAsync(
        "VaultSecretSet",
        It.Is<object>(o => /* validate event data */)),
        Times.Once);
}

[Fact]
public async Task DeleteSecretAsync_Success_EmitsAuditEvent()
{
    // Similar pattern for deletion
}

[Fact]
public async Task SetSecretAsync_Failure_EmitsFailureAuditEvent()
{
    // Test that failed operations also audit
}
```

### Integration Tests (Manual or Automated)

**Staging Environment:**
1. Deploy VaultSecretsService with audit changes
2. Execute: `SetSecretAsync("test/path", "test-value")`
3. Query audit log: Verify "VaultSecretSet" event exists with correct fields
4. Execute: `DeleteSecretAsync("test/path")`
5. Query audit log: Verify "VaultSecretDeleted" event exists

---

## Trace Coverage Gate Impact

### Before Removal

```bash
$ node tools/gates/trace-coverage-gate.mjs

📋 Known exemptions (tracked technical debt):
   ⚠️  Services/VaultSecretsService.cs — Vault secret lifecycle (Set/Delete) — audit remediation planned
   ⚠️  Services/DisasterRecoveryService.cs — ...
   ⚠️  Services/EliteSecurityHardeningService.cs — ...
   ⚠️  Services/PostgresPerformanceService.cs — ...

Active exemptions: 4 ≤ 4 max
```

### After Removal

**Step 1:** Remove exemption from `tools/gates/trace-coverage-gate.mjs`:

```javascript
const KNOWN_EXEMPTIONS = new Map([
  // ❌ REMOVE: ['Services/VaultSecretsService.cs', 'Vault secret lifecycle...'],
  ['Services/DisasterRecoveryService.cs', 'Backup/restore operations — audit remediation planned'],
  ['Services/EliteSecurityHardeningService.cs', 'Security policy mutations — audit remediation planned'],
  ['Services/PostgresPerformanceService.cs', 'Infrastructure config mutations — audit remediation planned'],
]);

// ✅ LOWER CAP: Ratchet mechanism
const MAX_KNOWN_EXEMPTIONS = 3;
```

**Step 2:** Run gate:

```bash
$ node tools/gates/trace-coverage-gate.mjs

✅ Trace Coverage Gate PASSED
   Policy: BLOCK enforced — new security writes without audit will fail.
   Known gaps: 3 (ratchet max: 3)
```

---

## Rollout Plan

### Week 3 (2026-02-21 to 2026-02-27)

**Day 1-2: Implementation**
- [ ] Add `ISecurityAuditService` dependency to constructor
- [ ] Add audit calls to `SetSecretAsync` (success + failure)
- [ ] Add audit calls to `DeleteSecretAsync` (success + failure)
- [ ] Verify DI configuration

**Day 3: Testing**
- [ ] Write unit tests (3-4 test cases)
- [ ] Run `dotnet test` to verify
- [ ] Manual integration test in staging

**Day 4: Gate Closure**
- [ ] Remove exemption from `trace-coverage-gate.mjs`
- [ ] Lower ratchet cap from 4 → 3
- [ ] Run `node tools/gates/trace-coverage-gate.mjs` → verify PASS
- [ ] Update `trace-exemptions-burndown.md` with completion evidence

**Day 5: PR + Merge**
- [ ] Create PR: `feat(security): remove VaultSecretsService trace exemption`
- [ ] Include test results + gate pass evidence
- [ ] Merge after review

---

## Compliance & Audit

**FISMA-HIGH Alignment:**
- Secret lifecycle events now auditable (meets AU-3, AU-12 controls)
- Tamper-evident audit trail (SecurityAuditService includes hashing)
- Supports forensic investigation (who/what/when for secrets)

**Evidence Pack Integration:**
- Removal tracked in `trace-exemptions-burndown.md`
- Gate pass recorded in release evidence
- Contributes to Validation Period Success Criterion #5

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Audit call slows Vault ops | Low | Low | Audit service should be async + non-blocking |
| DI resolution fails in prod | Low | High | Verify DI config + test in staging first |
| Audit log volume too high | Medium | Low | Secret ops are infrequent; monitor audit DB size |
| Secret value accidentally logged | Low | Critical | Code review + test validation (never log `value` param) |

---

## Acceptance Criteria

**Definition of Done:**
- [x] Design document approved
- [ ] Code changes implemented
- [ ] Unit tests written (3+ test cases)
- [ ] Integration test passed in staging
- [ ] `trace-coverage-gate.mjs` exemption removed
- [ ] Ratchet cap lowered from 4 → 3
- [ ] Gate passes: `node tools/gates/trace-coverage-gate.mjs` → exit 0
- [ ] `trace-exemptions-burndown.md` updated with completion
- [ ] PR merged

---

## References

- [LetsEncryptService Exemption Removal](../../backend/TerraFusion.Security/Services/LetsEncryptService.cs) — Reference implementation
- [Trace Coverage Gate](../../tools/gates/trace-coverage-gate.mjs) — Enforcement mechanism
- [Trace Exemptions Burn-Down Log](./trace-exemptions-burndown.md) — Tracking document
- [Security Audit Service](../../backend/TerraFusion.Security/Services/SecurityServices.cs) — ISecurityAuditService interface

---

*Government. Transcended. Audit-Hardened.*
