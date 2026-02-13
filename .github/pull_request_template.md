# TerraFusion Government Service Pull Request

## 🏛️ Summary

**What changed:**
<!-- Describe the change and which subsystem it touches (backend / frontend / county config / AI) -->

**Why:**
<!-- Business/technical justification and government impact -->

## ✅ Verification Checklist

### Build & Test

- [ ] Builds locally: `dotnet build` (backend) / `npm run build` (frontend)
- [ ] `/health` responds locally or in CI
- [ ] Tests pass: `make test` / `dotnet test` / `npm test`
- [ ] No secrets committed
- [ ] If `.github/workflows/` changed: ran `node scripts/governance/workflow-inventory.mjs --write` and committed snapshot

### Database (if applicable)

- [ ] EF migration included (name: `_______________`)
- [ ] Audit fields preserved (CreatedAt/UpdatedAt/CreatedBy/UpdatedBy)
- [ ] `make migrate && make seed` runs successfully

### Government Compliance

- [ ] FISMA-High security requirements met
- [ ] No production county data modified
- [ ] Section 508 accessibility validated (WCAG 2.2 AA)
- [ ] Performance targets met (<100ms P95)
- [ ] Security/vulnerability scan passed

### Accessibility (Section 508 / WCAG 2.2 AA)

- [ ] Screen reader compatible
- [ ] Keyboard navigation functional
- [ ] Color contrast >= 4.5:1
- [ ] Focus indicators visible
- [ ] Form labels properly associated

### Documentation

- [ ] Code documented (JSDoc/XML comments)
- [ ] API docs updated if public surface changed
- [ ] README updated if needed

## 🧪 Testing Performed

**Local Verification:**

```bash
make up
make migrate && make seed
make test
```

**Manual Testing:**
<!-- Steps and expected outcomes -->

**Screenshots/URLs:**
<!-- If UI changes -->

## 📋 Tier-1 UI/UX Evidence (if applicable)

<!--
  Complete this section for any PR that changes Tier-1 UI/UX behavior.
  Delete this section if this PR does not touch Tier-1 UI.
  See: docs/governance/TIER1_UI_UX_DOD_CHECKLIST.md
-->

- [ ] **This PR changes Tier-1 UI/UX behavior**
- **Flow tested:** `<scene> → <action> → <result>`
- **CID(s):** `<paste a real CID from your test run>`
- **Trace evidence:** `<screenshot or trace link showing CID>`
- **Latency:** `<action> took <N>ms`
- **Error evidence:** `<error state screenshot or "no console errors">`
- **Receipt evidence (if write/commit):** `<screenshot + payload>`
- **UI screenshot/gif:** `<at least one state transition>`

## 🔒 Security & Risk

**Security Considerations:**
<!-- Any security implications -->

**Risk Level:** [ ] Low [ ] Medium [ ] High

**Rollback Plan:**

```bash
make down && make clean
# or revert to previous image tags
```

**Secrets/Env Changes:**
<!-- List any new environment variables or secret changes -->

## 👥 Review Requirements

**Focused Review Areas:**
<!-- e.g., "check audit interceptor", "verify SignalR hub registration", "AI swarm coordination safety" -->

**Approvals Required:**

- [ ] Technical Lead
- [ ] Security Team (if Medium/High risk)
- [ ] Compliance Officer (if government-facing)

## 📊 Performance Impact

**Metrics:**
<!-- Before/after performance benchmarks, resource usage -->

---

**AI-Swarm Changes:** If this PR touches AI coordination, add `AI-SWARM` label and include safety plan.

**Government Service Standards:** This change meets federal accessibility, security, and performance requirements for citizen services.
