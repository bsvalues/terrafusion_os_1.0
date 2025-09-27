import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {Progress} from "@/components/ui/progress"

export function StateFinancials() {const states = [
    {
      name: "Washington",
      counties: 27,
      totalCounties: 39,
      arr: "$18.2M",
      growth: "+34%",
      completion: 69,},
    {name: "Florida",
      counties: 15,
      totalCounties: 67,
      arr: "$24.8M",
      growth: "+156%",
      completion: 22,},
    {name: "Arizona",
      counties: 8,
      totalCounties: 15,
      arr: "$6.4M",
      growth: "+89%",
      completion: 53,},
    {name: "Michigan",
      counties: 12,
      totalCounties: 83,
      arr: "$4.6M",
      growth: "+67%",
      completion: 14,},
  ]

  return (
    <Card className="bg-dark-800/50 border-primary/20"><CardHeader><CardTitle className="text-white">State Financial Performance</CardTitle></CardHeader><CardContent className="space-y-6">{states.map((state /* , index */) => (<div key={index} className="space-y-2"><div className="flex items-center justify-between"><div><><h4 className="text-white font-semibold">{state.name}</h4><p
</>className="text-sm text-gray-400">
                  {state.counties}/{state.totalCounties} counties</p></div><div className="text-right"><><p className="text-white font-semibold">{state.arr}</p><p
</>
className="text-sm text-accent">{state.growth}</p></div></div><Progress value={state.completion} className="h-2" /></div>))}</CardContent></Card>
  )
}
