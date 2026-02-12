import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function PlaygroundIDE() {
  return (
    <Card className="tf-card bg-tf-surface border-tf-accent/20">
      <CardHeader className="border-b border-tf-accent/20 bg-tf-surface">
        <div className="flex items-center justify-between">
          <div>
<>
            <CardTitle className="text-lg font-semibold text-tf-text">Agent Development Environment</CardTitle>
            <p
</> className="text-sm text-tf-text/70">Interactive code editor for Terrafusion agents</p>
          </div>
          <Button variant="outline" className="tf-button-secondary text-tf-accent border-tf-accent/30 hover:bg-tf-accent/10">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
            </svg>
            Launch IDE
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 bg-tf-surface">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Code Editor Preview */}
          <div className="lg:col-span-2">
            <div className="bg-tf-dark rounded-lg overflow-hidden border border-tf-accent/20">
              <div className="flex items-center justify-between px-4 py-2 bg-tf-dark border-b border-tf-accent/30">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <div className="w-3 h-3 bg-yellow-500 rounded-full" />
<>
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                </div>
                <div
</> className="flex items-center space-x-4">
<>
                  <span className="text-xs text-tf-text/60">benton-analysis-agent.py</span>
                  <div
</> className="flex space-x-2">
<>
                    <button className="text-tf-accent hover:text-tf-accent/80 text-xs">Execute</button>
                    <button
</> className="text-tf-accent hover:text-tf-accent/80 text-xs">Debug</button>
                  </div>
                </div>
              </div>
              <div className="p-4 text-sm font-mono h-40 overflow-hidden">
<>
                <div className="text-tf-text/50"># Terrafusion Benton County Analysis Agent</div>
                <div
</>><span className="text-purple-400">from</span> <span className="text-tf-text">terrafusion.agents</span> <span className="text-purple-400">import</span> <span className="text-tf-text">PropertyAgent</span></div>
                <div><span className="text-purple-400">from</span> <span className="text-tf-text">openai</span> <span className="text-purple-400">import</span> <span className="text-tf-text">OpenAI</span></div>
                <br />
                <div><span className="text-purple-400">class</span> <span className="text-yellow-300">BentonAnalysisAgent</span><span className="text-tf-text">(</span><span className="text-yellow-300">PropertyAgent</span><span className="text-tf-text">):</span></div>
<>
                <div className="ml-4 text-tf-text">"""Real-time property analysis for Benton County"""</div>
                <br
</> />
                <div className="ml-4"><span className="text-purple-400">async def</span> <span className="text-blue-300">analyze_property</span><span className="text-tf-text">(</span><span className="text-orange-300">self</span><span className="text-tf-text">, </span><span className="text-orange-300">parcel_data</span><span className="text-tf-text">):</span></div>
<>
                <div className="ml-8 text-gray-500"># Implement cost analysis logic</div>
                <div
</> className="ml-8"><span className="text-purple-400">return</span> <span className="text-white">self.calculate_rcn(property_data)</span></div>
              </div>
            </div>
          </div>

          {/* Development Tools */}
          <div className="space-y-6">
            {/* PromptOps */}
            <div>
<>
              <h4 className="text-sm font-medium text-gray-900 mb-3">PromptOps Console</h4>
              <div
</> className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
<>
                    <span className="text-xs font-medium text-gray-700">Property Analysis Prompt</span>
                    <Badge
</> variant="outline" className="text-green-600 border-green-200">✓ Tested</Badge>
                  </div>
<>
                  <div className="text-xs text-gray-600 bg-white p-2 rounded border">
                    "Analyze this property for assessment accuracy using comparable sales data..."
                  </div>
                  <Button
</> size="sm" variant="ghost" className="w-full text-xs text-terra-700 hover:text-terra-800">
                    Edit Prompt
                  </Button>
                </div>
              </div>
            </div>

            {/* Agent Testing */}
            <div>
<>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Agent Testing</h4>
              <div
</> className="space-y-3">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full justify-between bg-terra-50 text-terra-700 border-terra-200 hover:bg-terra-100"
                >
<>
                  <span>Test with Sample Data</span>
                  <svg
</> className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h1m4 0h1"/>
                  </svg>
                </Button>
                <Button size="sm" variant="outline" className="w-full justify-between">
<>
                  <span>Performance Monitor</span>
                  <svg
</> className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                  </svg>
                </Button>
                <Button size="sm" variant="outline" className="w-full justify-between">
<>
                  <span>Deploy to Production</span>
                  <svg
</> className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"/>
                  </svg>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
