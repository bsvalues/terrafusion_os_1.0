import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {Progress} from "@/components/ui/progress"

export function FinancialMetrics() {const metrics = [
    {
      name: "Revenue Recognition",
      current: 87,
      target: 95,
      value: "$47M",},
    {name: "Contract Renewals",
      current: 94,
      target: 98,
      value: "94%",},
    {name: "Expansion Revenue",
      current: 76,
      target: 85,
      value: "$12M",},
    {name: "Gross Margin",
      current: 89,
      target: 92,
      value: "89%",},
  ]

  return (
    <Card className="bg-dark-800/50 border-primary/20"><CardHeader><CardTitle className="text-white">Key Financial Metrics</CardTitle></CardHeader><CardContent className="space-y-6">{metrics.map((metric /* , index */) => (<div key={index} className="space-y-2"><div className="flex items-center justify-between"><><span className="text-gray-300">{metric.name}</span><span
</>
className="text-white font-semibold">{metric.value}</span></div><Progress value={metric.current} className="h-2" /><div className="flex justify-between text-xs text-gray-400"><><span>Current: {metric.current}%</span><span
</></>>Target: {metric.target}%</span></div></div>))}</CardContent></Card>
  )
}
