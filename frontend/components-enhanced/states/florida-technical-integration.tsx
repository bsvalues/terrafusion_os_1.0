"use client"

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {Badge} from "@/components/ui/badge"
import {Button} from "@/components/ui/button"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"
import {Database, Globe, MapPin, CloudRain, Waves, Building, Users} from '@mui/icons-material'

const counties = [
  {name: "Miami-Dade",
    tier: 1,
    parcels: "950K",
    value: "$567B",
    population: "2.7M",
    readiness: 98,
    features: ["Bilingual", "Hurricane Ready", "International"],
    api: "ArcGIS Hub",
    timeline: "72 hours",},
  {name: "Broward",
    tier: 1,
    parcels: "685K",
    value: "$423B",
    population: "2.0M",
    readiness: 96,
    features: ["Coastal", "Port Integration", "Beach Properties"],
    api: "GeoHub",
    timeline: "48 hours",},
  {name: "Palm Beach",
    tier: 1,
    parcels: "625K",
    value: "$389B",
    population: "1.5M",
    readiness: 97,
    features: ["Luxury Properties", "Security Enhanced", "Celebrity"],
    api: "ArcGIS Open Data",
    timeline: "48 hours",},
  {name: "Orange",
    tier: 2,
    parcels: "485K",
    value: "$234B",
    population: "1.4M",
    readiness: 94,
    features: ["Theme Parks", "Tourism", "Convention Center"],
    api: "DataHub",
    timeline: "72 hours",},
]

