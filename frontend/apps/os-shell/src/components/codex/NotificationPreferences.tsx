import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, Mail, MessageSquare, Slack, CheckCircle2, XCircle, Settings } from 'lucide-react';

/**
 * Codex 3-6-9 Framework - Notification Preferences Management UI
 *
 * Features:
 * - Email notification preferences
 * - Slack notification preferences
 * - Teams notification preferences
 * - Alert level thresholds
 * - Daily summary scheduling
 * - Per-county notification settings
 *
 * THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.
 */

interface NotificationPreferences {
  email: EmailPreferences;
  slack: SlackPreferences;
  teams: TeamsPreferences;
  alertThresholds: AlertThresholds;
  dailySummary: DailySummaryPreferences;
}

interface EmailPreferences {
  enabled: boolean;
  address: string;
  criticalAlerts: boolean;
  warningAlerts: boolean;
  infoAlerts: boolean;
  dailySummary: boolean;
  achievements: boolean;
}

interface SlackPreferences {
  enabled: boolean;
  webhook: string;
  criticalAlerts: boolean;
  warningAlerts: boolean;
  infoAlerts: boolean;
  statusUpdates: boolean;
  dailySummary: boolean;
  achievements: boolean;
}

interface TeamsPreferences {
  enabled: boolean;
  webhook: string;
  criticalAlerts: boolean;
  warningAlerts: boolean;
  infoAlerts: boolean;
  statusUpdates: boolean;
  dailySummary: boolean;
  achievements: boolean;
}

interface AlertThresholds {
  ultimatePowerScore: number;
  domainScore: number;
  criticalThreshold: number;
  warningThreshold: number;
}

interface DailySummaryPreferences {
  enabled: boolean;
  time: string;
  timezone: string;
  includeAlerts: boolean;
  includePerformance: boolean;
  includeTrends: boolean;
}

