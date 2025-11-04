import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bot, 
  BarChart4, 
  History, 
  Search, 
  MessageSquareText, 
  ShieldCheck,
  Lightbulb,
  Brain,
  Cpu,
  BookOpen,
  FileSearch,
  MapPin,
  Gauge,
  FileStack,
  Globe,
  Link2,
  Share2,
  Activity,
  Database,
  BrainCircuit
 } from '@mui/icons-material';
import { useTour } from '@/contexts/TourContext';
import { useTourTarget } from '@/hooks/use-tour-target';
import { BatchSummaryAnalysis } from './BatchSummaryAnalysis';
import { PermitHistoryAnalysis } from './PermitHistoryAnalysis';
import { ConsistencyReview } from './ConsistencyReview';
import { SimilarPermitSearch } from './SimilarPermitSearch';
import { PermitQuestionForm } from './PermitQuestionForm';
import { EnhancedExplanation } from './EnhancedExplanation';
import { NeighborhoodAnalysis } from './NeighborhoodAnalysis';
import { RegulatoryChangeAnalyzer } from './RegulatoryChangeAnalyzer';
import { PermitRecommendationEngine } from './PermitRecommendationEngine';
import { DocumentUnderstanding } from './DocumentUnderstanding';
import { AdvancedProcessingOptimization } from './AdvancedProcessingOptimization';
import { EnhancedDocumentExtraction } from './EnhancedDocumentExtraction';
import { DeepPermitAnalysis } from '../langchain/DeepPermitAnalysis';
import { ConversationalAssistant } from '../langchain/ConversationalAssistant';
import { ExternalConnectors } from '../integration/ExternalConnectors';
import { RealtimeProcessing } from '../integration/RealtimeProcessing';
import { SecureDataSharing } from '../integration/SecureDataSharing';
import AgentAnalysisPanel from './AgentAnalysisPanel';
import { Permit } from '@/types';
import AIErrorBoundary from './AIErrorBoundary';

interface AIDashboardProps {
  uploadId: number;
  className?: string;
}

