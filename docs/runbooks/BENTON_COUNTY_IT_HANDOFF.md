# TerraFusion — Benton County IT Handoff

> **One page. Everything County IT needs to know.**

---

## What You're Responsible For

| Responsibility | Who |
|---------------|-----|
| Server hardware/VM | County IT |
| Network/DNS | County IT |
| Operating system patches | County IT |
| TerraFusion software | **TerraFusion Team** |
| Application updates | **TerraFusion Team** |
| Data integrity | **TerraFusion Team** |

**Simple rule:** If the server is up and reachable, TerraFusion handles everything else.

---

## Health Checks (Bookmark These)

### 1. Application Ready
```
GET https://tf.benton.wa.gov/health/ready
```
**Expected:** `200 OK` with `{"status": "ready"}`

### 2. PACS Sync Status
```
GET https://tf.benton.wa.gov/ops/pacs/proof
```
**Expected:** JSON showing last sync time, record count, contract version

### 3. SpecLock Contract Proof
```
GET https://tf.benton.wa.gov/ops/speclock/proof
```
**Expected:** JSON showing active contracts and their versions

---

## When to Call TerraFusion

| Symptom | Action |
|---------|--------|
| `/health/ready` returns non-200 | Call TerraFusion |
| PACS sync older than 1 hour | Call TerraFusion |
| Application error screens | Call TerraFusion |
| Performance degradation | Call TerraFusion |
| Server/network unreachable | Fix server first, then call TerraFusion if app doesn't recover |

---

## When NOT to Call TerraFusion

| Symptom | Action |
|---------|--------|
| Server won't boot | County IT issue |
| Network outage | County IT issue |
| Disk full | County IT issue (but tell us after you fix it) |
| Firewall blocking traffic | County IT issue |

---

## Contact

**TerraFusion Support:**
- Email: support@terrafusion.gov
- Phone: [TBD]
- Hours: M-F 8am-5pm PT

**Emergency (production down):**
- [Emergency contact TBD]

---

## Deployment Certificate

Every TerraFusion deployment includes a **Runtime Certification Report**.

Location: `artifacts/cert/*/cert.report.md`

This proves:
- PACS contract is valid
- All health endpoints passed
- SpecLock contracts are enforced
- Deployment is production-ready

**Keep this file.** It's your audit trail.

---

## What You Should Never Do

1. ❌ **Never modify application files** — TerraFusion handles all updates
2. ❌ **Never edit database directly** — Use the application UI
3. ❌ **Never restart services without checking** — Call TerraFusion first
4. ❌ **Never expose ports beyond what's documented** — Security risk

---

## What You Can Always Do

1. ✅ **Check health endpoints** — They're designed for you
2. ✅ **Restart the entire server** — If you must, it will recover
3. ✅ **Check disk space** — Alert us if under 20%
4. ✅ **Check network connectivity** — Ensure DNS resolves

---

*Government. Transcended.*