export function FloridaTechnicalIntegration() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white p-6"><div className="max-w-7xl mx-auto space-y-8">{/* Header */}<div className="text-center space-y-4"><><h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 bg-clip-text text-transparent">🌴 FLORIDA TECHNICAL INTEGRATION</h1><p
</>
className="text-xl text-slate-300">Hurricane-Ready • Tourism-Aware • Multilingual • Future-Proof</p><div className="flex justify-center gap-4"><><Badge className="bg-orange-500/20 text-orange-400 border-orange-500">15 Counties Targeted</Badge><Badge
</>
className="bg-green-500/20 text-green-400 border-green-500">5.8M Parcels</Badge><Badge className="bg-blue-500/20 text-blue-400 border-blue-500">$2.1T Property Value</Badge></div></div>{/* Key Features */}<div className="grid grid-cols-1 md:grid-cols-4 gap-4"><Card className="bg-slate-900/50 border-orange-500/30 backdrop-blur-sm"><CardContent className="p-6 text-center"><CloudRain className="w-12 h-12 text-orange-400 mx-auto mb-4" /><><h3 className="text-lg font-semibold text-white mb-2">Hurricane Integration</h3><p
</>
className="text-slate-400 text-sm">4-hour post-storm assessment with NOAA/FEMA integration</p></CardContent></Card><Card className="bg-slate-900/50 border-red-500/30 backdrop-blur-sm"><CardContent className="p-6 text-center"><Building className="w-12 h-12 text-red-400 mx-auto mb-4" /><><h3 className="text-lg font-semibold text-white mb-2">Tourism Properties</h3><p
</>
className="text-slate-400 text-sm">Theme parks, hotels, short-term rentals specialized handling</p></CardContent></Card><Card className="bg-slate-900/50 border-pink-500/30 backdrop-blur-sm"><CardContent className="p-6 text-center"><Users className="w-12 h-12 text-pink-400 mx-auto mb-4" /><><h3 className="text-lg font-semibold text-white mb-2">Multilingual Support</h3><p
</>
className="text-slate-400 text-sm">English, Spanish, Haitian Creole interface and data</p></CardContent></Card><Card className="bg-slate-900/50 border-cyan-500/30 backdrop-blur-sm"><CardContent className="p-6 text-center"><Waves className="w-12 h-12 text-cyan-400 mx-auto mb-4" /><><h3 className="text-lg font-semibold text-white mb-2">Coastal Intelligence</h3><p
</>
className="text-slate-400 text-sm">Sea level rise projections and beach erosion modeling</p></CardContent></Card></div>{/* County Grid */}<div className="space-y-6"><><h2 className="text-2xl font-bold text-center text-white">Priority Counties</h2><div
</>className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {counties.map((county /* , index */) => (<Card
                key={index}
                className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm hover:border-orange-500/50 transition-all duration-300"
              ><CardHeader><div className="flex items-center justify-between"><div><><CardTitle className="text-xl text-white">{county.name} County</CardTitle><p
</>
className="text-slate-400">Tier {county.tier} Priority</p></div><Badge
                      className={`${
                        county.tier === 1
                          ? "bg-red-500/20 text-red-400 border-red-500"
                          : "bg-orange-500/20 text-orange-400 border-orange-500"}`}
                    >{county.readiness}% Ready</Badge></div></CardHeader><CardContent className="space-y-4"><div className="grid grid-cols-2 gap-4 text-sm"><div><><div className="text-slate-400">Population</div><div
</>
className="text-white font-semibold">{county.population}</div></div><div><><div className="text-slate-400">Parcels</div><div
</>
className="text-white font-semibold">{county.parcels}</div></div><div><><div className="text-slate-400">Property Value</div><div
</>
className="text-white font-semibold">{county.value}</div></div><div><><div className="text-slate-400">Migration Time</div><div
</>
className="text-white font-semibold">{county.timeline}</div></div></div><div><><div className="text-slate-400 text-sm mb-2">Special Features</div><div
</>className="flex flex-wrap gap-2">
                      {county.features.map((feature, idx) => (<Badge key={idx} variant="outline" className="text-xs border-slate-600 text-slate-300">{feature}</Badge>))}</div></div><div className="flex items-center justify-between pt-2"><div className="text-sm"><><span className="text-slate-400">API: </span><span
</>
className="text-cyan-400">{county.api}</span></div><Button
                      size="sm"
                      className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500"
                    >Start Migration</Button></div></CardContent></Card>))}</div></div>{/* Technical Specifications */}<Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm"><CardHeader><CardTitle className="text-2xl text-white flex items-center gap-2"><Database className="w-6 h-6 text-orange-400" />Florida Unified Migration Framework</CardTitle></CardHeader><CardContent><Tabs defaultValue="hurricane" className="w-full"><TabsList className="grid w-full grid-cols-4 bg-slate-800/50"><><TabsTrigger value="hurricane" className="data-[state=active]:bg-orange-600">Hurricane</TabsTrigger><TabsTrigger
</>value="tourism" className="data-[state=active]:bg-red-600">
                  Tourism</TabsTrigger><><TabsTrigger value="coastal" className="data-[state=active]:bg-cyan-600">Coastal</TabsTrigger><TabsTrigger
</>value="performance" className="data-[state=active]:bg-green-600">
                  Performance</TabsTrigger></TabsList><TabsContent value="hurricane" className="space-y-4"><div className="bg-slate-800/30 rounded-lg p-6"><><h3 className="text-lg font-semibold text-orange-400 mb-4">Hurricane Response Protocol</h3><div
