import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  Mail,
  Send,
  TestTube,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Users,
} from 'lucide-react';

interface CodexEmailNotificationPanelProps {
  countyId?: string;
}

interface EmailTestResult {
  success: boolean;
  message: string;
  testedAt: string;
  errorDetails?: string;
}

interface ManualAlertRequest {
  countyId?: string;
  alertLevel: 'Critical' | 'Red' | 'Yellow' | 'Green';
  metricName: string;
  message: string;
  recommendedAction?: string;
}

/**
 * Codex Email Notification Panel
 *
 * Administrative interface for testing and managing Codex 3-6-9 email notifications.
 * Provides controls for:
 * - Testing email configuration
 * - Sending manual alerts
 * - Triggering daily digests and weekly summaries
 * - Viewing notification history
 *
 * THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.
 */
export function CodexEmailNotificationPanel({ countyId }: CodexEmailNotificationPanelProps) {
  const [testResult, setTestResult] = useState<EmailTestResult | null>(null);
  const [testing, setTesting] = useState(false);
  const [sending, setSending] = useState(false);

  // Manual alert form state
  const [alertForm, setAlertForm] = useState<ManualAlertRequest>({
    countyId: countyId,
    alertLevel: 'Yellow',
    metricName: '',
    message: '',
    recommendedAction: '',
  });

  const handleTestEmailConfig = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/codex/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const result = await response.json();
      setTestResult(result);

      if (result.success) {
        toast.success('Email configuration test passed!');
      } else {
        toast.error('Email configuration test failed');
      }
    } catch (error) {
      console.error('Failed to test email configuration:', error);
      setTestResult({
        success: false,
        message: 'Failed to connect to notification service',
        testedAt: new Date().toISOString(),
        errorDetails: error instanceof Error ? error.message : 'Unknown error',
      });
      toast.error('Failed to test email configuration');
    } finally {
      setTesting(false);
    }
  };

  const handleSendManualAlert = async () => {
    if (!alertForm.metricName || !alertForm.message) {
      toast.error('Metric name and message are required');
      return;
    }

    setSending(true);

    try {
      const response = await fetch('/api/codex/notifications/send-alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(alertForm),
      });

      if (response.ok) {
        toast.success('Manual alert sent successfully');
        // Reset form
        setAlertForm({
          countyId: countyId,
          alertLevel: 'Yellow',
          metricName: '',
          message: '',
          recommendedAction: '',
        });
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to send manual alert');
      }
    } catch (error) {
      console.error('Failed to send manual alert:', error);
      toast.error('Failed to send manual alert');
    } finally {
      setSending(false);
    }
  };

  const handleSendDailyDigest = async () => {
    setSending(true);

    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().split('T')[0];

      const response = await fetch(
        `/api/codex/notifications/send-daily-digest?countyId=${countyId || ''}&date=${dateStr}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (response.ok) {
        toast.success('Daily digest sent successfully');
      } else {
        toast.error('Failed to send daily digest');
      }
    } catch (error) {
      console.error('Failed to send daily digest:', error);
      toast.error('Failed to send daily digest');
    } finally {
      setSending(false);
    }
  };

  const handleSendWeeklySummary = async () => {
    setSending(true);

    try {
      const lastSunday = new Date();
      lastSunday.setDate(lastSunday.getDate() - lastSunday.getDay());
      const dateStr = lastSunday.toISOString().split('T')[0];

      const response = await fetch(
        `/api/codex/notifications/send-weekly-summary?countyId=${countyId || ''}&weekEnding=${dateStr}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (response.ok) {
        toast.success('Weekly executive summary sent successfully');
      } else {
        toast.error('Failed to send weekly summary');
      }
    } catch (error) {
      console.error('Failed to send weekly summary:', error);
      toast.error('Failed to send weekly summary');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-terra-midnight border-terra-slate">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-terra-cyan">
            <Mail className="h-5 w-5" />
            Codex 3-6-9 Email Notification Management
          </CardTitle>
          <CardDescription className="text-terra-slate">
            Test email configuration, send manual alerts, and manage automated notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="test" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-terra-slate/20">
              <TabsTrigger value="test">
                <TestTube className="h-4 w-4 mr-2" />
                Test Config
              </TabsTrigger>
              <TabsTrigger value="manual">
                <Send className="h-4 w-4 mr-2" />
                Manual Alert
              </TabsTrigger>
              <TabsTrigger value="automated">
                <Calendar className="h-4 w-4 mr-2" />
                Automated
              </TabsTrigger>
              <TabsTrigger value="history">
                <Clock className="h-4 w-4 mr-2" />
                History
              </TabsTrigger>
            </TabsList>

            {/* Test Configuration Tab */}
            <TabsContent value="test" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-terra-cyan mb-2">Email Configuration Test</h3>
                  <p className="text-sm text-terra-slate mb-4">
                    Verify SMTP settings and connectivity by sending a test email to the configured test recipient.
                  </p>

                  <Button
                    onClick={handleTestEmailConfig}
                    disabled={testing}
                    className="bg-terra-blue hover:bg-terra-blue/80"
                  >
                    {testing ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <TestTube className="h-4 w-4 mr-2" />
                        Test Email Configuration
                      </>
                    )}
                  </Button>
                </div>

                {testResult && (
                  <Alert className={testResult.success ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10'}>
                    <div className="flex items-start gap-3">
                      {testResult.success ? (
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 space-y-2">
                        <AlertDescription className={testResult.success ? 'text-green-200' : 'text-red-200'}>
                          {testResult.message}
                        </AlertDescription>
                        <p className="text-xs text-terra-slate">
                          Tested at: {new Date(testResult.testedAt).toLocaleString()}
                        </p>
                        {testResult.errorDetails && (
                          <details className="text-xs text-red-300 mt-2">
                            <summary className="cursor-pointer hover:underline">Error Details</summary>
                            <pre className="mt-2 p-2 bg-black/20 rounded text-[10px] overflow-auto max-h-32">
                              {testResult.errorDetails}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </Alert>
                )}

                <div className="bg-terra-slate/10 p-4 rounded-lg border border-terra-slate/30">
                  <h4 className="text-sm font-semibold text-terra-cyan mb-3">Test Checklist</h4>
                  <ul className="space-y-2 text-sm text-terra-slate">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>SMTP host and port configured correctly</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>SMTP credentials valid and authenticated</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>SSL/TLS encryption enabled (port 587 or 465)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Test email delivered to recipient inbox</span>
                    </li>
                  </ul>
                </div>
              </div>
            </TabsContent>

            {/* Manual Alert Tab */}
            <TabsContent value="manual" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-terra-cyan mb-2">Send Manual Alert</h3>
                  <p className="text-sm text-terra-slate mb-4">
                    Send a custom alert notification to appropriate stakeholders based on alert level.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="alert-level">Alert Level</Label>
                    <Select
                      value={alertForm.alertLevel}
                      onValueChange={(value) =>
                        setAlertForm({ ...alertForm, alertLevel: value as ManualAlertRequest['alertLevel'] })
                      }
                    >
                      <SelectTrigger className="bg-terra-slate/20 border-terra-slate/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Critical">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-red-600">Critical</Badge>
                            <span className="text-xs text-muted-foreground">Immediate notification</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="Red">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-red-500">Red</Badge>
                            <span className="text-xs text-muted-foreground">High priority</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="Yellow">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-yellow-500">Yellow</Badge>
                            <span className="text-xs text-muted-foreground">Medium priority</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="Green">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-green-500">Green</Badge>
                            <span className="text-xs text-muted-foreground">Low priority</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="metric-name">Metric Name</Label>
                    <Input
                      id="metric-name"
                      placeholder="e.g., Database Performance, System Health"
                      value={alertForm.metricName}
                      onChange={(e) => setAlertForm({ ...alertForm, metricName: e.target.value })}
                      className="bg-terra-slate/20 border-terra-slate/50"
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">Alert Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Describe the issue or notification..."
                      value={alertForm.message}
                      onChange={(e) => setAlertForm({ ...alertForm, message: e.target.value })}
                      className="bg-terra-slate/20 border-terra-slate/50 min-h-[100px]"
                    />
                  </div>

                  <div>
                    <Label htmlFor="recommended-action">Recommended Action (Optional)</Label>
                    <Textarea
                      id="recommended-action"
                      placeholder="What should recipients do about this alert?"
                      value={alertForm.recommendedAction}
                      onChange={(e) => setAlertForm({ ...alertForm, recommendedAction: e.target.value })}
                      className="bg-terra-slate/20 border-terra-slate/50"
                    />
                  </div>

                  <Button
                    onClick={handleSendManualAlert}
                    disabled={sending || !alertForm.metricName || !alertForm.message}
                    className="bg-terra-blue hover:bg-terra-blue/80 w-full"
                  >
                    {sending ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Alert Notification
                      </>
                    )}
                  </Button>

                  <Alert className="border-yellow-500 bg-yellow-500/10">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <AlertDescription className="text-yellow-200 text-sm">
                      This alert will be sent immediately to recipients configured for the {alertForm.alertLevel} alert level.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            </TabsContent>

            {/* Automated Notifications Tab */}
            <TabsContent value="automated" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-terra-cyan mb-2">Automated Reports</h3>
                  <p className="text-sm text-terra-slate mb-4">
                    Trigger automated daily digests and weekly executive summaries on demand.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-terra-slate/10 border-terra-slate/30">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2 text-terra-cyan">
                        <Calendar className="h-4 w-4" />
                        Daily Digest
                      </CardTitle>
                      <CardDescription>Management team summary</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-sm text-terra-slate space-y-1">
                        <p>• Previous day's metrics and alerts</p>
                        <p>• Performance summary</p>
                        <p>• Recommended actions</p>
                      </div>
                      <Button
                        onClick={handleSendDailyDigest}
                        disabled={sending}
                        variant="outline"
                        className="w-full border-terra-blue text-terra-cyan hover:bg-terra-blue/20"
                      >
                        {sending ? 'Sending...' : 'Send Daily Digest'}
                      </Button>
                      <p className="text-xs text-terra-slate">
                        Automated: Daily at 7:00 AM
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-terra-slate/10 border-terra-slate/30">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2 text-terra-cyan">
                        <TrendingUp className="h-4 w-4" />
                        Weekly Executive Summary
                      </CardTitle>
                      <CardDescription>Leadership strategic report</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-sm text-terra-slate space-y-1">
                        <p>• 7-day performance analysis</p>
                        <p>• Domain KPIs</p>
                        <p>• Strategic recommendations</p>
                      </div>
                      <Button
                        onClick={handleSendWeeklySummary}
                        disabled={sending}
                        variant="outline"
                        className="w-full border-terra-blue text-terra-cyan hover:bg-terra-blue/20"
                      >
                        {sending ? 'Sending...' : 'Send Weekly Summary'}
                      </Button>
                      <p className="text-xs text-terra-slate">
                        Automated: Monday at 8:00 AM
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="bg-terra-slate/10 p-4 rounded-lg border border-terra-slate/30">
                  <h4 className="text-sm font-semibold text-terra-cyan mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Notification Recipients
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="font-medium text-red-400 mb-1">Critical Alerts</p>
                      <p className="text-terra-slate text-xs">IT Director, County Admin, Ops Manager</p>
                    </div>
                    <div>
                      <p className="font-medium text-yellow-400 mb-1">Operations Team</p>
                      <p className="text-terra-slate text-xs">IT Operations, DevOps Team</p>
                    </div>
                    <div>
                      <p className="font-medium text-blue-400 mb-1">Management</p>
                      <p className="text-terra-slate text-xs">Department Heads, Team Leads</p>
                    </div>
                    <div>
                      <p className="font-medium text-purple-400 mb-1">Executives</p>
                      <p className="text-terra-slate text-xs">County Executive, CTO, CIO</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-terra-cyan mb-2">Notification History</h3>
                  <p className="text-sm text-terra-slate mb-4">
                    View recent notification activity for audit trail and compliance.
                  </p>
                </div>

                <Alert className="border-terra-blue bg-terra-blue/10">
                  <Clock className="h-4 w-4 text-terra-cyan" />
                  <AlertDescription className="text-terra-cyan">
                    Notification history tracking is configured. History will be available after the first notifications are sent.
                  </AlertDescription>
                </Alert>

                <div className="bg-terra-slate/10 p-6 rounded-lg border border-terra-slate/30 text-center">
                  <Calendar className="h-12 w-12 text-terra-slate mx-auto mb-3" />
                  <p className="text-terra-slate">No notification history available yet</p>
                  <p className="text-xs text-terra-slate/70 mt-2">
                    History will appear here after email notifications are sent
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="text-center text-xs text-terra-slate/70">
        <p>THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.</p>
        <p>Codex 3-6-9 Framework - Email Notification Management</p>
      </div>
    </div>
  );
}
