import React from 'react';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {Progress} from '@/components/ui/progress';
import {Brain, TrendingUp, Warning, CheckCircle, Target, Zap} from '@mui/icons-material';

export default function MLInsightsPage() {
  return (
    <div className="space-y-6">{/* Header */}<div className="flex justify-between items-center"><div><><h1 className="text-3xl font-bold text-gray-900">ML Insights</h1><p
</>
className="text-gray-600 mt-2">Machine learning insights and predictive analytics</p></div><div className="flex gap-2"><><Badge variant="secondary" className="bg-purple-100 text-purple-800">ML Active</Badge><Badge
</>variant="secondary" className="bg-green-100 text-green-800">
            Real-time</Badge></div></div>{/* Model Performance Overview */}<div className="grid grid-cols-1 md:grid-cols-4 gap-6"><Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><><CardTitle className="text-sm font-medium">Model Accuracy</CardTitle><Target
</>
className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><><div className="text-2xl font-bold">94.7%</div><Progress
</>
value={94.7} className="mt-2" /></CardContent></Card><Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><><CardTitle className="text-sm font-medium">Predictions Today</CardTitle><Brain
</>
className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><><div className="text-2xl font-bold">1,247</div><p
</>className="text-xs text-muted-foreground">
              +23% from yesterday</p></CardContent></Card><Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><><CardTitle className="text-sm font-medium">Processing Speed</CardTitle><Zap
</>
className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><><div className="text-2xl font-bold">0.3s</div><p
</>className="text-xs text-muted-foreground">
              Average response time</p></CardContent></Card><Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><><CardTitle className="text-sm font-medium">Confidence Score</CardTitle><CheckCircle
</>
className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><><div className="text-2xl font-bold">89.2%</div><p
</>className="text-xs text-muted-foreground">
              Weighted average</p></CardContent></Card></div>{/* Active Models */}<Card><CardHeader><CardTitle className="flex items-center gap-2"><><Brain className="h-5 w-5" />Active ML Models</CardTitle><CardDescription
</></>>Currently deployed machine learning models and their performance</CardDescription></CardHeader><CardContent><div className="space-y-4"><div className="flex items-center justify-between p-4 border rounded-lg"><div className="flex items-center gap-3"><><div className="w-3 h-3 bg-green-500 rounded-full"></div><div
</></>><><h4 className="font-semibold">Cost Prediction Model v3.2</h4><p
</>
className="text-sm text-gray-600">Neural network for construction cost estimation</p></div></div><div className="text-right"><><Badge variant="secondary" className="bg-green-100 text-green-800">Active</Badge><p
</>
className="text-sm text-gray-600 mt-1">96.1% accuracy</p></div></div><div className="flex items-center justify-between p-4 border rounded-lg"><div className="flex items-center gap-3"><><div className="w-3 h-3 bg-blue-500 rounded-full"></div><div
</></>><><h4 className="font-semibold">Market Trend Analyzer v2.1</h4><p
</>
className="text-sm text-gray-600">Time series analysis for market predictions</p></div></div><div className="text-right"><><Badge variant="secondary" className="bg-blue-100 text-blue-800">Active</Badge><p
</>
className="text-sm text-gray-600 mt-1">91.8% accuracy</p></div></div><div className="flex items-center justify-between p-4 border rounded-lg"><div className="flex items-center gap-3"><><div className="w-3 h-3 bg-purple-500 rounded-full"></div><div
</></>><><h4 className="font-semibold">Risk Assessment Engine v1.5</h4><p
</>
className="text-sm text-gray-600">Classification model for project risk analysis</p></div></div><div className="text-right"><><Badge variant="secondary" className="bg-purple-100 text-purple-800">Active</Badge><p
</>
className="text-sm text-gray-600 mt-1">88.4% accuracy</p></div></div></div></CardContent></Card>{/* Insights and Alerts */}<div className="grid grid-cols-1 md:grid-cols-2 gap-6"><Card><CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" />Key Insights</CardTitle></CardHeader><CardContent className="space-y-3"><div className="flex items-start gap-3"><CheckCircle className="h-5 w-5 text-green-500 mt-0.5" /><div><><p className="font-medium">Material Cost Trend</p><p
</>
className="text-sm text-gray-600">Steel prices showing 3.2% decrease this quarter</p></div></div><div className="flex items-start gap-3"><CheckCircle className="h-5 w-5 text-green-500 mt-0.5" /><div><><p className="font-medium">Labor Market Analysis</p><p
</>
className="text-sm text-gray-600">Skilled labor availability improving in key markets</p></div></div><div className="flex items-start gap-3"><CheckCircle className="h-5 w-5 text-green-500 mt-0.5" /><div><><p className="font-medium">Regional Opportunities</p><p
</>
className="text-sm text-gray-600">Southeast region showing strongest growth potential</p></div></div></CardContent></Card><Card><CardHeader><CardTitle className="flex items-center gap-2"><Warning className="h-5 w-5" />Alerts & Recommendations</CardTitle></CardHeader><CardContent className="space-y-3"><div className="flex items-start gap-3"><Warning className="h-5 w-5 text-yellow-500 mt-0.5" /><div><><p className="font-medium">Model Drift Detected</p><p
</>
className="text-sm text-gray-600">Cost prediction model needs retraining next month</p></div></div><div className="flex items-start gap-3"><Warning className="h-5 w-5 text-orange-500 mt-0.5" /><div><><p className="font-medium">Data Quality Warning</p><p
</>
className="text-sm text-gray-600">Missing data points in Northwest region dataset</p></div></div><div className="flex items-start gap-3"><CheckCircle className="h-5 w-5 text-blue-500 mt-0.5" /><div><><p className="font-medium">Model Update Available</p><p
</>
className="text-sm text-gray-600">New version of risk assessment engine ready for deployment</p></div></div></CardContent></Card></div></div>
  );
}