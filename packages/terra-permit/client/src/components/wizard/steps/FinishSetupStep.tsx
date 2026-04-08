import React, { useEffect } from 'react';
import { CheckCircle, FileCheck, Server, Shield, Settings, Zap, Bot } from 'lucide-react';
import { SystemConfiguration } from '../ConfigurationWizard';

interface FinishSetupStepProps {
  config: SystemConfiguration;
  onValidation: (isValid: boolean) => void;
}

const FinishSetupStep: React.FC<FinishSetupStepProps> = ({ config, onValidation }) => {
  // Always validate this step as valid
  useEffect(() => {
    onValidation(true);
  }, [onValidation]);

  return (
    <div>
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold text-center">System Configuration Complete!</h2>
        <p className="text-muted-foreground text-center mt-2">
          Review your configuration settings below before finishing the setup process.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-md p-4 shadow-sm">
          <div className="flex items-center mb-3">
            <Settings className="h-5 w-5 mr-2 text-primary" />
            <h3 className="font-medium">General Settings</h3>
          </div>
          <div className="pl-7 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Application Name:</span>
              <span className="font-medium">{config.general.applicationName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Default Theme:</span>
              <span className="font-medium capitalize">{config.general.defaultTheme}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Default View:</span>
              <span className="font-medium capitalize">{config.general.defaultView}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Notifications:</span>
              <span className="font-medium">{config.general.enableNotifications ? 'Enabled' : 'Disabled'}</span>
            </div>
          </div>
        </div>

        <div className="border rounded-md p-4 shadow-sm">
          <div className="flex items-center mb-3">
            <Bot className="h-5 w-5 mr-2 text-primary" />
            <h3 className="font-medium">AI Configuration</h3>
          </div>
          <div className="pl-7 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">API Key Status:</span>
              <span className={`font-medium ${config.ai.apiKeyConfigured ? 'text-green-600' : 'text-amber-600'}`}>
                {config.ai.apiKeyConfigured ? 'Configured' : 'Not Configured'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">AI Model:</span>
              <span className="font-medium">{config.ai.aiModel}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Content Filtering:</span>
              <span className="font-medium">{config.ai.enableContentFiltering ? 'Enabled' : 'Disabled'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Rate Limiting:</span>
              <span className="font-medium">
                {config.ai.enableRateLimiting ? `Enabled (${config.ai.maxRequestsPerMinute} req/min)` : 'Disabled'}
              </span>
            </div>
          </div>
        </div>

        <div className="border rounded-md p-4 shadow-sm">
          <div className="flex items-center mb-3">
            <Server className="h-5 w-5 mr-2 text-primary" />
            <h3 className="font-medium">Database Settings</h3>
          </div>
          <div className="pl-7 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Connection Type:</span>
              <span className="font-medium capitalize">{config.database.connectionType}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Automated Backups:</span>
              <span className="font-medium">{config.database.enableBackups ? 'Enabled' : 'Disabled'}</span>
            </div>
            {config.database.enableBackups && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Backup Frequency:</span>
                  <span className="font-medium capitalize">{config.database.backupFrequency}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Retention Period:</span>
                  <span className="font-medium">{config.database.retentionPeriod} days</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="border rounded-md p-4 shadow-sm">
          <div className="flex items-center mb-3">
            <Shield className="h-5 w-5 mr-2 text-primary" />
            <h3 className="font-medium">Security Settings</h3>
          </div>
          <div className="pl-7 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Multi-Factor Authentication:</span>
              <span className="font-medium">{config.security.requireMFA ? 'Required' : 'Optional'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Session Timeout:</span>
              <span className="font-medium">{config.security.sessionTimeout} minutes</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Password Policy:</span>
              <span className="font-medium capitalize">{config.security.passwordPolicy}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">IP Restrictions:</span>
              <span className="font-medium">
                {config.security.ipWhitelist.length > 0 
                  ? `${config.security.ipWhitelist.length} address${config.security.ipWhitelist.length > 1 ? 'es' : ''}` 
                  : 'None (all allowed)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-green-50 text-green-800 rounded-md flex items-start">
        <FileCheck className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="font-semibold mb-1">Ready to Complete Setup</h3>
          <p className="text-sm">
            Your system configuration is ready to be applied. Click the 'Finish Setup' button 
            below to save these settings and complete the configuration process. You can always 
            modify these settings later through the Settings page.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FinishSetupStep;