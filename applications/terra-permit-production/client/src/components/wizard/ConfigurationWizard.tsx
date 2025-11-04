import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Database, Shield, Brain, CheckCircle2  } from '@mui/icons-material';

// Define SystemConfiguration type for use in other components
export interface SystemConfiguration {
  general: {
    applicationName: string;
    defaultTheme: string;
    defaultView: string;
    enableNotifications: boolean;
  };
  ai: {
    apiKeyConfigured: boolean;
    aiModel: string;
    enableContentFiltering: boolean;
    enableRateLimiting: boolean;
    maxRequestsPerMinute: number;
  };
  database: {
    connectionType: string;
    enableBackups: boolean;
    backupFrequency: string;
    retentionPeriod: number;
  };
  security: {
    requireMFA: boolean;
    sessionTimeout: number;
    passwordPolicy: string;
    ipWhitelist: string[];
  };
}

// Define steps
const STEPS = [
  { id: 'general', label: 'General Setup', icon: Settings },
  { id: 'ai', label: 'AI Configuration', icon: Brain },
  { id: 'database', label: 'Database Setup', icon: Database },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'finish', label: 'Finish', icon: CheckCircle2 },
];

const ConfigurationWizard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState('general');
  const [config, setConfig] = useState({
    general: { appName: 'TerraFusionPermit', apiUrl: '' },
    ai: { openaiKey: '', useAi: true },
    database: { databaseUrl: '' },
    security: { enableAuth: true },
  });

  // Find current step index
  const currentStepIndex = STEPS.findIndex(step => step.id === currentStep);
  
  // Compute next and previous steps
  const previousStep = currentStepIndex > 0 ? STEPS[currentStepIndex - 1].id : null;
  const nextStep = currentStepIndex < STEPS.length - 1 ? STEPS[currentStepIndex + 1].id : null;
  
  // Handle next button click
  const handleNext = () => {
    if (nextStep) {
      setCurrentStep(nextStep);
    }
  };
  
  // Handle previous button click
  const handlePrevious = () => {
    if (previousStep) {
      setCurrentStep(previousStep);
    }
  };
  
  // Handle finish button click
  const handleFinish = () => {
    // TODO: Implement saving configuration
    console.log('Configuration saved:', config);
    alert('Configuration saved!');
  };

  // Render content for each step
  const renderStepContent = (step: string) => {
    switch (step) {
      case 'general':
        return (
          <div className="space-y-4"><>

            <p className="text-gray-500">
              Configure the basic settings for your application. These settings will be used throughout the system.
            </p>
            <div
</> className="space-y-4">
              <div className="grid gap-2"><>

                <label htmlFor="appName" className="text-sm font-medium">Application Name</label>
                <input
</>
                  id="appName"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="TerraFusionPermit"
                  value={config.general.appName}
                  onChange={(e) => setConfig({
                    ...config,
                    general: { ...config.general, appName: e.target.value }
                  })}
                />
              </div>
              <div className="grid gap-2"><>

                <label htmlFor="apiUrl" className="text-sm font-medium">API URL</label>
                <input
</>
                  id="apiUrl"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="https://api.example.com"
                  value={config.general.apiUrl}
                  onChange={(e) => setConfig({
                    ...config,
                    general: { ...config.general, apiUrl: e.target.value }
                  })}
                />
              </div>
            </div>
          </div>
        );
      case 'ai':
        return (
          <div className="space-y-4"><>

            <p className="text-gray-500">
              Configure AI integration settings. You can enable or disable AI features and provide your OpenAI API key.
            </p>
            <div
</> className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  id="useAi"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300"
                  checked={config.ai.useAi}
                  onChange={(e) => setConfig({
                    ...config,
                    ai: { ...config.ai, useAi: e.target.checked }
                  })}
                />
                <label htmlFor="useAi" className="text-sm font-medium">Enable AI Features</label>
              </div>
              <div className="grid gap-2"><>

                <label htmlFor="openaiKey" className="text-sm font-medium">OpenAI API Key</label>
                <input
</>
                  id="openaiKey"
                  type="password"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="sk-..."
                  value={config.ai.openaiKey}
                  onChange={(e) => setConfig({
                    ...config,
                    ai: { ...config.ai, openaiKey: e.target.value }
                  })}
                />
              </div>
            </div>
          </div>
        );
      case 'database':
        return (
          <div className="space-y-4"><>

            <p className="text-gray-500">
              Configure your database connection. This is required for the application to function properly.
            </p>
            <div
</> className="space-y-4">
              <div className="grid gap-2"><>

                <label htmlFor="databaseUrl" className="text-sm font-medium">Database URL</label>
                <input
</>
                  id="databaseUrl"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="postgresql://user:password@localhost:5432/dbname"
                  value={config.database.databaseUrl}
                  onChange={(e) => setConfig({
                    ...config,
                    database: { ...config.database, databaseUrl: e.target.value }
                  })}
                />
              </div>
            </div>
          </div>
        );
      case 'security':
        return (
          <div className="space-y-4"><>

            <p className="text-gray-500">
              Configure security settings for your application. These settings will help protect your data and users.
            </p>
            <div
</> className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  id="enableAuth"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300"
                  checked={config.security.enableAuth}
                  onChange={(e) => setConfig({
                    ...config,
                    security: { ...config.security, enableAuth: e.target.checked }
                  })}
                />
                <label htmlFor="enableAuth" className="text-sm font-medium">Enable Authentication</label>
              </div>
            </div>
          </div>
        );
      case 'finish':
        return (
          <div className="space-y-4"><>

            <p className="text-gray-500">
              Review your configuration settings before finalizing. Once you finish, these settings will be applied to your application.
            </p>
            <div
</> className="rounded-md bg-gray-50 p-4">
              <pre className="text-xs overflow-auto whitespace-pre-wrap">
                {JSON.stringify(config, null, 2)}
              </pre>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader><>

        <CardTitle>System Configuration Wizard</CardTitle>
        <CardDescription
</>>Configure your application settings step by step</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={currentStep} onValueChange={setCurrentStep} className="w-full">
          <TabsList className="grid grid-cols-5 mb-8">
            {STEPS.map((step) => (
              <TabsTrigger
                key={step.id}
                value={step.id}
                className="flex flex-col items-center py-2 gap-1"
                disabled={step.id === 'finish' && !config.general.appName}
              >
                <step.icon className="h-5 w-5" />
                <span className="text-xs">{step.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          {STEPS.map((step) => (
            <TabsContent key={step.id} value={step.id} className="space-y-4 min-h-[300px]">
              {renderStepContent(step.id)}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={!previousStep}
        >
          Previous
        </Button>
        {nextStep ? (
          <Button onClick={handleNext}>Next</Button>
        ) : (
          <Button onClick={handleFinish} disabled={!config.general.appName}>
            Finish
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default ConfigurationWizard;