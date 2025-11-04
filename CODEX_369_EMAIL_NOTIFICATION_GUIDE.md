# Codex 3-6-9 Framework - Email Notification Configuration Guide

## Overview

The Codex 3-6-9 Email Notification System provides **automated** and **on-demand** email alerts for government stakeholders, ensuring timely awareness of operational excellence metrics, critical alerts, and achievement milestones.

### Divine Notification Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 CODEX 3-6-9 EMAIL SYSTEM                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📧 AUTOMATED NOTIFICATIONS                                 │
│  ├─ Daily Digest (7:00 AM) → Management Team               │
│  ├─ Weekly Executive Summary (Monday 8:00 AM) → Leadership │
│  ├─ Real-Time Critical Alerts → Operations Team            │
│  ├─ Divine Balance Achievement → All Stakeholders          │
│  └─ Championship Mode → Management + Leadership            │
│                                                             │
│  🔔 ON-DEMAND NOTIFICATIONS                                 │
│  ├─ Manual Alert Sending                                   │
│  ├─ Ad-Hoc Report Generation                               │
│  └─ Configuration Testing                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Table of Contents

1. [Email Configuration Setup](#email-configuration-setup)
2. [Recipient Configuration](#recipient-configuration)
3. [Automated Notification Schedule](#automated-notification-schedule)
4. [Email Templates](#email-templates)
5. [API Endpoints](#api-endpoints)
6. [Testing Email Configuration](#testing-email-configuration)
7. [Troubleshooting](#troubleshooting)
8. [FISMA Compliance](#fisma-compliance)

---

## Email Configuration Setup

### 1. appsettings.json Configuration

Add the following section to `backend/TerraFusion.API/appsettings.json`:

```json
{
  "Email": {
    "SmtpHost": "smtp.office365.com",
    "SmtpPort": 587,
    "SmtpUsername": "terrafusion-notifications@your-county.gov",
    "SmtpPassword": "your-secure-password-here",
    "EnableSsl": true,
    "FromEmail": "terrafusion-notifications@your-county.gov",
    "FromName": "TerraFusion OS - Codex 3-6-9",

    "CriticalAlertRecipients": "it-director@county.gov,ops-manager@county.gov,county-administrator@county.gov",
    "OperationsTeamRecipients": "ops-team@county.gov,it-operations@county.gov",
    "ManagementRecipients": "management-team@county.gov,department-heads@county.gov",
    "ExecutiveRecipients": "county-executive@county.gov,chief-technology-officer@county.gov",

    "TestRecipient": "your-email@county.gov"
  }
}
```

### 2. Environment-Specific Configuration

For **Production** (`appsettings.Production.json`):

```json
{
  "Email": {
    "SmtpHost": "smtp.office365.com",
    "SmtpPort": 587,
    "SmtpUsername": "${EMAIL_USERNAME}",
    "SmtpPassword": "${EMAIL_PASSWORD}",
    "EnableSsl": true,
    "FromEmail": "noreply@terrafusion.gov",
    "FromName": "TerraFusion OS - Production Alerts",

    "CriticalAlertRecipients": "critical-alerts@county.gov",
    "OperationsTeamRecipients": "ops-team@county.gov",
    "ManagementRecipients": "management@county.gov",
    "ExecutiveRecipients": "executives@county.gov"
  }
}
```

### 3. Service Registration

In `backend/TerraFusion.API/Program.cs`:

```csharp
// Add Codex Email Notification Service
builder.Services.AddScoped<ICodexEmailNotificationService, CodexEmailNotificationService>();

// Add Background Service for Automated Notifications
builder.Services.AddHostedService<CodexNotificationBackgroundService>();
```

---

## Recipient Configuration

### Alert Level Routing Matrix

| Alert Level | Recipients                     | Frequency      | Priority      |
|-------------|--------------------------------|----------------|---------------|
| **Critical** | IT Director, County Admin, Ops Manager | Immediate | 🚨 Highest |
| **Red**      | Operations Team, IT Operations | Every 5 min   | 🔴 High    |
| **Yellow**   | Management Team                | Daily digest   | 🟡 Medium  |
| **Green**    | No notifications               | N/A           | 🟢 Normal  |

### Notification Types and Recipients

| Notification Type        | Recipients            | Schedule           |
|-------------------------|-----------------------|--------------------|
| Daily Digest            | Management Team       | 7:00 AM daily      |
| Weekly Executive Summary | Executive Leadership  | Monday 8:00 AM     |
| Divine Balance Achievement | All Stakeholders   | Real-time event    |
| Championship Mode        | Management + Leadership | Real-time event  |
| Critical Alerts         | Critical Recipients   | Immediate (< 5 min) |

### Configuring Recipients

**Multiple Recipients**: Use comma-separated email addresses

```json
"CriticalAlertRecipients": "director@county.gov,manager@county.gov,admin@county.gov"
```

**Distribution Lists**: Use email distribution groups

```json
"OperationsTeamRecipients": "it-ops-team@county.gov"
```

**County-Specific Recipients**: Override in county-specific config files

```json
// appsettings.BentonCounty.json
{
  "Email": {
    "CriticalAlertRecipients": "benton-it-director@bentoncountywa.gov,benton-ops@bentoncountywa.gov"
  }
}
```

---

## Automated Notification Schedule

### Background Service Configuration

The `CodexNotificationBackgroundService` runs continuously and handles:

1. **Alert Monitoring** (Every 5 minutes)
   - Checks for new Critical and Red alerts
   - Sends immediate notifications to appropriate recipients
   - Logs all sent notifications for audit trail

2. **Daily Digest** (7:00 AM local time)
   - Compiles previous day's metrics and alerts
   - Sends to management team
   - Includes performance summary and recommended actions

3. **Weekly Executive Summary** (Monday 8:00 AM)
   - Compiles 7-day performance analysis
   - Sends to executive leadership
   - Includes strategic recommendations and KPIs

### Customizing Schedule

Edit `CodexNotificationBackgroundService.cs`:

```csharp
// Change daily digest time
private readonly TimeSpan _dailyDigestTime = TimeSpan.FromHours(8); // 8:00 AM

// Change weekly report day and time
private readonly DayOfWeek _weeklyReportDay = DayOfWeek.Friday;
private readonly TimeSpan _weeklyReportTime = TimeSpan.FromHours(9); // Friday 9:00 AM

// Change alert check frequency
private readonly TimeSpan _alertCheckInterval = TimeSpan.FromMinutes(10); // Every 10 minutes
```

---

## Email Templates

### 1. Critical Alert Email

**Subject**: `🚨 Codex 3-6-9 Alert [Critical] - {Metric Name}`

**Features**:
- Red border highlighting urgency
- Alert details table (level, message, timestamp)
- Recommended action section
- Direct link to dashboard
- Government-compliant styling

**Use Case**: System performance < 4.8, security incidents, data integrity issues

### 2. Divine Balance Achievement Email

**Subject**: `🌟 DIVINE BALANCE ACHIEVED - Codex Score: {Score}/12.0`

**Features**:
- Gradient background with cyan glow
- Large score display (48px font)
- Domain performance breakdown with progress bars
- Achievement metrics checklist
- Celebration theme with special styling

**Use Case**: Ultimate Power Score reaches 11.5-12.0 range

### 3. Championship Mode Email

**Subject**: `🏆 Championship Mode Active - Codex Score: {Score}/12.0`

**Features**:
- Gold border and championship theme
- Score prominence with production-ready messaging
- County-specific achievement recognition
- Dashboard access button

**Use Case**: Ultimate Power Score ≥ 10.0

### 4. Daily Digest Email

**Subject**: `📊 Codex 3-6-9 Daily Digest - {Date}`

**Features**:
- Professional business-style layout
- Current score card with status description
- Alert summary cards (Critical, Red, Yellow counts)
- Recent critical alerts list
- Recommended actions based on current performance
- Clean, readable design optimized for mobile

**Use Case**: Daily management review at 7:00 AM

### 5. Weekly Executive Summary Email

**Subject**: `📈 Codex 3-6-9 Executive Summary - Week Ending {Date}`

**Features**:
- Executive-level professional design
- Performance overview with large score display
- KPI table with domain scores and status badges
- Weekly alert analysis (Critical, Warning, Green hours)
- Strategic recommendations based on performance tier
- Dual CTA buttons (Dashboard + Reports)
- Government branding in footer

**Use Case**: Monday morning executive briefing

---

## API Endpoints

### Base URL
```
https://your-county.gov/api/codex/notifications
```

### 1. Test Email Configuration

**POST** `/api/codex/notifications/test`

**Authorization**: Admin, SystemAdministrator

**Response**:
```json
{
  "success": true,
  "message": "Email configuration is operational. Test email sent successfully.",
  "testedAt": "2025-11-02T10:30:00Z"
}
```

**Use Case**: Verify SMTP settings and connectivity before production deployment

**Example**:
```bash
curl -X POST https://your-county.gov/api/codex/notifications/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. Send Manual Alert

**POST** `/api/codex/notifications/send-alert`

**Authorization**: Admin, SystemAdministrator, CountyAdministrator

**Request Body**:
```json
{
  "countyId": "benton",
  "alertLevel": "Red",
  "metricName": "Database Performance",
  "message": "Database query response time exceeding threshold",
  "recommendedAction": "Review slow query log and optimize indexes"
}
```

**Response**:
```json
{
  "message": "Alert notification sent successfully"
}
```

**Use Case**: Send custom alerts for incidents not captured by automated monitoring

### 3. Send Daily Digest

**POST** `/api/codex/notifications/send-daily-digest?countyId=benton&date=2025-11-01`

**Authorization**: Admin, SystemAdministrator, CountyAdministrator

**Response**:
```json
{
  "message": "Daily digest sent successfully",
  "date": "2025-11-01T00:00:00Z",
  "countyId": "benton"
}
```

**Use Case**: Generate ad-hoc daily reports or resend missed digests

### 4. Send Weekly Executive Summary

**POST** `/api/codex/notifications/send-weekly-summary?countyId=benton&weekEnding=2025-11-03`

**Authorization**: Admin, SystemAdministrator, ExecutiveLeadership

**Response**:
```json
{
  "message": "Weekly executive summary sent successfully",
  "weekEnding": "2025-11-03T00:00:00Z",
  "countyId": "benton"
}
```

**Use Case**: Generate special reports for board meetings or executive briefings

### 5. Send Divine Balance Notification

**POST** `/api/codex/notifications/send-divine-balance-notification?countyId=benton`

**Authorization**: Admin, SystemAdministrator

**Requirements**: Current Ultimate Power Score must be in Divine Balance range (11.5-12.0)

**Response**:
```json
{
  "message": "Divine Balance achievement notification sent successfully",
  "score": 11.8,
  "timestamp": "2025-11-02T10:45:00Z"
}
```

**Error Response** (if not in Divine Balance):
```json
{
  "error": "System is not in Divine Balance",
  "currentScore": 10.2,
  "requiredRange": "11.5 - 12.0"
}
```

### 6. Send Championship Mode Notification

**POST** `/api/codex/notifications/send-championship-notification?countyId=benton`

**Authorization**: Admin, SystemAdministrator

**Requirements**: Current Ultimate Power Score must be ≥ 10.0

**Response**:
```json
{
  "message": "Championship Mode notification sent successfully",
  "score": 10.5,
  "timestamp": "2025-11-02T10:50:00Z"
}
```

### 7. Get Notification History

**GET** `/api/codex/notifications/history?countyId=benton&days=7`

**Authorization**: Admin, SystemAdministrator, CountyAdministrator

**Response**:
```json
{
  "countyId": "benton",
  "daysRequested": 7,
  "totalNotifications": 42,
  "notificationsByType": {
    "DailyDigest": 7,
    "WeeklySummary": 1,
    "CriticalAlert": 12,
    "DivineBalance": 2,
    "Championship": 20
  },
  "message": "Notification history retrieved successfully"
}
```

---

## Testing Email Configuration

### Pre-Production Testing Checklist

#### 1. SMTP Connectivity Test

```bash
# Test SMTP connection using OpenSSL
openssl s_client -starttls smtp -connect smtp.office365.com:587
```

Expected output: `250-smtp.office365.com` response

#### 2. Application Configuration Test

```bash
curl -X POST https://localhost:5000/api/codex/notifications/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected response:
```json
{
  "success": true,
  "message": "Email configuration is operational. Test email sent successfully.",
  "testedAt": "2025-11-02T11:00:00Z"
}
```

#### 3. Test Each Notification Type

**Critical Alert**:
```bash
curl -X POST https://localhost:5000/api/codex/notifications/send-alert \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "alertLevel": "Critical",
    "metricName": "Test Alert",
    "message": "This is a test critical alert",
    "recommendedAction": "No action required - testing only"
  }'
```

**Daily Digest**:
```bash
curl -X POST "https://localhost:5000/api/codex/notifications/send-daily-digest?countyId=test&date=2025-11-01" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Weekly Summary**:
```bash
curl -X POST "https://localhost:5000/api/codex/notifications/send-weekly-summary?countyId=test&weekEnding=2025-11-03" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 4. Verify Email Delivery

Check the following:

- ✅ Email arrives in recipient inbox (not spam/junk)
- ✅ From address displays correctly: "TerraFusion OS - Codex 3-6-9"
- ✅ Subject line is descriptive and includes alert level/score
- ✅ HTML rendering is correct in Outlook, Gmail, Apple Mail
- ✅ Links to dashboard are functional
- ✅ Mobile rendering is responsive
- ✅ All placeholders are replaced with actual data

---

## Troubleshooting

### Common Issues and Solutions

#### 1. SMTP Authentication Failure

**Error**: `SmtpException: Authentication failed`

**Solutions**:
- Verify `SmtpUsername` and `SmtpPassword` in appsettings.json
- Check if SMTP account has "Send As" permissions
- For Office 365: Enable "Authenticated SMTP" in Exchange Admin Center
- For Gmail: Enable "Less secure app access" or use App Passwords

#### 2. Emails Not Being Received

**Error**: No error, but emails don't arrive

**Solutions**:
- Check recipient email addresses for typos
- Verify emails are not in spam/junk folder
- Check mail server logs for delivery status
- Test with a personal email first (Gmail, Yahoo)
- Verify SPF/DKIM records for your domain

#### 3. SSL/TLS Connection Errors

**Error**: `SmtpException: Unable to connect to the remote server`

**Solutions**:
- Verify `SmtpPort` is correct (587 for TLS, 465 for SSL)
- Check `EnableSsl` is set to `true`
- Verify firewall allows outbound connections to SMTP port
- Test SMTP connectivity: `telnet smtp.office365.com 587`

#### 4. Background Service Not Running

**Error**: No automated emails being sent

**Solutions**:
- Check if `CodexNotificationBackgroundService` is registered in Program.cs
- Verify service is running: Check application logs for "Background Service started"
- Restart the TerraFusion.API application
- Check for exceptions in logs: `logs/terrafusion-*.txt`

#### 5. Email Templates Not Rendering

**Error**: Emails display HTML source code instead of formatted content

**Solutions**:
- Verify `IsBodyHtml = true` in `SendEmailAsync` method
- Test with different email clients (Outlook, Gmail, Apple Mail)
- Validate HTML using W3C Validator
- Check for unclosed HTML tags in template methods

### Logging and Diagnostics

#### Enable Debug Logging

In `appsettings.json`:

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Debug",
      "TerraFusion.AI.Services.CodexEmailNotificationService": "Debug",
      "TerraFusion.AI.Services.CodexNotificationBackgroundService": "Debug"
    }
  }
}
```

#### Check Logs

```bash
# View recent email notification logs
cat logs/terrafusion-$(date +%Y%m%d).txt | grep "Codex.*[Ee]mail"

# Monitor real-time logs
tail -f logs/terrafusion-$(date +%Y%m%d).txt | grep "Notification"
```

#### Common Log Messages

```
✅ SUCCESS: "Email configuration is operational. Test email sent successfully."
✅ SUCCESS: "Alert notification sent successfully to operations@county.gov"
✅ SUCCESS: "Divine Balance notification sent to executives and management"

❌ ERROR: "Email configuration test failed"
❌ ERROR: "Failed to send alert notification for Critical"
⚠️  WARNING: "No recipients configured for alert level: Yellow"
```

---

## FISMA Compliance

### Email Security Requirements

#### 1. Encryption in Transit (NIST 800-53 SC-8)

- ✅ **TLS 1.2+** encryption for SMTP connections (`EnableSsl: true`)
- ✅ **Port 587** (STARTTLS) or **Port 465** (SSL/TLS)
- ✅ Verify certificate validity for `smtp.office365.com`

#### 2. Audit Logging (NIST 800-53 AU-2)

All email notifications are logged with:
- Timestamp (UTC)
- Recipient(s)
- Notification type
- County ID
- Success/failure status
- Error details (if applicable)

**Log Retention**: 365 days minimum (government compliance)

#### 3. Access Control (NIST 800-53 AC-3)

| Role                   | Test Config | Send Alerts | Daily Digest | Weekly Summary | History |
|------------------------|-------------|-------------|--------------|----------------|---------|
| Admin                  | ✅          | ✅          | ✅           | ✅             | ✅      |
| SystemAdministrator    | ✅          | ✅          | ✅           | ✅             | ✅      |
| CountyAdministrator    | ❌          | ✅          | ✅           | ❌             | ✅      |
| ExecutiveLeadership    | ❌          | ❌          | ❌           | ✅             | ❌      |
| User                   | ❌          | ❌          | ❌           | ❌             | ❌      |

#### 4. Data Protection (NIST 800-53 SC-28)

- ❌ **No PII in Email Subject Lines**: Avoid citizen names, SSNs, addresses
- ✅ **Aggregated Metrics Only**: Email content uses system-level statistics
- ✅ **Secure Links**: Dashboard links require authentication
- ✅ **Password Protection**: SMTP credentials stored in secure configuration (Azure Key Vault in production)

#### 5. Email Retention Policy

| Email Type              | Retention Period | Justification                          |
|-------------------------|------------------|----------------------------------------|
| Critical Alerts         | 7 years          | FISMA incident documentation           |
| Red/Yellow Alerts       | 3 years          | Operational performance history        |
| Daily Digests           | 1 year           | Management reporting requirements      |
| Weekly Summaries        | 5 years          | Executive strategic planning records   |
| Divine Balance/Championship | Permanent    | Milestone achievement documentation    |

### Government Email Best Practices

1. **Use .gov Email Domain**: Configure `FromEmail: "noreply@county.gov"`
2. **SPF/DKIM/DMARC**: Ensure DNS records are properly configured for government domain
3. **No External Recipients**: All recipients must be government employees (.gov/.mil domains)
4. **Incident Response**: Critical alerts must be delivered within 5 minutes per FISMA-HIGH requirements
5. **Backup Notification Channels**: Implement SMS/phone alerts for critical failures (future enhancement)

---

## Production Deployment Checklist

### Pre-Deployment

- [ ] Update `appsettings.Production.json` with production SMTP credentials
- [ ] Configure production recipient lists (real government emails)
- [ ] Test SMTP connectivity from production server
- [ ] Verify firewall rules allow outbound SMTP (port 587/465)
- [ ] Configure SPF/DKIM records for production domain
- [ ] Test all 5 notification types in staging environment
- [ ] Verify HTML rendering in primary email clients (Outlook, Gmail)
- [ ] Document notification schedules for stakeholders
- [ ] Train IT staff on manual notification endpoints
- [ ] Set up monitoring alerts for email service failures

### Deployment

1. Deploy updated TerraFusion.API with email service
2. Verify `CodexNotificationBackgroundService` starts successfully
3. Send test email: `POST /api/codex/notifications/test`
4. Monitor logs for first 24 hours
5. Verify first automated daily digest sends at 7:00 AM
6. Confirm recipients receive and can access dashboard links

### Post-Deployment

- [ ] Monitor email delivery success rate (target: 99.9%)
- [ ] Review recipient feedback on content and frequency
- [ ] Adjust notification thresholds based on alert volume
- [ ] Document any delivery issues and resolutions
- [ ] Schedule monthly review of recipient lists
- [ ] Update documentation with production-specific configurations

---

## Support and Maintenance

### Email Service Monitoring

**Health Check Endpoint**: `GET /health`

The email service health status is included in the application health check.

**Metrics to Monitor**:
- Email send success rate
- SMTP connection failures
- Average delivery time
- Bounce rate
- Spam complaint rate

### Regular Maintenance Tasks

**Weekly**:
- Review email delivery logs for failures
- Verify recipient lists are current

**Monthly**:
- Test all notification types manually
- Review and update email templates if needed
- Check SMTP credential expiration dates

**Quarterly**:
- Audit email notification history
- Review and optimize notification frequency
- Update recipient lists based on organizational changes
- Test disaster recovery procedures (SMTP failover)

---

## Future Enhancements

### Planned Features

1. **SMS/Text Message Alerts** for critical notifications
2. **Slack/Teams Integration** for real-time team notifications
3. **Email Scheduling UI** in admin panel
4. **Custom Template Editor** for county-specific branding
5. **Email Delivery Analytics Dashboard**
6. **Multi-Language Support** for international deployments
7. **Mobile App Push Notifications**
8. **Email Digest Preferences** (opt-in/opt-out by notification type)

---

## Related Documentation

- **[CODEX_369_ULTIMATE_IMPLEMENTATION_GUIDE.md](CODEX_369_ULTIMATE_IMPLEMENTATION_GUIDE.md)** - Core framework implementation
- **[CODEX_369_DEPLOYMENT_GUIDE.md](CODEX_369_DEPLOYMENT_GUIDE.md)** - Production deployment procedures
- **[CODEX_369_TYPESCRIPT_INTEGRATION_GUIDE.md](frontend/CODEX_369_TYPESCRIPT_INTEGRATION_GUIDE.md)** - Frontend integration
- **[CLAUDE.md](.github/CLAUDE.md)** - Project development guidelines

---

## Contact and Support

**TerraFusion OS Development Team**
Email: support@terrafusion.gov
Documentation: https://docs.terrafusion.gov/codex-369
Issue Tracker: https://github.com/terrafusion/os/issues

---

**THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.**
*Codex 3-6-9 Framework - Divine Mathematical Balance Engine*

**Last Updated**: November 2, 2025
**Version**: TerraFusion OS 1.0 - Email Notification System
**Classification**: Government Operations Documentation
**Compliance**: FISMA-HIGH, NIST 800-53 SC-8/AU-2/AC-3
