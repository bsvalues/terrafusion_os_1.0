import { useState } from "react";
import Sidebar from "@/components/sidebar";
import DashboardHeader from "@/components/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Play, FileText, Terminal, Cpu, Database  } from '@mui/icons-material';

export default function IDEPage() {
  const [activeTab, setActiveTab] = useState("editor");

  return (
    <div className="tf-app-container bg-tf-background min-h-screen">
      <Sidebar />
      
      <main className="tf-main-content">
        <div className="tf-content-wrapper">
          <DashboardHeader 
            title="Terrafusion IDE" 
            subtitle="Interactive development environment for property analysis"
          />
          
          <div className="tf-content-area space-y-6">
            {/* IDE Controls */}
            <div className="tf-grid grid-cols-1 lg:grid-cols-4 gap-6">
              <Card className="tf-card bg-tf-surface border-tf-accent/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
<>
                      <p className="text-sm text-tf-text/60">Active Sessions</p>
                      <div
</> className="text-2xl font-bold text-tf-text">3</div>
                    </div>
                    <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                      <Terminal className="w-6 h-6 text-green-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="tf-card bg-tf-surface border-tf-accent/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
<>
                      <p className="text-sm text-tf-text/60">Code Files</p>
                      <div
</> className="text-2xl font-bold text-tf-text">12</div>
                    </div>
                    <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="tf-card bg-tf-surface border-tf-accent/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
<>
                      <p className="text-sm text-tf-text/60">CPU Usage</p>
                      <div
</> className="text-2xl font-bold text-tf-text">24%</div>
                    </div>
                    <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                      <Cpu className="w-6 h-6 text-orange-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="tf-card bg-tf-surface border-tf-accent/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
<>
                      <p className="text-sm text-tf-text/60">DB Queries</p>
                      <div
</> className="text-2xl font-bold text-tf-text">1,247</div>
                    </div>
                    <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                      <Database className="w-6 h-6 text-purple-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* IDE Interface */}
            <Card className="tf-card bg-tf-surface border-tf-accent/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-tf-text">
<>
                    <Code className="w-5 h-5 text-tf-accent" />
                    Terrafusion Development Environment
                  </CardTitle>
                  <div
</> className="flex items-center gap-2">
                    <Button size="sm" className="bg-tf-accent text-tf-background hover:bg-tf-accent/90">
<>
                      <Play className="w-4 h-4 mr-1" />
                      Run Code
                    </Button>
                    <Badge
</> variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                      Connected
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 bg-tf-accent/10">
<>
                    <TabsTrigger value="editor" className="data-[state=active]:bg-tf-accent data-[state=active]:text-tf-background">
                      Code Editor
                    </TabsTrigger>
                    <TabsTrigger
</> value="terminal" className="data-[state=active]:bg-tf-accent data-[state=active]:text-tf-background">
                      Terminal
                    </TabsTrigger>
                    <TabsTrigger value="output" className="data-[state=active]:bg-tf-accent data-[state=active]:text-tf-background">
                      Output
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="editor" className="mt-6">
                    <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm min-h-96 overflow-auto">
<>
                      <div className="text-gray-400 mb-2"># Terrafusion Property Analysis Agent</div>
                      <div
</> className="text-gray-400 mb-4"># Advanced AI-powered property assessment system</div>
                      
                      <div><span className="text-purple-400">import</span> <span className="text-yellow-300">asyncio</span></div>
                      <div><span className="text-purple-400">import</span> <span className="text-yellow-300">pandas</span> <span className="text-purple-400">as</span> <span className="text-yellow-300">pd</span></div>
                      <div><span className="text-purple-400">from</span> <span className="text-yellow-300">openai</span> <span className="text-purple-400">import</span> <span className="text-yellow-300">AsyncOpenAI</span></div>
                      <div><span className="text-purple-400">from</span> <span className="text-yellow-300">terrafusion.core</span> <span className="text-purple-400">import</span> <span className="text-yellow-300">PropertyAnalyzer</span></div>
<>
                      <div></div>
                      
                      <div
</>><span className="text-purple-400">class</span> <span className="text-blue-300">TerraFusionAgent</span>:</div>
                      <div className="ml-4"><span className="text-gray-400">"""Enterprise-grade property analysis agent"""</span></div>
<>
                      <div></div>
                      <div
</> className="ml-4"><span className="text-purple-400">def</span> <span className="text-blue-300">__init__</span><span className="text-tf-text">(</span><span className="text-orange-300">self</span><span className="text-tf-text">):</span></div>
                      <div className="ml-8"><span className="text-orange-300">self</span><span className="text-tf-text">.</span><span className="text-tf-text">client</span> <span className="text-tf-text">=</span> <span className="text-blue-300">AsyncOpenAI</span><span className="text-tf-text">()</span></div>
                      <div className="ml-8"><span className="text-orange-300">self</span><span className="text-tf-text">.</span><span className="text-tf-text">analyzer</span> <span className="text-tf-text">=</span> <span className="text-blue-300">PropertyAnalyzer</span><span className="text-tf-text">()</span></div>
<>
                      <div></div>
                      
                      <div
</> className="ml-4"><span className="text-purple-400">async def</span> <span className="text-blue-300">analyze_property</span><span className="text-tf-text">(</span><span className="text-orange-300">self</span><span className="text-tf-text">, </span><span className="text-orange-300">property_data</span><span className="text-tf-text">):</span></div>
<>
                      <div className="ml-8 text-tf-text">"""Perform comprehensive property analysis"""</div>
                      <div
</> className="ml-8"><span className="text-orange-300">analysis_prompt</span> <span className="text-tf-text">=</span> <span className="text-green-300">f"""</span></div>
<>
                      <div className="ml-8 text-green-300">Analyze this Benton County property:</div>
                      <div
</> className="ml-8 text-green-300">Address: &#123;property_data['address']&#125;</div>
<>
                      <div className="ml-8 text-green-300">Assessed Value: $&#123;property_data['assessed_value']&#125;</div>
                      <div
</> className="ml-8 text-green-300">Property Type: &#123;property_data['property_type']&#125;</div>
<>
                      <div className="ml-8 text-green-300">"""</div>
                      <div
</>></div>
                      <div className="ml-8"><span className="text-orange-300">response</span> <span className="text-tf-text">=</span> <span className="text-purple-400">await</span> <span className="text-orange-300">self</span><span className="text-tf-text">.</span><span className="text-tf-text">client</span><span className="text-tf-text">.</span><span className="text-tf-text">chat</span><span className="text-tf-text">.</span><span className="text-tf-text">completions</span><span className="text-tf-text">.</span><span className="text-blue-300">create</span><span className="text-tf-text">(</span></div>
                      <div className="ml-12"><span className="text-tf-text">model</span><span className="text-tf-text">=</span><span className="text-green-300">"gpt-4"</span><span className="text-tf-text">,</span></div>
                      <div className="ml-12"><span className="text-tf-text">messages</span><span className="text-tf-text">=[&#123;"role": "user", "content": </span><span className="text-orange-300">analysis_prompt</span><span className="text-tf-text">&#125;]</span></div>
                      <div className="ml-8"><span className="text-tf-text">)</span></div>
<>
                      <div></div>
                      <div
</> className="ml-8"><span className="text-purple-400">return</span> <span className="text-orange-300">response</span><span className="text-tf-text">.</span><span className="text-tf-text">choices</span><span className="text-tf-text">[</span><span className="text-blue-300">0</span><span className="text-tf-text">]</span><span className="text-tf-text">.</span><span className="text-tf-text">message</span><span className="text-tf-text">.</span><span className="text-tf-text">content</span></div>
<>
                      <div></div>
                      <div
</>><span className="text-purple-400">if</span> <span className="text-orange-300">__name__</span> <span className="text-tf-text">==</span> <span className="text-green-300">"__main__"</span><span className="text-tf-text">:</span></div>
                      <div className="ml-4"><span className="text-orange-300">agent</span> <span className="text-tf-text">=</span> <span className="text-blue-300">TerraFusionAgent</span><span className="text-tf-text">()</span></div>
                      <div className="ml-4"><span className="text-blue-300">print</span><span className="text-tf-text">(</span><span className="text-green-300">"Terrafusion Agent initialized and ready"</span><span className="text-tf-text">)</span></div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="terminal" className="mt-6">
                    <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm min-h-96 text-green-400">
<>
                      <div>Terrafusion Development Terminal v2.1.0</div>
                      <div
</>>Connected to Benton County Property Database</div>
<>
                      <div>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</div>
                      <div
</>></div>
<>
                      <div>$ python terrafusion_agent.py</div>
                      <div
</> className="text-blue-400">Loading Terrafusion Agent...</div>
<>
                      <div className="text-blue-400">✓ Connected to OpenAI API</div>
                      <div
</> className="text-blue-400">✓ Connected to Property Database</div>
<>
                      <div className="text-blue-400">✓ Initialized PropertyAnalyzer</div>
                      <div
</> className="text-green-400">Terrafusion Agent initialized and ready</div>
<>
                      <div></div>
                      <div
</>>$ agent.analyze_property(address="1234 Main St", assessed_value=285000)</div>
<>
                      <div className="text-yellow-400">Processing property analysis...</div>
                      <div
</> className="text-green-400">Analysis complete - property shows strong market position</div>
<>
                      <div></div>
                      <div
</> className="text-green-400">$ ▊</div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="output" className="mt-6">
                    <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm min-h-96 text-white">
<>
                      <div className="text-blue-400">=== Terrafusion Analysis Output ===</div>
                      <div
</>></div>
                      <div><span className="text-yellow-400">Property:</span> 1234 Main St, Kennewick, WA</div>
                      <div><span className="text-yellow-400">Assessed Value:</span> $285,000</div>
                      <div><span className="text-yellow-400">Analysis Date:</span> {new Date().toLocaleDateString()}</div>
<>
                      <div></div>
                      <div
</> className="text-green-400">✓ Market Analysis Complete</div>
<>
                      <div className="text-green-400">✓ Comparable Sales Retrieved</div>
                      <div
</> className="text-green-400">✓ Valuation Model Applied</div>
<>
                      <div className="text-green-400">✓ Risk Assessment Performed</div>
                      <div
</>></div>
                      <div><span className="text-cyan-400">Recommendation:</span> Property is well-positioned in current market</div>
                      <div><span className="text-cyan-400">Confidence Score:</span> 94.2%</div>
                      <div><span className="text-cyan-400">Market Trend:</span> Stable with slight upward trajectory</div>
<>
                      <div></div>
                      <div
</> className="text-gray-400">Analysis completed in 2.3 seconds</div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="tf-grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="tf-card bg-tf-surface border-tf-accent/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-tf-text">
                    <FileText className="w-5 h-5 text-tf-accent" />
                    Code Templates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-tf-accent/5 rounded-lg border border-tf-accent/10">
                      <div>
<>
                        <p className="text-sm font-medium text-tf-text">Property Analysis Agent</p>
                        <p
</> className="text-xs text-tf-text/60">Basic property analysis template</p>
                      </div>
                      <Button size="sm" variant="ghost" className="text-tf-accent hover:bg-tf-accent/10">
                        Load
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-tf-accent/5 rounded-lg border border-tf-accent/10">
                      <div>
<>
                        <p className="text-sm font-medium text-tf-text">Market Comparison Script</p>
                        <p
</> className="text-xs text-tf-text/60">Compare properties against market</p>
                      </div>
                      <Button size="sm" variant="ghost" className="text-tf-accent hover:bg-tf-accent/10">
                        Load
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-tf-accent/5 rounded-lg border border-tf-accent/10">
                      <div>
<>
                        <p className="text-sm font-medium text-tf-text">Valuation Model</p>
                        <p
</> className="text-xs text-tf-text/60">Advanced property valuation</p>
                      </div>
                      <Button size="sm" variant="ghost" className="text-tf-accent hover:bg-tf-accent/10">
                        Load
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="tf-card bg-tf-surface border-tf-accent/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-tf-text">
                    <Terminal className="w-5 h-5 text-tf-accent" />
                    Recent Commands
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 font-mono text-sm">
<>
                    <div className="text-tf-text/80">$ python analyze_market_trends.py</div>
                    <div
</> className="text-tf-text/80">$ agent.process_batch(property_ids)</div>
<>
                    <div className="text-tf-text/80">$ db.query("SELECT * FROM properties")</div>
                    <div
</> className="text-tf-text/80">$ terraform apply -auto-approve</div>
                    <div className="text-tf-text/80">$ docker compose up -d</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}