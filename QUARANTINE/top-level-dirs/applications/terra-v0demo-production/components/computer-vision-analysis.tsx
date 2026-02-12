"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Camera,
  Eye,
  Brain,
  Zap,
  Upload,
  CheckCircle,
  Warning,
  Home,
  Wrench,
  Shield,
  TreePine,
  Car,
 } from '@mui/icons-material'

interface AnalysisResult {
  id: string
  imageUrl: string
  analysisType: string
  confidence: number
  findings: {
    category: string
    condition: "excellent" | "good" | "fair" | "poor" | "critical"
    confidence: number
    description: string
    recommendations: string[]
  }[]
  estimatedValue: {
    current: number
    potential: number
    repairCosts: number
  }
  processingTime: number
}

export default function ComputerVisionAnalysis() {
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)

  useEffect(() => {
    const mockAnalyses: AnalysisResult[] = [
      {
        id: "cv-001",
        imageUrl: "/placeholder.svg?height=300&width=400",
        analysisType: "Exterior Assessment",
        confidence: 94.2,
        findings: [
          {
            category: "Roof Condition",
            condition: "good",
            confidence: 92.1,
            description: "Asphalt shingles in good condition with minor granule loss",
            recommendations: ["Monitor for further deterioration", "Plan replacement in 5-7 years"],
          },
          {
            category: "Siding",
            condition: "fair",
            confidence: 87.3,
            description: "Vinyl siding with some fading and minor cracks detected",
            recommendations: ["Clean and inspect annually", "Consider touch-up painting"],
          },
          {
            category: "Windows",
            condition: "excellent",
            confidence: 96.8,
            description: "Double-pane windows in excellent condition",
            recommendations: ["No immediate action required"],
          },
          {
            category: "Foundation",
            condition: "good",
            confidence: 89.4,
            description: "Concrete foundation with minor settling cracks",
            recommendations: ["Monitor crack progression", "Seal minor cracks"],
          },
        ],
        estimatedValue: {
          current: 485000,
          potential: 510000,
          repairCosts: 8500,
        },
        processingTime: 2.3,
      },
    ]

    setAnalyses(mockAnalyses)
  }, [])

  const simulateAnalysis = () => {
    setIsProcessing(true)
    setProcessingProgress(0)

    const interval = setInterval(() => {
      setProcessingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsProcessing(false)
          return 100
        }
        return prev + 10
      })
    }, 300)
  }

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "excellent":
        return "bg-green-100 text-green-800"
      case "good":
        return "bg-blue-100 text-blue-800"
      case "fair":
        return "bg-yellow-100 text-yellow-800"
      case "poor":
        return "bg-orange-100 text-orange-800"
      case "critical":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "roof condition":
        return <Home className="h-4 w-4" />
      case "siding":
        return <Shield className="h-4 w-4" />
      case "windows":
        return <Eye className="h-4 w-4" />
      case "foundation":
        return <Wrench className="h-4 w-4" />
      case "landscaping":
        return <TreePine className="h-4 w-4" />
      case "driveway":
        return <Car className="h-4 w-4" />
      default:
        return <Home className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><>

          <h1 className="text-3xl font-bold">Computer Vision Property Analysis</h1>
          <p
</> className="text-gray-600">AI-powered automated property condition assessment</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge className="bg-purple-100 text-purple-800"><>

            <Brain className="h-4 w-4 mr-1" />
            CV Engine: ACTIVE
          </Badge>
          <Button
