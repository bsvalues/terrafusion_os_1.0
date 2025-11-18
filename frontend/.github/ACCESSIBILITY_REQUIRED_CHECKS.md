# TerraFusion OS - Required Accessibility Checks Configuration

This document guides repository administrators on configuring the Playwright Accessibility workflow as a **required status check** for PR merges.

---

## 🎯 Purpose

The `Playwright Accessibility Tests` workflow ensures **WCAG 2.1 AA**, **Section 508**, and **FISMA-High** compliance before code reaches the main branch.

---

## ⚙️ Configuration Steps

### Step 1: Enable Branch Protection

1. Go to **Settings** → **Branches** in your GitHub repository
2. Under **Branch protection rules**, click **Add rule** (or edit existing rule for `main`)

### Step 2: Configure Protection Settings

Configure the following for the `main` branch:

- ✅ **Require a pull request before merging**
  - ✅ Require approvals: `1` (minimum)

- ✅ **Require status checks to pass before merging**
  - ✅ Require branches to be up to date before merging

- **Add required status check:**
  - Search for and select: `🧪 Playwright Accessibility (axe-core)`

- ✅ **Require conversation resolution before merging**

- ✅ **Do not allow bypassing the above settings** (recommended for compliance)

### Step 3: Save Changes

Click **Create** or **Save changes** to apply the protection rule.

---

## 📋 What This Enforces

Once configured, PRs targeting `main` **cannot be merged** until:

1. ✅ All Playwright accessibility tests pass (0 violations)
2. ✅ Required approvals are obtained
3. ✅ All conversations are resolved

---

## 🔄 Workflow Behavior

### On PR Creation/Update
- Workflow runs automatically on every push to PR
- Tests homepage + key routes: `/monitoring`, `/marketplace`, `/elite-research`, `/experiments`
- Posts PR comment with:
  - ✅ Success: Summary of validated pages and standards
  - ❌ Failure: Violation summary + link to HTML report artifact

### On Push to Main
- Workflow runs to validate merged code
- Ensures main branch maintains accessibility standards

### Manual Trigger
- Available via **Actions** → **Playwright Accessibility Tests** → **Run workflow**
- Useful for ad-hoc validation

---

## 🚨 Bypassing Checks (Emergency Only)

If you must merge with failing accessibility tests:

1. **Document the exception** in PR description with:
   - Business justification
   - Plan to remediate
   - Timeline for fix

2. **Admin override** (if "Do not allow bypassing" is disabled):
   - Admin merges PR manually
   - Creates follow-up issue to track remediation

3. **Alternative**: Add `[skip ci]` to commit message (not recommended)

---

## 📊 Monitoring Compliance

### View Test Results
- Go to **Actions** tab
- Filter by workflow: `Playwright Accessibility Tests`
- Download `playwright-report` artifact for detailed violations

### Track Historical Trends
- Use GitHub Insights → **Actions** to monitor pass/fail rates
- Set up Slack/Teams notifications for workflow failures

---

## 🎯 Standards Enforced

This workflow validates compliance with:

- **WCAG 2.1 Level AA** (Web Content Accessibility Guidelines)
- **Section 508** (U.S. Government accessibility requirement)
- **FISMA-High** (Federal Information Security Management Act)

---

## 🔧 Troubleshooting

### Tests Pass Locally but Fail in CI
- Ensure `VITE_PORT=5173` is set in workflow (already configured)
- Check for race conditions in component loading
- Review `waitUntil: 'domcontentloaded'` in test navigation

### False Positives
- Review HTML report to confirm violation
- If axe-core rule is incorrect, add `.disableRules(['rule-id'])` in test
- Document exception with business justification

### Workflow Not Showing as Required
- Verify workflow has run at least once (status checks appear after first run)
- Check workflow name matches exactly: `🧪 Playwright Accessibility (axe-core)`
- Refresh branch protection settings page

---

## 📞 Support

For questions or issues:
- Review test output in GitHub Actions logs
- Check `frontend/tests/accessibility/README.md` for test documentation
- Open issue with `accessibility` label

---

**Government. Transcended.** - Maintaining championship-level accessibility standards.
