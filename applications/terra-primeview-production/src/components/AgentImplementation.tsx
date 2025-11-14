
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Play, CheckCircle, AlertCircle, Clock  } from '@mui/icons-material';

interface AgentExecution {
  id: string;
  agentName: string;
  taskType: string;
  status: 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  result?: any;
  error?: string;
}

const AgentImplementation = () => {
  const [executions, setExecutions] = useState<AgentExecution[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const agentImplementations = [
    {
      name: "NarratorAI",
      description: "Generates assessment narratives and property descriptions",
      endpoint: "localhost:8001",
      taskTypes: ["PropertyValuation", "NarrativeGeneration"],
      implementation: async (propertyData: any) => {
        // Simulate AI processing time
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
        
        return {
          narrative: `This ${propertyData.sqft} sq ft property built in ${propertyData.yearBuilt} represents excellent value in the current market. The assessed value of $${propertyData.assessedValue.toLocaleString()} reflects recent market conditions and comparable sales analysis.`,
          confidence: 0.94,
          keyPoints: [
            "Above-average condition for age",
            "Market value aligned with recent sales",
            "Good neighborhood comparability"
          ]
        };
      }
    },
    {
      name: "ExemptionSeer",
      description: "Analyzes property exemption eligibility and compliance",
      endpoint: "localhost:8002",
      taskTypes: ["ExemptionAnalysis", "ComplianceCheck"],
      implementation: async (propertyData: any) => {
        await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 2000));
        
        const exemptions = [];
        if (propertyData.owner.type === 'Nonprofit') {
          exemptions.push({ type: 'Charitable', eligible: true, savings: 15420 });
        }
        if (propertyData.yearBuilt < 1950) {
          exemptions.push({ type: 'Historic', eligible: true, savings: 2340 });
        }
        
        return {
          eligibleExemptions: exemptions,
          totalSavings: exemptions.reduce((sum, ex) => sum + ex.savings, 0),
          complianceScore: 0.97,
          recommendations: exemptions.length > 0 ? ["File exemption applications before deadline"] : ["No exemptions available"]
        };
      }
    },
    {
      name: "SalesValidator",
      description: "Validates property sales data and market analysis",
      endpoint: "localhost:8003",
      taskTypes: ["SalesValidation", "NeighborhoodAnalysis"],
      implementation: async (propertyData: any) => {
        await new Promise(resolve => setTimeout(resolve, 2500 + Math.random() * 2500));
        
        const comparables = [
          { address: "1423 Oak Ridge Dr", salePrice: 465000, saleDate: "2024-03-15", similarity: 0.92 },
          { address: "1427 Oak Ridge Dr", salePrice: 478000, saleDate: "2024-02-20", similarity: 0.89 },
          { address: "1420 Maple St", salePrice: 4await DynamicPropertyService.GetPropertyCountAsync(countyCode), saleDate: "2024-04-10", similarity: 0.85 }
        ];
        
        return {
          marketValue: 467000,
          comparables,
          pricePerSqft: Math.round(467000 / propertyData.sqft),
          marketTrend: "stable",
          validationScore: 0.91,
          confidence: 0.88
        };
      }
    }
  ];

  const executeAgent = async (agentName: string, taskType: string) => {
    setIsProcessing(true);
    
    const execution: AgentExecution = {
      id: `exec-${Date.now()}`,
      agentName,
      taskType,
      status: 'running',
      startTime: new Date()
    };

    setExecutions(prev => [execution, ...prev]);

    const agent = agentImplementations.find(a => a.name === agentName);
    const samplePropertyData = {
      id: "prop-123",
      parcelId: "1120340094",
      address: "1425 Oak Ridge Drive",
      assessedValue: 485200,
      sqft: 2350,
      yearBuilt: 1987,
      owner: { type: 'Individual' }
    };

    try {
      const result = await agent?.implementation(samplePropertyData);
      
      setExecutions(prev => prev.map(exec => 
        exec.id === execution.id 
          ? { ...exec, status: 'completed', endTime: new Date(), result }
          : exec
      ));
    } catch (error) {
      setExecutions(prev => prev.map(exec => 
        exec.id === execution.id 
          ? { ...exec, status: 'failed', endTime: new Date(), error: error?.toString() }
          : exec
      ));
    }

    setIsProcessing(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Clock className="w-4 h-4 text-yellow-400 animate-spin" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-400" />;
      default: return null;
    }
  };

  const getDuration = (start: Date, end?: Date) => {
    if (!end) return 'Running...';
    return `${Math.round((end.getTime() - start.getTime()) / 1000)}s`;
  };

  return (
    <div className="space-y-6">
      {/* Agent Implementation Cards */}
      <div className="grid lg:grid-cols-3 gap-6">
        {agentImplementations.map((agent) => (
          <Card key={agent.name} className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
<>

                <Bot className="w-5 h-5 mr-2 text-cyan-400" />
                {agent.name}
              </CardTitle>
              <CardDescription
</> className="text-slate-300">
                {agent.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm">
<>

                <span className="text-slate-300">Endpoint: </span>
                <span
</> className="text-cyan-400 font-mono">{agent.endpoint}</span>
              </div>
              
              <div className="space-y-2">
<>

                <span className="text-slate-300 text-sm">Task Types:</span>
                <div
</> className="flex flex-wrap gap-1">
                  {agent.taskTypes.map((type) => (
                    <Badge key={type} variant="outline" className="text-xs border-white/20 text-slate-300">
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                {agent.taskTypes.map((taskType) => (
                  <Button
                    key={taskType}
                    size="sm"
                    onClick={() => executeAgent(agent.name, taskType)}
                    disabled={isProcessing}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
                  >
                    <Play className="w-3 h-3 mr-2" />
                    Execute {taskType}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Execution Results */}
      {executions.length > 0 && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
<>

            <CardTitle className="text-white">Live Execution Results</CardTitle>
            <CardDescription
</> className="text-slate-300">
              Real-time agent execution logs and results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {executions.map((execution) => (
                  <div key={execution.id} className="p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(execution.status)}
<>

                        <span className="text-white font-medium">{execution.agentName}</span>
                        <Badge
</> variant="outline" className="text-xs border-white/20 text-slate-300">
                          {execution.taskType}
                        </Badge>
                      </div>
                      <span className="text-slate-400 text-sm">
                        {getDuration(execution.startTime, execution.endTime)}
                      </span>
                    </div>
                    
                    {execution.result && (
                      <div className="mt-2 p-2 bg-green-500/10 border border-green-500/20 rounded text-sm">
                        <pre className="text-green-300 whitespace-pre-wrap">
                          {JSON.stringify(execution.result, null, 2)}
                        </pre>
                      </div>
                    )}
                    
                    {execution.error && (
                      <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-sm">
                        <span className="text-red-300">{execution.error}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AgentImplementation;
