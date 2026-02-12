import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, 
  Warning, 
  CheckCircle, 
  TrendingUp, 
  Brain,
  Target,
  Clock
 } from '@mui/icons-material';

interface RiskAnalysis {
  riskScore: number;
  riskFactors: string[];
  recommendations: string[];
  confidence: number;
}

interface AuditRiskIndicatorProps {
  auditId: number;
  auditNumber: string;
  priority?: string;
  status?: string;
  compact?: boolean;
}

function getRiskLevel(score: number): { level: string; color: string; icon: React.ComponentType } {
  if (score >= 0.8) return { level: "Critical", color: "bg-red-100 text-red-800 border-red-200", icon: Warning };
  if (score >= 0.6) return { level: "High", color: "bg-orange-100 text-orange-800 border-orange-200", icon: Shield };
  if (score >= 0.4) return { level: "Medium", color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: TrendingUp };
  return { level: "Low", color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle };
}

export function AuditRiskIndicator({ auditId, auditNumber, priority, status, compact = false }: AuditRiskIndicatorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { 
    data: riskAnalysis, 
    isLoading, 
    error,
    refetch 
  } = useQuery<RiskAnalysis>({
    queryKey: [`/api/audits/${auditId}/risk-analysis`],
    enabled: isOpen, // Only fetch when dialog is opened
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  const risk = riskAnalysis ? getRiskLevel(riskAnalysis.riskScore) : null;

  if (compact) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
            <Brain className="h-3 w-3 mr-1" />
            Risk
          </Button>
        </DialogTrigger>
        
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center"><>

              <Brain className="h-5 w-5 mr-2 text-blue-600" />
              AI Risk Analysis: {auditNumber}
            </DialogTitle>
            <DialogDescription
</>

</>>
              Comprehensive risk assessment powered by artificial intelligence
            </DialogDescription>
          </DialogHeader>
          
          <RiskAnalysisContent 
            riskAnalysis={riskAnalysis}
            isLoading={isLoading}
            error={error}
            onRefresh={() => refetch()}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="cursor-pointer">
          {isLoading ? (
            <Skeleton className="h-6 w-16 rounded" />
          ) : risk ? (
            <Badge className={`${risk.color} border cursor-pointer hover:opacity-80 transition-opacity`}>
              <risk.icon className="h-3 w-3 mr-1" />
              {risk.level}
            </Badge>
          ) : (
            <Badge variant="outline" className="cursor-pointer hover:bg-gray-50">
              <Brain className="h-3 w-3 mr-1" />
              Analyze
            </Badge>
          )}
        </div>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center"><>

            <Brain className="h-5 w-5 mr-2 text-blue-600" />
            AI Risk Analysis: {auditNumber}
          </DialogTitle>
          <DialogDescription
</>

</>>
            Comprehensive risk assessment powered by artificial intelligence
          </DialogDescription>
        </DialogHeader>
        
        <RiskAnalysisContent 
          riskAnalysis={riskAnalysis}
          isLoading={isLoading}
          error={error}
          onRefresh={() => refetch()}
        />
      </DialogContent>
    </Dialog>
  );
}

function RiskAnalysisContent({ 
  riskAnalysis, 
  isLoading, 
  error, 
  onRefresh 
}: { 
  riskAnalysis?: RiskAnalysis; 
  isLoading: boolean; 
  error: any; 
  onRefresh: () => void;
}) {
  if (error) {
    return (
      <Alert>
        <Warning className="h-4 w-4" />
        <AlertDescription>
          Failed to load risk analysis. This may be due to insufficient data or a temporary service issue.
          <Button variant="outline" size="sm" onClick={onRefresh} className="ml-2">
            Try Again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" /><>

          <Skeleton className="h-6 w-16" />
        </div>
        <div
</>

className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" /><>

          <Skeleton className="h-4 w-1/2" />
        </div>
        <div
</>

className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>
    );
  }

  if (!riskAnalysis) {
    return (
      <div className="text-center py-8">
        <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" /><>

        <p className="text-gray-500">No risk analysis available</p>
        <Button
</>

variant="outline" onClick={onRefresh} className="mt-2">
          Generate Analysis
        </Button>
      </div>
    );
  }

  const risk = getRiskLevel(riskAnalysis.riskScore);

  return (
    <div className="space-y-6">
      {/* Risk Score Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <span className="flex items-center"><>

              <risk.icon className="h-5 w-5 mr-2" />
              Risk Assessment
            </span>
            <div
</>

className="flex items-center space-x-2"><>

              <Badge className={`${risk.color} border`}>
                {risk.level}
              </Badge>
              <span
</>

className="text-sm text-gray-500">
                {Math.round(riskAnalysis.confidence * 100)}% confidence
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2"><>

                <span className="text-sm font-medium">Risk Score</span>
                <span
</>

className="text-sm text-gray-600">
                  {Math.round(riskAnalysis.riskScore * 100)}/100
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    riskAnalysis.riskScore >= 0.8 ? 'bg-red-500' :
                    riskAnalysis.riskScore >= 0.6 ? 'bg-orange-500' :
                    riskAnalysis.riskScore >= 0.4 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${riskAnalysis.riskScore * 100}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Factors */}
      {riskAnalysis.riskFactors.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Warning className="h-5 w-5 mr-2 text-orange-600" />
              Identified Risk Factors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {riskAnalysis.riskFactors.map((factor /* , index */) => (
                <div key={index} className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{factor}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {riskAnalysis.recommendations.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Target className="h-5 w-5 mr-2 text-blue-600" />
              AI Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {riskAnalysis.recommendations.map((recommendation /* , index */) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                  </div>
                  <span className="text-sm text-gray-700">{recommendation}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Metadata */}
      <div className="text-xs text-gray-500 text-center border-t pt-4">
        <div className="flex items-center justify-center space-x-4">
          <span className="flex items-center"><>

            <Clock className="h-3 w-3 mr-1" />
            Analysis generated just now
          </span>
          <span
</>

className="flex items-center">
            <Brain className="h-3 w-3 mr-1" />
            Powered by AI
          </span>
        </div>
      </div>
    </div>
  );
}