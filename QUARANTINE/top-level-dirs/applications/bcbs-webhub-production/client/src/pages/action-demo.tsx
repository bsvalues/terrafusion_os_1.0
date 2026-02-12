import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RecommendationActions } from "@/components/recommendation-action-buttons";
import { Zap, 
  Play, 
  CheckCircle, 
  Warning,
  TrendingUp,
  Shield,
  Users,
  FileText,
  Info,
  ArrowRight
 } from '@mui/icons-material';

const demoRecommendations = [
  {
    id: "demo_1",
    type: "risk_assessment" as const,
    title: "High-Risk Commercial Properties Detected",
    description: "AI analysis identified 3 commercial properties with assessment discrepancies exceeding $500K that require immediate review.",
    priority: "critical" as const,
    confidence: 0.92,
    suggestedActions: [
      "Create priority audit for Maple Street Commercial Plaza",
      "Schedule on-site inspection within 5 business days",
      "Assign senior assessor with commercial expertise"
    ],
    riskFactors: [
      "Assessment variance > 40% of market value",
      "No recent inspection in 3+ years",
      "Property type: Large commercial complex"
    ],
    reasoning: "The AI detected significant assessment discrepancies when comparing these properties against recent commercial sales data and market trends. The variance suggests potential under-assessment that could impact tax revenue."
  },
  {
    id: "demo_2", 
    type: "workload_optimization" as const,
    title: "Optimize Team Workload Distribution",
    description: "Current workload analysis shows uneven distribution with 3 auditors handling 70% of pending cases while 2 team members have light workloads.",
    priority: "high" as const,
    confidence: 0.88,
    suggestedActions: [
      "Redistribute 5 pending audits from overloaded team members",
      "Implement auto-assignment for new audits",
      "Review skill-based assignment criteria"
    ],
    riskFactors: [
      "Potential burnout for overworked staff",
      "Delayed audit completion times",
      "Quality concerns due to rushed reviews"
    ],
    reasoning: "Data analysis shows significant workload imbalance that could lead to bottlenecks and quality issues. Redistributing work will improve efficiency and reduce completion times."
  },
  {
    id: "demo_3",
    type: "compliance_priority" as const, 
    title: "Deadline Management Required",
    description: "8 audits are approaching their statutory deadlines within the next 7 days, with 3 at critical risk of missing required completion dates.",
    priority: "urgent" as const,
    confidence: 0.95,
    suggestedActions: [
      "Send immediate deadline reminders to assigned auditors",
      "Schedule emergency review session for critical cases",
      "Escalate 3 most urgent audits to supervisor"
    ],
    riskFactors: [
      "Potential regulatory compliance violations",
      "Risk of taxpayer appeals due to delays",
      "Possible penalty or legal implications"
    ],
    reasoning: "Statutory deadlines are approaching for multiple audits. Immediate action is required to prevent compliance violations and maintain the integrity of the assessment process."
  },
  {
    id: "demo_4",
    type: "resource_allocation" as const,
    title: "Workflow Process Enhancement",
    description: "Performance analysis suggests that implementing batch processing for similar property types could reduce average audit time by 23%.",
    priority: "medium" as const,
    confidence: 0.84,
    suggestedActions: [
      "Enable batch processing for residential properties",
      "Update workflow settings for automatic grouping",
      "Train team on new batch review procedures"
    ],
    riskFactors: [
      "Current inefficient individual processing",
      "Missed opportunities for economies of scale",
      "Suboptimal resource utilization"
    ],
    reasoning: "Analysis of audit patterns shows significant time savings potential through batch processing of similar property types. This optimization could improve overall department efficiency."
  }
];

const priorityColors = {
  low: 'bg-green-100 text-green-800 border-green-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  critical: 'bg-red-100 text-red-800 border-red-200',
  urgent: 'bg-red-100 text-red-800 border-red-200'
};

const typeIcons = {
  risk_assessment: Shield,
  workload_optimization: TrendingUp,
  compliance_priority: CheckCircle,
  resource_allocation: Users
};

