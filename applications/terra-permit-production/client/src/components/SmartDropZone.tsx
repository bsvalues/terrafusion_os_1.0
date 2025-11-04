import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, Brain, Zap, CheckCircle, AlertCircle  } from '@mui/icons-material';
import { apiRequest } from '@/lib/queryClient';

interface ProcessedPermit {
  id: string;
  type: string;
  status: 'processing' | 'analyzed' | 'decided';
  confidence: number;
  recommendation: string;
  extractedData: any;
  aiDecision?: any;
}

export default function SmartDropZone() {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [processedPermits, setProcessedPermits] = useState<ProcessedPermit[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const processDocument = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const permitId = `permit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      // First, extract data from the document
      const extractResponse = await fetch('/api/extract', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!extractResponse.ok) {
        throw new Error('Document extraction failed');
      }

      const extractedData = await extractResponse.json();

      // Create permit record
      const newPermit: ProcessedPermit = {
        id: permitId,
        type: extractedData.type || 'residential',
        status: 'processing',
        confidence: 0,
        recommendation: '',
        extractedData
      };

      setProcessedPermits(prev => [...prev, newPermit]);

      // Update status to analyzed
      setProcessedPermits(prev => 
        prev.map(p => p.id === permitId ? { ...p, status: 'analyzed' } : p)
      );

      // Process through neural network
      const neuralResponse = await apiRequest({
        method: 'POST',
        url: '/api/neural/decision',
        body: {
          permitData: {
            type: extractedData.type || 'residential',
            squareFootage: extractedData.squareFootage || 2000,
            estimatedValue: extractedData.estimatedValue || 150000,
            hasEnvironmentalImpact: extractedData.hasEnvironmentalImpact || false,
            zoningCompliant: extractedData.zoningCompliant !== false,
            documentationComplete: true
          },
          countyId: 'benton'
        }
      });

      // Update with AI decision
      setProcessedPermits(prev => 
        prev.map(p => p.id === permitId ? {
          ...p,
          status: 'decided',
          confidence: neuralResponse.decision.confidence,
          recommendation: neuralResponse.decision.recommendation,
          aiDecision: neuralResponse
        } : p)
      );

    } catch (error) {
      console.error('Processing error:', error);
      setProcessedPermits(prev => 
        prev.map(p => p.id === permitId ? {
          ...p,
          status: 'decided',
          confidence: 0,
          recommendation: 'error'
        } : p)
      );
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploadedFiles(prev => [...prev, ...acceptedFiles]);
    setIsProcessing(true);

    for (const file of acceptedFiles) {
      await processDocument(file);
    }

    setIsProcessing(false);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/*': ['.txt'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: true
  });

  const getStatusIcon = (status: string, recommendation: string) => {
    if (status === 'processing') return <Brain className="h-4 w-4 animate-spin" />;
    if (status === 'analyzed') return <Zap className="h-4 w-4 text-yellow-600" />;
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
    <div className="space-y-6">
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

                <h3 className="text-lg font-semibold mb-2">
                  AI-Powered Document Processing
                </h3>
                <p
</> className="text-muted-foreground mb-4">
                  {isDragActive
                    ? "Drop your permit documents here..."
                    : "Drag & drop permit documents or click to select"}
                </p>
                <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground"><>

                  <Badge variant="outline">PDF</Badge>
                  <Badge
</> variant="outline">DOC/DOCX</Badge><>

                  <Badge variant="outline">Images</Badge>
                  <Badge
</> variant="outline">Excel</Badge>
                  <Badge variant="outline">Text Files</Badge>
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

                <h4 className="font-medium">AI Processing Documents...</h4>
                <p
</> className="text-sm text-muted-foreground">
                  Extracting data and generating quantum decisions
                </p>
              </div>
            </div>
            <Progress value={75} className="mt-3" />
          </CardContent>
        </Card>
      )}

      {/* Processed Results */}
      {processedPermits.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center"><>

              <Zap className="h-5 w-5 mr-2 text-primary" />
              Neural Network Decisions
            </h3>
            <div
</> className="space-y-4">
              {processedPermits.map((permit) => (
                <div
                  key={permit.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-muted/50"
                >
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(permit.status, permit.recommendation)}
                    <div><>

                      <h4 className="font-medium capitalize">
                        {permit.type} Permit
                      </h4>
                      <p
</> className="text-sm text-muted-foreground">
                        {permit.status === 'processing' && 'Analyzing document...'}
                        {permit.status === 'analyzed' && 'Generating AI decision...'}
                        {permit.status === 'decided' && `Confidence: ${(permit.confidence * 100).toFixed(1)}%`}
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

      {/* AI Insights */}
      {processedPermits.some(p => p.status === 'decided') && (
        <Card>
          <CardContent className="p-6"><>

            <h3 className="text-lg font-semibold mb-4">AI Processing Summary</h3>
            <div
</> className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <div className="text-center p-4 bg-blue-50 rounded-lg"><>

                <div className="text-2xl font-bold text-blue-600">
                  {((processedPermits.reduce((sum, p) => sum + p.confidence, 0) / processedPermits.length) * 100).toFixed(1)}%
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