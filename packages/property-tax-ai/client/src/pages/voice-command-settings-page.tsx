/**
 * Voice Command Settings Page
 * 
 * This page provides access to all voice command enhancement features:
 * - Analytics and usage statistics
 * - Shortcut management
 * - Command contextual help
 */

import { useState } from 'react';
import { VoiceCommandShortcuts } from '@/components/agent-voice/VoiceCommandShortcuts';
import { VoiceCommandAnalytics } from '@/components/agent-voice/VoiceCommandAnalytics';
import { VoiceCommandHelp } from '@/components/agent-voice/VoiceCommandHelp';
import { ExternalLink, AlertCircle, ChevronRight, BarChart, Info, Command } from 'lucide-react';
import { Link } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export default function VoiceCommandSettingsPage() {
  // State
  const [activeTab, setActiveTab] = useState<string>('shortcuts');
  const [selectedContext, setSelectedContext] = useState<string>('global');
  
  const { toast } = useToast();
  
  // Mock user ID (in a real application, this would come from auth context)
  const userId = 1;
  
  // Handle command execution
  const handleCommandExecute = (command: string) => {
    toast({
      title: 'Command Selected',
      description: `"${command}" will be executed when implemented`,
    });
  };
  
  // Available contexts for command help
  const contexts = [
    { id: 'global', name: 'Global Commands' },
    { id: 'property', name: 'Property Assessment' },
    { id: 'data', name: 'Data Analysis' },
    { id: 'admin', name: 'Admin Commands' },
    { id: 'mapping', name: 'Mapping & GIS' }
  ];
  
  // Render context selector
  const renderContextSelector = () => (
    <div className="flex flex-wrap gap-2 mb-4">
      {contexts.map(context => (
        <Button
          key={context.id}
          variant={selectedContext === context.id ? 'default' : 'outline'}
          onClick={() => setSelectedContext(context.id)}
          size="sm"
        >
          {context.name}
        </Button>
      ))}
    </div>
  );
  
  return (
    <div className="container py-8 max-w-6xl">
      <div className="mb-8 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Voice Command Settings</h1>
            <p className="text-muted-foreground">
              Manage and customize voice commands for the assessment platform
            </p>
          </div>
          
          <Link href="/">
            <Button variant="outline" className="gap-1">
              <ChevronRight className="h-4 w-4 -rotate-180" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
        
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Enhanced Voice Commands</AlertTitle>
          <AlertDescription>
            The enhanced voice command system provides powerful features for interacting with the assessment platform.
            Customize shortcuts, view analytics, and access contextual help for an improved experience.
          </AlertDescription>
        </Alert>
      </div>
      
      <Tabs defaultValue="shortcuts" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="shortcuts">
            <Command className="h-4 w-4 mr-2" />
            Shortcuts
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="help">
            <Info className="h-4 w-4 mr-2" />
            Command Help
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="shortcuts" className="space-y-4">
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Voice Command Shortcuts</CardTitle>
              <CardDescription>
                Create and manage shortcuts to quickly execute common voice commands
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Voice command shortcuts allow you to define short phrases that expand to longer, more complex commands.
                This makes it easier to execute frequently used commands without having to repeat lengthy phrases.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="border rounded-md p-4">
                  <h3 className="font-medium mb-2">Example</h3>
                  <p className="text-sm text-muted-foreground">
                    Say <Badge variant="secondary" className="font-mono">show properties</Badge> instead of 
                    <Badge variant="outline" className="font-mono ml-2">"show all property assessments in Benton County sorted by value"</Badge>
                  </p>
                </div>
                
                <div className="border rounded-md p-4">
                  <h3 className="font-medium mb-2">Benefits</h3>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                    <li>Faster command execution</li>
                    <li>Reduced speech recognition errors</li>
                    <li>Personalized to your workflow</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <VoiceCommandShortcuts userId={userId} />
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-4">
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Voice Command Analytics</CardTitle>
              <CardDescription>
                View detailed analytics about your voice command usage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Analytics provide insights into how you're using voice commands, helping you identify patterns,
                improve efficiency, and troubleshoot common issues.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="border rounded-md p-4">
                  <h3 className="font-medium mb-2">Usage Patterns</h3>
                  <p className="text-sm text-muted-foreground">
                    Track which commands you use most frequently and their success rates
                  </p>
                </div>
                
                <div className="border rounded-md p-4">
                  <h3 className="font-medium mb-2">Error Analysis</h3>
                  <p className="text-sm text-muted-foreground">
                    Identify common errors and get suggestions for improvement
                  </p>
                </div>
                
                <div className="border rounded-md p-4">
                  <h3 className="font-medium mb-2">Performance Metrics</h3>
                  <p className="text-sm text-muted-foreground">
                    Monitor response times and command success rates over time
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <VoiceCommandAnalytics userId={userId} />
        </TabsContent>
        
        <TabsContent value="help" className="space-y-4">
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Command Help</CardTitle>
              <CardDescription>
                Learn about available voice commands and how to use them
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Browse available commands by context or search for specific functionality.
                Each command includes examples, parameter explanations, and usage tips.
              </p>
              
              {renderContextSelector()}
            </CardContent>
          </Card>
          
          <VoiceCommandHelp 
            contextId={selectedContext} 
            onCommandSelected={handleCommandExecute}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}