const typeColors = {
  risk_assessment: 'text-red-600',
  workload_optimization: 'text-blue-600', 
  compliance_priority: 'text-green-600',
  resource_allocation: 'text-purple-600'
};

export default function ActionDemo() {
  const [executedActions, setExecutedActions] = useState<string[]>([]);

  const handleActionExecuted = (result: any) => {
    if (result.success) {
      setExecutedActions(prev => [...prev, result.message]);
    }
  };

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center mb-4"><>

          <Zap className="h-8 w-8 mr-3 text-blue-600" />
          One-Click Action Demo
        </h1>
        <p
</>

className="text-muted-foreground mb-4">
          Experience the power of AI-driven recommendations with instant action execution. 
          Each recommendation includes contextually relevant actions you can execute with a single click.
        </p>
        
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertDescription>
            This demo shows how one-click actions work with sample recommendations. 
            Actions will execute real operations on your audit system - try clicking the action buttons below each recommendation.
          </AlertDescription>
        </Alert>
      </div>

      {executedActions.length > 0 && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-green-800 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              Recent Actions Executed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {executedActions.map((action /* , index */) => (
                <div key={index} className="flex items-center text-sm text-green-700">
                  <ArrowRight className="h-3 w-3 mr-2" />
                  {action}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        {demoRecommendations.map((recommendation) => {
          const IconComponent = typeIcons[recommendation.type];
          
          return (
            <Card key={recommendation.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg bg-gray-50 ${typeColors[recommendation.type]}`}><>

                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div
</>

className="flex-1"><>

                      <CardTitle className="text-lg leading-tight">{recommendation.title}</CardTitle>
                      <CardDescription
</>

className="mt-1">
                        {recommendation.description}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2"><>

                    <Badge className={`${priorityColors[recommendation.priority]} border`}>
                      {recommendation.priority}
                    </Badge>
                    <div
</>

className="flex items-center text-sm text-gray-500">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      {Math.round(recommendation.confidence * 100)}%
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {recommendation.suggestedActions.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center"><>

                      <Play className="h-4 w-4 mr-1" />
                      Suggested Actions
                    </h4>
                    <ul
</>

className="space-y-1">
                      {recommendation.suggestedActions.map((action /* , index */) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {recommendation.riskFactors.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center"><>

                      <Warning className="h-4 w-4 mr-1" />
                      Risk Factors
                    </h4>
                    <div
</>

className="flex flex-wrap gap-2">
                      {recommendation.riskFactors.map((factor /* , index */) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {factor}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="bg-gray-50 rounded-lg p-3 mb-4"><>

                  <h5 className="font-medium text-sm text-gray-700 mb-1">AI Reasoning</h5>
                  <p
</>

className="text-sm text-gray-600">{recommendation.reasoning}</p>
                </div>
                
                <div className="border-t pt-4">
                  <RecommendationActions 
                    recommendationType={recommendation.type}
                    layout="compact"
                    onActionExecuted={handleActionExecuted}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-800 mb-3 flex items-center"><>

          <Info className="h-5 w-5 mr-2" />
          How One-Click Actions Work
        </h3>
        <div
</>

className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
          <div><>

            <h4 className="font-medium mb-2">Intelligent Action Detection</h4>
            <p
</>

</>>AI analyzes each recommendation and automatically suggests the most relevant actions based on the recommendation type and context.</p>
          </div>
          <div><>

            <h4 className="font-medium mb-2">Instant Execution</h4>
            <p
</>

</>>Click any action button to immediately execute the operation - no additional forms or complex workflows required.</p>
          </div>
          <div><>

            <h4 className="font-medium mb-2">Smart Confirmation</h4>
            <p
</>

</>>Critical actions require confirmation to prevent accidental execution, while routine operations execute immediately.</p>
          </div>
          <div><>

            <h4 className="font-medium mb-2">Real-time Feedback</h4>
            <p
</>

</>>Get instant feedback on action results with detailed success messages and any relevant data from the operation.</p>
          </div>
        </div>
      </div>
    </div>
  );
}