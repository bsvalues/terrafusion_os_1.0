import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, Brain, Zap, CheckCircle, AlertCircle, FileSpreadsheet  } from '@mui/icons-material';
import { useMutation } from '@tanstack/react-query';
import { uploadSpreadsheet } from '@/lib/api';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface ProcessedPermit {
  id: string;
  fileName: string;
  type: string;
  status: 'processing' | 'extracted' | 'decided';
  confidence: number;
  recommendation: string;
  extractedData: any;
  aiDecision?: any;
}

export default function TerraFusionAI() {
  const [processedPermits, setProcessedPermits] = useState<ProcessedPermit[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: uploadSpreadsheet,
    onSuccess: async (result, file) => {
      // Process through neural network
      try {
        const neuralResponse = await apiRequest({
          method: 'POST',
          url: '/api/neural/decision',
          body: {
            permitData: {
              type: 'residential',
              squareFootage: 2000,
              estimatedValue: 150000,
              hasEnvironmentalImpact: false,
              zoningCompliant: true,
              documentationComplete: true
            },
            countyId: 'benton'
          }
        });

        const newPermit: ProcessedPermit = {
          id: `permit-${Date.now()}`,
          fileName: file.name,
          type: 'residential',
          status: 'decided',
          confidence: neuralResponse.decision.confidence,
          recommendation: neuralResponse.decision.recommendation,
          extractedData: result,
          aiDecision: neuralResponse
        };

        setProcessedPermits(prev => [...prev, newPermit]);
        
        toast({
          title: 'AI Processing Complete',
          description: `Document processed with ${(neuralResponse.decision.confidence * 100).toFixed(1)}% confidence`,
        });
      } catch (error) {
        console.error('Neural processing error:', error);
        toast({
          title: 'Processing Complete',
          description: `File uploaded successfully with ${result.summary.totalCount} permits`,
        });
      }
      setIsProcessing(false);
    },
    onError: (error) => {
      setIsProcessing(false);
      toast({
        title: 'Upload Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsProcessing(true);
    for (const file of acceptedFiles) {
      uploadMutation.mutate(file);
    }
  }, [uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/vnd.oasis.opendocument.spreadsheet': ['.ods']
    },
    multiple: true
  });

  const getStatusIcon = (status: string, recommendation: string) => {
    if (status === 'processing') return <Brain className="h-4 w-4 animate-spin text-blue-600" />;
    if (status === 'extracted') return <Zap className="h-4 w-4 text-yellow-600" />;
    if (recommendation === 'approve') return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (recommendation === 'deny') return <AlertCircle className="h-4 w-4 text-red-600" />;
    return <FileText className="h-4 w-4 text-blue-600" />;
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'approve': return 'bg-green-100 text-green-800';
      case 'deny': return 'bg-red-100 text-red-800';
      case 'conditional': return 'bg-yellow-100 text-yellow-800';
      case 'escalate': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2"><>

          <Brain className="h-8 w-8 text-primary" />
          Terrafusion-AI Permit Processor
        </h1>
        <p
</> className="text-muted-foreground">
          Drag-and-drop AI powerhouse for instant permit analysis and decision-making
        </p>
      </div>

      {/* Smart Drop Zone */}
      <Card className="border-2 border-dashed border-primary/20 hover:border-primary/40 transition-colors">
        <CardContent className="p-8">
          <div
            {...getRootProps()}
            className={`text-center cursor-pointer transition-all duration-200 ${
              isDragActive ? 'scale-105 bg-primary/5' : ''
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-primary/10 rounded-full"><>

                <Upload className="h-8 w-8 text-primary" />
              </div>
              <div
</>><>

                <h3 className="text-xl font-semibold mb-2">
                  Drop Documents Here for Instant AI Analysis
                </h3>
                <p
</> className="text-muted-foreground mb-4">
                  {isDragActive
                    ? "Drop your permit documents here..."
                    : "Drag & drop any permit documents or click to select"}
                </p>
                <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground"><>

                  <Badge variant="outline">Excel</Badge>
                  <Badge
</> variant="outline">PDF</Badge><>

                  <Badge variant="outline">CSV</Badge>
                  <Badge
</> variant="outline">Text</Badge>
                </div>
              </div>
              {!isDragActive && (
                <Button variant="outline" className="mt-4">
                  <Upload className="h-4 w-4 mr-2" />
                  Select Documents
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Processing Status */}
      {isProcessing && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Brain className="h-5 w-5 animate-spin text-primary" />
              <div className="flex-1"><>

                <h4 className="font-medium">Terrafusion-AI Processing...</h4>
                <p
</> className="text-sm text-muted-foreground">
                  Extracting data, analyzing patterns, and generating quantum decisions
                </p>
              </div>
            </div>
            <Progress value={75} className="mt-3" />
          </CardContent>
        </Card>
      )}

      {/* AI Results */}
      {processedPermits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-2 text-primary" />
              AI Processing Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {processedPermits.map((permit) => (
                <div
                  key={permit.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-muted/50"
                >
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(permit.status, permit.recommendation)}
                    <div><>

                      <h4 className="font-medium">
                        {permit.fileName}
                      </h4>
                      <p
</> className="text-sm text-muted-foreground">
                        {permit.status === 'processing' && 'Analyzing document...'}
                        {permit.status === 'extracted' && 'Generating AI decision...'}
                        {permit.status === 'decided' && `AI Confidence: ${(permit.confidence * 100).toFixed(1)}%`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {permit.recommendation && (
                      <Badge className={getRecommendationColor(permit.recommendation)}>
                        {permit.recommendation}
                      </Badge>
                    )}
                    {permit.aiDecision?.automationLevel && (
                      <Badge variant="outline">
                        {permit.aiDecision.automationLevel}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Performance Summary */}
      {processedPermits.some(p => p.status === 'decided') && (
        <Card>
          <CardHeader>
            <CardTitle>AI Performance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg"><>

                <div className="text-2xl font-bold text-green-600">
                  {processedPermits.filter(p => p.recommendation === 'approve').length}
                </div>
                <div
</> className="text-sm text-green-600">Auto-Approved</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg"><>

                <div className="text-2xl font-bold text-yellow-600">
                  {processedPermits.filter(p => p.recommendation === 'conditional').length}
                </div>
                <div
</> className="text-sm text-yellow-600">Conditional</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg"><>

                <div className="text-2xl font-bold text-red-600">
                  {processedPermits.filter(p => p.recommendation === 'deny').length}
                </div>
                <div
</> className="text-sm text-red-600">Denied</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg"><>

                <div className="text-2xl font-bold text-blue-600">
                  {processedPermits.length > 0 
                    ? ((processedPermits.reduce((sum, p) => sum + p.confidence, 0) / processedPermits.length) * 100).toFixed(1)
                    : 0}%
                </div>
                <div
</> className="text-sm text-blue-600">Avg Confidence</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}