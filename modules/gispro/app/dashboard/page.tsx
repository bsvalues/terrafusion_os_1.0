"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RealTimeDashboard } from "@/components/real-time-dashboard"
import { PropertySearch } from "@/components/property-search"
import { PropertyAgent } from "@/components/property-agent"
import { SacredGeometry } from "@/components/sacred-geometry"
import { MarketAnalysis } from "@/components/market-analysis"
// Add new import for BentonCountyGisViewer
import { BentonCountyGisViewer } from "@/components/benton-county-gis-viewer"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8"><>

          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            GAMA Professional Dashboard
          </h1>
          <p
</> className="text-xl text-gray-600 mt-2">Advanced Property Analysis & Market Intelligence Platform</p>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          {/* Update TabsList to include the new tab, adjust grid-cols accordingly */}
          <TabsList className="grid grid-cols-6 w-full"><>

            <TabsTrigger value="dashboard">Live Dashboard</TabsTrigger>
            <TabsTrigger
</> value="search">Property Search</TabsTrigger><>

            <TabsTrigger value="agent">AI Agent</TabsTrigger>
            <TabsTrigger
</> value="geometry">Sacred Geometry</TabsTrigger>
            <TabsTrigger value="market">Market Analysis</TabsTrigger>
            {/* Add new TabsTrigger for Benton County GIS */}
            <TabsTrigger value="benton-gis">Benton GIS</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard"><>

            <RealTimeDashboard />
          </TabsContent>

          <TabsContent
</> value="search"><>

            <PropertySearch />
          </TabsContent>

          <TabsContent
</> value="agent"><>

            <PropertyAgent />
          </TabsContent>

          <TabsContent
</> value="geometry"><>

            <SacredGeometry />
          </TabsContent>

          <TabsContent
</> value="market">
            <MarketAnalysis />
          </TabsContent>

          {/* Add new TabsContent for Benton County GIS */}
          <TabsContent value="benton-gis">
            <BentonCountyGisViewer />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
