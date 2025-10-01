"use client"

import {useState, useEffect} from "react"
import {Badge} from "@/components/ui/badge"

const priorityTiers = [
  {tier: "Tier 1: Critical Targets",
    description: "King County and Snohomish County represent 47% of total opportunity",
    counties: ["King County", "Snohomish County"],
    color: "from-red-500 to-red-600",
    percentage: 47,},
  {tier: "Tier 2: High Priority",
    description: "Pierce, Clark, Yakima, Whatcom - Major population centers",
    counties: ["Pierce", "Clark", "Yakima", "Whatcom"],
    color: "from-primary to-transcend",
    percentage: 35,},
  {tier: "Tier 3: Quick Wins",
    description: "Ready systems, smaller scale",
    counties: ["Cowlitz", "Island", "Grant", "Franklin"],
    color: "from-accent to-green-500",
    percentage: 12,},
  {tier: "Tier 4: Strategic Development",
    description: "Require system modernization first",
    counties: ["Stevens", "San Juan"],
    color: "from-yellow-500 to-orange-500",
    percentage: 6,},
]

export function StrategicStats() {const [activeMetrics, setActiveMetrics] = useState({
    totalOpportunity: 12.8,
    potentialSavings: 28,
    implementationRevenue: 4.2,
    contractValue: 46,})

  useEffect(() =>{const interval = setInterval(() => {
      setActiveMetrics((prev) => ({
        totalOpportunity: prev.totalOpportunity + (Math.random() - 0.5) * 0.1,
        potentialSavings: prev.potentialSavings + (Math.random() - 0.5) * 0.5,
        implementationRevenue: prev.implementationRevenue + (Math.random() - 0.5) * 0.05,
        contractValue: prev.contractValue + (Math.random() - 0.5) * 0.2,}))
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return (<section className="py-16 px-4"><div className="max-w-6xl mx-auto"><h2 className="text-3xl font-bold text-center mb-12"><span className="bg-gradient-to-r from-transcend to-accent bg-clip-text text-transparent">Priority Matrix & Financial Projections</span></h2>{/* Priority Tiers */}<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">{priorityTiers.map((tier /* , index */) => (<div
              key={index}
              className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-transcend/30 transition-all duration-300"
            ><div className="flex items-center justify-between mb-4"><><h3 className="text-lg font-semibold text-white">{tier.tier}</h3><Badge
</>
className={`bg-gradient-to-r ${tier.color} text-white`}>{tier.percentage}%</Badge></div><><p className="text-white/70 text-sm mb-4">{tier.description}</p><div
</>className="flex flex-wrap gap-2">
                {tier.counties.map((county, idx) => (<span key={idx} className="px-3 py-1 bg-white/10 rounded-full text-xs text-white/80">{county}</span>))}</div></div>))}</div>{/* Financial Projections */}<div className="bg-gradient-to-r from-black/60 to-black/40 backdrop-blur-sm border border-transcend/20 rounded-3xl p-8"><h3 className="text-2xl font-bold text-center mb-8"><span className="bg-gradient-to-r from-accent to-transcend bg-clip-text text-transparent">Total Financial Opportunity</span></h3><div className="grid grid-cols-1 md:grid-cols-4 gap-6"><div className="text-center"><><div className="text-3xl font-black text-primary mb-2">${activeMetrics.totalOpportunity.toFixed(1)}B</div><div
</>
className="text-white/60 text-sm">Combined Annual Budgets</div></div><div className="text-center"><><div className="text-3xl font-black text-accent mb-2">${activeMetrics.potentialSavings.toFixed(0)}M</div><div
</>
className="text-white/60 text-sm">Potential Annual Savings</div></div><div className="text-center"><><div className="text-3xl font-black text-transcend mb-2">${activeMetrics.implementationRevenue.toFixed(1)}M</div><div
</>
className="text-white/60 text-sm">Implementation Revenue</div></div><div className="text-center"><><div className="text-3xl font-black text-accent mb-2">${activeMetrics.contractValue.toFixed(0)}M</div><div
</>
className="text-white/60 text-sm">5-Year Contract Value</div></div></div></div></div></section>
  )
}
