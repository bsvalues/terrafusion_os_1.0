"use client"

import type React from "react" // Ensure React is imported if not already
import { useState, useEffect } from "react" // Added useEffect for listener

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Server,
  Database,
  Brain,
  Shield,
  Activity,
  Globe,
  Zap,
  GitBranch,
  Code,
  Layers,
  Network,
  Terminal,
  UploadCloud,
  CheckCircle,
  Warning,
 } from '@mui/icons-material'
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert" // Added Alert
import { ScrollArea } from "@/components/ui/scroll-area" // Added ScrollArea

async function runPythonTestScript() {
  if (window.electronAPI && typeof window.electronAPI.runTestPropertyAgent === "function") {
    try {
      console.log("Attempting to run Python script via Electron IPC...")
      const result = await window.electronAPI.runTestPropertyAgent()
      console.log("Python Script Result:", result)
      alert(
        "Python script executed. Check Electron console for output.\nOutput snippet:\n" +
          (result.output ? result.output.substring(0, 500) + "..." : "No output from script."),
      )
    } catch (error: any) {
      console.error("Error running Python script:", error)
      alert("Error running Python script: " + (error.error || error.message || "Unknown error"))
    }
  } else {
    alert("Electron API for running Python script not available. This button works in the Electron app.")
    console.warn("window.electronAPI.runTestPropertyAgent is not available.")
  }
}