</>
className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-2"><><h4 className="font-semibold text-white">Pre-Landfall</h4><ul
</>
className="text-sm text-slate-300 space-y-1"><><li>• Snapshot all properties</li><li
</></>>• Identify vulnerable parcels</li><><li>• Notify property owners</li><li
</></>>• Coordinate with EOC</li></ul></div><div className="space-y-2"><><h4 className="font-semibold text-white">Post-Landfall</h4><ul
</>
className="text-sm text-slate-300 space-y-1"><><li>• 4-hour rapid assessment</li><li
</></>>• AI damage detection</li><><li>• FEMA report generation</li><li
</></>>• Insurance claim expediting</li></ul></div></div></div></TabsContent><TabsContent value="tourism" className="space-y-4"><div className="bg-slate-800/30 rounded-lg p-6"><><h3 className="text-lg font-semibold text-red-400 mb-4">Tourism Property Management</h3><div
</>
className="grid grid-cols-1 md:grid-cols-3 gap-4"><div className="space-y-2"><><h4 className="font-semibold text-white">Theme Parks</h4><ul
</>
className="text-sm text-slate-300 space-y-1"><><li>• Disney World integration</li><li
</></>>• Universal Studios</li><><li>• Special district handling</li><li
</></>>• Custom valuations</li></ul></div><div className="space-y-2"><><h4 className="font-semibold text-white">Hotels & Resorts</h4><ul
</>
className="text-sm text-slate-300 space-y-1"><><li>• Occupancy rate tracking</li><li
</></>>• RevPAR calculations</li><><li>• Brand value assessment</li><li
</></>>• Competition analysis</li></ul></div><div className="space-y-2"><><h4 className="font-semibold text-white">Short-Term Rentals</h4><ul
</>
className="text-sm text-slate-300 space-y-1"><><li>• Airbnb integration</li><li
</></>>• VRBO tracking</li><><li>• Tourist tax compliance</li><li
</></>>• Neighborhood impact</li></ul></div></div></div></TabsContent><TabsContent value="coastal" className="space-y-4"><div className="bg-slate-800/30 rounded-lg p-6"><><h3 className="text-lg font-semibold text-cyan-400 mb-4">Coastal Property Intelligence</h3><div
</>
className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-2"><><h4 className="font-semibold text-white">Environmental Factors</h4><ul
</>
className="text-sm text-slate-300 space-y-1"><><li>• Beach erosion risk assessment</li><li
</></>>• Sea level rise projections (30-year)</li><><li>• Turtle nesting season compliance</li><li
</></>>• Dune preservation impact</li></ul></div><div className="space-y-2"><><h4 className="font-semibold text-white">Valuation Adjustments</h4><ul
</>
className="text-sm text-slate-300 space-y-1"><><li>• Beach access premium calculation</li><li
</></>>• Ocean view value assessment</li><><li>• Storm surge risk discount</li><li
</></>>• Insurance cost integration</li></ul></div></div></div></TabsContent><TabsContent value="performance" className="space-y-4"><div className="bg-slate-800/30 rounded-lg p-6"><><h3 className="text-lg font-semibold text-green-400 mb-4">Performance Benchmarks</h3><div
</>
className="grid grid-cols-2 md:grid-cols-4 gap-4"><div className="text-center"><><div className="text-2xl font-bold text-green-400">500×</div><div
</>
className="text-sm text-slate-400">Parcel Query Speed</div></div><div className="text-center"><><div className="text-2xl font-bold text-green-400">720×</div><div
</>
className="text-sm text-slate-400">Bulk Valuation</div></div><div className="text-center"><><div className="text-2xl font-bold text-green-400">84×</div><div
</>
className="text-sm text-slate-400">Hurricane Assessment</div></div><div className="text-center"><><div className="text-2xl font-bold text-green-400">30×</div><div
</>
className="text-sm text-slate-400">FEMA Reporting</div></div></div></div></TabsContent></Tabs></CardContent></Card>{/* Call to Action */}<Card className="bg-gradient-to-r from-orange-900/50 to-red-900/50 border-orange-500/50 backdrop-blur-sm"><CardContent className="p-8 text-center"><><h2 className="text-3xl font-bold text-white mb-4">Ready to Transform Florida?</h2><p
</>className="text-xl text-slate-300 mb-6">
              Hurricane-ready, tourism-aware, multilingual government technology</p><div className="flex justify-center gap-4"><Button
                size="lg"
                className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white"
              ><><MapPin className="w-5 h-5 mr-2" />Start Miami-Dade Migration</Button><Button
</>

                size="lg"
                variant="outline"
                className="border-orange-500 text-orange-400 hover:bg-orange-500/10 bg-transparent"
              ><Globe className="w-5 h-5 mr-2" />View Technical Docs</Button></div></CardContent></Card></div></div>
  )
}
