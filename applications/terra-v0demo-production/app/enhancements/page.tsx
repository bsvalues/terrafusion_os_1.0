import ComputerVisionAnalysis from "@/components/computer-vision-analysis"
import SatelliteImageryIntegration from "@/components/satellite-imagery-integration"
import ARFieldAssessment from "@/components/ar-field-assessment"
import VoiceDocumentation from "@/components/voice-documentation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function EnhancementsPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8"><>

        <h1 className="text-4xl font-bold mb-2">Terrafusion Advanced Enhancements</h1>
        <p
</> className="text-xl text-gray-600">Next-generation AI and mobile capabilities</p>
      </div>

      <Tabs defaultValue="computer-vision" className="w-full">
        <TabsList className="grid w-full grid-cols-4"><>

          <TabsTrigger value="computer-vision">Computer Vision</TabsTrigger>
          <TabsTrigger
</> value="satellite">Satellite Imagery</TabsTrigger><>

          <TabsTrigger value="ar-assessment">AR Assessment</TabsTrigger>
          <TabsTrigger
</> value="voice-docs">Voice Documentation</TabsTrigger>
        </TabsList>

        <TabsContent value="computer-vision"><>

          <ComputerVisionAnalysis />
        </TabsContent>

        <TabsContent
</> value="satellite"><>

          <SatelliteImageryIntegration />
        </TabsContent>

        <TabsContent
</> value="ar-assessment"><>

          <ARFieldAssessment />
        </TabsContent>

        <TabsContent
</> value="voice-docs">
          <VoiceDocumentation />
        </TabsContent>
      </Tabs>
    </div>
  )
}
