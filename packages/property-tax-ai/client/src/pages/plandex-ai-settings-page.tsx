/**
 * Plandex AI Settings Page
 * 
 * This page allows users to configure and manage the Plandex AI integration.
 */

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Settings2, Save, Terminal, Bot, Key, FileCode, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { PlandexAIProvider, usePlandexAI } from '@/providers/plandex-ai-provider';
import { PlandexAICodeGenerator } from '@/components/development/PlandexAICodeGenerator';
import { PlandexAICodeExplainer } from '@/components/development/PlandexAICodeExplainer';
import { PlandexAIBugFixer } from '@/components/development/PlandexAIBugFixer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

/**
 * Interface for API settings
 */
interface APISettings {
  apiKey: string;
  baseUrl: string;
  defaultModel: string;
  maxTokens: number;
  temperature: number;
}

/**
 * Default API settings
 */
const defaultSettings: APISettings = {
  apiKey: '',
  baseUrl: 'https://api.plandex.ai/v1',
  defaultModel: 'plandex-code-v1',
  maxTokens: 1024,
  temperature: 0.2
};

/**
 * Plandex AI Settings Page Component
 */
export default function PlandexAISettingsPage() {
  return (
    <PlandexAIProvider>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Plandex AI Settings</h1>
            <p className="text-muted-foreground">
              Configure and manage your Plandex AI integration
            </p>
          </div>
        </div>
        
        <PlandexAISettingsContent />
      </div>
    </PlandexAIProvider>
  );
}

/**
 * Plandex AI Settings Content Component
 */
