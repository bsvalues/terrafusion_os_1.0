import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {Badge} from "@/components/ui/badge"

export function ROIAnalysis() {const roiMetrics = [
    {
      metric: "Average County ROI",
      value: "642%",
      timeframe: "Year 1",
      status: "Excellent",},
    {metric: "Implementation Cost",
      value: "$2.3M",
      timeframe: "Total",
      status: "Efficient",},
    {metric: "Annual Savings",
      value: "$28M",
      timeframe: "Per Year",
      status: "Outstanding",},
    {metric: "Payback Period",
      value: "2.8 months",
      timeframe: "Average",
      status: "Rapid",},
  ]

  return (
    <Card className="bg-dark-800/50 border-primary/20"><CardHeader><CardTitle className="text-white">ROI Analysis</CardTitle></CardHeader><CardContent className="space-y-4">{roiMetrics.map((item /* , index */) => (<div key={index} className="flex items-center justify-between p-3 bg-dark-700/30 rounded-lg"><div><><h4 className="text-white font-medium">{item.metric}</h4><p
</>
className="text-sm text-gray-400">{item.timeframe}</p></div><div className="text-right"><><p className="text-xl font-bold text-accent">{item.value}</p><Badge
</>variant="secondary" className="bg-accent/20 text-accent">
                {item.status}</Badge></div></div>))}</CardContent></Card>
  )
}
