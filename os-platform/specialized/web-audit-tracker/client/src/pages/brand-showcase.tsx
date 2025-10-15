import {useState} from "react";
import {useQuery} from "@tanstack/react-query";

import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {Progress} from "@/components/ui/progress";
import {Crown, 
  Shield, 
  Target, 
  Zap,
  Building,
  Trophy,
  Star,
  Sparkles,
  CheckCircle,
  TrendingUp,
  Eye,
  Award} from '@mui/icons-material';

export default function BrandShowcasePage() {
  return (
      <div className="space-y-8 p-6">{/* Hero Section */}<div className="text-center space-y-8 py-12"><div className="space-y-4"><><h1 className="text-6xl font-bold bg-gradient-to-r from-[#00d2ff] to-[#3a7bd5] bg-clip-text text-transparent tracking-wide">Terrafusion</h1><div
</>className="text-3xl font-bold text-[#00d2ff] tracking-wider">
              Intelligence That Counties Envy</div><p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">Beyond assessment, beyond limits—delivering the territorial intelligence that makes counties legendary 
              for their operational excellence and innovation leadership.</p></div>{/* Brand DNA Display */}<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-6xl mx-auto pt-8"><div className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-[#00d2ff]/10 to-[#0891b2]/10 rounded-xl border border-[#00d2ff]/20"><Zap className="h-8 w-8 text-[#00d2ff]" /><><span className="text-sm font-semibold text-white">Tesla's</span><span
</>
className="text-xs text-gray-400">Precision</span></div><div className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-[#3a7bd5]/10 to-[#667eea]/10 rounded-xl border border-[#3a7bd5]/20"><Eye className="h-8 w-8 text-[#3a7bd5]" /><><span className="text-sm font-semibold text-white">Jobs'</span><span
</>
className="text-xs text-gray-400">Elegance</span></div><div className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-[#667eea]/10 to-[#00d2ff]/10 rounded-xl border border-[#667eea]/20"><TrendingUp className="h-8 w-8 text-[#667eea]" /><><span className="text-sm font-semibold text-white">Musk's</span><span
</>
className="text-xs text-gray-400">Scale</span></div><div className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-[#10b981]/10 to-[#10b981]/5 rounded-xl border border-[#10b981]/20"><Shield className="h-8 w-8 text-[#10b981]" /><><span className="text-sm font-semibold text-white">ICSF</span><span
</>
className="text-xs text-gray-400">Security</span></div><div className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-[#f59e0b]/10 to-[#f59e0b]/5 rounded-xl border border-[#f59e0b]/20"><Trophy className="h-8 w-8 text-[#f59e0b]" /><><span className="text-sm font-semibold text-white">Brady</span><span
</>
className="text-xs text-gray-400">Excellence</span></div><div className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-[#ef4444]/10 to-[#ef4444]/5 rounded-xl border border-[#ef4444]/20"><Crown className="h-8 w-8 text-[#ef4444]" /><><span className="text-sm font-semibold text-white">Annunaki</span><span
</>
className="text-xs text-gray-400">Knowledge</span></div></div></div>{/* Brand Promise */}<Card className="border-[#00d2ff]/30 bg-gradient-to-br from-gray-900/80 to-gray-800/80"><CardHeader className="text-center bg-gradient-to-r from-[#00d2ff]/20 to-[#3a7bd5]/20"><CardTitle className="text-2xl text-white">Our Brand Promise</CardTitle></CardHeader><CardContent className="pt-8"><div className="text-center space-y-6"><><p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">"Transform counties into territorial intelligence powerhouses that create competitive envy. 
                Every system, every insight, every decision optimized for legendary operational excellence."</p><div
</>
className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6"><div className="text-center space-y-3"><div className="h-16 w-16 bg-gradient-to-br from-[#00d2ff] to-[#3a7bd5] rounded-full flex items-center justify-center mx-auto"><><Target className="h-8 w-8 text-white" /></div><h3
</>
className="text-lg font-bold text-white">Authoritative</h3><p className="text-sm text-gray-400">The definitive source for territorial intelligence</p></div><div className="text-center space-y-3"><div className="h-16 w-16 bg-gradient-to-br from-[#3a7bd5] to-[#667eea] rounded-full flex items-center justify-center mx-auto"><><Sparkles className="h-8 w-8 text-white" /></div><h3
</>
className="text-lg font-bold text-white">Innovative</h3><p className="text-sm text-gray-400">Pioneering the future of civil infrastructure</p></div><div className="text-center space-y-3"><div className="h-16 w-16 bg-gradient-to-br from-[#667eea] to-[#00d2ff] rounded-full flex items-center justify-center mx-auto"><><Award className="h-8 w-8 text-white" /></div><h3
</>
className="text-lg font-bold text-white">Aspirational</h3><p className="text-sm text-gray-400">The standard that creates competitive envy</p></div></div></div></CardContent></Card>{/* Color Palette Showcase */}<Card className="border-[#00d2ff]/30 bg-gradient-to-br from-gray-900/80 to-gray-800/80"><CardHeader><><CardTitle className="text-white text-xl">Brand Visual Identity</CardTitle><CardDescription
</>className="text-gray-300">
              Professional color system designed for enterprise authority and innovation leadership</CardDescription></CardHeader><CardContent className="space-y-6"><div><><h4 className="text-white font-semibold mb-4">Primary Intelligence Colors</h4><div
</>
className="grid grid-cols-2 md:grid-cols-4 gap-4"><div className="text-center space-y-2"><><div className="h-20 w-full bg-[#00d2ff] rounded-lg shadow-lg"></div><div
</>
className="text-sm"><><div className="text-white font-medium">Terrafusion Cyan</div><div
</>
className="text-gray-400">#00d2ff</div></div></div><div className="text-center space-y-2"><><div className="h-20 w-full bg-[#0891b2] rounded-lg shadow-lg"></div><div
</>
className="text-sm"><><div className="text-white font-medium">Intelligence Blue</div><div
</>
className="text-gray-400">#0891b2</div></div></div><div className="text-center space-y-2"><><div className="h-20 w-full bg-[#3a7bd5] rounded-lg shadow-lg"></div><div
</>
className="text-sm"><><div className="text-white font-medium">Authority Teal</div><div
</>
className="text-gray-400">#3a7bd5</div></div></div><div className="text-center space-y-2"><><div className="h-20 w-full bg-[#667eea] rounded-lg shadow-lg"></div><div
</>
className="text-sm"><><div className="text-white font-medium">Innovation Purple</div><div
</>
className="text-gray-400">#667eea</div></div></div></div></div><div><><h4 className="text-white font-semibold mb-4">Functional Status Colors</h4><div
</>
className="grid grid-cols-2 md:grid-cols-4 gap-4"><div className="text-center space-y-2"><><div className="h-12 w-full bg-[#10b981] rounded-lg shadow-lg"></div><div
</>
className="text-sm"><><div className="text-white font-medium">Success</div><div
</>
className="text-gray-400">#10b981</div></div></div><div className="text-center space-y-2"><><div className="h-12 w-full bg-[#f59e0b] rounded-lg shadow-lg"></div><div
</>
className="text-sm"><><div className="text-white font-medium">Warning</div><div
</>
className="text-gray-400">#f59e0b</div></div></div><div className="text-center space-y-2"><><div className="h-12 w-full bg-[#ef4444] rounded-lg shadow-lg"></div><div
</>
className="text-sm"><><div className="text-white font-medium">Critical</div><div
</>
className="text-gray-400">#ef4444</div></div></div><div className="text-center space-y-2"><><div className="h-12 w-full bg-[#6b7280] rounded-lg shadow-lg"></div><div
</>
className="text-sm"><><div className="text-white font-medium">Neutral</div><div
</>
className="text-gray-400">#6b7280</div></div></div></div></div></CardContent></Card>{/* Brand Applications */}<Card className="border-[#00d2ff]/30 bg-gradient-to-br from-gray-900/80 to-gray-800/80"><CardHeader><><CardTitle className="text-white text-xl">Enterprise Applications</CardTitle><CardDescription
</>className="text-gray-300">
              Brand implementation across government and enterprise touchpoints</CardDescription></CardHeader><CardContent><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"><div className="space-y-3"><div className="h-12 w-12 bg-gradient-to-br from-[#00d2ff] to-[#3a7bd5] rounded-lg flex items-center justify-center"><><Building className="h-6 w-6 text-white" /></div><h4
</>
className="text-white font-semibold">Government Communications</h4><p className="text-sm text-gray-400">Formal, respectful, results-focused messaging for county officials and stakeholders</p></div><div className="space-y-3"><div className="h-12 w-12 bg-gradient-to-br from-[#3a7bd5] to-[#667eea] rounded-lg flex items-center justify-center"><><Shield className="h-6 w-6 text-white" /></div><h4
</>
className="text-white font-semibold">Technical Documentation</h4><p className="text-sm text-gray-400">Precise, detailed, methodical approach to system specifications and procedures</p></div><div className="space-y-3"><div className="h-12 w-12 bg-gradient-to-br from-[#667eea] to-[#00d2ff] rounded-lg flex items-center justify-center"><><Star className="h-6 w-6 text-white" /></div><h4
</>
className="text-white font-semibold">Marketing Excellence</h4><p className="text-sm text-gray-400">Aspirational, compelling, differentiated messaging that creates competitive advantage</p></div></div></CardContent></Card>{/* Implementation Status */}<Card className="border-[#00d2ff]/30 bg-gradient-to-br from-gray-900/80 to-gray-800/80"><CardHeader><><CardTitle className="text-white text-xl">Brand Implementation Status</CardTitle><CardDescription
</>className="text-gray-300">
              Current brand deployment across Terrafusion Enterprise Platform</CardDescription></CardHeader><CardContent className="space-y-6"><div className="space-y-4"><div className="flex justify-between items-center"><><span className="text-white font-medium">Visual Identity System</span><Badge
</>
className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30">Complete</Badge></div><><Progress value={100} className="h-2" /></div><div
</>
className="space-y-4"><div className="flex justify-between items-center"><><span className="text-white font-medium">Brand Voice & Messaging</span><Badge
</>
className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30">Complete</Badge></div><><Progress value={100} className="h-2" /></div><div
</>
className="space-y-4"><div className="flex justify-between items-center"><><span className="text-white font-medium">Enterprise Platform Integration</span><Badge
</>
className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30">Complete</Badge></div><><Progress value={100} className="h-2" /></div><div
</>
className="space-y-4"><div className="flex justify-between items-center"><><span className="text-white font-medium">Digital Brand Guidelines</span><Badge
</>
className="bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30">In Progress</Badge></div><Progress value={85} className="h-2" /></div></CardContent></Card></div>
  );
}