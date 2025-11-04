"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building2, Palette, Settings, Users, DollarSign, CheckCircle, Star, Shield, Zap  } from '@mui/icons-material'

export default function WhiteLabelSolutions() {
  const packages = [
    {
      name: "Essential",
      price: "$2,500/month",
      description: "Perfect for counties with 10,000-25,000 parcels",
      features: [
        "Custom branding & logo",
        "Basic assessment workflows",
        "Standard reporting",
        "Email support",
        "Mobile app access",
        "Basic integrations",
      ],
      limits: {
        parcels: "25,000",
        users: "10",
        storage: "100GB",
      },
      popular: false,
    },
    {
      name: "Professional",
      price: "$4,500/month",
      description: "Ideal for mid-size counties with 25,000-75,000 parcels",
      features: [
        "Full custom branding",
        "Advanced assessment workflows",
        "Custom reporting & analytics",
        "Priority phone support",
        "Mobile app with offline sync",
        "Premium integrations",
        "AI-powered valuations",
        "Predictive analytics",
      ],
      limits: {
        parcels: "75,000",
        users: "25",
        storage: "500GB",
      },
      popular: true,
    },
    {
      name: "Enterprise",
      price: "Custom pricing",
      description: "For large counties with 75,000+ parcels",
      features: [
        "Complete white-label solution",
        "Custom feature development",
        "Advanced AI & machine learning",
        "24/7 dedicated support",
        "Multi-platform deployment",
        "All integrations included",
        "Custom training programs",
        "SLA guarantees",
        "On-premise deployment option",
      ],
      limits: {
        parcels: "Unlimited",
        users: "Unlimited",
        storage: "Unlimited",
      },
      popular: false,
    },
  ]

  const successStories = [
    {
      county: "Jefferson County, CO",
      package: "Professional",
      results: {
        efficiency: "+45%",
        accuracy: "96.8%",
        savings: "$280K/year",
      },
      testimonial:
        "Terrafusion's white-label solution allowed us to maintain our brand identity while gaining cutting-edge assessment technology.",
      assessor: "Maria Rodriguez, County Assessor",
    },
    {
      county: "Polk County, FL",
      package: "Enterprise",
      results: {
        efficiency: "+60%",
        accuracy: "97.2%",
        savings: "$450K/year",
      },
      testimonial: "The custom features and dedicated support have transformed our assessment operations completely.",
      assessor: "David Thompson, Chief Appraiser",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
<>

        <h1 className="text-4xl font-bold">White-Label Assessment Solutions</h1>
        <p
</>

className="text-xl text-gray-600 max-w-3xl mx-auto">
          Empower smaller counties with enterprise-grade assessment technology under your own brand
        </p>
      </div>

      {/* Key Benefits */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Palette className="h-12 w-12 mx-auto mb-4 text-blue-600" />
<>

            <h3 className="font-semibold mb-2">Custom Branding</h3>
            <p
</>

className="text-sm text-gray-600">Your logo, colors, and brand identity throughout the platform</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Zap className="h-12 w-12 mx-auto mb-4 text-green-600" />
<>

            <h3 className="font-semibold mb-2">Rapid Deployment</h3>
            <p
</>

className="text-sm text-gray-600">Go live in 30-60 days with pre-configured workflows</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <DollarSign className="h-12 w-12 mx-auto mb-4 text-purple-600" />
<>

            <h3 className="font-semibold mb-2">Cost Effective</h3>
            <p
</>

className="text-sm text-gray-600">Enterprise features at a fraction of custom development cost</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-orange-600" />
<>

            <h3 className="font-semibold mb-2">Proven Platform</h3>
            <p
</>

className="text-sm text-gray-600">Battle-tested technology used by counties nationwide</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="packages" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
<>

          <TabsTrigger value="packages">Packages</TabsTrigger>
          <TabsTrigger
</>

value="features">Features</TabsTrigger>
          <TabsTrigger value="success">Success Stories</TabsTrigger>
        </TabsList>

        <TabsContent value="packages" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <Card key={pkg.name} className={`relative ${pkg.popular ? "border-blue-500 border-2" : ""}`}>
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-500 text-white">
                      <Star className="h-3 w-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center">
<>

                  <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                  <div
</>

className="text-3xl font-bold text-blue-600">{pkg.price}</div>
                  <CardDescription>{pkg.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    {pkg.features.map((feature /* , index */) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4">
<>

                    <h4 className="font-medium mb-2">Package Limits</h4>
                    <div
</>

className="space-y-1 text-sm text-gray-600">
                      <div className="flex justify-between">
<>

                        <span>Max Parcels:</span>
                        <span
</>

className="font-medium">{pkg.limits.parcels}</span>
                      </div>
                      <div className="flex justify-between">
<>

                        <span>Max Users:</span>
                        <span
</>

className="font-medium">{pkg.limits.users}</span>
                      </div>
                      <div className="flex justify-between">
<>

                        <span>Storage:</span>
                        <span
</>

className="font-medium">{pkg.limits.storage}</span>
                      </div>
                    </div>
                  </div>

                  <Button className={`w-full ${pkg.popular ? "bg-blue-600 hover:bg-blue-700" : ""}`}>
                    {pkg.name === "Enterprise" ? "Contact Sales" : "Get Started"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Core Assessment Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    "Property search & management",
                    "Assessment workflows",
                    "Appeals processing",
                    "Tax roll generation",
                    "Compliance reporting",
                    "Audit trails",
                    "Document management",
                    "Notification system",
                  ].map((feature /* , index */) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Customization Options
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    "Custom logo & branding",
                    "Color scheme matching",
                    "Custom domain name",
                    "Personalized login page",
                    "Custom email templates",
                    "Branded mobile apps",
                    "Custom report headers",
                    "White-label documentation",
                  ].map((feature /* , index */) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Advanced Capabilities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    "AI-powered valuations",
                    "Predictive analytics",
                    "Mobile field assessment",
                    "GIS integration",
                    "MLS data connectivity",
                    "State system integration",
                    "Public portal access",
                    "API access",
                  ].map((feature /* , index */) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-purple-500" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Support & Training
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    "Implementation support",
                    "Data migration assistance",
                    "Staff training programs",
                    "Ongoing technical support",
                    "Regular system updates",
                    "Performance monitoring",
                    "Best practices guidance",
                    "User community access",
                  ].map((feature /* , index */) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-orange-500" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="success" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {successStories.map((story /* , index */) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
<>

                    <span>{story.county}</span>
                    <Badge
</>

className="bg-blue-100 text-blue-800">{story.package}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
<>

                      <div className="text-2xl font-bold text-green-600">{story.results.efficiency}</div>
                      <div
</>

className="text-xs text-gray-600">Efficiency Gain</div>
                    </div>
                    <div>
<>

                      <div className="text-2xl font-bold text-blue-600">{story.results.accuracy}</div>
                      <div
</>

className="text-xs text-gray-600">Accuracy Rate</div>
                    </div>
                    <div>
<>

                      <div className="text-2xl font-bold text-purple-600">{story.results.savings}</div>
                      <div
</>

className="text-xs text-gray-600">Annual Savings</div>
                    </div>
                  </div>
<>

                  <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-700">
                    "{story.testimonial}"
                  </blockquote>

                  <div
</>

className="text-sm text-gray-600">— {story.assessor}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
<>

              <CardTitle>Implementation Timeline</CardTitle>
              <CardDescription
</>

</>>Typical deployment schedule for white-label solutions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
<>

                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div
</>

</>>
<>

                    <div className="font-medium">Discovery & Planning (Week 1-2)</div>
                    <div
</>

className="text-sm text-gray-600">
                      Requirements gathering, branding guidelines, data assessment
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
<>

                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div
</>

</>>
<>

                    <div className="font-medium">Customization & Setup (Week 3-6)</div>
                    <div
</>

className="text-sm text-gray-600">
                      Brand application, system configuration, integration setup
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
<>

                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <div
</>

</>>
<>

                    <div className="font-medium">Data Migration (Week 7-8)</div>
                    <div
</>

className="text-sm text-gray-600">Historical data import, validation, testing</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
<>

                  <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold">
                    4
                  </div>
                  <div
</>

</>>
<>

                    <div className="font-medium">Training & Go-Live (Week 9-10)</div>
                    <div
</>

className="text-sm text-gray-600">Staff training, system testing, production launch</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Call to Action */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardContent className="p-8 text-center">
<>

          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Assessment Operations?</h2>
          <p
</>

className="text-xl mb-6 opacity-90">
            Join the growing network of counties using TerraFusionAssessor white-label solutions
          </p>
          <div className="flex gap-4 justify-center">
<>

            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
              Schedule Demo
            </Button>
            <Button
</>

size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
              Download Brochure
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
