import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Download, FileCheck, Box, AlertCircle, Sparkles, Brain, ArrowRight, BarChart, Activity, Refresh, Settings, Shield, FileWarning  } from '@mui/icons-material';
import ContextualTooltip from '@/components/ui/contextual-tooltip';
import { useHelp } from '@/contexts/HelpContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PermitRecommendationEngine } from '@/components/ai/PermitRecommendationEngine';
import { AdvancedProcessingOptimization } from '@/components/ai/AdvancedProcessingOptimization';
import ErrorDisplay, { ErrorAction } from '@/components/ui/error-display';

/**
 * TerraFusionProcessor - The TerraFusionPermit processing component for permit data
 * with integrated contextual help and tooltips.
 */
const TerraFusionProcessor: React.FC = () => {
  const [activeTab, setActiveTab] = useState('upload');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState<number>(0);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [simulatedUploadId, setSimulatedUploadId] = useState<number | null>(null);
  const [showAiRecommendations, setShowAiRecommendations] = useState(false);
  const [showAdvancedOptimization, setShowAdvancedOptimization] = useState(false);
  
  // Error handling states
  const [error, setError] = useState<{
    code: string;
    title: string;
    description: string;
    details?: string;
    severity: 'error' | 'warning' | 'info';
    helpTopic?: string;
    step?: number;
    recoverable: boolean;
  } | null>(null);
  
  const { showHelp } = useHelp();
  
  // Generate a simulated upload ID when processing is complete
  useEffect(() => {
    if (showSuccessAlert && !simulatedUploadId) {
      // Generate a random ID for demonstration purposes
      setSimulatedUploadId(Math.floor(Math.random() * 10000) + 1);
      
      // Show AI recommendations after a short delay
      setTimeout(() => {
        setShowAiRecommendations(true);
      }, 1000);
    }
  }, [showSuccessAlert, simulatedUploadId]);
  
  // Simulate processing step change with potential errors
  const nextStep = () => {
    // Clear any existing errors first
    setError(null);
    
    if (processingStep < 3) {
      // Random chance to trigger an error based on the current step
      const errorChance = Math.random();
      
      // Different error probability for each step to showcase different error types
      if (processingStep === 1 && errorChance < 0.3) {
        // 30% chance to show validation error during validation step
        simulateDataValidationError();
      } else if (processingStep === 2 && errorChance < 0.3) {
        // 30% chance to show AI processing error during AI step
        simulateAIProcessingError();
      } else {
        // Normal progress - move to next step
        setProcessingStep(prev => prev + 1);
      }
    } else {
      setShowSuccessAlert(true);
    }
  };
  
  // Simulate upload progress
  const simulateUpload = () => {
    // Clear any existing errors
    setError(null);
    setUploadProgress(0);
    
    // Random chance to trigger an error for demonstration
    const shouldSimulateError = Math.random() < 0.3; // 30% chance of error
    
    if (shouldSimulateError) {
      // Simulate an upload error after a short delay
      setTimeout(() => {
        setUploadProgress(70); // Show progress bar at 70% when error occurs
        setError({
          code: 'UPLOAD_ERROR',
          title: 'File Upload Error',
          description: 'There was a problem uploading your permit files to the server.',
          details: 'The server connection was interrupted during file upload. This could be due to network issues or file server constraints.',
          severity: 'error',
          helpTopic: 'upload-troubleshooting',
          recoverable: true
        });
      }, 1500);
    } else {
      // Normal upload progress simulation
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setProcessingStep(1);
            return 100;
          }
          return prev + 10;
        });
      }, 300);
    }
  };
  
  // Error recovery functions
  const handleErrorRetry = () => {
    setError(null);
    
    // Retry upload
    if (processingStep === 0) {
      simulateUpload();
    } 
    // Retry the current processing step
    else {
      // First reset the current step to trigger a reprocessing
      setProcessingStep(prev => {
        // If we're already at step 0, stay there
        if (prev === 0) return 0;
        // Otherwise go back one step
        return prev - 1;
      });
      
      // Then move forward after a delay to simulate reprocessing
      setTimeout(() => {
        setProcessingStep(prev => prev + 1);
      }, 1000);
    }
  };
  
  // Method to handle file validation errors during data validation step
  const simulateDataValidationError = () => {
    setError({
      code: 'TFP_VALIDATION_ERROR',
      title: 'TerraFusionPermit Validation Failed',
      description: 'Some of your permit records contain invalid or missing data.',
      details: 'The TerraFusionPermit validator found 3 permits with missing address information and 2 permits with invalid dates. These need to be corrected before processing can continue.',
      severity: 'warning',
      helpTopic: 'data-validation',
      step: 1,
      recoverable: true
    });
  };
  
  // Method to handle AI processing errors
  const simulateAIProcessingError = () => {
    setError({
      code: 'TFP_AI_SERVICE_ERROR',
      title: 'TerraFusionPermit AI Service Unavailable',
      description: 'We couldn\'t connect to the Terrafusion AI processing service.',
      details: 'The connection to the Terrafusion AI service timed out. This could be due to service interruption or API credential issues.',
      severity: 'error',
      helpTopic: 'ai-troubleshooting',
      step: 2,
      recoverable: true
    });
  };
  
  // Processing steps display
  const renderProcessingSteps = () => {
    const steps = [
      { 
        title: 'Upload Complete', 
        description: 'Your permit data has been successfully uploaded and is ready for processing.',
        icon: Upload,
        tooltipContent: 'All files have been uploaded to the server and saved for further processing.'
      },
      { 
        title: 'Data Validation', 
        description: 'Automatically validating permit entries and checking for errors.',
        icon: FileCheck,
        tooltipContent: 'This step checks for missing fields, inconsistent data types, and validates against permit rules.'
      },
      { 
        title: 'AI Processing', 
        description: 'Applying AI analysis to identify patterns and make recommendations.',
        icon: Sparkles,
        tooltipContent: 'Our AI models analyze your data to identify trends, flag potential issues, and suggest optimizations.'
      },
      { 
        title: 'Ready for Review', 
        description: 'All processing complete. Your permits are ready for final review.',
        icon: Box,
        tooltipContent: 'Review the processed permits, make any final adjustments, and prepare for export or database storage.'
      }
    ];
    
    return (
      <div className="space-y-4 mt-6">
        {steps.map((step /* , index */) => {
          const StepIcon = step.icon;
          const isCompleted = processingStep > index;
          const isActive = processingStep === index;
          
          return (
            <div 
              key={index}
              className={`flex items-start p-4 rounded-lg border transition-all ${
                isActive ? 'border-primary bg-primary/5' : 
                isCompleted ? 'border-green-500 bg-green-500/10' : 
                'border-gray-200'
              }`}
            >
              <div className={`p-2 rounded-full mr-4 ${
                isActive ? 'bg-primary text-white' : 
                isCompleted ? 'bg-green-500 text-white' : 
                'bg-gray-100'
              }`}>
                <StepIcon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center">
                  <h3 className={`font-medium ${isActive || isCompleted ? 'text-black' : 'text-gray-500'}`}>
                    {step.title}
                  </h3>
                  <ContextualTooltip content={step.tooltipContent}
                    className="ml-2"
                    iconClassName={`h-4 w-4 ${isActive ? 'text-primary' : 'text-gray-400'}`}
                  />
                </div>
                <p className={`text-sm mt-1 ${isActive || isCompleted ? 'text-gray-700' : 'text-gray-400'}`}>
                  {step.description}
                </p>
              </div>
              {isActive && (
                <Button size="sm" className="ml-auto self-center" onClick={nextStep}>
                  {index === steps.length - 1 ? 'Complete' : 'Next'}
                </Button>
              )}
              {isCompleted && (
                <div className="ml-auto text-green-500 self-center">
                  <FileCheck className="h-5 w-5" />
                </div>
              )}
            </div>
          );
        })}
        
        {showSuccessAlert && (
          <Alert className="bg-green-500/10 border-green-500/30 text-primary mt-4">
            <AlertCircle className="h-4 w-4 text-green-500" />
            <AlertTitle>Processing Complete!</AlertTitle>
            <AlertDescription
>
              All permit processing steps have been completed successfully. You can now review the results or download the processed data.
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };
  
  // Render AI recommendation panel
  const renderAiRecommendationPanel = () => {
    return (
      <Card className="border-primary/20 mt-6">
        <CardHeader className="bg-primary/5 pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Brain className="h-5 w-5 text-primary" />
                Terrafusion AI Recommendations
                <ContextualTooltip
                  content="Our AI analyzes your permit data and provides intelligent recommendations to help you process permits more efficiently."
                  className="ml-2"
                  asSpan={true}
                />
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                Intelligent insights and suggestions based on your permit data
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Activity className="h-3 w-3" />
                <span>AI-Powered</span>
              </Badge>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowAdvancedOptimization(!showAdvancedOptimization)}
                aria-label={showAdvancedOptimization ? 'Hide advanced optimization options' : 'Show advanced optimization options'}
                aria-expanded={showAdvancedOptimization}
              >
                {showAdvancedOptimization ? 'Hide Advanced' : 'Show Advanced'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Processing Efficiency</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold">84%</span>
                    <Badge className="bg-green-500/20 text-primary hover:bg-green-500/30">+12%</Badge>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Above department average</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Permits Processed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold">42</span>
                    <span className="text-xs text-gray-500">of 42</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">100% complete</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Processing Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold">1.3</span>
                    <span className="text-xs">min/permit</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">30% faster than average</div>
                </CardContent>
              </Card>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-medium mb-3 flex items-center">
                <Sparkles className="h-4 w-4 mr-2 text-blue-400" />
                Top Recommendations
                <ContextualTooltip
                  content="AI-generated suggestions to improve your permit processing efficiency"
                  className="ml-2"
                  asSpan={true}
                />
              </h4>
              
              <div className="space-y-3">
                <div className="flex gap-3 p-3 border rounded-lg bg-amber-50">
                  <div className="p-2 bg-primary/10 rounded-full h-fit">
                    <BarChart className="h-4 w-4 text-primary" />
                  </div>
                  <div
>
                    <h5 className="text-sm font-medium">Group Similar Permits</h5>
                    <div className="text-xs text-gray-600 mt-0.5">Processing permits by neighborhood or type can increase efficiency by 18%</div>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">High Impact</Badge>
                      <Badge variant="outline" className="text-xs">Easy to Implement</Badge>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3 p-3 border rounded-lg bg-blue-50">
                  <div className="p-2 bg-blue-400/20 rounded-full h-fit">
                    <ArrowRight className="h-4 w-4 text-blue-500" />
                  </div>
                  <div
>
                    <h5 className="text-sm font-medium">Prioritize Residential Permits</h5>
                    <div className="text-xs text-gray-600 mt-0.5">Based on current backlog analysis, residential permits should be prioritized</div>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">Medium Impact</Badge>
                      <Badge variant="outline" className="text-xs">Quick Win</Badge>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3 p-3 border rounded-lg bg-green-50">
                  <div className="p-2 bg-green-400/20 rounded-full h-fit">
                    <Refresh className="h-4 w-4 text-green-500" />
                  </div>
                  <div
>
                    <h5 className="text-sm font-medium">Automate Renewal Permits</h5>
                    <div className="text-xs text-gray-600 mt-0.5">Using templates for renewal permits can save approximately 45 minutes per day</div>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">High Impact</Badge>
                      <Badge variant="outline" className="text-xs">Requires Setup</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  // Render main permit processor tabs interface
  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full border-b rounded-none grid grid-cols-3 h-auto p-0">
          <TabsTrigger 
            value="upload" 
            className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none h-12"
            aria-label="Switch to Upload tab"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="process" 
            className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none h-12"
            aria-label="Switch to Process tab"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Process
          </TabsTrigger>
          <TabsTrigger value="download" 
            className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none h-12"
            aria-label="Switch to Download tab"
          >
            <Download className="h-4 w-4 mr-2" />
            Results
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="p-6">
          {uploadProgress > 0 && uploadProgress < 100 && !error && (
            <div className="mb-6">
              <div className="flex justify-between mb-2 text-sm">
                <span>Uploading permit files...</span>
                <span
>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
          
          {error && (
            <div className="mb-6">
              <ErrorDisplay 
                title="TerraFusionPermit Error"
                description={error.description || "An error occurred during processing"}
                severity={error.severity || "error"}
                errorCode={error.code}
                errorDetails={error.details}
                helpTopic="terrafusion-errors"
                actions={
                  [
                    ...(error.recoverable ? [
                      {
                        label: 'Retry',
                        onClick: handleErrorRetry,
                        icon: Refresh,
                        primary: true
                      }
                    ] : []),
                    {
                      label: 'Get Terrafusion Help',
                      onClick: () => showHelp('terrafusion-errors'),
                      icon: Settings
                    },
                    ...(error.code === 'VALIDATION_ERROR' ? [
                      {
                        label: 'Edit Permits',
                        onClick: () => {
                          setError(null);
                          // This would typically open a permit editor
                          // For now just reset the step
                          setTimeout(() => setProcessingStep(2), 500);
                        },
                        icon: FileWarning
                      }
                    ] : [])
                  ]}
                />
              </div>
            )}
            
            {processingStep === 0 ? (
              <div className="text-center py-8 border-2 border-dashed rounded-lg">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">Upload Permit Files</h3>
                <div className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
                  Upload Excel (.xlsx), CSV or JSON files containing permit data.
                  <ContextualTooltip
                    content="We support standard permit formats and can automatically detect fields for standard permit types."
                    className="ml-1"
                    asSpan={true}
                  />
                </div>
                <div className="flex justify-center gap-4">
                  <Button 
                    onClick={simulateUpload}
                    aria-label="Select permit files to upload"
                  >
                    Select Files
                  </Button>
                  <Button variant="outline"
                    onClick={simulateUpload}
                    aria-label="Drag and drop files from your computer"
                  >
                    Drag & Drop
                  </Button>
                </div>
                <div className="mt-4 text-xs text-gray-400">Maximum file size: 50MB per file</div>
              </div>
            ) : (
              renderProcessingSteps()
            )}
        </TabsContent>
        
        <TabsContent value="process" className="p-6">
          {showSuccessAlert ? (
            <div className="space-y-6">
              {renderAiRecommendationPanel()}
              
              {showAdvancedOptimization && (
                <AdvancedProcessingOptimization
                  uploadId={simulatedUploadId || 0}
                />
              )}
              
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Processing Audit Log
                  </CardTitle>
                  <CardDescription
>
                    Detailed record of all permit processing steps and actions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between p-2 border-b">
                      <span className="text-gray-500">Upload ID</span>
                      <span className="font-medium">TFP-{simulatedUploadId}</span>
                    </div>
                    <div className="flex justify-between p-2 border-b">
                      <span className="text-gray-500">Processing Date</span>
                      <span className="font-medium">{new Date().toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between p-2 border-b">
                      <span className="text-gray-500">Time to Process</span>
                      <span className="font-medium">1 minute 42 seconds</span>
                    </div>
                    <div className="flex justify-between p-2 border-b">
                      <span className="text-gray-500">Processor Version</span>
                      <span className="font-medium">TerraFusionPermit v2.5.1</span>
                    </div>
                    <div className="flex justify-between p-2">
                      <span className="text-gray-500">Process Mode</span>
                      <Badge variant="outline">Standard</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="py-10 text-center">
              <div className="flex flex-col items-center">
                <Sparkles className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium mb-2">Processing Not Started</h3>
                <p className="text-sm text-gray-500 mb-4 max-w-md">
                  Please upload and process permit files in the Upload tab first.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab('upload')}
                  aria-label="Go to upload tab to start processing"
                >
                  Go to Upload
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="download" className="p-6">
          {showSuccessAlert ? (
            <div className="space-y-6">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-6">
                <div className="flex items-start">
                  <FileCheck className="h-5 w-5 text-green-500 mt-0.5 mr-3" />
                  <div>
                    <h3 className="font-medium text-green-800">Processing Complete</h3>
                    <p className="text-sm text-green-700 mt-1">
                      All permit files have been successfully processed. You can now download the results or view permit recommendations.
                    </p>
                  </div>
                </div>
              </div>
              
              <Card className="mb-6 border-primary/20">
                <CardHeader className="bg-primary/5 pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    Terrafusion Processing Results
                  </CardTitle>
                  <CardDescription
>
                    Completed with TerraFusionPermit intelligent processing technology
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Permits Processed</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">42</div>
                          <div className="text-xs text-muted-foreground mt-1">Upload #{simulatedUploadId || 0}</div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Processing Time</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">1.4s</div>
                          <div className="text-xs text-muted-foreground mt-1">Average per permit</div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">100%</div>
                          <div className="text-xs text-muted-foreground mt-1">All permits processed</div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-2 gap-4 mt-6">
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Download Terrafusion Processed Data</CardTitle>
                      <Download className="h-4 w-4 text-gray-400" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500 mb-4">
                      Download your processed permit data in your preferred format
                    </p>
                    <div className="flex flex-col gap-2">
                      <Button className="w-full justify-start" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Excel Format (.xlsx)
                      </Button>
                      <Button variant="outline" className="w-full justify-start" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        CSV Format (.csv)
                      </Button>
                      <Button variant="outline" className="w-full justify-start" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        JSON Format (.json)
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Export to Systems</CardTitle>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500 mb-4">
                      Export directly to connected permit management systems
                    </p>
                    <div className="flex flex-col gap-2">
                      <Button className="w-full justify-start" size="sm">
                        <ArrowRight className="h-4 w-4 mr-2" />
                        TerraFusionPermit Database
                      </Button>
                      <Button variant="outline" className="w-full justify-start" size="sm">
                        <ArrowRight className="h-4 w-4 mr-2" />
                        County Records System
                      </Button>
                      <Button variant="outline" className="w-full justify-start" size="sm">
                        <ArrowRight className="h-4 w-4 mr-2" />
                        State Permit Registry
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="py-10 text-center">
              <div className="flex flex-col items-center">
                <div className="bg-primary/10 p-4 rounded-full mb-4">
                  <Download className="h-12 w-12 text-primary/60" />
                </div>
                <h3 className="text-lg font-medium mb-2">TerraFusionPermit Results</h3>
                <p className="text-sm text-gray-500 mb-4 max-w-md">
                  Please upload and process permit files using the TerraFusionPermit processor before downloading results.
                </p>
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab('upload')}
                    aria-label="Go to upload tab to start processing"
                    className="flex items-center"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Start Processing
                  </Button>
                  <Button variant="ghost" 
                    onClick={() => showHelp('terrafusion-overview')}
                    aria-label="View help documentation about TerraFusionPermit"
                  >
                    View Documentation
                  </Button>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TerraFusionProcessor;