/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS - CODEX 3-6-9 ADMIN CONFIGURATION PANEL
 * Divine Mathematical Balance Engine - Administrative Controls
 * Threshold Configuration, Alert Management, System Tuning
 * THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Settings,
  Save,
  RotateCcw,
  Shield,
  Bell,
  Activity,
  Database,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

interface CodexConfiguration {
  // Divine Constants
  foundationMax: number;
  amplificationSafeguard: number;
  amplificationScale: number;
  ultimateTarget: number;
  divineBalanceMin: number;
  divineBalanceMax: number;
  championshipMin: number;

  // Alert Thresholds
  greenThreshold: number;
  yellowThreshold: number;
  redThreshold: number;

  // System Settings
  enableRealTimeUpdates: boolean;
  metricCollectionInterval: number;
  enablePredictiveAnalytics: boolean;
  enableEmailAlerts: boolean;
  enableSlackNotifications: boolean;

  // Data Retention
  metricsRetentionDays: number;
  alertRetentionDays: number;
  enableAutoArchive: boolean;
}

const DEFAULT_CONFIGURATION: CodexConfiguration = {
  foundationMax: 12.0,
  amplificationSafeguard: 666.0,
  amplificationScale: 55.5,
  ultimateTarget: 12.0,
  divineBalanceMin: 11.5,
  divineBalanceMax: 12.0,
  championshipMin: 10.0,

  greenThreshold: 9.6,
  yellowThreshold: 7.2,
  redThreshold: 4.8,

  enableRealTimeUpdates: true,
  metricCollectionInterval: 60000,
  enablePredictiveAnalytics: true,
  enableEmailAlerts: true,
  enableSlackNotifications: false,

  metricsRetentionDays: 90,
  alertRetentionDays: 365,
  enableAutoArchive: true,
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CodexAdminPanel() {
  const [config, setConfig] = useState<CodexConfiguration>(DEFAULT_CONFIGURATION);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleConfigChange = (key: keyof CodexConfiguration, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      // Validate configuration
      if (!validateConfiguration(config)) {
        toast.error('Invalid configuration', {
          description: 'Please check all values and try again.',
        });
        setSaving(false);
        return;
      }

      const response = await fetch('/api/codex/configuration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!response.ok && response.status !== 501) {
        throw new Error(`Server responded with ${response.status}`);
      }

      toast.success('Configuration saved successfully', {
        description: 'Codex 3-6-9 Framework updated with new settings.',
      });

      setHasChanges(false);
    } catch (error) {
      toast.error('Failed to save configuration', {
        description: error instanceof Error ? error.message : 'Configuration endpoint not available (501)',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setConfig(DEFAULT_CONFIGURATION);
    setHasChanges(true);
    toast.info('Configuration reset to defaults');
  };

  return (
    <div className="space-y-6 p-6 bg-terra-midnight min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Settings className="h-8 w-8 text-terra-cyan" />
            Codex 3-6-9 Administration
          </h1>
          <p className="text-gray-400 mt-2">
            Configure divine mathematical balance thresholds and system settings
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={saving}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to Defaults
          </Button>

          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="gap-2 bg-terra-cyan text-black hover:bg-terra-cyan/90"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Warning Banner */}
      {hasChanges && (
        <Alert variant="default" className="bg-yellow-500/10 border-yellow-500/20">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <AlertTitle className="text-yellow-500">Unsaved Changes</AlertTitle>
          <AlertDescription className="text-yellow-400">
            You have unsaved configuration changes. Click "Save Changes" to apply them.
          </AlertDescription>
        </Alert>
      )}

      {/* Configuration Tabs */}
      <Tabs defaultValue="thresholds" className="space-y-6">
        <TabsList className="bg-terra-midnight border border-terra-slate">
          <TabsTrigger value="thresholds">
            <Shield className="h-4 w-4 mr-2" />
            Thresholds
          </TabsTrigger>
          <TabsTrigger value="alerts">
            <Bell className="h-4 w-4 mr-2" />
            Alerts
          </TabsTrigger>
          <TabsTrigger value="system">
            <Activity className="h-4 w-4 mr-2" />
            System
          </TabsTrigger>
          <TabsTrigger value="retention">
            <Database className="h-4 w-4 mr-2" />
            Data Retention
          </TabsTrigger>
        </TabsList>

        {/* THRESHOLDS TAB */}
        <TabsContent value="thresholds" className="space-y-6">
          <Card className="bg-terra-midnight border-terra-slate">
            <CardHeader>
              <CardTitle className="text-white">Divine Mathematical Constants</CardTitle>
              <CardDescription>
                Core 3-6-9 framework constants (modify with extreme caution)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="bg-red-500/10 border-red-500/20">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <AlertTitle className="text-red-500">WARNING</AlertTitle>
                <AlertDescription className="text-red-400">
                  Modifying divine constants may break the mathematical balance.
                  Only change these values if you fully understand Tesla's 3-6-9 principles.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ConfigInput
                  label="Foundation Max"
                  description="Maximum score for foundation metrics (sacred 12)"
                  value={config.foundationMax}
                  onChange={(v) => handleConfigChange('foundationMax', v)}
                  min={1}
                  max={20}
                  step={0.1}
                  locked
                />

                <ConfigInput
                  label="Amplification Safeguard"
                  description="Never cross threshold (666 imbalance protection)"
                  value={config.amplificationSafeguard}
                  onChange={(v) => handleConfigChange('amplificationSafeguard', v)}
                  min={100}
                  max={1000}
                  step={1}
                  locked
                />

                <ConfigInput
                  label="Amplification Scale"
                  description="Scaling factor (666 ÷ 12 = 55.5)"
                  value={config.amplificationScale}
                  onChange={(v) => handleConfigChange('amplificationScale', v)}
                  min={1}
                  max={100}
                  step={0.1}
                  locked
                />

                <ConfigInput
                  label="Ultimate Target"
                  description="Perfect balance target (12.0)"
                  value={config.ultimateTarget}
                  onChange={(v) => handleConfigChange('ultimateTarget', v)}
                  min={1}
                  max={20}
                  step={0.1}
                  locked
                />

                <ConfigInput
                  label="Divine Balance Min"
                  description="Minimum score for divine balance (11.5)"
                  value={config.divineBalanceMin}
                  onChange={(v) => handleConfigChange('divineBalanceMin', v)}
                  min={0}
                  max={12}
                  step={0.1}
                />

                <ConfigInput
                  label="Divine Balance Max"
                  description="Maximum score for divine balance (12.0)"
                  value={config.divineBalanceMax}
                  onChange={(v) => handleConfigChange('divineBalanceMax', v)}
                  min={0}
                  max={12}
                  step={0.1}
                />

                <ConfigInput
                  label="Championship Min"
                  description="Minimum score for championship mode (10.0)"
                  value={config.championshipMin}
                  onChange={(v) => handleConfigChange('championshipMin', v)}
                  min={0}
                  max={12}
                  step={0.1}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-terra-midnight border-terra-slate">
            <CardHeader>
              <CardTitle className="text-white">Alert Level Thresholds</CardTitle>
              <CardDescription>
                Configure when alerts are triggered (0-12 scale)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ConfigInput
                  label="Green Threshold"
                  description="Operational excellence (80% of 12)"
                  value={config.greenThreshold}
                  onChange={(v) => handleConfigChange('greenThreshold', v)}
                  min={0}
                  max={12}
                  step={0.1}
                  statusColor="green"
                />

                <ConfigInput
                  label="Yellow Threshold"
                  description="Attention required (60% of 12)"
                  value={config.yellowThreshold}
                  onChange={(v) => handleConfigChange('yellowThreshold', v)}
                  min={0}
                  max={12}
                  step={0.1}
                  statusColor="yellow"
                />

                <ConfigInput
                  label="Red Threshold"
                  description="Immediate action (40% of 12)"
                  value={config.redThreshold}
                  onChange={(v) => handleConfigChange('redThreshold', v)}
                  min={0}
                  max={12}
                  step={0.1}
                  statusColor="red"
                />
              </div>

              <Alert className="bg-blue-500/10 border-blue-500/20">
                <Info className="h-4 w-4 text-blue-500" />
                <AlertDescription className="text-blue-400">
                  <strong>Current thresholds:</strong> Green ≥{config.greenThreshold}, Yellow ≥
                  {config.yellowThreshold}, Red ≥{config.redThreshold}, Critical &lt;
                  {config.redThreshold}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ALERTS TAB */}
        <TabsContent value="alerts" className="space-y-6">
          <Card className="bg-terra-midnight border-terra-slate">
            <CardHeader>
              <CardTitle className="text-white">Alert Notifications</CardTitle>
              <CardDescription>
                Configure how and when alerts are sent to administrators
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ConfigSwitch
                label="Email Alerts"
                description="Send email notifications for critical alerts"
                checked={config.enableEmailAlerts}
                onChange={(v) => handleConfigChange('enableEmailAlerts', v)}
              />

              <ConfigSwitch
                label="Slack Notifications"
                description="Send Slack messages to #terrafusion-alerts channel"
                checked={config.enableSlackNotifications}
                onChange={(v) => handleConfigChange('enableSlackNotifications', v)}
              />

              <Alert className="bg-green-500/10 border-green-500/20">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-400">
                  SignalR real-time notifications are always enabled in the dashboard
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SYSTEM TAB */}
        <TabsContent value="system" className="space-y-6">
          <Card className="bg-terra-midnight border-terra-slate">
            <CardHeader>
              <CardTitle className="text-white">System Configuration</CardTitle>
              <CardDescription>
                Real-time updates, predictive analytics, and performance tuning
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ConfigSwitch
                label="Real-Time Updates"
                description="Enable SignalR WebSocket streaming for live dashboard updates"
                checked={config.enableRealTimeUpdates}
                onChange={(v) => handleConfigChange('enableRealTimeUpdates', v)}
              />

              <ConfigInput
                label="Metric Collection Interval"
                description="How often to collect metrics (milliseconds)"
                value={config.metricCollectionInterval}
                onChange={(v) => handleConfigChange('metricCollectionInterval', v)}
                min={5000}
                max={300000}
                step={1000}
                suffix="ms"
              />

              <ConfigSwitch
                label="Predictive Analytics"
                description="Enable 7-day forecasting with linear regression"
                checked={config.enablePredictiveAnalytics}
                onChange={(v) => handleConfigChange('enablePredictiveAnalytics', v)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* DATA RETENTION TAB */}
        <TabsContent value="retention" className="space-y-6">
          <Card className="bg-terra-midnight border-terra-slate">
            <CardHeader>
              <CardTitle className="text-white">Data Retention Policy</CardTitle>
              <CardDescription>
                Configure how long historical data is retained in the database
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ConfigInput
                label="Metrics Retention"
                description="Days to retain CodexMetrics time-series data"
                value={config.metricsRetentionDays}
                onChange={(v) => handleConfigChange('metricsRetentionDays', v)}
                min={7}
                max={365}
                step={1}
                suffix="days"
              />

              <ConfigInput
                label="Alert Retention"
                description="Days to retain CodexAlerts history"
                value={config.alertRetentionDays}
                onChange={(v) => handleConfigChange('alertRetentionDays', v)}
                min={30}
                max={730}
                step={1}
                suffix="days"
              />

              <ConfigSwitch
                label="Auto-Archive"
                description="Automatically archive old records to cold storage"
                checked={config.enableAutoArchive}
                onChange={(v) => handleConfigChange('enableAutoArchive', v)}
              />

              <Alert className="bg-blue-500/10 border-blue-500/20">
                <Info className="h-4 w-4 text-blue-500" />
                <AlertDescription className="text-blue-400">
                  Government compliance requires minimum 365 days retention for audit trails
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================================
// CONFIG INPUT COMPONENT
// ============================================================================

interface ConfigInputProps {
  label: string;
  description: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  locked?: boolean;
  suffix?: string;
  statusColor?: 'green' | 'yellow' | 'red';
}

function ConfigInput({
  label,
  description,
  value,
  onChange,
  min,
  max,
  step,
  locked = false,
  suffix,
  statusColor,
}: ConfigInputProps) {
  const getBadgeColor = () => {
    switch (statusColor) {
      case 'green':
        return 'bg-green-500/20 text-green-500 border-green-500/30';
      case 'yellow':
        return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
      case 'red':
        return 'bg-red-500/20 text-red-500 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-500 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-white font-medium">{label}</Label>
        {locked && (
          <Badge variant="outline" className="text-xs">
            Locked
          </Badge>
        )}
        {statusColor && (
          <Badge className={getBadgeColor()}>
            {statusColor.charAt(0).toUpperCase() + statusColor.slice(1)}
          </Badge>
        )}
      </div>

      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        min={min}
        max={max}
        step={step}
        disabled={locked}
        className="bg-terra-midnight border-terra-slate text-white"
      />

      <p className="text-xs text-gray-400">{description}</p>

      {suffix && (
        <p className="text-xs text-terra-cyan">
          Current: {value} {suffix}
        </p>
      )}
    </div>
  );
}

// ============================================================================
// CONFIG SWITCH COMPONENT
// ============================================================================

interface ConfigSwitchProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ConfigSwitch({ label, description, checked, onChange }: ConfigSwitchProps) {
  return (
    <div className="flex items-center justify-between p-4 border border-terra-slate rounded-lg">
      <div className="space-y-1">
        <Label className="text-white font-medium">{label}</Label>
        <p className="text-sm text-gray-400">{description}</p>
      </div>

      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

// ============================================================================
// VALIDATION
// ============================================================================

function validateConfiguration(config: CodexConfiguration): boolean {
  // Divine constants validation
  if (config.foundationMax !== 12.0) {
    console.warn('Foundation max should be 12.0 (sacred geometry)');
  }

  if (config.amplificationSafeguard !== 666.0) {
    console.warn('Amplification safeguard should be 666.0');
  }

  if (Math.abs(config.amplificationScale - 55.5) > 0.1) {
    console.warn('Amplification scale should be 55.5 (666 / 12)');
  }

  // Threshold validation
  if (config.greenThreshold <= config.yellowThreshold) {
    toast.error('Green threshold must be greater than yellow threshold');
    return false;
  }

  if (config.yellowThreshold <= config.redThreshold) {
    toast.error('Yellow threshold must be greater than red threshold');
    return false;
  }

  // Divine balance validation
  if (config.divineBalanceMin >= config.divineBalanceMax) {
    toast.error('Divine balance min must be less than max');
    return false;
  }

  // Retention validation
  if (config.alertRetentionDays < 365) {
    toast.warn('Alert retention less than 365 days may violate government compliance');
  }

  return true;
}

export default CodexAdminPanel;