export default function NotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: {
      enabled: true,
      address: '',
      criticalAlerts: true,
      warningAlerts: true,
      infoAlerts: false,
      dailySummary: true,
      achievements: true,
    },
    slack: {
      enabled: false,
      webhook: '',
      criticalAlerts: true,
      warningAlerts: true,
      infoAlerts: true,
      statusUpdates: false,
      dailySummary: true,
      achievements: true,
    },
    teams: {
      enabled: false,
      webhook: '',
      criticalAlerts: true,
      warningAlerts: true,
      infoAlerts: true,
      statusUpdates: false,
      dailySummary: true,
      achievements: true,
    },
    alertThresholds: {
      ultimatePowerScore: 7.2,
      domainScore: 0.6,
      criticalThreshold: 7.2,
      warningThreshold: 9.6,
    },
    dailySummary: {
      enabled: true,
      time: '08:00',
      timezone: 'America/Los_Angeles',
      includeAlerts: true,
      includePerformance: true,
      includeTrends: true,
    },
  });

  const [saving, setSaving] = useState(false);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load preferences from API
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const response = await fetch('/api/codex/notifications/preferences', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
      }
    } catch (err) {
      console.error('Failed to load notification preferences:', err);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    setSaveSuccess(false);
    setError(null);

    try {
      const response = await fetch('/api/codex/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setError('Failed to save preferences. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async (platform: 'slack' | 'teams') => {
    setTestingConnection(platform);
    setError(null);

    try {
      const response = await fetch(`/api/codex/collaboration/${platform}/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        alert(`${platform === 'slack' ? 'Slack' : 'Teams'} connection test successful! Check your channel for the test message.`);
      } else {
        setError(`${platform === 'slack' ? 'Slack' : 'Teams'} connection test failed. Please check your webhook URL.`);
      }
    } catch (err) {
      setError('Network error during connection test.');
    } finally {
      setTestingConnection(null);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-terra-cyan">Notification Preferences</h1>
          <p className="text-terra-slate mt-2">
            Configure how you receive Codex 3-6-9 Framework notifications
          </p>
        </div>
        <Badge variant="outline" className="text-terra-cyan border-terra-cyan">
          <Bell className="w-4 h-4 mr-2" />
          Notification Settings
        </Badge>
      </div>

      {/* Success/Error Alerts */}
      {saveSuccess && (
        <Alert className="bg-green-500/10 border-green-500 text-green-500">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            Notification preferences saved successfully!
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="bg-red-500/10 border-red-500 text-red-500">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="email" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="email">
            <Mail className="w-4 h-4 mr-2" />
            Email
          </TabsTrigger>
          <TabsTrigger value="slack">
            <Slack className="w-4 h-4 mr-2" />
            Slack
          </TabsTrigger>
          <TabsTrigger value="teams">
            <MessageSquare className="w-4 h-4 mr-2" />
            Teams
          </TabsTrigger>
          <TabsTrigger value="advanced">
            <Settings className="w-4 h-4 mr-2" />
            Advanced
          </TabsTrigger>
        </TabsList>

        {/* Email Preferences */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>
                Receive Codex notifications via email
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email Enable */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-enabled">Enable Email Notifications</Label>
                  <p className="text-sm text-terra-slate">
                    Receive notifications at your email address
                  </p>
                </div>
                <Switch
                  id="email-enabled"
                  checked={preferences.email.enabled}
                  onCheckedChange={(checked) =>
                    setPreferences({
                      ...preferences,
                      email: { ...preferences.email, enabled: checked },
                    })
                  }
                />
              </div>

              {/* Email Address */}
              <div className="space-y-2">
                <Label htmlFor="email-address">Email Address</Label>
                <Input
                  id="email-address"
                  type="email"
                  placeholder="your.email@example.com"
                  value={preferences.email.address}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      email: { ...preferences.email, address: e.target.value },
                    })
                  }
                  disabled={!preferences.email.enabled}
                />
              </div>

              {/* Alert Level Toggles */}
              <div className="space-y-4">
                <Label>Notification Types</Label>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-critical">Critical Alerts</Label>
                    <p className="text-sm text-terra-slate">
                      Immediate attention required (Ultimate Power &lt; 7.2)
                    </p>
                  </div>
                  <Switch
                    id="email-critical"
                    checked={preferences.email.criticalAlerts}
                    onCheckedChange={(checked) =>
                      setPreferences({
                        ...preferences,
                        email: { ...preferences.email, criticalAlerts: checked },
                      })
                    }
                    disabled={!preferences.email.enabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-warning">Warning Alerts</Label>
                    <p className="text-sm text-terra-slate">
                      Monitor situation (Ultimate Power 7.2-9.6)
                    </p>
                  </div>
                  <Switch
                    id="email-warning"
                    checked={preferences.email.warningAlerts}
                    onCheckedChange={(checked) =>
                      setPreferences({
                        ...preferences,
                        email: { ...preferences.email, warningAlerts: checked },
                      })
                    }
                    disabled={!preferences.email.enabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-info">Info Alerts</Label>
                    <p className="text-sm text-terra-slate">
                      Informational updates and notifications
                    </p>
                  </div>
                  <Switch
                    id="email-info"
                    checked={preferences.email.infoAlerts}
                    onCheckedChange={(checked) =>
                      setPreferences({
                        ...preferences,
                        email: { ...preferences.email, infoAlerts: checked },
                      })
                    }
                    disabled={!preferences.email.enabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-daily">Daily Summary</Label>
                    <p className="text-sm text-terra-slate">
                      Daily performance digest at 8:00 AM
                    </p>
                  </div>
                  <Switch
                    id="email-daily"
                    checked={preferences.email.dailySummary}
                    onCheckedChange={(checked) =>
                      setPreferences({
                        ...preferences,
                        email: { ...preferences.email, dailySummary: checked },
                      })
                    }
                    disabled={!preferences.email.enabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-achievements">Achievement Notifications</Label>
                    <p className="text-sm text-terra-slate">
                      Divine Balance and Championship Mode announcements
                    </p>
                  </div>
                  <Switch
                    id="email-achievements"
                    checked={preferences.email.achievements}
                    onCheckedChange={(checked) =>
                      setPreferences({
                        ...preferences,
                        email: { ...preferences.email, achievements: checked },
                      })
                    }
                    disabled={!preferences.email.enabled}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Slack Preferences */}
        <TabsContent value="slack">
          <Card>
            <CardHeader>
              <CardTitle>Slack Integration</CardTitle>
              <CardDescription>
                Send Codex notifications to your Slack workspace
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Slack Enable */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="slack-enabled">Enable Slack Notifications</Label>
                  <p className="text-sm text-terra-slate">
                    Send notifications to Slack channel via webhook
                  </p>
                </div>
                <Switch
                  id="slack-enabled"
                  checked={preferences.slack.enabled}
                  onCheckedChange={(checked) =>
                    setPreferences({
                      ...preferences,
                      slack: { ...preferences.slack, enabled: checked },
                    })
                  }
                />
              </div>

              {/* Webhook URL */}
              <div className="space-y-2">
                <Label htmlFor="slack-webhook">Webhook URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="slack-webhook"
                    type="url"
                    placeholder="https://hooks.slack.com/services/..."
                    value={preferences.slack.webhook}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        slack: { ...preferences.slack, webhook: e.target.value },
                      })
                    }
                    disabled={!preferences.slack.enabled}
                  />
                  <Button
                    onClick={() => testConnection('slack')}
                    disabled={!preferences.slack.enabled || !preferences.slack.webhook || testingConnection === 'slack'}
                    variant="outline"
                  >
                    {testingConnection === 'slack' ? 'Testing...' : 'Test'}
                  </Button>
                </div>
                <p className="text-xs text-terra-slate">
                  Get your webhook URL from Slack: Apps → Incoming Webhooks
                </p>
              </div>

              {/* Notification Types */}
              <div className="space-y-4">
                <Label>Notification Types</Label>

                <div className="flex items-center justify-between">
                  <Label htmlFor="slack-critical">Critical Alerts</Label>
                  <Switch
                    id="slack-critical"
                    checked={preferences.slack.criticalAlerts}
                    onCheckedChange={(checked) =>
                      setPreferences({
                        ...preferences,
                        slack: { ...preferences.slack, criticalAlerts: checked },
                      })
                    }
                    disabled={!preferences.slack.enabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="slack-warning">Warning Alerts</Label>
                  <Switch
                    id="slack-warning"
                    checked={preferences.slack.warningAlerts}
                    onCheckedChange={(checked) =>
                      setPreferences({
                        ...preferences,
                        slack: { ...preferences.slack, warningAlerts: checked },
                      })
                    }
                    disabled={!preferences.slack.enabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="slack-info">Info Alerts</Label>
                  <Switch
                    id="slack-info"
                    checked={preferences.slack.infoAlerts}
                    onCheckedChange={(checked) =>
                      setPreferences({
                        ...preferences,
                        slack: { ...preferences.slack, infoAlerts: checked },
                      })
                    }
                    disabled={!preferences.slack.enabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="slack-status">Status Updates</Label>
                  <Switch
                    id="slack-status"
                    checked={preferences.slack.statusUpdates}
                    onCheckedChange={(checked) =>
                      setPreferences({
                        ...preferences,
                        slack: { ...preferences.slack, statusUpdates: checked },
                      })
                    }
                    disabled={!preferences.slack.enabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="slack-daily">Daily Summary</Label>
                  <Switch
                    id="slack-daily"
                    checked={preferences.slack.dailySummary}
                    onCheckedChange={(checked) =>
                      setPreferences({
                        ...preferences,
                        slack: { ...preferences.slack, dailySummary: checked },
                      })
                    }
                    disabled={!preferences.slack.enabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="slack-achievements">Achievements</Label>
                  <Switch
                    id="slack-achievements"
                    checked={preferences.slack.achievements}
                    onCheckedChange={(checked) =>
                      setPreferences({
                        ...preferences,
                        slack: { ...preferences.slack, achievements: checked },
                      })
                    }
                    disabled={!preferences.slack.enabled}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teams Preferences */}
        <TabsContent value="teams">
          <Card>
            <CardHeader>
              <CardTitle>Microsoft Teams Integration</CardTitle>
              <CardDescription>
                Send Codex notifications to your Teams channel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Teams Enable */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="teams-enabled">Enable Teams Notifications</Label>
                  <p className="text-sm text-terra-slate">
                    Send notifications to Teams channel via webhook
                  </p>
                </div>
                <Switch
                  id="teams-enabled"
                  checked={preferences.teams.enabled}
                  onCheckedChange={(checked) =>
                    setPreferences({
                      ...preferences,
                      teams: { ...preferences.teams, enabled: checked },
                    })
                  }
                />
              </div>

              {/* Webhook URL */}
              <div className="space-y-2">
                <Label htmlFor="teams-webhook">Webhook URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="teams-webhook"
                    type="url"
                    placeholder="https://outlook.office.com/webhook/..."
                    value={preferences.teams.webhook}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        teams: { ...preferences.teams, webhook: e.target.value },
                      })
                    }
                    disabled={!preferences.teams.enabled}
                  />
                  <Button
                    onClick={() => testConnection('teams')}
                    disabled={!preferences.teams.enabled || !preferences.teams.webhook || testingConnection === 'teams'}
                    variant="outline"
                  >
                    {testingConnection === 'teams' ? 'Testing...' : 'Test'}
                  </Button>
                </div>
                <p className="text-xs text-terra-slate">
                  Get your webhook URL from Teams: Channel → Connectors → Incoming Webhook
                </p>
              </div>

              {/* Notification Types */}
              <div className="space-y-4">
                <Label>Notification Types</Label>

                <div className="flex items-center justify-between">
                  <Label htmlFor="teams-critical">Critical Alerts</Label>
                  <Switch
                    id="teams-critical"
                    checked={preferences.teams.criticalAlerts}
                    onCheckedChange={(checked) =>
                      setPreferences({
                        ...preferences,
                        teams: { ...preferences.teams, criticalAlerts: checked },
                      })
                    }
                    disabled={!preferences.teams.enabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="teams-warning">Warning Alerts</Label>
                  <Switch
                    id="teams-warning"
                    checked={preferences.teams.warningAlerts}
                    onCheckedChange={(checked) =>
                      setPreferences({
                        ...preferences,
                        teams: { ...preferences.teams, warningAlerts: checked },
                      })
                    }
                    disabled={!preferences.teams.enabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="teams-info">Info Alerts</Label>
                  <Switch
                    id="teams-info"
                    checked={preferences.teams.infoAlerts}
                    onCheckedChange={(checked) =>
                      setPreferences({
                        ...preferences,
                        teams: { ...preferences.teams, infoAlerts: checked },
                      })
                    }
                    disabled={!preferences.teams.enabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="teams-status">Status Updates</Label>
                  <Switch
                    id="teams-status"
                    checked={preferences.teams.statusUpdates}
                    onCheckedChange={(checked) =>
                      setPreferences({
                        ...preferences,
                        teams: { ...preferences.teams, statusUpdates: checked },
                      })
                    }
                    disabled={!preferences.teams.enabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="teams-daily">Daily Summary</Label>
                  <Switch
                    id="teams-daily"
                    checked={preferences.teams.dailySummary}
                    onCheckedChange={(checked) =>
                      setPreferences({
                        ...preferences,
                        teams: { ...preferences.teams, dailySummary: checked },
                      })
                    }
                    disabled={!preferences.teams.enabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="teams-achievements">Achievements</Label>
                  <Switch
                    id="teams-achievements"
                    checked={preferences.teams.achievements}
                    onCheckedChange={(checked) =>
                      setPreferences({
                        ...preferences,
                        teams: { ...preferences.teams, achievements: checked },
                      })
                    }
                    disabled={!preferences.teams.enabled}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Settings */}
        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>
                Configure alert thresholds and daily summary preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Alert Thresholds */}
              <div className="space-y-4">
                <Label>Alert Thresholds</Label>

                <div className="space-y-2">
                  <Label htmlFor="threshold-critical">
                    Critical Alert Threshold (Ultimate Power Score &lt; value)
                  </Label>
                  <Input
                    id="threshold-critical"
                    type="number"
                    step="0.1"
                    min="0"
                    max="12"
                    value={preferences.alertThresholds.criticalThreshold}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        alertThresholds: {
                          ...preferences.alertThresholds,
                          criticalThreshold: parseFloat(e.target.value),
                        },
                      })
                    }
                  />
                  <p className="text-xs text-terra-slate">
                    Default: 7.2 (Critical if below this score)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="threshold-warning">
                    Warning Alert Threshold (Ultimate Power Score &lt; value)
                  </Label>
                  <Input
                    id="threshold-warning"
                    type="number"
                    step="0.1"
                    min="0"
                    max="12"
                    value={preferences.alertThresholds.warningThreshold}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        alertThresholds: {
                          ...preferences.alertThresholds,
                          warningThreshold: parseFloat(e.target.value),
                        },
                      })
                    }
                  />
                  <p className="text-xs text-terra-slate">
                    Default: 9.6 (Warning if below this score)
                  </p>
                </div>
              </div>

              {/* Daily Summary Settings */}
              <div className="space-y-4">
                <Label>Daily Summary Settings</Label>

                <div className="flex items-center justify-between">
                  <Label htmlFor="daily-enabled">Enable Daily Summary</Label>
                  <Switch
                    id="daily-enabled"
                    checked={preferences.dailySummary.enabled}
                    onCheckedChange={(checked) =>
                      setPreferences({
                        ...preferences,
                        dailySummary: { ...preferences.dailySummary, enabled: checked },
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="daily-time">Summary Time</Label>
                  <Input
                    id="daily-time"
                    type="time"
                    value={preferences.dailySummary.time}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        dailySummary: { ...preferences.dailySummary, time: e.target.value },
                      })
                    }
                    disabled={!preferences.dailySummary.enabled}
                  />
                  <p className="text-xs text-terra-slate">
                    Time when daily summary will be sent
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="daily-timezone">Timezone</Label>
                  <Select
                    value={preferences.dailySummary.timezone}
                    onValueChange={(value) =>
                      setPreferences({
                        ...preferences,
                        dailySummary: { ...preferences.dailySummary, timezone: value },
                      })
                    }
                    disabled={!preferences.dailySummary.enabled}
                  >
                    <SelectTrigger id="daily-timezone">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                      <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="daily-alerts">Include Alerts</Label>
                  <Switch
                    id="daily-alerts"
                    checked={preferences.dailySummary.includeAlerts}
                    onCheckedChange={(checked) =>
                      setPreferences({
                        ...preferences,
                        dailySummary: { ...preferences.dailySummary, includeAlerts: checked },
                      })
                    }
                    disabled={!preferences.dailySummary.enabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="daily-performance">Include Performance Metrics</Label>
                  <Switch
                    id="daily-performance"
                    checked={preferences.dailySummary.includePerformance}
                    onCheckedChange={(checked) =>
                      setPreferences({
                        ...preferences,
                        dailySummary: { ...preferences.dailySummary, includePerformance: checked },
                      })
                    }
                    disabled={!preferences.dailySummary.enabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="daily-trends">Include Trend Analysis</Label>
                  <Switch
                    id="daily-trends"
                    checked={preferences.dailySummary.includeTrends}
                    onCheckedChange={(checked) =>
                      setPreferences({
                        ...preferences,
                        dailySummary: { ...preferences.dailySummary, includeTrends: checked },
                      })
                    }
                    disabled={!preferences.dailySummary.enabled}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={savePreferences}
          disabled={saving}
          className="bg-terra-cyan text-terra-midnight hover:bg-terra-cyan/90"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  );
}
