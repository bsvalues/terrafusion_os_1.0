# Key Compromise Response

> **TerraFusion OS — Security Incident Response**
> **Last Updated:** 2026-02-13
> **Classification:** Internal — Security Operations
> **Owner:** Security Operations Team
> **Review Cadence:** Quarterly, or after any incident invocation

---

## Triggers

### Severity levels

| Level | Trigger | Response Path |
|-------|---------|---------------|
| **SEV-1: Confirmed compromise** | Key material confirmed exposed (leaked in logs, repo, breach disclosure) | **Fast Path** → immediate rotation + containment |
| **SEV-2: Suspected compromise** | Anomalous decrypt failures, unauthorized access alerts, credential leak in adjacent system | **Assessment Path** → investigate first, then rotate if confirmed |
| **SEV-3: Precautionary** | Employee departure with key access, secret store access review findings, scheduled security audit finding | **Planned Path** → standard rotation per [Key Rotation Runbook](key-rotation.md) |

### Who can invoke this runbook

- Security Operations Team lead
- Engineering Manager (on-call)
- Any engineer with evidence of SEV-1 or SEV-2 trigger

---

## Immediate Actions

Upon SEV-1 or SEV-2 trigger:

### 1. Declare incident

- Create incident ticket (Jira / GitHub Issue)
- Tag: `security-incident`, `key-compromise`
- Record: timestamp, reporter, trigger description, severity level

### 2. Assess blast radius

| Question | How to determine |
|----------|-----------------|
| Which key(s) are affected? | Check `KeyId` in the compromise evidence |
| Is the compromised key currently Active? | Check config: `Security:Encryption:Keys[]` for `Active: true` |
| What data was encrypted with this key? | Search data stores for ciphertext with the compromised `keyId:` prefix |
| Is the secret store itself compromised? | Check secret store audit logs for unauthorized access |

### 3. Freeze non-essential deployments

For SEV-1: Freeze all deployments to affected environments until rotation is complete. Communicate freeze to engineering team via incident channel.

---

## Emergency Rotation Procedure

**Fast path for SEV-1.** For SEV-2, complete assessment (above) before proceeding.

### Step 1 — Generate new key material (immediate)

```bash
python3 -c "import secrets, base64; print(base64.b64encode(secrets.token_bytes(32)).decode())"
```

Choose `KeyId`: `k{seq}-emergency-{YYYYMMDD}` (e.g., `k4-emergency-20260213`).

### Step 2 — Update config with new key as Active

In one config change, add the new key as `Active: true` and set the compromised key to `Active: false`:

```json
{
  "Security": {
    "Encryption": {
      "Keys": [
        { "KeyId": "k2-compromised", "Material": "<compromised-material>", "Active": false },
        { "KeyId": "k4-emergency-20260213", "Material": "<new-material>", "Active": true }
      ]
    }
  }
}
```

**Do NOT remove the compromised key yet** — existing ciphertext still needs it for decrypt.

### Step 3 — Deploy immediately

Deploy to the affected environment(s). Priority: production first, then staging, then dev.

### Step 4 — Verify

- [ ] Application starts without errors
- [ ] New encrypt operations use the emergency key prefix
- [ ] Decrypt of existing ciphertext (including compromised-key ciphertext) succeeds
- [ ] Run security tests: `dotnet test backend/tests/TerraFusion.Security.Tests/ -c Release -v minimal`

### Step 5 — Begin re-encryption (if warranted)

For SEV-1 where the attacker may have captured ciphertext:

1. Identify all data encrypted with the compromised key (search for `keyId:` prefix in data stores)
2. Decrypt with old key → re-encrypt with new Active key
3. Track re-encryption progress in the incident ticket
4. Once complete, the compromised key can be scheduled for removal

---

## Containment

### Audit log review

1. Query audit logs for the compromised key's `keyId`:
   ```bash
   pnpm run trace:query --recent 100 --type tool_completed
   ```
2. Review for anomalous decrypt operations (unexpected volume, unexpected source IPs, off-hours activity)

### Access investigation

1. Review secret store access logs for the time window around suspected compromise
2. Identify all principals who had access to the compromised key material
3. Revoke any access that is no longer needed
4. Document findings in the incident ticket

### Secret store hardening (post-incident)

- Rotate secret store access credentials if store compromise is suspected
- Enable or verify MFA on secret store access
- Review and tighten secret store IAM policies

---

## Communication Plan

### Internal notification

| Audience | Channel | Timing |
|----------|---------|--------|
| Security Ops Team | Incident channel (Slack / Teams) | Immediately on SEV-1/SEV-2 |
| Engineering leads | Incident channel + email | Within 1 hour |
| Project management | Email summary | Within 4 hours |
| Agency stakeholders (FISMA) | Formal incident report | Per incident response SLA |

### External notification

Per FISMA incident reporting requirements:

- **US-CERT notification:** Within 1 hour for confirmed PII-impacting incidents
- **Agency ISSO notification:** Within 4 hours for SEV-1
- Coordinate with compliance officer for reporting obligations

---

## Evidence & Follow-up

### During incident — capture these artifacts

1. **Incident timeline** — Chronological log of actions taken (who, what, when)
2. **Blast radius assessment** — Which keys, which data, which environments
3. **Rotation evidence** — Completed [Key Rotation Checklist](templates/key-rotation-checklist.md)
4. **Test results** — `dotnet test` output confirming security tests pass post-rotation
5. **Evidence pack** — Run `node scripts/phase4-evidence-pack.mjs` to generate cryptographic receipt
6. **Log excerpts** — Relevant application and secret store logs

### After incident — follow-up tasks

| Task | Owner | Deadline |
|------|-------|----------|
| Complete re-encryption of affected data (if SEV-1) | Security Ops | 48 hours |
| Remove compromised key from ring (after re-encryption) | Security Ops | After retention period |
| Post-incident review (blameless) | Eng Manager | Within 1 week |
| Update this runbook with lessons learned | Security Ops | Within 2 weeks |
| File FISMA incident report (if applicable) | Compliance | Per SLA |
| Update access controls based on findings | Security Ops | Within 1 week |

### Post-incident review agenda

1. What happened? (timeline)
2. How was it detected?
3. How long was the exposure window?
4. What worked well in the response?
5. What could be improved?
6. Action items for hardening

---

**Government. Transcended. Resilient.** 🏛️
