# Key Rotation Checklist

> **TerraFusion OS — Security Operations**
> Complete this checklist for every key rotation event (planned or emergency).
> Store the completed checklist in the PR or incident ticket for audit trail.

---

## Rotation Metadata

| Field | Value |
|-------|-------|
| **Date/Time (UTC)** | ____-__-__T__:__:__Z |
| **Environment** | ☐ Development  ☐ Staging  ☐ Production |
| **Rotation Type** | ☐ Planned  ☐ Emergency |
| **Operator** | _________________________ |
| **Approver** | _________________________ |
| **Incident Ticket** | _________________________ (if emergency) |

---

## Key Transition

| Field | Value |
|-------|-------|
| **Previous Active KeyId** | _________________________ |
| **New Active KeyId** | _________________________ |
| **Keys retained (inactive)** | _________________________ |
| **Keys retired (removed)** | _________________________ |

---

## Deployment

| Step | Completed | Deploy ID / Version | Timestamp (UTC) |
|------|-----------|---------------------|-----------------|
| Deploy 1: New key added (inactive) | ☐ | ____________ | ____-__-__T__:__:__Z |
| Deploy 2: New key set to Active | ☐ | ____________ | ____-__-__T__:__:__Z |

---

## Verification Results

| Check | Pass/Fail | Notes |
|-------|-----------|-------|
| Application starts without error | ☐ Pass  ☐ Fail | |
| New ciphertext uses new KeyId prefix | ☐ Pass  ☐ Fail | |
| Decrypt of old-key ciphertext succeeds | ☐ Pass  ☐ Fail | |
| GCM tamper detection functional | ☐ Pass  ☐ Fail | |
| No "unknown key" errors in logs | ☐ Pass  ☐ Fail | |
| Security tests pass (`dotnet test`) | ☐ Pass  ☐ Fail | ___ / ___ tests passed |
| Health check endpoints healthy | ☐ Pass  ☐ Fail | |

---

## Rollback

| Field | Value |
|-------|-------|
| **Rollback invoked?** | ☐ Yes  ☐ No |
| **Rollback reason** | _________________________ |
| **Rollback deploy ID** | _________________________ |
| **Rollback verified?** | ☐ Yes  ☐ N/A |

---

## Evidence Artifacts

| Artifact | Collected | Location |
|----------|-----------|----------|
| Evidence pack (`evidence-pack-latest.json`) | ☐ | _________________________ |
| Test results output | ☐ | _________________________ |
| Log excerpt (post-rotation) | ☐ | _________________________ |
| This completed checklist | ☐ | _________________________ |

---

## Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Operator | ____________ | ____-__-__ | ____________ |
| Approver | ____________ | ____-__-__ | ____________ |
| Security Review | ____________ | ____-__-__ | ____________ |

---

**Government. Transcended. Receipted.** 🏛️
