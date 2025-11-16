"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdvancedAnalytics } from "@/components/advanced-analytics"
import { IntegrationHub } from "@/components/integration-hub"

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8"><>

          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            GAMA Analytics Center
          </h1>
          <p
</>
className="text-xl text-gray-600 mt-2">Advanced AI Analytics & External Data Integration Platform</p>
        </div>

        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto"><>

            <TabsTrigger value="analytics">Advanced Analytics</TabsTrigger>
            <TabsTrigger
</>
value="integrations">Integration Hub</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics"><>

            <AdvancedAnalytics />
          </TabsContent>

          <TabsContent
</>
value="integrations">
            <IntegrationHub />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