</> onClick={simulateAnalysis} disabled={isProcessing}>
            <Camera className="h-4 w-4 mr-2" />
            {isProcessing ? "Analyzing..." : "Analyze New Photo"}
          </Button>
        </div>
      </div>

      {/* Processing Status */}
      {isProcessing && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Zap className="h-6 w-6 text-blue-600 animate-pulse" />
                <div><>

                  <div className="font-medium">AI Analysis in Progress</div>
                  <div
</> className="text-sm text-gray-600">Processing property images with computer vision</div>
                </div>
              </div>
              <Progress value={processingProgress} className="w-full" />
              <div className="grid grid-cols-4 gap-4 text-sm"><>

                <div className={processingProgress >= 25 ? "text-green-600" : "text-gray-400"}>
                  ✓ Image preprocessing
                </div>
                <div
</> className={processingProgress >= 50 ? "text-green-600" : "text-gray-400"}>✓ Feature detection</div><>

                <div className={processingProgress >= 75 ? "text-green-600" : "text-gray-400"}>
                  ✓ Condition analysis
                </div>
                <div
</> className={processingProgress >= 100 ? "text-green-600" : "text-gray-400"}>
                  ✓ Report generation
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="results" className="w-full">
        <TabsList className="grid w-full grid-cols-4"><>

          <TabsTrigger value="results">Analysis Results</TabsTrigger>
          <TabsTrigger
</> value="upload">Upload Images</TabsTrigger><>

          <TabsTrigger value="models">AI Models</TabsTrigger>
          <TabsTrigger
</> value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="results" className="space-y-6">
          {analyses.map((analysis) => (
            <Card key={analysis.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3"><>

                    <Eye className="h-6 w-6" />
                    {analysis.analysisType}
                  </div>
                  <Badge
</> className="bg-blue-100 text-blue-800">{analysis.confidence}% Confidence</Badge>
                </CardTitle>
                <CardDescription>
                  Processed in {analysis.processingTime}s • {analysis.findings.length} findings detected
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Property Image */}
                  <div className="space-y-4">
                    <img
                      src={analysis.imageUrl || "/placeholder.svg"}
                      alt="Property analysis"
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="text-center"><>

                        <div className="font-bold text-green-600">
                          ${analysis.estimatedValue.current.toLocaleString()}
                        </div>
                        <div
</> className="text-gray-600">Current Value</div>
                      </div>
                      <div className="text-center"><>

                        <div className="font-bold text-blue-600">
                          ${analysis.estimatedValue.potential.toLocaleString()}
                        </div>
                        <div
</> className="text-gray-600">Potential Value</div>
                      </div>
                      <div className="text-center"><>

                        <div className="font-bold text-orange-600">
                          ${analysis.estimatedValue.repairCosts.toLocaleString()}
                        </div>
                        <div
</> className="text-gray-600">Repair Costs</div>
                      </div>
                    </div>
                  </div>

                  {/* Analysis Findings */}
                  <div className="lg:col-span-2 space-y-4">
                    <h4 className="font-semibold">Detailed Findings</h4>
                    {analysis.findings.map((finding /* , index */) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(finding.category)}
                            <span className="font-medium">{finding.category}</span>
                          </div>
                          <div className="flex items-center gap-2"><>

                            <Badge className={getConditionColor(finding.condition)}>
                              {finding.condition.toUpperCase()}
                            </Badge>
                            <span
</> className="text-sm text-gray-600">{finding.confidence}%</span>
                          </div>
                        </div><>


                        <p className="text-sm text-gray-700 mb-3">{finding.description}</p>

                        <div
</>><>

                          <div className="text-sm font-medium mb-1">Recommendations:</div>
                          <ul
</> className="text-sm text-gray-600 space-y-1">
                            {finding.recommendations.map((rec, recIndex) => (
                              <li key={recIndex} className="flex items-start gap-2">
                                <span className="text-blue-600 mt-1">•</span>
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <Button><>

                    <CheckCircle className="h-4 w-4 mr-2" />
                    Accept Analysis
                  </Button>
                  <Button
</> variant="outline"><>

                    <Eye className="h-4 w-4 mr-2" />
                    View Detailed Report
                  </Button>
                  <Button
</> variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Re-analyze
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader><>

              <CardTitle>Upload Property Images</CardTitle>
              <CardDescription
</>>Upload photos for AI-powered condition analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" /><>

                  <div className="text-lg font-medium mb-2">Drop images here or click to upload</div>
                  <div
</> className="text-sm text-gray-600 mb-4">
                    Supports JPG, PNG, HEIC • Max 10MB per image • Up to 20 images
                  </div>
                  <Button>
                    <Camera className="h-4 w-4 mr-2" />
                    Select Images
                  </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2">
                    <Home className="h-6 w-6" />
                    <span className="text-xs">Front Exterior</span>
                  </Button>
                  <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2">
                    <Home className="h-6 w-6" />
                    <span className="text-xs">Rear Exterior</span>
                  </Button>
                  <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2">
                    <Shield className="h-6 w-6" />
                    <span className="text-xs">Roof Detail</span>
                  </Button>
                  <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2">
                    <Wrench className="h-6 w-6" />
                    <span className="text-xs">Foundation</span>
                  </Button>
                </div>

                <Alert>
                  <Warning className="h-4 w-4" /><>

                  <AlertTitle>Best Practices for Accurate Analysis</AlertTitle>
                  <AlertDescription
</>>
                    <ul className="mt-2 space-y-1 text-sm"><>

                      <li>• Take photos in good lighting conditions</li>
                            <li
</>>• Capture multiple angles of each building component</li><>

                      <li>• Include close-up shots of any visible damage</li>
                            <li
</>>• Ensure images are in focus and not blurry</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><>

                <CardTitle>Active CV Models</CardTitle>
                <CardDescription
</>>Computer vision models currently in use</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: "RoofNet Pro", accuracy: 96.2, specialty: "Roof condition analysis" },
                    { name: "SidingVision", accuracy: 94.8, specialty: "Exterior siding assessment" },
                    { name: "FoundationAI", accuracy: 91.3, specialty: "Foundation crack detection" },
                    { name: "WindowScope", accuracy: 97.1, specialty: "Window condition evaluation" },
                  ].map((model /* , index */) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                      <div><>

                        <div className="font-medium">{model.name}</div>
                        <div
</> className="text-sm text-gray-600">{model.specialty}</div>
                      </div>
                      <div className="text-right"><>

                        <div className="font-bold text-green-600">{model.accuracy}%</div>
                        <div
</> className="text-xs text-gray-500">Accuracy</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><>

                <CardTitle>Processing Statistics</CardTitle>
                <CardDescription
</>>Real-time analysis performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 border rounded-lg"><>

                      <div className="text-2xl font-bold text-blue-600">1,247</div>
                      <div
</> className="text-sm text-gray-600">Images Analyzed Today</div>
                    </div>
                    <div className="text-center p-3 border rounded-lg"><>

                      <div className="text-2xl font-bold text-green-600">2.1s</div>
                      <div
</> className="text-sm text-gray-600">Avg Processing Time</div>
                    </div>
                  </div>
                  <div className="text-center p-3 border rounded-lg"><>

                    <div className="text-2xl font-bold text-purple-600">94.7%</div>
                    <div
</> className="text-sm text-gray-600">Overall Accuracy Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader><>

              <CardTitle>Analysis Settings</CardTitle>
              <CardDescription
</>>Configure computer vision analysis parameters</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div><>

                  <label className="text-sm font-medium">Confidence Threshold</label>
                  <div
</> className="mt-2">
                    <Progress value={85} className="w-full" />
                    <div className="flex justify-between text-xs text-gray-600 mt-1"><>

                      <span>Low (70%)</span>
                      <span
</>>Current: 85%</span>
                      <span>High (95%)</span>
                    </div>
                  </div>
                </div>

                <div><>

                  <label className="text-sm font-medium">Analysis Depth</label>
                  <select
</> className="w-full mt-1 p-2 border rounded-md"><>

                    <option value="standard">Standard Analysis</option>
                    <option
</> value="detailed">Detailed Analysis</option>
                    <option value="comprehensive">Comprehensive Analysis</option>
                  </select>
                </div>

                <div><>

                  <label className="text-sm font-medium">Auto-processing</label>
                  <div
</> className="mt-2 space-y-2">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked />
                      <span className="text-sm">Process images automatically on upload</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked />
                      <span className="text-sm">Generate condition reports automatically</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" />
                      <span className="text-sm">Send alerts for critical findings</span>
                    </label>
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
