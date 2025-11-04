"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search,
  MapPin,
  Database,
  Building,
  Globe,
  Zap,
  CheckCircle,
  Download,
  Star,
  Users,
  Shield,
 } from '@mui/icons-material'

interface Integration {
  id: string
  name: string
  category: "gis" | "mls" | "state" | "financial" | "utility" | "other"
  description: string
  provider: string
  rating: number
  installs: number
  price: "free" | "paid" | "enterprise"
  status: "available" | "installed" | "pending"
  features: string[]
  icon: any
}

export default function IntegrationMarketplace() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  const integrations: Integration[] = [
    {
      id: "esri-arcgis",
      name: "Esri ArcGIS Integration",
      category: "gis",
      description: "Complete GIS integration with parcel mapping, spatial analysis, and geocoding services",
      provider: "Esri Inc.",
      rating: 4.8,
      installs: 1247,
      price: "enterprise",
      status: "installed",
      features: ["Parcel Mapping", "Spatial Analysis", "Geocoding", "Layer Management"],
      icon: MapPin,
    },
    {
      id: "mls-connector",
      name: "MLS Data Connector",
      category: "mls",
      description: "Real-time access to Multiple Listing Service data for comparable sales analysis",
      provider: "MLS Grid",
      rating: 4.6,
      installs: 892,
      price: "paid",
      status: "installed",
      features: ["Sales Comparables", "Market Trends", "Property History", "Real-time Updates"],
      icon: Building,
    },
    {
      id: "wa-state-dor",
      name: "Washington State DOR",
      category: "state",
      description: "Direct integration with Washington State Department of Revenue systems",
      provider: "WA State DOR",
      rating: 4.9,
      installs: 156,
      price: "free",
      status: "installed",
      features: ["Tax Roll Submission", "Compliance Reporting", "State Forms", "Audit Support"],
      icon: Shield,
    },
    {
      id: "corelogic-avm",
      name: "CoreLogic AVM Suite",
      category: "financial",
      description: "Advanced automated valuation models and market analytics",
      provider: "CoreLogic",
      rating: 4.4,
      installs: 2341,
      price: "enterprise",
      status: "available",
      features: ["AVM Models", "Market Analytics", "Risk Assessment", "Forecasting"],
      icon: Database,
    },
    {
      id: "google-earth",
      name: "Google Earth Engine",
      category: "gis",
      description: "Satellite imagery and aerial photography for property analysis",
      provider: "Google",
      rating: 4.7,
      installs: 3456,
      price: "paid",
      status: "available",
      features: ["Satellite Imagery", "Historical Views", "Change Detection", "Measurement Tools"],
      icon: Globe,
    },
    {
      id: "utility-connect",
      name: "Utility Data Connect",
      category: "utility",
      description: "Integration with local utility companies for property usage data",
      provider: "UtilityAPI",
      rating: 4.2,
      installs: 567,
      price: "paid",
      status: "pending",
      features: ["Usage Data", "Service History", "Billing Integration", "Efficiency Metrics"],
      icon: Zap,
    },
  ]

  const filteredIntegrations = integrations.filter((integration) => {
    const matchesSearch =
      integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      integration.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || integration.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "gis":
        return "bg-blue-100 text-blue-800"
      case "mls":
        return "bg-green-100 text-green-800"
      case "state":
        return "bg-purple-100 text-purple-800"
      case "financial":
        return "bg-orange-100 text-orange-800"
      case "utility":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriceColor = (price: string) => {
    switch (price) {
      case "free":
        return "bg-green-100 text-green-800"
      case "paid":
        return "bg-blue-100 text-blue-800"
      case "enterprise":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "installed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "available":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "installed":
        return <CheckCircle className="h-4 w-4" />
      case "pending":
        return <Download className="h-4 w-4" />
      case "available":
        return <Download className="h-4 w-4" />
      default:
        return <Download className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><>

          <h1 className="text-3xl font-bold">Integration Marketplace</h1>
          <p
</> className="text-gray-600">Connect TerraFusionAssessor with external systems and data sources</p>
        </div>
        <Button>
          <Building className="h-4 w-4 mr-2" />
          Request Integration
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search integrations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              className="px-3 py-2 border rounded-md"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            ><>

              <option value="all">All Categories</option>
              <option
</> value="gis">GIS & Mapping</option><>

              <option value="mls">MLS & Real Estate</option>
              <option
</> value="state">State Systems</option><>

              <option value="financial">Financial & Analytics</option>
              <option
</> value="utility">Utilities</option>
              <option value="other">Other</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Integration Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="text-right"><>

                <div className="text-2xl font-bold">{integrations.filter((i) => i.status === "installed").length}</div>
                <div
</> className="text-sm text-gray-600">Installed</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Database className="h-8 w-8 text-blue-600" />
              <div className="text-right"><>

                <div className="text-2xl font-bold">{integrations.length}</div>
                <div
</> className="text-sm text-gray-600">Available</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Users className="h-8 w-8 text-purple-600" />
              <div className="text-right"><>

                <div className="text-2xl font-bold">
                  {integrations.reduce((sum, i) => sum + i.installs, 0).toLocaleString()}
                </div>
                <div
</> className="text-sm text-gray-600">Total Installs</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Star className="h-8 w-8 text-yellow-600" />
              <div className="text-right"><>

                <div className="text-2xl font-bold">
                  {(integrations.reduce((sum, i) => sum + i.rating, 0) / integrations.length).toFixed(1)}
                </div>
                <div
</> className="text-sm text-gray-600">Avg Rating</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4"><>

          <TabsTrigger value="all">All Integrations</TabsTrigger>
          <TabsTrigger
</> value="installed">Installed</TabsTrigger><>

          <TabsTrigger value="featured">Featured</TabsTrigger>
          <TabsTrigger
</> value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredIntegrations.map((integration) => (
              <Card key={integration.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3"><>

                      <integration.icon className="h-6 w-6" />
                      {integration.name}
                    </div>
                    <Badge
</> className={getStatusColor(integration.status)}>
                      {getStatusIcon(integration.status)}
                      <span className="ml-1">{integration.status.toUpperCase()}</span>
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    <div className="flex items-center gap-2 mb-2"><>

                      <Badge className={getCategoryColor(integration.category)}>
                        {integration.category.toUpperCase()}
                      </Badge>
                      <Badge
</> className={getPriceColor(integration.price)}>{integration.price.toUpperCase()}</Badge>
                    </div>
                    {integration.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="font-medium">{integration.rating}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span>{integration.installs.toLocaleString()} installs</span>
                      </div>
                      <div className="text-gray-600">by {integration.provider}</div>
                    </div>

                    <div><>

                      <div className="text-sm font-medium mb-2">Key Features</div>
                      <div
</> className="flex flex-wrap gap-1">
                        {integration.features.map((feature /* , index */) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {integration.status === "installed" ? (
                        <><>

                          <Button size="sm" variant="outline" className="flex-1">
                            Configure
                          </Button>
                          <Button
</> size="sm" variant="outline">
                            Uninstall
                          </Button>
                        </>
                      ) : integration.status === "pending" ? (
                        <Button size="sm" disabled className="flex-1">
                          Installing...
                        </Button>
                      ) : (
                        <>
                          <Button size="sm" className="flex-1"><>

                            <Download className="h-4 w-4 mr-2" />
                            Install
                          </Button>
                          <Button
</> size="sm" variant="outline">
                            Learn More
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="installed" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {integrations
              .filter((integration) => integration.status === "installed")
              .map((integration) => (
                <Card key={integration.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <integration.icon className="h-6 w-6" />
                      {integration.name}
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        ACTIVE
                      </Badge>
                    </CardTitle>
                    <CardDescription>{integration.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><>

                          <div className="font-medium">Status</div>
                          <div
</> className="text-green-600">Connected</div>
                        </div>
                        <div><>

                          <div className="font-medium">Last Sync</div>
                          <div
</>>2 hours ago</div>
                        </div>
                      </div>

                      <div className="flex gap-2"><>

                        <Button size="sm" variant="outline" className="flex-1">
                          Settings
                        </Button>
                        <Button
</> size="sm" variant="outline">
                          View Logs
                        </Button>
                        <Button size="sm" variant="outline">
                          Test Connection
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="featured" className="space-y-4">
          <Card>
            <CardHeader><>

              <CardTitle>Featured Integration: AI-Powered Market Analytics</CardTitle>
              <CardDescription
</>>
                Advanced machine learning models for property valuation and market trend analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center"><>

                    <div className="text-2xl font-bold text-blue-600">95.7%</div>
                    <div
</> className="text-sm text-gray-600">Accuracy Rate</div>
                  </div>
                  <div className="text-center"><>

                    <div className="text-2xl font-bold text-green-600">$2.1M</div>
                    <div
</> className="text-sm text-gray-600">Savings Generated</div>
                  </div>
                  <div className="text-center"><>

                    <div className="text-2xl font-bold text-purple-600">50%</div>
                    <div
</> className="text-sm text-gray-600">Time Reduction</div>
                  </div>
                </div>

                <Button className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Install AI Market Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: "GIS & Mapping", icon: MapPin, count: 8, color: "bg-blue-100 text-blue-800" },
              { name: "MLS & Real Estate", icon: Building, count: 5, color: "bg-green-100 text-green-800" },
              { name: "State Systems", icon: Shield, count: 12, color: "bg-purple-100 text-purple-800" },
              { name: "Financial & Analytics", icon: Database, count: 15, color: "bg-orange-100 text-orange-800" },
              { name: "Utilities", icon: Zap, count: 6, color: "bg-yellow-100 text-yellow-800" },
              { name: "Other", icon: Globe, count: 9, color: "bg-gray-100 text-gray-800" },
            ].map((category) => (
              <Card key={category.name} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <category.icon className="h-12 w-12 mx-auto mb-4 text-gray-600" /><>

                  <h3 className="font-semibold mb-2">{category.name}</h3>
                  <Badge
</> className={category.color}>{category.count} integrations</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
