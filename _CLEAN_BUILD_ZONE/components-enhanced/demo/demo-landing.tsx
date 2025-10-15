"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { terraFusionBrand } from "@/lib/brand"
import { Play, Monitor, Users, Shield, Zap, ArrowRight, Clock, CheckCircle  } from '@mui/icons-material'
import Link from "next/link"

const demoScenarios = [
  {
    id: "county-admin",
    title: "County Administrator",
    description: "Experience the executive dashboard with real-time county operations overview",
    duration: "5 min",
    features: ["Revenue Analytics", "Module Overview", "Performance Metrics"],
    color: "tf-primary",
    icon: Monitor,
  },
  {
    id: "assessor",
    title: "Property Assessor",
    description: "See CostForge AI process 1,000+ property valuations in seconds",
    duration: "3 min",
    features: ["AI Valuations", "Batch Processing", "Accuracy Reports"],
    color: "tf-accent",
    icon: Zap,
  },
  {
    id: "citizen-services",
    title: "Citizen Services",
    description: "Walk through the citizen portal and permit application process",
    duration: "4 min",
    features: ["Service Requests", "Permit Tracking", "Public Records"],
    color: "tf-success",
    icon: Users,
  },
  {
    id: "it-director",
    title: "IT Director",
    description: "Explore security features, compliance reporting, and system monitoring",
    duration: "6 min",
    features: ["Security Dashboard", "Audit Logs", "Compliance Reports"],
    color: "tf-error",
    icon: Shield,
  },
]

