# Phase 4 Authentication Hardening - Proper Implementation

**Status:** Planned  
**Priority:** High (FISMA-HIGH compliance blocker)  
**Effort:** ~56 hours (2 sprints)  
**Blocked By:** PR #315 merged ✅  
**Context:** Post-incident redo after reverting orphaned PR #314 prototype

---

## Problem Statement

PR #314 attempted Phase 4 NIST 800-63B authentication hardening but shipped as orphaned code:
- ❌ No `.csproj` files (code not in build graph)
- ❌ 48+ compilation errors when force-integrated  
- ❌ Zero test coverage (tests couldn't run)
- ❌ No durable storage (in-memory only)

**Governance Failure:** Code existed in git but not in solution, bypassing CI validation.

**Resolution:** Reverted via PR #315 + added orphan scanner to prevent recurrence.

---

## Requirements

### Functional (NIST 800-63B Compliance)

**AC-2(4): Account Lockout**
- Progressive lockout: 3 failed attempts → 15min lockout, 5 attempts → 1hr, 10 attempts → admin unlock
- Store lockout state in **Redis** (fast reads for auth path)
- Audit trail in **SQL** audit log

**AC-2(7): Password History**
- Store last 5 password hashes per user
- Reject new password if matches any of last 5
- Store in **SQL** (durable, queryable)
- Hash using existing crypto service (PBKDF2/Argon2)

**AC-2(5): Token Revocation**
- Store revoked token JTIs in **Redis** (TTL = token expiry)
- Check on every authenticated request (middleware)
- Admin API to revoke tokens (logout all sessions)

**AU-12: Comprehensive Audit Logging**
- Log all auth events: login success/fail, lockout, password change, token revocation
- Include: timestamp, user, IP, result, reason
- Store in **SQL** audit log (existing `AuditLogs` table)

**SC-13: Cryptographic Protection**
- FIPS 140-2 validated crypto module
- Startup validation: check `SymmetricAlgorithm.Create("AES").LegalKeySizes`
- Document FIPS cert number in compliance docs

---

## Architecture (Non-Negotiable)

### 1. Use Existing Compiled Project

**DO NOT** create standalone `TerraFusion.Security` project again.

**Option A (Preferred):** Add to `TerraFusion.API` project
- Auth service already lives here: `IAuthenticationService` 
- Has Redis/SQL dependencies already wired
- Tests exist in `TerraFusion.API.Tests` or `TerraFusion.Integration.Tests`

**Option B:** Add to `TerraFusion.Core` if auth lives there
- Check: `grep -r "IAuthenticationService" backend/src/TerraFusion.Core/`
- Ensure project has Redis/SQL deps or add them

**Verification Command:**
```bash
# Find where IAuthenticationService lives
grep -r "interface IAuthenticationService" backend/src/

# That's where Phase 4 features go
```

### 2. Durable Storage FIRST (No In-Memory Hacks)

**Redis Storage (Fast Path)**
- Account lockouts: `lockout:{userId}` → `{ attempts: 3, lockedUntil: ISO8601 }`
- Revoked tokens: `revoked:{jti}` TTL = token expiry seconds
- Use `IDistributedCache` or direct `StackExchange.Redis` client

**SQL Storage (Durable Path)**
- Password history: `PasswordHistory` table
  - Columns: `Id`, `UserId`, `PasswordHash`, `CreatedAt`
  - Index: `(UserId, CreatedAt DESC)`
- Audit events: Existing `AuditLogs` table
  - Add event types: `ACCOUNT_LOCKED`, `TOKEN_REVOKED`, `PASSWORD_CHANGED`

**Feature Flags** (for gradual rollout):
```json
"FeatureFlags": {
  "UseRedisAuthStore": true,
  "UseSqlPasswordHistory": true,
  "EnforceFipsCompliance": false  // Production = true
}
```

---

## Implementation Plan (TDD Approach)

### Phase 1: Storage Layer (8 hours)

**Tasks:**
1. Create `PasswordHistory` SQL table + EF migration
2. Create `IAuthStorageService` interface
3. Implement `RedisAuthStorageService` (lockouts + revocations)
4. Implement `SqlPasswordHistoryService` (last 5 hashes)
5. **Write tests FIRST:**
   - `AuthStorageServiceTests.cs` (unit tests with Redis/SQL mocks)
   - `PasswordHistoryIntegrationTests.cs` (real SQL, testcontainers)

**Acceptance:**
- `dotnet test` → All storage tests green
- `dotnet build TerraFusion.sln` → No warnings
- `node tools/dx/orphan-cs-scan.mjs` → 0 orphans

### Phase 2: Account Lockout (16 hours)

**Tasks:**
1. Extend existing auth service with lockout logic
2. Hook into login failure handler
3. Check lockout state before auth attempt (Redis)
4. Progressive backoff: 3→15min, 5→1hr, 10→admin
5. Audit log every lockout event
6. **Write tests:**
   - `AccountLockoutTests.cs` (progressive lockout scenarios)
   - `LockoutMiddlewareTests.cs` (integration with auth middleware)

**Acceptance:**
- 3 failed logins → 15min lockout ✅
- Lockout state persists Redis restart ✅ (use AOF)
- Audit log has lockout events ✅

### Phase 3: Password History (12 hours)

**Tasks:**
1. On password change: hash + store in `PasswordHistory`
2. On password set: query last 5 hashes, reject if match
3. Cleanup: delete history rows older than retention policy
4. **Write tests:**
   - `PasswordHistoryValidationTests.cs` (reject recent passwords)
   - `PasswordHistoryCleanupTests.cs` (retention policy)

**Acceptance:**
- Cannot reuse last 5 passwords ✅
- History survives server restart ✅ (SQL durable)
- Old history auto-pruned ✅

### Phase 4: Token Revocation (12 hours)

**Tasks:**
1. Store revoked JTIs in Redis (TTL = token lifetime)
2. Auth middleware: check Redis before processing request
3. Admin API: `POST /api/auth/revoke-token` or `POST /api/auth/logout-all`
4. SignalR: notify user sessions of revocation (optional)
5. **Write tests:**
   - `TokenRevocationTests.cs` (revoke + verify blocked)
   - `RevocationMiddlewareTests.cs` (integration)

**Acceptance:**
- Revoked token returns 401 ✅
- Revocation expires with token ✅ (TTL)
- Admin can force logout ✅

### Phase 5: FIPS Validation (8 hours)

**Tasks:**
1. Startup health check: validate FIPS crypto module
2. Document FIPS 140-2 cert number in `/docs/compliance/phase4-fips-evidence.md`
3. Feature flag: `EnforceFipsCompliance` → fail startup if not validated
4. **Write tests:**
   - `FipsComplianceTests.cs` (mock/real crypto validation)

**Acceptance:**
- Startup log shows FIPS validation ✅
- Docs have cert evidence ✅
- CI enforces FIPS check ✅

---

## Success Criteria (Definition of Done)

**Code Quality:**
- [ ] All code in existing compiled project (in `TerraFusion.sln`)
- [ ] All tests in existing test project (runnable via `dotnet test`)
- [ ] Zero orphaned `.cs` files (`node tools/dx/orphan-cs-scan.mjs` → 0)
- [ ] Redis + SQL storage (no in-memory hacks)
- [ ] Feature flags for gradual rollout

**Testing:**
- [ ] Unit tests: 80%+ coverage on new auth services
- [ ] Integration tests: Real Redis + SQL (testcontainers)
- [ ] Manual test: Login → fail 3x → locked out 15min

**CI/Validation:**
- [ ] `dotnet build TerraFusion.sln` → green
- [ ] `dotnet test TerraFusion.sln` → green
- [ ] `node --test os-platform/core/tests/phase83-tools.test.mjs` → 32/32
- [ ] SEAL gate (orphan scan) → green

**Documentation:**
- [ ] `/docs/compliance/phase4-nist-800-63b.md` (implementation guide)
- [ ] `/docs/compliance/phase4-fips-evidence.md` (FIPS cert proof)
- [ ] API docs: New endpoints (revoke token, check lockout)

**Deployment:**
- [ ] Dev: Feature flags OFF (test in isolation)
- [ ] Staging: Feature flags ON (validate with real traffic)
- [ ] Production: Feature flags ON + monitoring (Grafana dashboards)

---

## Risk Mitigation

**Risk 1: Redis Unavailable (Lockout State Lost)**
- Mitigation: Enable Redis AOF persistence (Append-Only File)
- Fallback: If Redis down, auth still works but lockouts not enforced (log warning)

**Risk 2: SQL Write Latency (Password History)**
- Mitigation: Async write after password change (don't block response)
- Monitoring: Track write latency in metrics

**Risk 3: Token Revocation Cache Stampede**
- Mitigation: Cache negative lookups (not-revoked) for 60s
- Monitoring: Redis hit rate on revocation checks

**Risk 4: FIPS Compliance False Negatives**
- Mitigation: Test on production-like Windows Server (not dev workstation)
- Validation: Run on CI Windows runner + staging environment

---

## Follow-Up PRs (After Phase 4 Complete)

1. **PR #316:** Orphan scanner hardening (optional, non-blocking)
   - Tighten allowlist (backend-relative paths only)
   - MSBuild edge cases: `<Compile Remove>`, conditionals, `Directory.Build.props`
   - Scanner fixture tests

2. **Phase 5 (Future):** Multi-Factor Authentication (MFA)
   - TOTP (Google Authenticator, Authy)
   - SMS/Email backup codes
   - Admin-enforced MFA for high-privilege accounts

3. **Phase 6 (Future):** Session Management
   - Concurrent session limits per user
   - Session geo-fencing (block if IP location changes)
   - Idle timeout enforcement

---

## References

- **NIST 800-63B:** Digital Identity Guidelines (Authentication and Lifecycle Management)
  - https://pages.nist.gov/800-63-3/sp800-63b.html
- **FIPS 140-2:** Security Requirements for Cryptographic Modules
  - https://csrc.nist.gov/publications/detail/fips/140/2/final
- **Redis Persistence:** https://redis.io/docs/manual/persistence/
- **Testcontainers:** https://dotnet.testcontainers.org/

---

**Next Steps:**
1. ✅ PR #315 merged (governance restored)
2. Create GitHub issue from this ticket
3. Estimate sprint allocation (2 sprints recommended)
4. Assign to auth team + security reviewer
5. Begin Phase 1: Storage Layer (TDD)

**Government. Transcended. (With durable storage this time.)**
