# Command Portal Integration Guide for TerraFusionIDE

**Workspace**: TerraFusionIDE  
**Integration Status**: ✅ Ready for activation  
**Last Updated**: 2025-10-16 10:46:49

---

## 📊 Integration Overview

This workspace is fully integrated with the TerraFusion Command Portal for:
- Real-time performance monitoring
- Unified SLA tracking
- Centralized alert management
- Optimization recommendations
- Compliance reporting
- Security event monitoring

---

## 🔧 Setup Instructions

### 1. Environment Variables

Add these to your `.env` file:

```bash
COMMAND_PORTAL_URL=https://command-portal.terrafusion.gov/api
PORTAL_TOKEN=<your-workspace-token>
PORTAL_WEBHOOK_PORT=3001
```

### 2. Initialize Portal Integration

```bash
npm run portal:init
```

This will:
- Validate portal connectivity
- Register workspace with portal
- Sync initial metrics
- Start continuous monitoring

### 3. Verify Integration

```bash
npm run portal:status
```

Expected output:
```
✅ Portal connection: Connected
✅ Metrics sync: Active (30s interval)
✅ Alert management: Active
✅ Webhook listener: Running on port 3001
```

---

## 📊 Available NPM Scripts

```bash
# Portal management
npm run portal:init              # Initialize portal integration
npm run portal:connect           # Test portal connection
npm run portal:status            # Check integration status
npm run portal:sync-metrics      # Force metric sync
npm run portal:webhook-test      # Test webhook endpoint

# Dashboard operations
npm run portal:dashboard         # Open portal dashboard
npm run portal:view-metrics      # View real-time metrics
npm run portal:view-alerts       # View active alerts
npm run portal:view-sla          # View SLA status

# Advanced operations
npm run portal:enable-ai         # Enable AI insights
npm run portal:export-data       # Export metrics data
npm run portal:compliance-report # Generate compliance report
```

---

## 🔔 Alert Management

### Alert Flow

```
Workspace Alert
    ↓
Metrics Collection
    ↓
Portal Sync (30-second intervals)
    ↓
Portal Processing
    ↓
Dashboard Display + Webhook Callback
    ↓
Escalation (if needed)
    ↓
Team Notification
```

### Webhook Endpoints

Your workspace is listening for these webhook events:

- `POST /webhooks/portal/alerts` - Alert events from portal
- `POST /webhooks/portal/performance` - Performance recommendations
- `POST /webhooks/portal/sla` - SLA events
- `POST /webhooks/portal/optimization` - Optimization suggestions
- `POST /webhooks/portal/security` - Security events

---

## 📈 Real-time Dashboard

Access your workspace dashboard:

```
https://command-portal.terrafusion.gov/workspace/TerraFusionIDE
```

Dashboard features:
- 🎯 Real-time performance metrics
- 📊 SLA compliance tracking
- 🔔 Active alerts with escalation
- 🔧 Optimization recommendations
- 🛡️ Security event timeline
- 📋 Compliance status
- 🧠 AI-powered insights

---

## 🔄 Data Synchronization

### Metrics Sync

```
Interval: 30 seconds
Data: Performance metrics, resource usage, error rates
Retention: 90 days in portal
Aggregation: 1m, 5m, 15m, 1h, 1d
```

### Alert Sync

```
Interval: Real-time
Data: Alert severity, metrics, escalation status
Retention: 365 days in portal
Actions: Acknowledge, resolve, escalate, reassign
```

### SLA Tracking

```
Interval: Continuous
Metrics: Uptime %, response time, error rate
Targets: Domain-specific SLA targets
Reporting: Daily, weekly, monthly

Current SLA Target: 99.9% uptime
```

---

## 🛡️ Security & Authentication

### Token Management

Your workspace uses JWT authentication:

```bash
# Generate new token
npm run portal:generate-token

# Rotate token
npm run portal:rotate-token

# Revoke token
npm run portal:revoke-token
```

### Data Encryption

All communication with portal is:
- ✅ TLS 1.3 encrypted
- ✅ Mutually authenticated
- ✅ End-to-end encrypted where applicable

---

## 🔧 Troubleshooting

### Connection Issues

```bash
# Test connectivity
npm run portal:connect

# Check network
npm run portal:network-test

# View logs
npm run portal:logs
```

### Metric Sync Problems

```bash
# Force sync
npm run portal:sync-metrics

# Check sync status
npm run portal:sync-status

# Enable debug logging
PORTAL_DEBUG=true npm run portal:sync-metrics
```

### Webhook Issues

```bash
# Test webhook endpoint
npm run portal:webhook-test

# Verify webhook configuration
npm run portal:webhook-config

# Check webhook logs
npm run portal:webhook-logs
```

---

## 📞 Support

For integration issues:

1. **Check Status**: `npm run portal:status`
2. **View Logs**: `npm run portal:logs`
3. **Test Connection**: `npm run portal:connect`
4. **Contact Portal Team**: support@command-portal.terrafusion.gov

---

## 📋 Checklist

- [ ] Environment variables configured
- [ ] Portal integration initialized
- [ ] Metrics syncing successfully
- [ ] Alerts flowing to portal
- [ ] Dashboard accessible
- [ ] Webhooks responding
- [ ] SLA tracking active
- [ ] Optimization recommendations received

---

**Integration Status**: ✅ Operational  
**Portal Connection**: ✅ Active  
**Metrics Sync**: ✅ Running  
**Support**: 24/7 Available