export function AIDashboard({ uploadId, className }: AIDashboardProps) {
  const [selectedPermitId, setSelectedPermitId] = useState<number | null>(null);
  const { registerTourTarget } = useTour();
  const aiDashboardRef = useTourTarget('tour-ai-dashboard');
  const mcpToolRef = useTourTarget('tour-mcp-tool');
  const aiSummaryRef = useTourTarget('tour-ai-summary');
  const askAIRef = useTourTarget('tour-ask-ai');

  const handleSelectPermit = (permit: Permit) => {
    setSelectedPermitId(permit.id);
  };

  return (
    <div className={className} ref={aiDashboardRef} id="tour-ai-dashboard">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2 flex items-center"><>

          <Bot className="mr-2 h-6 w-6" /> AI-Powered Analysis
        </h2>
        <p
</> className="text-muted-foreground">
          Leverage advanced AI capabilities to gain deeper insights into permit processing data
        </p>
      </div>

      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList className="grid grid-cols-12 lg:w-fit" id="tour-ai-tabs">
          <TabsTrigger value="summary" className="flex items-center" ref={aiSummaryRef} id="tour-ai-summary"><>

            <BarChart4 className="h-4 w-4 mr-2" /> Summary
          </TabsTrigger>
          <TabsTrigger
</> value="history" className="flex items-center"><>

            <History className="h-4 w-4 mr-2" /> History
          </TabsTrigger>
          <TabsTrigger
</> value="consistency" className="flex items-center"><>

            <ShieldCheck className="h-4 w-4 mr-2" /> Consistency
          </TabsTrigger>
          <TabsTrigger
</> value="search" className="flex items-center"><>

            <Search className="h-4 w-4 mr-2" /> Search
          </TabsTrigger>
          <TabsTrigger
</> value="question" className="flex items-center" ref={askAIRef} id="tour-ask-ai"><>

            <MessageSquareText className="h-4 w-4 mr-2" /> Ask AI
          </TabsTrigger>
          <TabsTrigger
</> value="neighborhood" className="flex items-center"><>

            <MapPin className="h-4 w-4 mr-2" /> Neighborhood
          </TabsTrigger>
          <TabsTrigger
</> value="regulations" className="flex items-center"><>

            <BookOpen className="h-4 w-4 mr-2" /> Regulations
          </TabsTrigger>
          <TabsTrigger
</> value="recommendations" className="flex items-center"><>

            <Brain className="h-4 w-4 mr-2" /> Recommendations
          </TabsTrigger>
          <TabsTrigger
</> value="documents" className="flex items-center"><>

            <FileSearch className="h-4 w-4 mr-2" /> Documents
          </TabsTrigger>
          <TabsTrigger
</> value="extraction" className="flex items-center"><>

            <FileStack className="h-4 w-4 mr-2" /> Extraction
          </TabsTrigger>
          <TabsTrigger
</> value="optimization" className="flex items-center"><>

            <Gauge className="h-4 w-4 mr-2" /> Optimization
          </TabsTrigger>
          <TabsTrigger
</> value="chat" className="flex items-center"><>

            <Bot className="h-4 w-4 mr-2" /> Chat
          </TabsTrigger>
          <TabsTrigger
</> value="connections" className="flex items-center"><>

            <Link2 className="h-4 w-4 mr-2" /> Connectors
          </TabsTrigger>
          <TabsTrigger
</> value="realtime" className="flex items-center"><>

            <Activity className="h-4 w-4 mr-2" /> Realtime
          </TabsTrigger>
          <TabsTrigger
</> value="sharing" className="flex items-center"><>

            <Share2 className="h-4 w-4 mr-2" /> Sharing
          </TabsTrigger>
          <TabsTrigger
</> value="agentanalysis" className="flex items-center" ref={mcpToolRef} id="tour-mcp-tool">
            <BrainCircuit className="h-4 w-4 mr-2" /> MCP Tool
          </TabsTrigger>
          {selectedPermitId && (
            <>
              <TabsTrigger value="explanation" className="flex items-center"><>

                <Lightbulb className="h-4 w-4 mr-2" /> Explanation
              </TabsTrigger>
              <TabsTrigger
</> value="deepanalysis" className="flex items-center">
                <Cpu className="h-4 w-4 mr-2" /> Deep Analysis
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="summary">
          <div className="grid gap-6">
            <AIErrorBoundary>
              <BatchSummaryAnalysis uploadId={uploadId} />
            </AIErrorBoundary>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="grid gap-6">
            <AIErrorBoundary>
              <PermitHistoryAnalysis uploadId={uploadId} />
            </AIErrorBoundary>
          </div>
        </TabsContent>

        <TabsContent value="consistency">
          <div className="grid gap-6">
            <AIErrorBoundary>
              <ConsistencyReview uploadId={uploadId} />
            </AIErrorBoundary>
          </div>
        </TabsContent>

        <TabsContent value="search">
          <div className="grid gap-6">
            <AIErrorBoundary>
              <SimilarPermitSearch onSelectPermit={handleSelectPermit} />
            </AIErrorBoundary>
          </div>
        </TabsContent>

        <TabsContent value="question">
          <div className="grid gap-6">
            <AIErrorBoundary>
              <PermitQuestionForm />
            </AIErrorBoundary>
          </div>
        </TabsContent>

        <TabsContent value="explanation">
          <div className="grid gap-6">
            {selectedPermitId ? (
              <AIErrorBoundary>
                <EnhancedExplanation permitId={selectedPermitId} />
              </AIErrorBoundary>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p>Select a permit from search results to view its explanation</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="deepanalysis">
          <div className="grid gap-6">
            {selectedPermitId ? (
              <AIErrorBoundary>
                <DeepPermitAnalysis permitId={selectedPermitId} />
              </AIErrorBoundary>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p>Select a permit from search results to perform deep analysis</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="neighborhood">
          <div className="grid gap-6">
            <AIErrorBoundary>
              <NeighborhoodAnalysis permits={[]} />
            </AIErrorBoundary>
          </div>
        </TabsContent>

        <TabsContent value="regulations">
          <div className="grid gap-6">
            <AIErrorBoundary>
              <RegulatoryChangeAnalyzer permits={[]} />
            </AIErrorBoundary>
          </div>
        </TabsContent>

        <TabsContent value="recommendations">
          <div className="grid gap-6">
            <AIErrorBoundary>
              <PermitRecommendationEngine uploadId={uploadId} />
            </AIErrorBoundary>
          </div>
        </TabsContent>

        <TabsContent value="documents">
          <div className="grid gap-6">
            <AIErrorBoundary>
              <DocumentUnderstanding />
            </AIErrorBoundary>
          </div>
        </TabsContent>

        <TabsContent value="extraction">
          <div className="grid gap-6">
            <AIErrorBoundary>
              <EnhancedDocumentExtraction />
            </AIErrorBoundary>
          </div>
        </TabsContent>

        <TabsContent value="optimization">
          <div className="grid gap-6">
            <AIErrorBoundary>
              <AdvancedProcessingOptimization uploadId={uploadId} />
            </AIErrorBoundary>
          </div>
        </TabsContent>

        <TabsContent value="chat">
          <div className="grid gap-6">
            <AIErrorBoundary>
              <ConversationalAssistant 
                sessionId={`upload-${uploadId}`} 
                permitContext={[]}
                currentPermitId={selectedPermitId || undefined}
              />
            </AIErrorBoundary>
          </div>
        </TabsContent>

        <TabsContent value="connections">
          <div className="grid gap-6">
            <AIErrorBoundary>
              <ExternalConnectors />
            </AIErrorBoundary>
          </div>
        </TabsContent>

        <TabsContent value="realtime">
          <div className="grid gap-6">
            <AIErrorBoundary>
              <RealtimeProcessing />
            </AIErrorBoundary>
          </div>
        </TabsContent>

        <TabsContent value="sharing">
          <div className="grid gap-6">
            <AIErrorBoundary>
              <SecureDataSharing />
            </AIErrorBoundary>
          </div>
        </TabsContent>

        <TabsContent value="agentanalysis">
          <div className="grid gap-6">
            <AIErrorBoundary>
              <AgentAnalysisPanel />
            </AIErrorBoundary>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}