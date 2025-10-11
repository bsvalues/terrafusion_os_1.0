# 🛡️ Sentry Setup Guide - TerraFusion OS

**Purpose**: Error tracking and monitoring for production deployment  
**Time Required**: 15 minutes  
**Cost**: Free (up to 5,000 events/month)

---

## Step 1: Create Sentry Account

1. Go to https://sentry.io/signup/
2. Sign up with your email (or GitHub/Google)
3. Choose the **Free Plan** (perfect for Benton County)

---

## Step 2: Create New Project

1. Click **"Create Project"**
2. **Platform**: Select **"Node.js"** (for TerraFusion API)
3. **Project Name**: `terrafusion-benton-county-production`
4. **Alert Frequency**: Default is fine
5. Click **"Create Project"**

---

## Step 3: Get Your DSN

After project creation, you'll see:

```
Sentry DSN: https://[YOUR-KEY]@o[ORG-ID].ingest.sentry.io/[PROJECT-ID]
```

**Example**:
```
https://1a2b3c4d5e6f7g8h9i0j@o123456.ingest.sentry.io/7654321
```

---

## Step 4: Update .env.benton

Replace the placeholder:

```bash
# BEFORE (placeholder)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# AFTER (your real DSN)
SENTRY_DSN=https://[YOUR-KEY]@o[ORG-ID].ingest.sentry.io/[PROJECT-ID]
```

---

## Step 5: Configure Sentry Settings (Optional but Recommended)

### Set Up Alerts
1. Go to **Settings → Alerts**
2. Create alert rule: "Notify on new issues"
3. Set notification method: Email

### Configure Integrations
1. Go to **Settings → Integrations**
2. Add **Slack** (if you use it)
3. Add **GitHub** (link to your repo)

### Set Up Releases
1. Go to **Settings → Releases**
2. Enable "Track releases" for deployment tracking

---

## Step 6: Test Sentry Integration

Run this test command:

```bash
# Test Sentry connection
curl -X POST "https://o[ORG-ID].ingest.sentry.io/api/[PROJECT-ID]/store/" \
  -H "X-Sentry-Auth: Sentry sentry_key=[YOUR-KEY]" \
  -H "Content-Type: application/json" \
  -d '{"message": "TerraFusion OS - Sentry Test"}'
```

Or test with Node.js:

```javascript
// test-sentry.js
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: 'production',
  release: 'terrafusion-os@1.0.0'
});

// Test error
Sentry.captureMessage('TerraFusion OS - Sentry Integration Test!');
console.log('✅ Test error sent to Sentry!');
```

Run: `node test-sentry.js`

Check Sentry dashboard - you should see the test error!

---

## Step 7: Configure for TerraFusion

### Environment Variables to Set

```bash
# In .env.benton
SENTRY_DSN=https://[YOUR-KEY]@o[ORG-ID].ingest.sentry.io/[PROJECT-ID]
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=terrafusion-os@1.0.0
SENTRY_TRACES_SAMPLE_RATE=1.0
```

### Integration Points

1. **TerraFusion API** (Node.js/Express)
2. **TerraFusion Frontend** (React)
3. **Harris PACS Integration** (track PACS errors)
4. **Levy Chain Service** (blockchain errors)
5. **Trends Chain Service** (analytics errors)

---

## Expected Benefits

### Error Tracking
- Automatic error capture
- Stack traces for debugging
- Error frequency analytics

### Performance Monitoring
- API response times
- Database query performance
- Frontend load times

### Alerting
- Email notifications on new errors
- Slack notifications (if configured)
- Issue assignment to team members

---

## Next Steps After Setup

1. ✅ Update `.env.benton` with real Sentry DSN
2. ✅ Commit changes to git
3. ✅ Test Sentry integration
4. ✅ Verify errors appear in dashboard
5. ✅ Configure alert rules
6. ✅ Mark "Sentry DSN" as COMPLETE in gap analysis

---

## Troubleshooting

### DSN Not Working?
- Check DSN format (should start with `https://`)
- Verify project ID is correct
- Ensure Sentry package is installed: `npm install @sentry/node`

### No Errors Showing?
- Check Sentry quota (free tier: 5,000 events/month)
- Verify SENTRY_DSN environment variable is loaded
- Check firewall/network connectivity

### Need Help?
- Sentry Docs: https://docs.sentry.io/
- Sentry Community: https://forum.sentry.io/

---

**Status**: Ready to set up!  
**Impact**: Removes 50% of deployment blocker (1 of 2 placeholder secrets)  
**Time**: 15 minutes  
**Cost**: $0 (Free plan)

🎯 **THE TERRAFUSION WAY: Professional monitoring = Production ready!** 🚀
