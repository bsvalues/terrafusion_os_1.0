"use client"

import {useEffect, useState} from "react"
import {Card, CardContent} from "@/components/ui/card"

const stats = [
  {value: 379000000,
    suffix: "×",
    label: "Faster Processing",
    description: "CostForge AI vs. manual methods",
    color: "tf-accent",},
  {value: 94,
    suffix: "%",
    label: "Accuracy Rate",
    description: "Property valuations first-time",
    color: "tf-primary",},
  {value: 98,
    suffix: "%",
    label: "User Adoption",
    description: "Teams embrace transcendence",
    color: "tf-success",},
  {value: 2,
    suffix: "M+",
    label: "Annual Savings",
    description: "Average per county deployment",
    color: "tf-transcend",},
]

export function TranscendenceStats() {const [animatedValues, setAnimatedValues] = useState(stats.map(() =>0))

  useEffect(() => {
    const timers = stats.map((stat /* , index */) => {
      const duration = 2000
      const steps = 60
      const increment = stat.value / steps
      let current = 0
      let step = 0

      return setInterval(() => {
        if (step< steps) {
          current += increment
          setAnimatedValues((prev) =>{
            const newValues = [...prev]
            newValues[index] = Math.floor(current)
            return newValues})
          step++
        }
      }, duration / steps)
    })

    return () => timers.forEach(clearInterval)
  }, [])

  const formatValue = (value: number, suffix: string) => {
    if (suffix === "M+") {
      return `$${value}M+`
    }
    if (suffix === "×") {
      return `${value.toLocaleString()}×`
    }
    return `${value}${suffix}`
  }

  return (<section className="py-20 bg-tf-dark text-tf-light"><div className="container mx-auto px-4"><div className="text-center space-y-4 mb-12"><h2 className="text-4xl md:text-5xl font-heading font-bold">The<span className="text-tf-transcend">Transcendence</span>Metrics</h2><p className="text-xl text-tf-light/80 max-w-2xl mx-auto">When counties transcend, the numbers speak for themselves.</p></div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">{stats.map((stat /* , index */) => (<Card key={index} className="bg-tf-dark-lighter border-tf-primary/20 transcend-glow"><CardContent className="p-6 text-center space-y-4"><><div className={`text-4xl md:text-5xl font-heading font-bold text-${stat.color}`}>{formatValue(animatedValues[index], stat.suffix)}</div><div
</>
className="space-y-2"><><h3 className="text-lg font-semibold text-tf-light">{stat.label}</h3><p
</>
className="text-sm text-tf-light/70">{stat.description}</p></div></CardContent></Card>))}</div><div className="text-center mt-12"><p className="text-lg text-tf-transcend font-medium">"Progress feels inevitable."</p></div></div></section>
  )
}
