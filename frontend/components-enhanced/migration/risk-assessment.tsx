import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {Badge} from "@/components/ui/badge"
import {Warning, Shield, CheckCircle} from '@mui/icons-material'

export function RiskAssessment() {const risks = [
    {
      risk: "Data Loss During Migration",
      probability: "Low",
      impact: "High",
      mitigation: "Triple backup strategy, incremental sync, rollback procedures",
      status: "Mitigated",},
    {risk: "Extended Downtime",
      probability: "Very Low",
      impact: "Medium",
      mitigation: "Parallel systems, phased cutover, 24/7 monitoring",
      status: "Controlled",},
    {risk: "User Adoption Resistance",
      probability: "Medium",
      impact: "Medium",
      mitigation: "Comprehensive training, change management, peer support",
      status: "Managed",},
    {risk: "Integration Failures",
      probability: "Low",
      impact: "Medium",
      mitigation: "Pre-migration testing, API validation, fallback options",
      status: "Mitigated",},
  ]

  const getRiskColor = (probability: string) =>{switch (probability.toLowerCase()) {
      case "very low":
        return "text-accent"
      case "low":
        return "text-transcend"
      case "medium":
        return "text-primary"
      case "high":
        return "text-yellow-400"
      default:
        return "text-gray-400"}
  }

  return (<Card className="bg-dark-800/50 border-primary/20"><CardHeader><CardTitle className="text-white flex items-center gap-2"><Shield className="w-5 h-5" />Risk Assessment & Mitigation</CardTitle></CardHeader><CardContent><div className="space-y-4">{risks.map((risk /* , index */) => (<div key={index} className="p-4 bg-dark-700/30 rounded-lg"><div className="flex items-start justify-between mb-3"><div className="flex items-center gap-2"><Warning className="w-5 h-5 text-yellow-400" /><h3 className="text-white font-semibold">{risk.risk}</h3></div><Badge variant="secondary" className="bg-accent/20 text-accent">{risk.status}</Badge></div><div className="grid grid-cols-2 gap-4 mb-3"><div><><span className="text-gray-400 text-sm">Probability: </span><span
</>
className={`font-semibold ${getRiskColor(risk.probability)}`}>{risk.probability}</span></div><div><><span className="text-gray-400 text-sm">Impact: </span><span
</>
className={`font-semibold ${getRiskColor(risk.impact)}`}>{risk.impact}</span></div></div><div className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-accent mt-0.5" /><p className="text-sm text-gray-300">{risk.mitigation}</p></div></div>))}</div></CardContent></Card>
  )
}
