import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings as SettingsIcon, Save, Bot, ShieldCheck, Key, AlertCircle, CheckCircle  } from '@mui/icons-material';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { configureOpenAIKey, checkOpenAIKeyStatus } from '@/lib/aiApi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const Settings: React.FC = () => {
  const { toast } = useToast();
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState('general');
  const [apiKey, setApiKey] = useState('');
  const queryClient = useQueryClient();

  // Query to check if OpenAI API key is configured
  const { data: apiKeyStatus, isLoading: isCheckingKey } = useQuery({
    queryKey: ['settings', 'openai-key-status'],
    queryFn: checkOpenAIKeyStatus
  });

  // Mutation to save the OpenAI API key
  const { mutate: saveApiKeyMutation, isPending: isSaving } = useMutation({
    mutationFn: (key: string) => configureOpenAIKey(key),
    onSuccess: (data) => {
      toast({
        title: "API Key Saved",
        description: data.message || "Your OpenAI API key has been saved securely.",
        variant: "default"
      });
      // Invalidate queries that depend on API key status
      queryClient.invalidateQueries({ queryKey: ['settings', 'openai-key-status'] });
      setApiKey(''); // Clear input field for security
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error?.message || "Failed to save API key. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Check for url param to highlight a specific section
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const highlight = params.get('highlight');
    
    if (highlight === 'openai_key') {
      setActiveTab('ai');
      
      // Scroll to the API key section
      setTimeout(() => {
        const apiKeySection = document.getElementById('openai-api-key');
        apiKeySection?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [location]);

  const saveApiKey = () => {
    if (apiKey.trim()) {
      saveApiKeyMutation(apiKey);
    }
  };

  return (
    <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
      <div className="flex justify-between items-center mb-4"><>

        <h2 className="text-lg font-medium text-gray-800">Settings</h2>
        <TabsList
</>><>

          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger
</> value="ai">AI Configuration</TabsTrigger><>

          <TabsTrigger value="classification">Classification Rules</TabsTrigger>
          <TabsTrigger
</> value="account">Account</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="general">
        <Card>
          <CardHeader><>

            <CardTitle>General Settings</CardTitle>
            <CardDescription
</>>Manage your application preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2"><>

              <Label htmlFor="app-name">Application Name</Label>
              <Input
</> id="app-name" defaultValue="TerraFusionPermit" />
            </div>
            
            <div className="space-y-2"><>

              <Label htmlFor="default-view">Default View</Label>
              <select
</> id="default-view" className="w-full p-2 border rounded-md"><>

                <option value="processing">Permit Processing</option>
                <option
</> value="history">History</option>
                <option value="reports">Reports</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5"><>

                <Label htmlFor="dark-mode">Dark Mode</Label>
                <p
</> className="text-sm text-gray-500">
                  Enable dark mode for the application
                </p>
              </div><>

              <Switch id="dark-mode" />
            </div>
            
            <div
</> className="flex items-center justify-between">
              <div className="space-y-0.5"><>

                <Label htmlFor="notifications">Notifications</Label>
                <p
</> className="text-sm text-gray-500">
                  Enable desktop notifications
                </p>
              </div><>

              <Switch id="notifications" defaultChecked />
            </div>
            
            <Button
</> className="mt-4">
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="classification">
        <Card>
          <CardHeader><>

            <CardTitle>Classification Rules</CardTitle>
            <CardDescription
</>>Manage how permits are classified</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2"><>

                <Label>Commercial Permits</Label>
                <div
</> className="flex items-center space-x-2">
                  <Input defaultValue="6" placeholder="Neighborhood code prefix" className="max-w-xs" />
                  <span className="text-gray-500">Starting with this prefix will be marked as commercial</span>
                </div>
              </div>
              
              <div className="space-y-2"><>

                <Label>Skip Keywords (one per line)</Label>
                <textarea
</>
                  className="w-full min-h-[150px] p-2 border rounded-md"
                  defaultValue="hvac
re-roof
heat pump
fence
water heater
mini split
like for like"
                />
                <p className="text-sm text-gray-500">
                  Permits containing these keywords will be skipped for residential properties
                </p>
              </div>
              
              <Button className="mt-4">
                <Save className="mr-2 h-4 w-4" />
                Save Rules
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="ai">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><>

              <Bot className="mr-2 h-5 w-5" /> AI Configuration
            </CardTitle>
            <CardDescription
</>>Configure AI features and API connections</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div id="openai-api-key" className="space-y-2 border-2 border-primary/10 p-4 rounded-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Key className="h-5 w-5 mr-2 text-primary" />
                    <Label htmlFor="openai-key" className="text-base font-medium">OpenAI API Key</Label>
                  </div>
                  
                  {isCheckingKey ? (
                    <div className="flex items-center text-muted-foreground">
                      <span className="animate-spin mr-2">⟳</span> Checking...
                    </div>
                  ) : apiKeyStatus?.isConfigured ? (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="h-5 w-5 mr-1" /> Configured
                    </div>
                  ) : (
                    <div className="flex items-center text-amber-600">
                      <AlertCircle className="h-5 w-5 mr-1" /> Not Configured
                    </div>
                  )}
                </div><>

                
                <p className="text-sm text-muted-foreground mb-4">
                  This key is required for advanced AI features like batch analysis, permit explanations, and AI-powered search. 
                  Your API key is stored securely and never shared.
                </p>
                
                <div
</> className="space-y-2">
                  <Input 
                    id="openai-key" 
                    type="password" 
                    placeholder="sk-..." 
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Don't have an API key? <a href="https://platform.openai.com/account/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Get one from OpenAI</a>
                  </p>
                </div>
                
                <Button 
                  onClick={saveApiKey} 
                  disabled={!apiKey.trim() || isSaving} 
                  className="mt-2"
                >
                  {isSaving ? (
                    <>
                      <span className="animate-spin mr-2">⟳</span> Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" /> {apiKeyStatus?.isConfigured ? 'Update API Key' : 'Save API Key'}
                    </>
                  )}
                </Button>
                
                {apiKeyStatus?.isConfigured && (
                  <p className="text-xs text-muted-foreground mt-2">
                    <CheckCircle className="h-3 w-3 inline-block mr-1 text-green-600" /> 
                    AI features are enabled with your configured API key.
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center">
                  <ShieldCheck className="h-5 w-5 mr-2 text-primary" />
                  <Label className="text-base font-medium">AI Feature Security</Label>
                </div>
                
                <div className="ml-7 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5"><>

                      <Label htmlFor="content-filtering">Content Filtering</Label>
                      <p
</> className="text-sm text-muted-foreground">
                        Filter inappropriate content from AI responses
                      </p>
                    </div><>

                    <Switch id="content-filtering" defaultChecked />
                  </div>
                  
                  <div
</> className="flex items-center justify-between">
                    <div className="space-y-0.5"><>

                      <Label htmlFor="rate-limiting">Rate Limiting</Label>
                      <p
</> className="text-sm text-muted-foreground">
                        Limit AI requests to prevent excessive API usage
                      </p>
                    </div>
                    <Switch id="rate-limiting" defaultChecked />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="account">
        <Card>
          <CardHeader><>

            <CardTitle>Account Settings</CardTitle>
            <CardDescription
</>>Manage your account preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2"><>

                <Label htmlFor="user-name">Name</Label>
                <Input
</> id="user-name" defaultValue="Admin User" />
              </div>
              
              <div className="space-y-2"><>

                <Label htmlFor="user-email">Email</Label>
                <Input
</> id="user-email" type="email" defaultValue="admin@example.com" />
              </div>
              
              <div className="space-y-2"><>

                <Label htmlFor="user-password">Password</Label>
                <Input
</> id="user-password" type="password" defaultValue="********" />
              </div>
              
              <Button className="mt-4">
                <Save className="mr-2 h-4 w-4" />
                Save Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default Settings;
