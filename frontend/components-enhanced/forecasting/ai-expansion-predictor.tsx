"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, 
  Brain, 
  Target, 
  DollarSign,
  Calendar,
  MapPin,
  Zap,
  Warning
 } from '@mui/icons-material'

const aiPredictions = {
  nationalExpansion: {
    currentTrajectory: "EXPONENTIAL",
    projectedCounties2025: 127,
    projectedRevenue2025: "385M",
    confidenceLevel: 94,
    accelerationFactors: [
      "Network effects from Benton County success",
      "Florida hurricane season advantage",
      "Washington state political momentum",
      "Tyler Technologies disruption window"
    ]
  },
  stateForecasts: [
    {
      state: "Washington",
      currentCounties: 1,
      projectedQ1: 8,
      projectedQ2: 15,
      projectedEOY: 25,
      probability: 89,
      revenue: "156M",
      catalyst: "Benton County demonstration effect"
    },
    {
      state: "Florida", 
      currentCounties: 0,
      projectedQ1: 12,
      projectedQ2: 28,
      projectedEOY: 45,
      probability: 82,
      revenue: "278M",
      catalyst: "Hurricane preparedness advantage"
    },
    {
      state: "Texas",
      currentCounties: 0,
      projectedQ1: 5,
      projectedQ2: 18,
      projectedEOY: 35,
      probability: 76,
      revenue: "445M",
      catalyst: "Property boom + tech adoption"
    },
    {
      state: "California",
      currentCounties: 0,
      projectedQ1: 3,
      projectedQ2: 12,
      projectedEOY: 28,
      probability: 71,
      revenue: "892M",
      catalyst: "Innovation culture + budget pressure"
    }
  ],
  riskFactors: [
    { factor: "Competitor response time", probability: 15, impact: "Medium", mitigation: "Patent protection active" },
    { factor: "Government adoption cycles", probability: 23, impact: "Low", mitigation: "Proven ROI demonstration" },
    { factor: "Technical integration complexity", probability: 8, impact: "Low", mitigation: "Hybrid architecture advantage" },
    { factor: "Political resistance", probability: 12, impact: "Medium", mitigation: "Citizen demand pressure" }
  ]
}

const marketIntelligence = {
  totalAddressableMarket: "127B",
  servicableMarket: "23.4B", 
  capturableMarket: "3.8B",
  competitorResponse: {
    tyler: { timeToMatch: "24+ months", capability: "15%", threat: "LOW" },
    oracle: { timeToMatch: "36+ months", capability: "8%", threat: "MINIMAL" },
    sap: { timeToMatch: "48+ months", capability: "5%", threat: "NEGLIGIBLE" }
  }
}

