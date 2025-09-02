import React, { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { AnimatedProgressTracker } from '@/components/workflow/animated-progress-tracker';
import { WorkflowType, workflowTypeLabels } from '@/lib/workflow-types';

export default function ProgressTrackerDemo() {
  const { toast } = useToast();
  
  // Configuration state
  const [workflowType, setWorkflowType] = useState<WorkflowType>('long_plat');
  const [currentStep, setCurrentStep] = useState(1);
  const [status, setStatus] = useState<'draft' | 'in_progress' | 'review' | 'completed' | 'archived'>('in_progress');
  const [animationSpeed, setAnimationSpeed] = useState<'slow' | 'medium' | 'fast'>('medium');
  const [size, setSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [showLabels, setShowLabels] = useState(true);
  const [showPercentage, setShowPercentage] = useState(true);
  
  // Workflow types for demo
  const workflowTypes: WorkflowType[] = ['long_plat', 'bla', 'merge_split', 'sm00_report'];
  
  // Function to advance to next step
  const handleNextStep = () => {
    let maxSteps = 0;
    
    switch (workflowType) {
      case 'long_plat':
        maxSteps = 5;
        break;
      case 'bla':
        maxSteps = 4;
        break;
      case 'merge_split':
        maxSteps = 5;
        break;
      case 'sm00_report':
        maxSteps = 3;
        break;
    }
    
    if (currentStep < maxSteps) {
      setCurrentStep(currentStep + 1);
      toast({
        title: 'Step Advanced',
        description: `Moved to step ${currentStep + 1}`,
      });
    } else {
      toast({
        title: 'Last Step Reached',
        description: 'This workflow has no more steps',
        variant: 'destructive',
      });
    }
  };
  
  // Function to go to previous step
  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      toast({
        title: 'Step Reversed',
        description: `Moved back to step ${currentStep - 1}`,
      });
    } else {
      toast({
        title: 'First Step Reached',
        description: 'This is the first step of the workflow',
        variant: 'destructive',
      });
    }
  };
  
  // Reset to first step
  const handleResetSteps = () => {
    setCurrentStep(1);
    toast({
      title: 'Progress Reset',
      description: 'Workflow progress has been reset to step 1',
    });
  };
  
  return (
    <div className="flex min-h-screen bg-muted/20">
      <Sidebar />
      
      <div className="flex flex-col flex-1">
        <Header />
        
        <main className="flex-1 p-6 container">
          <div className="flex justify-between items-center mb-6"><>

            <h1 className="text-3xl font-bold">Workflow Progress Tracker Demo</h1>
            
            <div
</> className="flex gap-2"><>

              <Button onClick={handlePrevStep} variant="outline">Previous Step</Button>
              <Button
</> onClick={handleNextStep}>Next Step</Button>
              <Button onClick={handleResetSteps} variant="destructive">Reset</Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Configuration panel */}
            <Card className="md:col-span-1">
              <CardHeader><>

                <CardTitle>Configuration</CardTitle>
                <CardDescription
</>>Customize the progress tracker display</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2"><>

                  <Label htmlFor="workflow-type">Workflow Type</Label>
                  <Select
</> 
                    value={workflowType} 
                    onValueChange={(value) => {
                      setWorkflowType(value as WorkflowType);
                      setCurrentStep(1); // Reset step when changing workflow type
                    }}
                  >
                    <SelectTrigger id="workflow-type"><>

                      <SelectValue placeholder="Select workflow type" />
                    </SelectTrigger>
                    <SelectContent
</>>
                      {workflowTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {workflowTypeLabels[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2"><>

                  <Label htmlFor="status">Workflow Status</Label>
                  <Select
</> 
                    value={status} 
                    onValueChange={(value) => {
                      setStatus(value as any);
                    }}
                  >
                    <SelectTrigger id="status"><>

                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent
</>><>

                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem
</> value="in_progress">In Progress</SelectItem><>

                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem
</> value="completed">Completed</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2"><>

                  <Label htmlFor="animation-speed">Animation Speed</Label>
                  <Select
</> 
                    value={animationSpeed} 
                    onValueChange={(value) => {
                      setAnimationSpeed(value as any);
                    }}
                  >
                    <SelectTrigger id="animation-speed"><>

                      <SelectValue placeholder="Select animation speed" />
                    </SelectTrigger>
                    <SelectContent
</>><>

                      <SelectItem value="slow">Slow</SelectItem>
                      <SelectItem
</> value="medium">Medium</SelectItem>
                      <SelectItem value="fast">Fast</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2"><>

                  <Label htmlFor="size">Size</Label>
                  <Select
</> 
                    value={size} 
                    onValueChange={(value) => {
                      setSize(value as any);
                    }}
                  >
                    <SelectTrigger id="size"><>

                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent
</>><>

                      <SelectItem value="sm">Small</SelectItem>
                      <SelectItem
</> value="md">Medium</SelectItem>
                      <SelectItem value="lg">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2"><>

                  <Label htmlFor="orientation">Orientation</Label>
                  <Select
</> 
                    value={orientation} 
                    onValueChange={(value) => {
                      setOrientation(value as any);
                    }}
                  >
                    <SelectTrigger id="orientation"><>

                      <SelectValue placeholder="Select orientation" />
                    </SelectTrigger>
                    <SelectContent
</>><>

                      <SelectItem value="horizontal">Horizontal</SelectItem>
                      <SelectItem
</> value="vertical">Vertical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between"><>

                  <Label htmlFor="show-labels">Show Step Labels</Label>
                  <Switch
</>
                    id="show-labels"
                    checked={showLabels}
                    onCheckedChange={setShowLabels}
                  />
                </div>
                
                <div className="flex items-center justify-between"><>

                  <Label htmlFor="show-percentage">Show Percentage</Label>
                  <Switch
</>
                    id="show-percentage"
                    checked={showPercentage}
                    onCheckedChange={setShowPercentage}
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Progress tracker preview */}
            <Card className="md:col-span-2">
              <CardHeader><>

                <CardTitle>Progress Tracker Preview</CardTitle>
                <CardDescription
</>>
                  Current step: {currentStep} | Status: {status}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <AnimatedProgressTracker
                  workflowType={workflowType}
                  currentStep={currentStep}
                  status={status}
                  animationSpeed={animationSpeed}
                  size={size}
                  orientation={orientation}
                  showLabels={showLabels}
                  showPercentage={showPercentage}
                  className="mb-8"
                />
                
                <div className="mt-8 text-sm text-muted-foreground"><>

                  <p>This component demonstrates an animated workflow progress tracker that can be configured with different options.</p>
                  <p
</>>Use the configuration panel to customize the appearance and behavior of the tracker.</p>
                </div>
              </CardContent>
            </Card>
            
            {/* Code usage example */}
            <Card className="md:col-span-3">
              <CardHeader><>

                <CardTitle>Component Usage Example</CardTitle>
                <CardDescription
</>>
                  Add this code to your components to use the progress tracker
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <pre className="p-4 rounded-md bg-muted overflow-auto text-sm">
{`import { AnimatedProgressTracker } from '@/components/workflow/animated-progress-tracker';

// Basic usage
<AnimatedProgressTracker
  workflowType="${workflowType}"
  currentStep={${currentStep}}
  status="${status}"
/>

// With all options
<AnimatedProgressTracker
  workflowType="${workflowType}"
  currentStep={${currentStep}}
  status="${status}"
  animationSpeed="${animationSpeed}"
  size="${size}"
  orientation="${orientation}"
  showLabels={${showLabels}}
  showPercentage={${showPercentage}}
  className="my-custom-class"
/>`}
                </pre>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}