function PlandexAISettingsContent() {
  // State
  const [settings, setSettings] = useState<APISettings>(defaultSettings);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  const { toast } = useToast();
  const { isAvailable } = usePlandexAI();

  // Load settings on mount
  useEffect(() => {
    // In a real implementation, this would load settings from an API
    const loadSettings = async () => {
      try {
        // Mock loading existing settings
        // In a real implementation, this would be:
        // const response = await fetch('/api/settings/plandex-ai');
        // const data = await response.json();
        
        // For demonstration purposes, we'll simulate loading existing settings
        const savedSettings = {
          ...defaultSettings,
          apiKey: process.env.PLANDEX_API_KEY || '',
        };
        
        setSettings(savedSettings);
      } catch (error) {
        console.error('Error loading settings:', error);
        toast({
          title: 'Failed to load settings',
          description: 'Check the console for details',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [toast]);

  // Handle settings changes
  const handleChange = (field: keyof APISettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Save settings
  const saveSettings = async () => {
    setIsSaving(true);
    
    try {
      // In a real implementation, this would be:
      // await fetch('/api/settings/plandex-ai', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(settings)
      // });
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Settings saved',
        description: 'Plandex AI settings have been updated',
      });
      
      // Force page reload to apply new settings
      window.location.reload();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Failed to save settings',
        description: 'Check the console for details',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Test connection
  const testConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      // In a real implementation, this would be:
      // const response = await fetch('/api/plandex-ai/test', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(settings)
      // });
      // 
      // if (!response.ok) {
      //   throw new Error('Connection test failed');
      // }
      
      // Simulate API call delay and result
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demonstration, use the isAvailable flag to determine test result
      // In a real implementation, this would use the API response
      if (isAvailable) {
        setTestResult('success');
        toast({
          title: 'Connection successful',
          description: 'Successfully connected to Plandex AI',
        });
      } else {
        setTestResult('error');
        toast({
          title: 'Connection failed',
          description: 'Failed to connect to Plandex AI. Check your API key and settings.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      setTestResult('error');
      toast({
        title: 'Connection test failed',
        description: 'Check the console for details',
        variant: 'destructive',
      });
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Tabs defaultValue="settings" className="w-full">
      <TabsList className="w-full max-w-md mx-auto grid grid-cols-3">
        <TabsTrigger value="settings" className="flex items-center gap-1">
          <Settings2 className="h-4 w-4" />
          Settings
        </TabsTrigger>
        <TabsTrigger value="test" className="flex items-center gap-1">
          <Terminal className="h-4 w-4" />
          Testing
        </TabsTrigger>
        <TabsTrigger value="examples" className="flex items-center gap-1">
          <FileCode className="h-4 w-4" />
          Examples
        </TabsTrigger>
      </TabsList>
      
      {/* Settings Tab */}
      <TabsContent value="settings" className="space-y-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Configuration
            </CardTitle>
            <CardDescription>
              Configure your Plandex AI API credentials and settings
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                value={settings.apiKey}
                onChange={(e) => handleChange('apiKey', e.target.value)}
                placeholder="Enter your Plandex AI API key"
              />
              <p className="text-sm text-muted-foreground">
                You can find your API key in your Plandex AI dashboard
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="baseUrl">API Base URL</Label>
              <Input
                id="baseUrl"
                value={settings.baseUrl}
                onChange={(e) => handleChange('baseUrl', e.target.value)}
                placeholder="https://api.plandex.ai/v1"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="defaultModel">Default Model</Label>
              <Select 
                value={settings.defaultModel}
                onValueChange={(value) => handleChange('defaultModel', value)}
              >
                <SelectTrigger id="defaultModel">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plandex-code-v1">Plandex Code v1</SelectItem>
                  <SelectItem value="plandex-code-pro-v1">Plandex Code Pro v1</SelectItem>
                  <SelectItem value="plandex-code-plus-v1">Plandex Code Plus v1</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Separator className="my-4" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxTokens">Max Tokens</Label>
                <Input
                  id="maxTokens"
                  type="number"
                  value={settings.maxTokens.toString()}
                  onChange={(e) => handleChange('maxTokens', parseInt(e.target.value))}
                  min="1"
                  max="8192"
                />
                <p className="text-xs text-muted-foreground">
                  Maximum tokens to generate (1-8192)
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature</Label>
                <Input
                  id="temperature"
                  type="number"
                  value={settings.temperature.toString()}
                  onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
                  min="0"
                  max="2"
                  step="0.1"
                />
                <p className="text-xs text-muted-foreground">
                  Randomness of outputs (0-2)
                </p>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => setSettings(defaultSettings)}
            >
              Reset to Defaults
            </Button>
            
            <Button 
              onClick={saveSettings}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Integration Status
            </CardTitle>
            <CardDescription>
              Check the status of your Plandex AI integration
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label htmlFor="enabled">Enable Plandex AI</Label>
                <p className="text-sm text-muted-foreground">
                  Turn on/off the Plandex AI integration
                </p>
              </div>
              <Switch 
                id="enabled" 
                checked={isAvailable}
                disabled={!settings.apiKey} 
              />
            </div>
            
            <div className="p-4 rounded-md bg-muted">
              <div className="flex items-center gap-2 mb-2">
                <div className="font-medium">Current Status:</div>
                {isAvailable ? (
                  <div className="flex items-center text-green-600 dark:text-green-500">
                    <div className="h-2 w-2 rounded-full bg-green-600 dark:bg-green-500 mr-2"></div>
                    Connected
                  </div>
                ) : (
                  <div className="flex items-center text-red-600 dark:text-red-500">
                    <div className="h-2 w-2 rounded-full bg-red-600 dark:bg-red-500 mr-2"></div>
                    Not Connected
                  </div>
                )}
              </div>
              
              {isAvailable ? (
                <Alert variant="success" className="bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800">
                  <Check className="h-4 w-4" />
                  <AlertTitle>Connected to Plandex AI</AlertTitle>
                  <AlertDescription>
                    Your integration with Plandex AI is working properly.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Not Connected</AlertTitle>
                  <AlertDescription>
                    {settings.apiKey 
                      ? "Your Plandex AI integration is not working. Check your API key and settings."
                      : "You need to enter an API key to use Plandex AI."}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
          
          <CardFooter>
            <Button 
              onClick={testConnection}
              disabled={isTesting || !settings.apiKey}
              className="w-full"
            >
              {isTesting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing Connection...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Test Connection
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
      
      {/* Testing Tab */}
      <TabsContent value="test" className="space-y-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              Test Plandex AI
            </CardTitle>
            <CardDescription>
              Try out Plandex AI's capabilities to verify your integration
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {!isAvailable ? (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Not Connected</AlertTitle>
                <AlertDescription>
                  Plandex AI is not available. Please configure your API key in the Settings tab.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-2">
                <p className="text-sm">
                  Use these tools to test different Plandex AI capabilities:
                </p>
                
                <div className="grid grid-cols-1 gap-4 mt-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Code Generation</h3>
                    <Input 
                      placeholder="Enter a prompt (e.g., 'Function to calculate tax based on property value')"
                      className="mb-2"
                    />
                    <Button size="sm" disabled={!isAvailable}>
                      <Terminal className="h-4 w-4 mr-2" />
                      Generate Sample Code
                    </Button>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">Code Completion</h3>
                    <Input 
                      placeholder="Enter code prefix (e.g., 'function calculateTax(')"
                      className="mb-2"
                    />
                    <Button size="sm" disabled={!isAvailable}>
                      <Terminal className="h-4 w-4 mr-2" />
                      Complete Code
                    </Button>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">Bug Fixing</h3>
                    <Input 
                      placeholder="Enter buggy code snippet"
                      className="mb-2"
                    />
                    <Input 
                      placeholder="Enter error message"
                      className="mb-2"
                    />
                    <Button size="sm" disabled={!isAvailable}>
                      <Terminal className="h-4 w-4 mr-2" />
                      Fix Bugs
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      
      {/* Examples Tab */}
      <TabsContent value="examples" className="space-y-6 mt-6">
        <div className="grid grid-cols-1 gap-6">
          <PlandexAICodeGenerator className="w-full" />
          <PlandexAIBugFixer className="w-full" />
          <PlandexAICodeExplainer className="w-full" />
        </div>
      </TabsContent>
    </Tabs>
  );
}