export function SystemArchitecture() {
  const [isDeploying, setIsDeploying] = useState(false)
  const [deploymentLog, setDeploymentLog] = useState<string[]>([])
  const [deploymentResult, setDeploymentResult] = useState<{ success: boolean; url?: string; error?: string } | null>(
    null,
  )

  useEffect(() => {
    const handleLog = (message: string) => {
      setDeploymentLog((prevLogs) => [...prevLogs, message])
    }

    if (window.electronAPI && window.electronAPI.onDeploymentLog) {
      window.electronAPI.onDeploymentLog(handleLog)
    }

    return () => {
      if (window.electronAPI && window.electronAPI.removeDeploymentLogListener) {
        window.electronAPI.removeDeploymentLogListener(handleLog)
      }
    }
  }, [])

  const handleDeploy = async () => {
    if (window.electronAPI && typeof window.electronAPI.deployToVercel === "function") {
      setIsDeploying(true)
      setDeploymentLog([])
      setDeploymentResult(null)
      try {
        const result = await window.electronAPI.deployToVercel()
        setDeploymentResult(result)
        if (result.log) {
          // Ensure logs from result are also captured if not sent via onDeploymentLog
          const finalLogs = result.log.split("\n")
          setDeploymentLog((prev) => [...prev, ...finalLogs.filter((log) => !prev.includes(log))])
        }
      } catch (error: any) {
        setDeploymentResult({ success: false, error: error.message || "An unknown error occurred" })
        setDeploymentLog((prevLogs) => [...prevLogs, `IPC Error: ${error.message || "Unknown IPC error"}`])
      } finally {
        setIsDeploying(false)
      }
    } else {
      alert("Electron API for deployment not available. This button works in the Electron app.")
      console.warn("window.electronAPI.deployToVercel is not available.")
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><>

            <Layers className="h-5 w-5 text-indigo-600" />
            GAMA System Architecture
          </CardTitle>
          <CardDescription
</>>
            Comprehensive overview of the TerraFusionTheory system components and data flow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview">
            <TabsList className="grid grid-cols-4 mb-6"><>

              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger
</> value="components">Components</TabsTrigger><>

              <TabsTrigger value="dataflow">Data Flow</TabsTrigger>
              <TabsTrigger
</> value="deployment">Deployment</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              {/* ... existing overview content ... */}
              <div className="space-y-6">
                {/* Architecture Diagram */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Frontend Layer */}
                    <div className="space-y-3"><>

                      <h3 className="font-medium text-center">Frontend Layer</h3>
                      <div
</> className="space-y-2">
                        <ArchComponent
                          icon={<Globe className="h-4 w-4" />}
                          title="React SPA"
                          description="User interface with Three.js visualizations"
                        />
                        <ArchComponent
                          icon={<Code className="h-4 w-4" />}
                          title="TypeScript"
                          description="Type-safe development"
                        />
                        <ArchComponent
                          icon={<Zap className="h-4 w-4" />}
                          title="Next.js"
                          description="Full-stack React framework"
                        />
                      </div>
                    </div>

                    {/* Backend Layer */}
                    <div className="space-y-3"><>

                      <h3 className="font-medium text-center">Backend Layer</h3>
                      <div
</> className="space-y-2">
                        <ArchComponent
                          icon={<Server className="h-4 w-4" />}
                          title="Node.js API"
                          description="Next.js API Routes (Express-like)"
                        />
                        <ArchComponent
                          icon={<Brain className="h-4 w-4" />}
                          title="Python Agents"
                          description="AI/ML processing (can be called via Electron)"
                        />
                        <ArchComponent
                          icon={<Network className="h-4 w-4" />}
                          title="GraphQL (Optional)"
                          description="Flexible data queries"
                        />
                      </div>
                    </div>

                    {/* Data Layer */}
                    <div className="space-y-3"><>

                      <h3 className="font-medium text-center">Data Layer</h3>
                      <div
</> className="space-y-2">
                        <ArchComponent
                          icon={<Database className="h-4 w-4" />}
                          title="PostgreSQL"
                          description="Primary database with PostGIS"
                        />
                        <ArchComponent
                          icon={<Activity className="h-4 w-4" />}
                          title="Redis (Optional)"
                          description="Caching and sessions"
                        />
                        <ArchComponent
                          icon={<GitBranch className="h-4 w-4" />}
                          title="Message Queue (Optional)"
                          description="For async tasks with Python agents"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-center mt-4">
                  <Button onClick={runPythonTestScript} variant="outline">
                    <Terminal className="h-4 w-4 mr-2" />
                    Run Test Python Agent (Electron Only)
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Shield className="h-4 w-4 text-green-600" />
                        Security Features
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2"><>

                      <Badge variant="outline">JWT Authentication</Badge>
                      <Badge
</> variant="outline">Role-based Access Control</Badge><>

                      <Badge variant="outline">HTTPS (via Next.js server)</Badge>
                      <Badge
</> variant="outline">Rate Limiting (API routes)</Badge>
                      <Badge variant="outline">CORS Protection (API routes)</Badge>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Activity className="h-4 w-4 text-blue-600" />
                        Monitoring & Analytics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2"><>

                      <Badge variant="outline">Next.js Analytics</Badge>
                      <Badge
</> variant="outline">Custom Logging</Badge><>

                      <Badge variant="outline">Error Tracking (e.g., Sentry)</Badge>
                      <Badge
</> variant="outline">Performance Monitoring</Badge>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="components">
              {/* ... existing components content ... */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Frontend Components */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Frontend Components</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <ComponentDetail
                        name="Property Visualization"
                        tech="Three.js + React"
                        description="3D property models and sacred geometry patterns"
                      />
                      <ComponentDetail
                        name="Market Dashboard"
                        tech="React + Recharts"
                        description="Real-time market data visualization"
                      />
                      <ComponentDetail
                        name="User Interface"
                        tech="React + Tailwind + shadcn/ui"
                        description="Responsive design with modern UI components"
                      />
                      <ComponentDetail
                        name="State Management"
                        tech="React Context / Zustand (Optional)"
                        description="Application state management"
                      />
                    </CardContent>
                  </Card>

                  {/* Backend Components */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Backend Components (Next.js API)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <ComponentDetail
                        name="API Routes"
                        tech="Next.js API Handlers"
                        description="RESTful API for properties, analysis, market data"
                      />
                      <ComponentDetail
                        name="Authentication Service"
                        tech="Next.js API + JWT/bcryptjs"
                        description="User authentication and authorization"
                      />
                      <ComponentDetail
                        name="Database Interaction"
                        tech="Node-postgres / Prisma (Optional)"
                        description="Interaction with PostgreSQL"
                      />
                      <ComponentDetail
                        name="External API Integration"
                        tech="Next.js API (e.g., ArcGIS)"
                        description="Fetching data from third-party services"
                      />
                    </CardContent>
                  </Card>

                  {/* AI/ML Components */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">AI/ML Components (Python)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <ComponentDetail
                        name="Property Agent"
                        tech="Python + (e.g., TensorFlow, Scikit-learn)"
                        description="Property valuation and analysis (run via Electron IPC)"
                      />
                      <ComponentDetail
                        name="Market Agent"
                        tech="Python + (e.g., Scikit-learn, Prophet)"
                        description="Market trend prediction (run via Electron IPC)"
                      />
                      <ComponentDetail
                        name="Geometry Engine"
                        tech="Python + NumPy/SciPy"
                        description="Sacred geometry calculations (run via Electron IPC)"
                      />
                      <ComponentDetail
                        name="Python Script Runner"
                        tech="Electron Main Process (child_process)"
                        description="Manages execution of Python scripts"
                      />
                    </CardContent>
                  </Card>

                  {/* Infrastructure Components */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Desktop Infrastructure (Electron)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <ComponentDetail
                        name="Application Shell"
                        tech="Electron"
                        description="Cross-platform desktop application wrapper"
                      />
                      <ComponentDetail
                        name="Bundled Web Server"
                        tech="Next.js Production Server"
                        description="Serves the Next.js application locally"
                      />
                      <ComponentDetail
                        name="Inter-Process Communication"
                        tech="Electron IPC"
                        description="Communication between UI and system tasks (e.g., Python)"
                      />
                      <ComponentDetail
                        name="Packaging"
                        tech="Electron Builder"
                        description="Creates distributable installers"
                      />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="dataflow">
              {/* ... existing dataflow content ... */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Data Flow Architecture (Electron App)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Property Data Flow */}
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-3 flex items-center gap-2"><>

                          <Database className="h-4 w-4 text-blue-600" />
                          Property Data Flow
                        </h4>
                        <div
</> className="space-y-2 text-sm">
                          <div className="flex items-center gap-2"><>

                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            <span
</>>User interacts with Next.js UI (Renderer Process)</span>
                          </div>
                          <div className="flex items-center gap-2"><>

                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            <span
</>>UI makes `fetch` requests to local Next.js Server (e.g., /api/properties)</span>
                          </div>
                          <div className="flex items-center gap-2"><>

                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            <span
</>>Next.js API route handles request (e.g., queries PostgreSQL)</span>
                          </div>
                          <div className="flex items-center gap-2"><>

                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            <span
</>>
                              For Python tasks: UI -> Electron Main (IPC) -> Python Script -> Electron Main -> UI
                            </span>
                          </div>
                          <div className="flex items-center gap-2"><>

                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            <span
</>>Data returned to UI for display/visualization</span>
                          </div>
                        </div>
                      </div>

                      {/* Market Analysis Flow */}
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-3 flex items-center gap-2"><>

                          <Activity className="h-4 w-4 text-green-600" />
                          Market Analysis Flow
                        </h4>
                        <div
</> className="space-y-2 text-sm">
                          <div className="flex items-center gap-2"><>

                            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                            <span
</>>UI requests market data from local Next.js Server (/api/market)</span>
                          </div>
                          <div className="flex items-center gap-2"><>

                            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                            <span
</>>
                              Next.js API route processes request, potentially calling external APIs (e.g., ArcGIS via
                              /api/arcgis) or Python scripts via Electron IPC
                            </span>
                          </div>
                          <div className="flex items-center gap-2"><>

                            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                            <span
</>>Results aggregated and returned to UI for dashboard updates</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="deployment">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2"><>

                      <UploadCloud className="h-5 w-5 text-blue-600" />
                      Deploy to Vercel
                    </CardTitle>
                    <CardDescription
</>>
                      Push the latest changes and deploy the Next.js application to Vercel. Assumes Vercel CLI is set up
                      and project is linked.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button onClick={handleDeploy} disabled={isDeploying} className="w-full">
                      <UploadCloud className="h-4 w-4 mr-2" />
                      {isDeploying ? "Deploying..." : "Deploy Next.js App to Vercel"}
                    </Button>
                    {deploymentLog.length > 0 && (
                      <div className="space-y-2"><>

                        <h4 className="font-medium text-sm">Deployment Log:</h4>
                        <ScrollArea
</> className="h-48 w-full rounded-md border p-3 bg-gray-900 text-gray-100 font-mono text-xs">
                          {deploymentLog.map((log /* , index */) => (
                            <div key={index}>{log}</div>
                          ))}
                        </ScrollArea>
                      </div>
                    )}
                    {deploymentResult &&
                      (deploymentResult.success ? (
                        <Alert variant="default" className="bg-green-50 border-green-200">
                          <CheckCircle className="h-4 w-4 text-green-700" />
                          <AlertDescription className="text-green-700">
                            Deployment successful! URL:{" "}
                            <a
                              href={deploymentResult.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline hover:text-green-800"
                            >
                              {deploymentResult.url}
                            </a>
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <Alert variant="destructive">
                          <Warning className="h-4 w-4" />
                          <AlertDescription>
                            Deployment failed: {deploymentResult.error || "Unknown error"}
                          </AlertDescription>
                        </Alert>
                      ))}
                    <Alert variant="default" className="mt-4">
                      <Terminal className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Note on Python Agents:</strong> This deployment process handles the Next.js application.
                        Deploying Python agents to a live server environment requires a separate strategy (e.g., Docker
                        containers, dedicated Python hosting) and configuration for the Vercel-deployed Next.js app to
                        communicate with them.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>

                {/* ... existing development and production build cards ... */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Development Environment */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Code className="h-4 w-4 text-blue-600" />
                        Development Environment
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="bg-gray-900 text-gray-100 p-3 rounded text-sm font-mono"><>

                        <div className="text-green-400"># Terminal 1: Start Next.js Dev Server</div>
                        <div
</>>npm run dev</div>
                        <br /><>

                        <div className="text-green-400"># Terminal 2: Start Electron</div>
                        <div
</>>npm run electron:dev</div>
                      </div>
                      <div className="space-y-2 text-sm"><>

                        <div>• Hot reloading for Next.js frontend & backend</div>
                        <div
</>>• Electron main process reloads on change (if using nodemon, or manually restart)</div>
                        <div>• Direct access to browser dev tools and Node.js debugger</div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Production Deployment */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Server className="h-4 w-4 text-green-600" />
                        Production Build & Package
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="bg-gray-900 text-gray-100 p-3 rounded text-sm font-mono"><>

                        <div className="text-green-400"># Build Next.js & Package Electron App</div>
                        <div
</>>npm run electron:package</div>
                      </div>
                      <div className="space-y-2 text-sm"><>

                        <div>• Creates optimized Next.js production build (.next)</div>
                        <div
</>>• Bundles Next.js server and app with Electron</div><>

                        <div>
                          • `electron-builder` creates installers (e.g., .exe, .dmg, .AppImage) in `dist_electron`
                        </div>
                        <div
</>>
                          • Python scripts need to be included in the package (see `extraResources` in `package.json`)
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

function ArchComponent({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="bg-white p-3 rounded-lg border shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="font-medium text-sm">{title}</span>
      </div>
      <p className="text-xs text-gray-600">{description}</p>
    </div>
  )
}

function ComponentDetail({
  name,
  tech,
  description,
}: {
  name: string
  tech: string
  description: string
}) {
  return (
    <div className="border-l-2 border-blue-200 pl-3"><>

      <div className="font-medium text-sm">{name}</div>
      <div
</> className="text-xs text-blue-600 mb-1">{tech}</div>
      <div className="text-xs text-gray-600">{description}</p>
    </div>
  )
}

declare global {
  interface Window {
    electronAPI?: {
      runTestPropertyAgent: () => Promise<{ success: boolean; output?: string; error?: string; code?: number }>
      deployToVercel: () => Promise<{ success: boolean; log?: string; url?: string; error?: string }>
      onDeploymentLog: (callback: (message: string) => void) => void
      removeDeploymentLogListener: (callback: (message: string) => void) => void
    }
  }
}