export function DemoLanding() {
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-gradient-to-br from-tf-dark via-tf-dark-lighter to-tf-dark text-tf-light">
      {/* Header */}
      <header className="border-b border-tf-primary/20 bg-tf-dark/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg clarity-gradient flex items-center justify-center">
                <span className="text-white font-bold text-sm">TF</span>
              </div>
              <div><>

                <h1 className="font-heading font-bold text-lg">Terrafusion OS Demo</h1>
                <p
</>
className="text-xs text-tf-light/70">{terraFusionBrand.essence}</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-tf-transcend/20 text-tf-transcend border-tf-transcend/30">
              Interactive Demo
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center space-y-8 mb-16">
          <div className="space-y-4">
            <h2 className="text-5xl md:text-6xl font-heading font-bold">
              Experience <span className="text-tf-transcend">Transcendence</span>
            </h2>
            <p className="text-xl text-tf-light/80 max-w-3xl mx-auto">
              See how Terrafusion OS transforms county government operations. Choose your role and explore real
              scenarios with live data.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <div className="flex items-center gap-2 bg-tf-dark-lighter/50 px-4 py-2 rounded-full border border-tf-success/20">
              <CheckCircle className="w-4 h-4 text-tf-success" />
              <span className="text-sm">No Installation Required</span>
            </div>
            <div className="flex items-center gap-2 bg-tf-dark-lighter/50 px-4 py-2 rounded-full border border-tf-primary/20">
              <Clock className="w-4 h-4 text-tf-primary" />
              <span className="text-sm">3-6 Minutes Per Demo</span>
            </div>
            <div className="flex items-center gap-2 bg-tf-dark-lighter/50 px-4 py-2 rounded-full border border-tf-transcend/20">
              <Shield className="w-4 h-4 text-tf-transcend" />
              <span className="text-sm">Real County Data</span>
            </div>
          </div>
        </div>

        {/* Demo Scenarios */}
        <div className="space-y-8">
          <div className="text-center"><>

            <h3 className="text-2xl font-heading font-bold mb-2">Choose Your Experience</h3>
            <p
</>
className="text-tf-light/70">Select a role to see Terrafusion from their perspective</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {demoScenarios.map((scenario) => {
              const Icon = scenario.icon
              const isSelected = selectedScenario === scenario.id

              return (
                <Card
                  key={scenario.id}
                  className={`transcend-glow cursor-pointer transition-all duration-300 ${
                    isSelected ? "ring-2 ring-tf-transcend scale-105" : "hover:scale-102"
                  } bg-tf-dark-lighter border-tf-primary/20`}
                  onClick={() => setSelectedScenario(scenario.id)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-lg bg-${scenario.color}/10 border border-${scenario.color}/20`}><>

                          <Icon className={`w-6 h-6 text-${scenario.color}`} />
                        </div>
                        <div
</>
</>><>

                          <CardTitle className="text-tf-light">{scenario.title}</CardTitle>
                          <div
</>
className="flex items-center gap-2 mt-1"><>

                            <Badge variant="secondary" className="text-xs">
                              {scenario.duration}
                            </Badge>
                            <span
</>
className="text-xs text-tf-light/60">Interactive Demo</span>
                          </div>
                        </div>
                      </div>
                      {isSelected && <CheckCircle className="w-5 h-5 text-tf-transcend" />}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4"><>

                    <p className="text-sm text-tf-light/80">{scenario.description}</p>

                    <div
</>
className="space-y-2"><>

                      <p className="text-xs font-medium text-tf-light/90">Featured Capabilities:</p>
                      <div
</>
className="flex flex-wrap gap-2">
                        {scenario.features.map((feature /* , index */) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs bg-tf-primary/10 text-tf-primary border-tf-primary/20"
                          >
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Launch Demo Button */}
          {selectedScenario && (
            <div className="text-center space-y-4">
              <div className="p-6 bg-tf-dark-lighter/50 rounded-lg border border-tf-transcend/20 max-w-md mx-auto">
                <p className="text-sm text-tf-light/80 mb-4">
                  Ready to experience{" "}
                  <span className="font-semibold text-tf-transcend">
                    {demoScenarios.find((s) => s.id === selectedScenario)?.title}
                  </span>{" "}
                  workflow?
                </p>
                <Link href="/demo/dashboard">
                  <Button
                    size="lg"
                    className="w-full bg-tf-transcend hover:bg-tf-transcend/90 text-tf-dark font-semibold transcend-glow"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Launch Interactive Demo
                  </Button>
                </Link>
              </div>

              <p className="text-xs text-tf-light/60">
                Demo includes sample Madison County data • All interactions are simulated • No real data is processed
              </p>
            </div>
          )}
        </div>

        {/* Features Preview */}
        <div className="mt-20 space-y-8">
          <div className="text-center"><>

            <h3 className="text-2xl font-heading font-bold mb-2">What You'll Experience</h3>
            <p
</>
className="text-tf-light/70">Real workflows, real data, real transcendence</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-tf-primary/10 border border-tf-primary/20 flex items-center justify-center mx-auto"><>

                <Zap className="w-6 h-6 text-tf-primary" />
              </div>
              <h4
</>
className="font-heading font-semibold text-tf-light">Lightning Speed</h4>
              <p className="text-sm text-tf-light/70">
                Watch CostForge AI process 1,000+ property valuations in under 10 seconds
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-tf-accent/10 border border-tf-accent/20 flex items-center justify-center mx-auto"><>

                <Users className="w-6 h-6 text-tf-accent" />
              </div>
              <h4
</>
className="font-heading font-semibold text-tf-light">Citizen-First Design</h4>
              <p className="text-sm text-tf-light/70">
                Experience the citizen portal that makes government services feel like modern apps
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-tf-success/10 border border-tf-success/20 flex items-center justify-center mx-auto"><>

                <Shield className="w-6 h-6 text-tf-success" />
              </div>
              <h4
</>
className="font-heading font-semibold text-tf-light">Enterprise Security</h4>
              <p className="text-sm text-tf-light/70">
                See SOC 2 Type II compliance in action with real-time audit trails and monitoring
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-20 text-center space-y-6">
          <div className="p-8 bg-gradient-to-r from-tf-primary/10 via-tf-transcend/10 to-tf-accent/10 rounded-lg border border-tf-primary/20"><>

            <h3 className="text-2xl font-heading font-bold mb-4">Ready to Transcend Your County?</h3>
            <p
</>
className="text-tf-light/80 mb-6 max-w-2xl mx-auto">
              After experiencing the demo, schedule a personalized consultation to see how Terrafusion OS can transform
              your specific county operations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center"><>

              <Button size="lg" className="bg-tf-primary hover:bg-tf-primary-dark text-white px-8">
                Schedule Consultation
              </Button>
              <Button
</>

                variant="outline"
                size="lg"
                className="border-tf-transcend text-tf-transcend hover:bg-tf-transcend hover:text-tf-dark bg-transparent px-8"
              >
                Download Brochure
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
