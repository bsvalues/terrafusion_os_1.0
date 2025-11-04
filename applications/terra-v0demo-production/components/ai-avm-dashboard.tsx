"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Brain, Target, Zap, BarChart3, MapPin, Cpu, Database, Activity  } from '@mui/icons-material'

interface AVMModel {
  id: string
  name: string
  type: "neural_network" | "random_forest" | "gradient_boost" | "ensemble"
  accuracy: number
  confidence: number
  lastTrained: string
  propertyTypes: string[]
  status: "active" | "training" | "testing" | "deprecated"
  predictions: number
}

interface ValuationResult {
  parcelId: string
  address: string
  currentAssessment: number
  avmValuation: number
  confidence: number
  variance: number
  factors: string[]
  lastUpdated: string
}

export default function AIAVMDashboard() {
  const [models, setModels] = useState<AVMModel[]>([])
  const [valuations, setValuations] = useState<ValuationResult[]>([])
  const [systemMetrics, setSystemMetrics] = useState({
    totalModels: 0,
    activeModels: 0,
    avgAccuracy: 0,
    dailyPredictions: 0,
    processingTime: 0,
  })

  useEffect(() => {
    const mockModels: AVMModel[] = [
      {
        id: "avm-001",
        name: "ResidentialNet Pro",
        type: "neural_network",
        accuracy: 94.7,
        confidence: 92.3,
        lastTrained: "2025-01-08",
        propertyTypes: ["Single Family", "Townhouse", "Condo"],
        status: "active",
        predictions: 15847,
      },
      {
        id: "avm-002",
        name: "CommercialForest Elite",
        type: "random_forest",
        accuracy: 91.2,
        confidence: 89.8,
        lastTrained: "2025-01-05",
        propertyTypes: ["Office", "Retail", "Industrial"],
        status: "active",
        predictions: 8923,
      },
      {
        id: "avm-003",
        name: "AgriBoost Advanced",
        type: "gradient_boost",
        accuracy: 88.9,
        confidence: 87.1,
        lastTrained: "2025-01-03",
        propertyTypes: ["Agricultural", "Vineyard", "Orchard"],
        status: "active",
        predictions: 4567,
      },
      {
        id: "avm-004",
        name: "MasterEnsemble Ultra",
        type: "ensemble",
        accuracy: 96.1,
        confidence: 94.8,
        lastTrained: "2025-01-09",
        propertyTypes: ["All Property Types"],
        status: "training",
        predictions: 0,
      },
    ]

    const mockValuations: ValuationResult[] = [
      {
        parcelId: "362301-100045",
        address: "123 Wine Country Rd, Prosser, WA",
        currentAssessment: 485000,
        avmValuation: 492000,
        confidence: 94.2,
        variance: 1.4,
        factors: ["Recent sales", "Market trends", "Property improvements"],
        lastUpdated: "2025-01-10 09:15:00",
      },
      {
        parcelId: "362301-200078",
        address: "456 River View Dr, Richland, WA",
        currentAssessment: 325000,
        avmValuation: 338000,
        confidence: 91.7,
        variance: 4.0,
        factors: ["Waterfront premium", "School district", "Market appreciation"],
        lastUpdated: "2025-01-10 09:12:00",
      },
      {
        parcelId: "362301-300012",
        address: "321 Commerce Blvd, Richland, WA",
        currentAssessment: 700000,
        avmValuation: 685000,
        confidence: 89.3,
        variance: -2.1,
        factors: ["Commercial vacancy rates", "Cap rate analysis", "Location factors"],
        lastUpdated: "2025-01-10 09:08:00",
      },
    ]

    setModels(mockModels)
    setValuations(mockValuations)

    setSystemMetrics({
      totalModels: mockModels.length,
      activeModels: mockModels.filter((m) => m.status === "active").length,
      avgAccuracy: mockModels.reduce((sum, m) => sum + m.accuracy, 0) / mockModels.length,
      dailyPredictions: mockModels.reduce((sum, m) => sum + m.predictions, 0),
      processingTime: 1.2,
    })
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getModelTypeColor = (type: string) => {
    switch (type) {
      case "neural_network":
        return "bg-purple-100 text-purple-800"
      case "random_forest":
        return "bg-green-100 text-green-800"
      case "gradient_boost":
        return "bg-blue-100 text-blue-800"
      case "ensemble":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "training":
        return "bg-yellow-100 text-yellow-800"
      case "testing":
        return "bg-blue-100 text-blue-800"
      case "deprecated":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getVarianceColor = (variance: number) => {
    if (Math.abs(variance) <= 2) return "text-green-600"
    if (Math.abs(variance) <= 5) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><>

          <h1 className="text-3xl font-bold">AI-Powered Automated Valuation Models</h1>
          <p
</> className="text-gray-600">Advanced machine learning for property assessment</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge className="bg-purple-100 text-purple-800"><>

            <Brain className="h-4 w-4 mr-1" />
            AI Engine: ACTIVE
          </Badge>
          <Button
</>>
            <Cpu className="h-4 w-4 mr-2" />
            Train New Model
          </Button>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Brain className="h-8 w-8 text-purple-600" />
              <div className="text-right"><>

                <div className="text-2xl font-bold">{systemMetrics.totalModels}</div>
                <div
</> className="text-sm text-gray-600">Total Models</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Activity className="h-8 w-8 text-green-600" />
              <div className="text-right"><>

                <div className="text-2xl font-bold">{systemMetrics.activeModels}</div>
                <div
</> className="text-sm text-gray-600">Active Models</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Target className="h-8 w-8 text-blue-600" />
              <div className="text-right"><>

                <div className="text-2xl font-bold">{systemMetrics.avgAccuracy.toFixed(1)}%</div>
                <div
</> className="text-sm text-gray-600">Avg Accuracy</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <BarChart3 className="h-8 w-8 text-orange-600" />
              <div className="text-right"><>

                <div className="text-2xl font-bold">{systemMetrics.dailyPredictions.toLocaleString()}</div>
                <div
</> className="text-sm text-gray-600">Daily Predictions</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Zap className="h-8 w-8 text-yellow-600" />
              <div className="text-right"><>

                <div className="text-2xl font-bold">{systemMetrics.processingTime}s</div>
                <div
</> className="text-sm text-gray-600">Avg Processing</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="models" className="w-full">
        <TabsList className="grid w-full grid-cols-4"><>

          <TabsTrigger value="models">AI Models</TabsTrigger>
          <TabsTrigger
</> value="valuations">Live Valuations</TabsTrigger><>

          <TabsTrigger value="training">Model Training</TabsTrigger>
          <TabsTrigger
</> value="analytics">Performance Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="models" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {models.map((model) => (
              <Card key={model.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3"><>

                      <Brain className="h-6 w-6" />
                      {model.name}
                    </div>
                    <Badge
</> className={getStatusColor(model.status)}>{model.status.toUpperCase()}</Badge>
                  </CardTitle>
                  <CardDescription>
                    <Badge className={getModelTypeColor(model.type)} variant="outline">
                      {model.type.replace("_", " ").toUpperCase()}
                    </Badge>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div><>

                        <div className="text-sm font-medium">Accuracy</div>
                        <div
</> className="text-2xl font-bold text-green-600">{model.accuracy}%</div><>

                        <Progress value={model.accuracy} className="mt-1" />
                      </div>
                      <div
</>><>

                        <div className="text-sm font-medium">Confidence</div>
                        <div
</> className="text-2xl font-bold text-blue-600">{model.confidence}%</div>
                        <Progress value={model.confidence} className="mt-1" />
                      </div>
                    </div>

                    <div><>

                      <div className="text-sm font-medium mb-2">Property Types</div>
                      <div
</> className="flex flex-wrap gap-1">
                        {model.propertyTypes.map((type /* , index */) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><>

                        <span className="font-medium">Last Trained:</span>
                        <div
</>>{new Date(model.lastTrained).toLocaleDateString()}</div>
                      </div>
                      <div><>

                        <span className="font-medium">Predictions:</span>
                        <div
</>>{model.predictions.toLocaleString()}</div>
                      </div>
                    </div>

                    <div className="flex gap-2"><>

                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                      <Button
</> size="sm" variant="outline">
                        Retrain Model
                      </Button>
                      {model.status === "active" && (
                        <Button size="sm" variant="outline">
                          Run Batch
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="valuations" className="space-y-4">
          <Card>
            <CardHeader><>

              <CardTitle>Recent AVM Valuations</CardTitle>
              <CardDescription
</>>Latest automated property valuations with confidence scores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {valuations.map((valuation) => (
                  <div key={valuation.parcelId} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div><>

                        <div className="font-medium">{valuation.parcelId}</div>
                        <div
</> className="text-sm text-gray-600 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {valuation.address}
                        </div>
                      </div>
                      <Badge
                        className={
                          valuation.confidence >= 90
                            ? "bg-green-100 text-green-800"
                            : valuation.confidence >= 80
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }
                      >
                        {valuation.confidence}% Confidence
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div><>

                        <div className="text-sm text-gray-600">Current Assessment</div>
                        <div
</> className="font-bold">{formatCurrency(valuation.currentAssessment)}</div>
                      </div>
                      <div><>

                        <div className="text-sm text-gray-600">AVM Valuation</div>
                        <div
</> className="font-bold">{formatCurrency(valuation.avmValuation)}</div>
                      </div>
                      <div><>

                        <div className="text-sm text-gray-600">Variance</div>
                        <div
</> className={`font-bold ${getVarianceColor(valuation.variance)}`}>
                          {valuation.variance > 0 ? "+" : ""}
                          {valuation.variance.toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    <div className="mb-3"><>

                      <div className="text-sm font-medium mb-1">Key Factors</div>
                      <div
</> className="flex flex-wrap gap-1">
                        {valuation.factors.map((factor /* , index */) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {factor}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs text-gray-500"><>

                      <span>Last Updated: {valuation.lastUpdated}</span>
                      <div
</> className="flex gap-2"><>

                        <Button size="sm" variant="outline">
                          Accept AVM
                        </Button>
                        <Button
</> size="sm" variant="outline">
                          Review Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="training" className="space-y-4">
          <Card>
            <CardHeader><>

              <CardTitle>Model Training Center</CardTitle>
              <CardDescription
</>>Train and optimize AI models for better accuracy</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <Alert>
                  <Brain className="h-4 w-4" /><>

                  <AlertTitle>MasterEnsemble Ultra Training in Progress</AlertTitle>
                  <AlertDescription
</>>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between text-sm"><>

                        <span>Training Progress</span>
                        <span
</>>73% Complete</span>
                      </div>
                      <Progress value={73} />
                      <div className="text-xs text-gray-600">
                        Estimated completion: 2 hours 15 minutes
                        <br />
                        Training on 125,000 property records from 9 Washington counties
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Training Data Sources</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between"><>

                          <span>Property Sales Data</span>
                          <span
</> className="font-medium">45,000 records</span>
                        </div>
                        <div className="flex justify-between"><>

                          <span>Assessment History</span>
                          <span
</> className="font-medium">125,000 records</span>
                        </div>
                        <div className="flex justify-between"><>

                          <span>Market Comparables</span>
                          <span
</> className="font-medium">78,000 records</span>
                        </div>
                        <div className="flex justify-between"><>

                          <span>Property Characteristics</span>
                          <span
</> className="font-medium">125,000 records</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Model Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between"><>

                          <span>Current Accuracy</span>
                          <span
</> className="font-medium text-green-600">94.7%</span>
                        </div>
                        <div className="flex justify-between"><>

                          <span>Target Accuracy</span>
                          <span
</> className="font-medium">96.0%</span>
                        </div>
                        <div className="flex justify-between"><>

                          <span>Mean Absolute Error</span>
                          <span
</> className="font-medium">3.2%</span>
                        </div>
                        <div className="flex justify-between"><>

                          <span>Processing Speed</span>
                          <span
</> className="font-medium">1,200/min</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex gap-4">
                  <Button><>

                    <Database className="h-4 w-4 mr-2" />
                    Add Training Data
                  </Button>
                  <Button
</> variant="outline"><>

                    <Cpu className="h-4 w-4 mr-2" />
                    Configure Hyperparameters
                  </Button>
                  <Button
</> variant="outline">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Training Logs
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><>

                <CardTitle>Model Accuracy Trends</CardTitle>
                <CardDescription
</>>30-day accuracy performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {models
                    .filter((m) => m.status === "active")
                    .map((model) => (
                      <div key={model.id} className="space-y-2">
                        <div className="flex justify-between text-sm"><>

                          <span>{model.name}</span>
                          <span
</> className="font-medium">{model.accuracy}%</span>
                        </div>
                        <Progress value={model.accuracy} />
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><>

                <CardTitle>Prediction Volume</CardTitle>
                <CardDescription
</>>Daily prediction statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center"><>

                    <div className="text-3xl font-bold text-blue-600">29,337</div>
                    <div
</> className="text-sm text-gray-600">Predictions Today</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center"><>

                      <div className="font-bold text-green-600">27,845</div>
                      <div
</> className="text-gray-600">High Confidence</div>
                    </div>
                    <div className="text-center"><>

                      <div className="font-bold text-yellow-600">1,492</div>
                      <div
</> className="text-gray-600">Needs Review</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><>

              <CardTitle>Property Type Performance</CardTitle>
              <CardDescription
</>>Model accuracy by property type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3"><>

                  <h4 className="font-medium">Residential Properties</h4>
                  <div
</> className="space-y-2">
                    <div className="flex justify-between text-sm"><>

                      <span>Single Family</span>
                      <span
</> className="font-medium">95.2%</span>
                    </div>
                    <div className="flex justify-between text-sm"><>

                      <span>Townhouse</span>
                      <span
</> className="font-medium">93.8%</span>
                    </div>
                    <div className="flex justify-between text-sm"><>

                      <span>Condominium</span>
                      <span
</> className="font-medium">91.4%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3"><>

                  <h4 className="font-medium">Commercial Properties</h4>
                  <div
</> className="space-y-2">
                    <div className="flex justify-between text-sm"><>

                      <span>Office</span>
                      <span
</> className="font-medium">89.7%</span>
                    </div>
                    <div className="flex justify-between text-sm"><>

                      <span>Retail</span>
                      <span
</> className="font-medium">87.3%</span>
                    </div>
                    <div className="flex justify-between text-sm"><>

                      <span>Industrial</span>
                      <span
</> className="font-medium">85.9%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3"><>

                  <h4 className="font-medium">Specialty Properties</h4>
                  <div
</> className="space-y-2">
                    <div className="flex justify-between text-sm"><>

                      <span>Agricultural</span>
                      <span
</> className="font-medium">88.9%</span>
                    </div>
                    <div className="flex justify-between text-sm"><>

                      <span>Vineyard</span>
                      <span
</> className="font-medium">86.2%</span>
                    </div>
                    <div className="flex justify-between text-sm"><>

                      <span>Waterfront</span>
                      <span
</> className="font-medium">84.7%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
