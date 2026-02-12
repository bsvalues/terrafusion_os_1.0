import React from "react";
import { useLocation } from "wouter";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "../components/ui/card";
import { RouteDebugger } from "@/components/dev/RouteDebugger";

// Simplified version - removed AppraisalContext dependency
export default function Home() {
  const [_, setLocation] = useLocation();

  // Immediately redirect to our property analysis page
  console.log("Home component rendering");

  // Use useEffect to redirect after render
  React.useEffect(() => {
    console.log("Redirecting to property analysis");
    setLocation("/property-analysis-new");
  }, []);

  return (
    <div className="flex-1 p-8 overflow-auto">
      <div className="fixed top-0 left-0 right-0 bg-blue-600 text-white p-2 z-50 flex justify-center">
        <button
          onClick={() => setLocation("/ws-test")}
          className="font-bold px-4 py-1 bg-blue-700 hover:bg-blue-800 rounded-md"
        >
          🔌 Click here to test WebSocket Connectivity
        </button>
      </div>

      <div className="max-w-5xl mx-auto mt-12"><>

        <h1 className="text-3xl font-bold mb-8">AppraisalCore - Real Estate Appraisal Platform</h1>

        <div
</> className="flex space-x-4 mb-6"><>

          <Button
            variant="default"
            onClick={() => setLocation("/ws-test")}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            🔌 WebSocket Test Page
          </Button>

          <Button
</> variant="outline" onClick={() => console.log("Native button clicked")}>
            Test Native Button
          </Button>

          <Button variant="secondary" onClick={() => setLocation("/form")}>
            Go to Form Page
          </Button>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader><>

              <CardTitle>Welcome to AppraisalCore</CardTitle>
              <CardDescription
</>>
                The comprehensive real estate appraisal platform for desktop and mobile
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-800 rounded-md p-4 mb-6">
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  New Feature: Property Condition AI Explainer
                </h3><>

                <p className="mb-3">
                  Explore how our AI model analyzes property conditions using SHAP values for
                  complete transparency.
                </p>
                <div
</> className="flex gap-3 flex-wrap"><>

                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => {
                      console.log("SHAP Viewer clicked");
                      setLocation("/shap-viewer");
                    }}
                  >
                    Open SHAP Value Explorer
                  </Button>
                  <Button
</>
                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                    onClick={() => {
                      console.log("WebSocket Test clicked");
                      setLocation("/ws-test");
                    }}
                  >
                    WebSocket Test Page
                  </Button>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => {
                      console.log("URAR + AI Assistant clicked");
                      setLocation("/urar");
                    }}
                  >
                    URAR + AI Assistant
                  </Button>
                </div>
              </div><>


              <p className="mb-4">
                You don't have any active appraisal reports. Create a new one to get started or load
                a demo report.
              </p>
              <div
</> className="flex gap-4"><>

                <Button
                  onClick={() => {
                    console.log("Load Demo Report clicked");
                    setLocation("/form");
                  }}
                >
                  Load Demo Report
                </Button>
                <Button
</>
                  variant="outline"
                  onClick={() => {
                    console.log("Create New Report clicked");
                    setLocation("/form");
                  }}
                >
                  Create New Report
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Desktop Form-Filler</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Complete appraisal forms with embedded spreadsheet-style worksheets that
                  auto-calculate adjustments and market values.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mobile Inspection</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Capture property details, photos, and measurements with our mobile app - even
                  without internet connection.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reports & Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Generate professional PDF reports and MISMO XML exports while ensuring compliance
                  with industry standards.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Route Debugger */}
          <RouteDebugger />
        </div>
      </div>
    </div>
  );
}
