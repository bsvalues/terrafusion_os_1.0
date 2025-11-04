import React, { useEffect, useState } from 'react';
import { DiagnosticEngine } from '@/lib/diagnostics/diagnostic-engine';
import DiagnosticDashboard from '@/components/diagnostics/DiagnosticDashboard';
import { createStandardRulesForService } from '@/lib/diagnostics/rules';
import { globalEventBus, EventCategory } from '@/lib/event-bus';
import { generateRandomServiceEvents } from '@/lib/diagnostics/test-data-generator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DiagnosticCategory, DiagnosticSeverity, DiagnosticStatus, DiagnosticVisualizationData } from '@/lib/diagnostics/types';

const Diagnostics: React.FC = () => {
  const [diagnosticEngine, setDiagnosticEngine] = useState<DiagnosticEngine | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [isGeneratingEvents, setIsGeneratingEvents] = useState(false);
  const [eventCount, setEventCount] = useState(0);
  
  // Initialize the diagnostic engine
  useEffect(() => {
    const engine = new DiagnosticEngine(globalEventBus, {
      maxEventsToAnalyze: 1000,
      analysisInterval: 10000, // 10 seconds
      enableRootCauseAnalysis: true,
      enablePredictiveAnalysis: true
    });
    
    // Register standard diagnostic rules for key services
    const services = ['api-service', 'database-service', 'auth-service', 'storage-service', 'cache-service'];
    services.forEach(service => {
      engine.registerRules(createStandardRulesForService(service));
    });
    
    setDiagnosticEngine(engine);
    
    // Clean up
    return () => {
      engine.destroy();
    };
  }, []);
  
  // Handle demo mode
  useEffect(() => {
    if (!diagnosticEngine || !isDemoMode) return;
    
    let intervalId: NodeJS.Timeout;
    let eventCountLocal = eventCount;
    
    const startGeneratingEvents = () => {
      setIsGeneratingEvents(true);
      
      // Generate random service events every 2-3 seconds
      intervalId = setInterval(() => {
        const events = generateRandomServiceEvents();
        events.forEach((event: any) => {
          globalEventBus.publish(EventCategory.SYSTEM, event);
          eventCountLocal++;
        });
        setEventCount(eventCountLocal);
      }, 2000 + Math.random() * 1000);
    };
    
    startGeneratingEvents();
    
    // Clean up
    return () => {
      clearInterval(intervalId);
      setIsGeneratingEvents(false);
    };
  }, [diagnosticEngine, isDemoMode]);
  
  // Toggle demo mode
  const toggleDemoMode = () => {
    setIsDemoMode(!isDemoMode);
  };
  
  if (!diagnosticEngine) {
    return <div className="p-8">Loading diagnostic engine...</div>;
  }
  
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div><>

          <h1 className="text-3xl font-bold">Diagnostic Dashboard</h1>
          <p
</> className="text-muted-foreground">
            Monitor system health, performance, and potential issues
          </p>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <Switch
              id="demo-mode"
              checked={isDemoMode}
              onCheckedChange={toggleDemoMode}
            />
            <Label htmlFor="demo-mode">Demo Mode</Label>
          </div>
          
          {isDemoMode && (
            <Badge variant={isGeneratingEvents ? 'default' : 'outline'}>
              {isGeneratingEvents ? 'Generating Events' : 'Events Paused'}
            </Badge>
          )}
          
          <Badge variant="outline">{eventCount} Events</Badge>
        </div>
      </div>
      
      {/* Demo mode info card */}
      {isDemoMode && (
        <Card>
          <CardHeader><>

            <CardTitle className="text-warning">Demo Mode Active</CardTitle>
            <CardDescription
</>>
              The system is generating synthetic diagnostic events to demonstrate the capabilities
              of the diagnostic engine. In production, these events would come from real system components.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              Demo mode is generating events for these services:
              <span className="font-mono ml-2">api-service, database-service, auth-service, storage-service, cache-service</span>
            </p>
          </CardContent>
        </Card>
      )}
      
      {/* Main dashboard */}
      <DiagnosticDashboard diagnosticEngine={diagnosticEngine} />
    </div>
  );
};

export default Diagnostics;