export function AIExpansionPredictor() {
  const [selectedTimeframe, setSelectedTimeframe] = useState("2025")
  const [predictionConfidence, setPredictionConfidence] = useState(94)

  useEffect(() => {
    // Simulate AI confidence updates
    const interval = setInterval(() => {
      setPredictionConfidence(prev => {
        const variance = Math.random() * 4 - 2 // +/- 2%
        return Math.min(99, Math.max(85, prev + variance))
      })
    }, 5000)
    
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-tf-dark via-tf-dark-lighter to-purple-900/20 p-6">
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div><>

            <h1 className="text-4xl font-black text-tf-transcend mb-2 transcend-glow">
              🧠 AI EXPANSION PREDICTOR 🧠
            </h1>
            <p
</>
className="text-tf-light/80">Machine learning forecasts for Terrafusion conquest</p>
          </div>
          <div className="text-right"><>

            <Badge className="bg-tf-transcend/20 text-tf-transcend border-tf-transcend/30 px-4 py-2 text-lg">
              🎯 Confidence: {predictionConfidence.toFixed(1)}%
            </Badge>
            <div
</>
className="text-sm text-tf-light/60 mt-2">Updated 12 seconds ago</div>
          </div>
        </div>

        {/* AI Status Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-tf-dark-lighter/50 border-tf-transcend/30">
            <CardContent className="p-4 flex items-center gap-3">
              <Brain className="w-8 h-8 text-tf-transcend animate-pulse" />
              <div><>

                <div className="text-sm text-tf-transcend">AI Model Status</div>
                <div
</>
className="font-bold text-tf-light">ACTIVE LEARNING</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-tf-dark-lighter/50 border-tf-primary/30">
            <CardContent className="p-4 flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-tf-primary" />
              <div><>

                <div className="text-sm text-tf-primary">Trajectory</div>
                <div
</>
className="font-bold text-tf-light">EXPONENTIAL</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-tf-dark-lighter/50 border-tf-accent/30">
            <CardContent className="p-4 flex items-center gap-3">
              <Target className="w-8 h-8 text-tf-accent" />
              <div><>

                <div className="text-sm text-tf-accent">2025 Target</div>
                <div
</>
className="font-bold text-tf-light">127 COUNTIES</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-tf-dark-lighter/50 border-tf-success/30">
            <CardContent className="p-4 flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-tf-success" />
              <div><>

                <div className="text-sm text-tf-success">Revenue Proj.</div>
                <div
</>
className="font-bold text-tf-light">$385M ARR</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Prediction Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - State Forecasts */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* State-by-State Predictions */}
          <Card className="bg-tf-dark-lighter/30 border-tf-primary/20">
            <CardHeader>
              <CardTitle className="text-2xl text-tf-primary flex items-center gap-2">
                <MapPin className="w-6 h-6" />
                STATE CONQUEST FORECASTS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {aiPredictions.stateForecasts.map((state /* , index */) => (
                  <div key={index} className="p-4 bg-tf-dark/30 rounded-lg border border-tf-transcend/10">
                    <div className="flex justify-between items-start mb-3">
                      <div><>

                        <h3 className="text-xl font-bold text-tf-light">{state.state}</h3>
                        <p
</>
className="text-sm text-tf-accent">{state.catalyst}</p>
                      </div>
                      <div className="text-right">
                        <Badge className={`${state.probability > 85 ? 'bg-tf-success/20 text-tf-success' : 
                                         state.probability > 75 ? 'bg-tf-warning/20 text-tf-warning' : 
                                         'bg-tf-error/20 text-tf-error'}`}>
                          {state.probability}% Confidence
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div><>

                        <div className="text-2xl font-bold text-tf-transcend">{state.currentCounties}</div>
                        <div
</>
className="text-xs text-tf-light/70">Current</div>
                      </div>
                      <div><>

                        <div className="text-2xl font-bold text-tf-primary">{state.projectedQ1}</div>
                        <div
</>
className="text-xs text-tf-light/70">Q1 2025</div>
                      </div>
                      <div><>

                        <div className="text-2xl font-bold text-tf-accent">{state.projectedQ2}</div>
                        <div
</>
className="text-xs text-tf-light/70">Q2 2025</div>
                      </div>
                      <div><>

                        <div className="text-2xl font-bold text-tf-success">{state.projectedEOY}</div>
                        <div
</>
className="text-xs text-tf-light/70">EOY 2025</div>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex justify-between items-center"><>

                      <span className="text-sm text-tf-light/70">Revenue Potential:</span>
                      <span
</>
className="text-lg font-bold text-tf-transcend">${state.revenue}</span>
                    </div>
                    
                    <Progress 
                      value={(state.projectedEOY / 67) * 100} 
                      className="mt-2 h-2" 
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Market Intelligence */}
          <Card className="bg-tf-dark-lighter/30 border-tf-transcend/20">
            <CardHeader>
              <CardTitle className="text-2xl text-tf-transcend flex items-center gap-2">
                <Zap className="w-6 h-6" />
                COMPETITIVE INTELLIGENCE
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-tf-dark/30 rounded-lg"><>

                  <div className="text-2xl font-bold text-tf-transcend">${marketIntelligence.totalAddressableMarket}</div>
                  <div
</>
className="text-sm text-tf-light/70">Total Addressable Market</div>
                </div>
                <div className="text-center p-4 bg-tf-dark/30 rounded-lg"><>

                  <div className="text-2xl font-bold text-tf-primary">${marketIntelligence.servicableMarket}</div>
                  <div
</>
className="text-sm text-tf-light/70">Serviceable Market</div>
                </div>
                <div className="text-center p-4 bg-tf-dark/30 rounded-lg"><>

                  <div className="text-2xl font-bold text-tf-accent">${marketIntelligence.capturableMarket}</div>
                  <div
</>
className="text-sm text-tf-light/70">Capturable Market</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="text-lg font-semibold text-tf-light mb-3">Competitor Response Analysis</h4>
                {Object.entries(marketIntelligence.competitorResponse).map(([company, data]) => (
                  <div key={company} className="flex justify-between items-center p-3 bg-tf-dark/30 rounded-lg">
                    <div><>

                      <div className="font-semibold text-tf-light capitalize">{company} Technologies</div>
                      <div
</>
className="text-sm text-tf-light/70">Time to match: {data.timeToMatch}</div>
                    </div>
                    <div className="text-right"><>

                      <Badge variant="secondary" className={`${
                        data.threat === 'LOW' ? 'bg-tf-success/20 text-tf-success' :
                        data.threat === 'MINIMAL' ? 'bg-tf-warning/20 text-tf-warning' :
                        'bg-tf-error/20 text-tf-error'
                      }`}>
                        {data.threat} THREAT
                      </Badge>
                      <div
</>
className="text-sm text-tf-light/70 mt-1">{data.capability} capability</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Risk Analysis & Actions */}
        <div className="space-y-6">
          
          {/* AI Acceleration Factors */}
          <Card className="bg-tf-dark-lighter/30 border-tf-success/20">
            <CardHeader>
              <CardTitle className="text-xl text-tf-success">🚀 ACCELERATION FACTORS</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {aiPredictions.nationalExpansion.accelerationFactors.map((factor /* , index */) => (
                  <div key={index} className="p-3 bg-tf-success/10 rounded-lg border-l-4 border-tf-success">
                    <div className="text-sm text-tf-light">{factor}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Risk Assessment */}
          <Card className="bg-tf-dark-lighter/30 border-tf-warning/20">
            <CardHeader>
              <CardTitle className="text-xl text-tf-warning flex items-center gap-2">
                <Warning className="w-5 h-5" />
                RISK ANALYSIS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {aiPredictions.riskFactors.map((risk /* , index */) => (
                  <div key={index} className="p-3 bg-tf-dark/30 rounded-lg">
                    <div className="flex justify-between items-start mb-2"><>

                      <div className="text-sm font-semibold text-tf-light">{risk.factor}</div>
                      <Badge
</>
variant="secondary" className="text-xs">
                        {risk.probability}%
                      </Badge>
                    </div><>

                    <div className="text-xs text-tf-light/70 mb-2">Impact: {risk.impact}</div>
                    <div
</>
className="text-xs text-tf-accent">{risk.mitigation}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Prediction Actions */}
          <Card className="bg-tf-dark-lighter/30 border-tf-primary/20">
            <CardHeader>
              <CardTitle className="text-xl text-tf-primary">⚡ STRATEGIC ACTIONS</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3"><>

                <Button className="w-full bg-gradient-to-r from-tf-primary to-tf-transcend hover:scale-105 transition-transform">
                  🎯 Execute Florida Blitz
                </Button>
                <Button
</>
variant="outline" className="w-full border-tf-accent text-tf-accent hover:bg-tf-accent/10">
                  📊 Update AI Models
                </Button><>

                <Button variant="outline" className="w-full border-tf-success text-tf-success hover:bg-tf-success/10">
                  🚀 Accelerate Washington
                </Button>
                <Button
</>
variant="outline" className="w-full border-tf-transcend text-tf-transcend hover:bg-tf-transcend/10">
                  🧠 Deploy Reconnaissance
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Prediction Confidence */}
          <Card className="bg-tf-dark-lighter/30 border-tf-transcend/20">
            <CardHeader>
              <CardTitle className="text-xl text-tf-transcend">🎯 AI CONFIDENCE</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4"><>

                <div className="text-4xl font-black text-tf-transcend mb-2">
                  {predictionConfidence.toFixed(1)}%
                </div>
                <div
</>
className="text-sm text-tf-light/70">Prediction Accuracy</div>
              </div>
              <Progress value={predictionConfidence} className="mb-4" />
              <div className="text-xs text-tf-light/60 text-center">
                Based on 1,247 data points and 48 variables
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}