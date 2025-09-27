import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {Badge} from "@/components/ui/badge"
import {Progress} from "@/components/ui/progress"
import {Database, Users, MapPin, Zap} from '@mui/icons-material'

export function MichiganTechnicalDashboard() {const semcogCounties = [
    { name: "Wayne County", population: "1.75M", parcels: "700K", value: "$89B", status: "Ready", progress: 95},
    {name: "Oakland County", population: "1.27M", parcels: "480K", value: "$142B", status: "Ready", progress: 92},
    {name: "Macomb County", population: "881K", parcels: "350K", value: "$67B", status: "Ready", progress: 88},
    {name: "Washtenaw County", population: "373K", parcels: "140K", value: "$48B", status: "Ready", progress: 94},
  ]

  const technicalSpecs = [
    {system: "Michigan GIS Open Data Portal",
      url: "gis-michigan.opendata.arcgis.com",
      status: "Modern ArcGIS",
      migration: "6 hours",
      icon: Database,},
    {system: "SEMCOG Regional Data",
      url: "semcog.org/data-maps",
      status: "8 Counties Ready",
      migration: "72 hours",
      icon: MapPin,},
    {system: "MDOT GIS Integration",
      url: "gis-mdot.opendata.arcgis.com",
      status: "Transportation Ready",
      migration: "API Direct",
      icon: Zap,},
    {system: "Michigan Open Data",
      url: "data.michigan.gov",
      status: "State Integration",
      migration: "Automated",
      icon: Users,},
  ]

  return (
    <div className="space-y-8"><Card className="bg-dark-800/50 border-primary/20"><CardHeader><CardTitle className="text-white">SEMCOG Regional Powerhouse</CardTitle></CardHeader><CardContent><div className="grid grid-cols-1 md:grid-cols-2 gap-6">{semcogCounties.map((county /* , index */) => (<div key={index} className="p-4 bg-dark-700/30 rounded-lg"><div className="flex items-center justify-between mb-3"><><h3 className="text-white font-semibold">{county.name}</h3><Badge
</>variant="secondary" className="bg-accent/20 text-accent">
                    {county.status}</Badge></div><div className="grid grid-cols-3 gap-2 text-sm mb-3"><div><><span className="text-gray-400">Population: </span><span
</>
className="text-white">{county.population}</span></div><div><><span className="text-gray-400">Parcels: </span><span
</>
className="text-accent">{county.parcels}</span></div><div><><span className="text-gray-400">Value: </span><span
</>
className="text-transcend">{county.value}</span></div></div><Progress value={county.progress} className="h-2" /><p className="text-xs text-gray-400 mt-2">Migration Readiness: {county.progress}%</p></div>))}</div></CardContent></Card><Card className="bg-dark-800/50 border-primary/20"><CardHeader><CardTitle className="text-white">Technical Infrastructure Analysis</CardTitle></CardHeader><CardContent><div className="grid grid-cols-1 md:grid-cols-2 gap-6">{technicalSpecs.map((spec /* , index */) => (<div key={index} className="p-4 bg-dark-700/30 rounded-lg"><div className="flex items-center gap-3 mb-3"><spec.icon className="w-6 h-6 text-primary" /><h3 className="text-white font-semibold">{spec.system}</h3></div><div className="space-y-2 text-sm"><div><><span className="text-gray-400">URL: </span><span
</>
className="text-transcend">{spec.url}</span></div><div><><span className="text-gray-400">Status: </span><span
</>
className="text-accent">{spec.status}</span></div><div><><span className="text-gray-400">Migration: </span><span
</>
className="text-white">{spec.migration}</span></div></div></div>))}</div></CardContent></Card><Card className="bg-dark-800/50 border-primary/20"><CardHeader><CardTitle className="text-white">45-Day Michigan Conquest Timeline</CardTitle></CardHeader><CardContent><div className="space-y-4"><div className="p-4 bg-dark-700/30 rounded-lg"><><h3 className="text-white font-semibold mb-2">Week 1: Detroit Metro Blitz</h3><p
</>
className="text-gray-300 text-sm mb-2">Wayne, Oakland, Macomb Counties</p><div className="flex justify-between items-center"><><span className="text-accent">$10.8M ARR Target</span><Badge
</>variant="secondary" className="bg-primary/20 text-primary">
                  Ready</Badge></div></div><div className="p-4 bg-dark-700/30 rounded-lg"><><h3 className="text-white font-semibold mb-2">Week 2-3: University Corridor</h3><p
</>
className="text-gray-300 text-sm mb-2">Washtenaw, Ingham, Kent Counties</p><div className="flex justify-between items-center"><><span className="text-accent">$7.2M ARR Target</span><Badge
</>variant="secondary" className="bg-transcend/20 text-transcend">
                  Planning</Badge></div></div><div className="p-4 bg-dark-700/30 rounded-lg"><><h3 className="text-white font-semibold mb-2">Week 4-6: Statewide Completion</h3><p
</>
className="text-gray-300 text-sm mb-2">Remaining 74 Counties</p><div className="flex justify-between items-center"><><span className="text-accent">$36M ARR Target</span><Badge
</>variant="secondary" className="bg-yellow-400/20 text-yellow-400">
                  Scheduled</Badge></div></div></div></CardContent></Card></div>
  )
}
