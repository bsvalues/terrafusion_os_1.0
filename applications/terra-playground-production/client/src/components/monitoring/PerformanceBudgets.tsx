import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  PerformanceBudgetSet,
  performanceBudgetSets,
  PerformanceBudget,
} from '@shared/web-vitals-budgets';

interface PerformanceBudgetsProps {
  metrics?: any[];
  selectedCategory?: string;
}

export function PerformanceBudgets({
  metrics = [],
  selectedCategory = 'critical',
}: PerformanceBudgetsProps) {
  const [activeTab, setActiveTab] = useState(selectedCategory);

  // Filter budget sets based on active tab
  const filteredBudgetSets = performanceBudgetSets.filter(
    set => activeTab === 'all' || set.category === activeTab
  );

  // Calculate budget status for a metric
  const getBudgetStatus = (budget: PerformanceBudget) => {
    // Find the corresponding metric in our data
    const matchingMetrics = metrics.filter(m => m.name === budget.metricName);

    if (matchingMetrics.length === 0) {
      return {
        value: null,
        percentage: 0,
        status: 'unknown',
        message: 'No data available',
      };
    }

    // Calculate the p75 (75th percentile)
    const values = matchingMetrics.map(m => m.value).sort((a, b) => a - b);
    const p75Index = Math.floor(values.length * 0.75);
    const p75Value = values[p75Index] || values[values.length - 1];

    // Special cases where higher values are better
    const isInverseMetric = ['MapRenderFPS', 'QueueProcessingRate'].includes(budget.metricName);

    let status: 'good' | 'warning' | 'critical' | 'unknown';
    let percentage: number;

    if (isInverseMetric) {
      // For these metrics, higher is better
      if (p75Value >= budget.good) {
        status = 'good';
        percentage = 100;
      } else if (p75Value >= budget.needsImprovement) {
        status = 'warning';
        percentage = Math.min(90, (p75Value / budget.good) * 100);
      } else {
        status = 'critical';
        percentage = Math.min(60, (p75Value / budget.needsImprovement) * 100);
      }
    } else {
      // For normal metrics, lower is better
      if (p75Value <= budget.good) {
        status = 'good';
        percentage = Math.min(100, ((budget.good - p75Value) / budget.good) * 100 + 40);
      } else if (p75Value <= budget.needsImprovement) {
        status = 'warning';
        const range = budget.needsImprovement - budget.good;
        const position = budget.needsImprovement - p75Value;
        percentage = Math.min(70, (position / range) * 30 + 40);
      } else if (p75Value <= budget.critical) {
        status = 'critical';
        const range = budget.critical - budget.needsImprovement;
        const position = budget.critical - p75Value;
        percentage = Math.min(40, (position / range) * 40);
      } else {
        status = 'critical';
        percentage = 10; // Very poor
      }
    }

    return {
      value: p75Value,
      percentage,
      status,
      message: `p75: ${p75Value}`,
      samples: matchingMetrics.length,
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'critical':
        return 'bg-red-500';
      default:
        return 'bg-gray-300';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'good':
        return <Badge className="bg-green-500">Good</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500">Needs Improvement</Badge>;
      case 'critical':
        return <Badge className="bg-red-500">Critical</Badge>;
      default:
        return <Badge className="bg-gray-300">Unknown</Badge>;
    }
  };

  const formatBudgetValue = (budget: PerformanceBudget, value: number | null) => {
    if (value === null) return 'N/A';

    // Format based on metric type
    if (budget.metricName === 'CLS') {
      return value.toFixed(3);
    } else if (['TotalAssetSize', 'InitialJSBundle'].includes(budget.metricName)) {
      // Format as KB or MB
      if (value < 1024) {
        return `${value.toFixed(1)} B`;
      } else if (value < 1024 * 1024) {
        return `${(value / 1024).toFixed(1)} KB`;
      } else {
        return `${(value / (1024 * 1024)).toFixed(1)} MB`;
      }
    } else {
      // Default formatting for timing metrics (ms)
      return `${value.toFixed(0)} ms`;
    }
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <TabsList><>

          <TabsTrigger value="critical">Critical</TabsTrigger>
          <TabsTrigger
</> value="all">All</TabsTrigger><>

          <TabsTrigger value="desktop">Desktop</TabsTrigger>
          <TabsTrigger
</> value="mobile">Mobile</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="pt-4">
          {filteredBudgetSets.map(budgetSet => (
            <Card key={budgetSet.name} className="mb-6">
              <CardHeader><>

                <CardTitle>{budgetSet.name}</CardTitle>
                <CardDescription
</>>{budgetSet.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {budgetSet.budgets.map(budget => {
                    const status = getBudgetStatus(budget);
                    return (
                      <div key={budget.metricName} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <div><>

                            <span className="font-medium">{budget.metricName}</span>
                            <p
</> className="text-sm text-gray-500">{budget.description}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="text-right">
                              {status.value !== null ? (
                                <><>

                                  <div className="font-medium">
                                    {formatBudgetValue(budget, status.value)}
                                  </div>
                                  <div
</> className="text-xs text-gray-500">
                                    {status.samples} samples
                                  </div>
                                </>
                              ) : (
                                <div className="text-sm text-gray-500">No data</div>
                              )}
                            </div>
                            {status.status !== 'unknown' && getStatusBadge(status.status)}
                          </div>
                        </div>
                        <Progress
                          value={status.percentage}
                          className={`h-2 ${getStatusColor(status.status)}`}
                        />
                        <div className="flex justify-between text-xs text-gray-500"><>

                          <span>Good: {formatBudgetValue(budget, budget.good)}</span>
                          <span
</>>
                            Needs Improvement: {formatBudgetValue(budget, budget.needsImprovement)}
                          </span>
                          <span>Critical: {formatBudgetValue(budget, budget.critical)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="text-xs text-gray-500">
                  {budgetSet.budgets.length} metric{budgetSet.budgets.length !== 1 ? 's' : ''}
                </div>
                {budgetSet.category === 'critical' && (
                  <Button variant="outline" size="sm">
                    Enforce in CI
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface PerformanceAlertProps {
  alerts?: any[];
  onAcknowledge?: (alertId: string) => void;
}

export function PerformanceAlerts({ alerts = [], onAcknowledge }: PerformanceAlertProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 border-red-500 text-red-700';
      case 'medium':
        return 'bg-yellow-100 border-yellow-500 text-yellow-700';
      case 'low':
        return 'bg-blue-100 border-blue-500 text-blue-700';
      default:
        return 'bg-gray-100 border-gray-500 text-gray-700';
    }
  };

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader><>

          <CardTitle>Performance Alerts</CardTitle>
          <CardDescription
</>>No active alerts at this time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 text-center text-gray-500">
            All performance metrics are within acceptable thresholds
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><>

        <CardTitle>Performance Alerts</CardTitle>
        <CardDescription
</>>
          {alerts.length} active alert{alerts.length !== 1 ? 's' : ''} requiring attention
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {alerts.map(alert => (
            <div
              key={alert.id}
              className={`border-l-4 p-4 rounded ${getSeverityColor(alert.severity)}`}
            >
              <div className="flex justify-between"><>

                <h3 className="font-medium">{alert.title}</h3>
                <Badge
</> className={alert.alertType === 'anomaly' ? 'bg-purple-500' : 'bg-red-500'}>
                  {alert.alertType === 'anomaly' ? 'Anomaly' : 'Threshold'}
                </Badge>
              </div><>

              <p className="text-sm mt-2">{alert.description}</p>
              <div
</> className="mt-2 flex justify-between items-center">
                <div className="text-xs">
                  Detected {new Date(alert.detectedAt).toLocaleString()}
                </div>
                {onAcknowledge && (
                  <Button variant="outline" size="sm" onClick={() => onAcknowledge(alert.id)}>
                    Acknowledge
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
