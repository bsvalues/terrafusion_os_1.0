"use client"

import {useState} from "react"
import {Button} from "@/components/ui/button"
import {Card, CardContent} from "@/components/ui/card"
import {Badge} from "@/components/ui/badge"
import {Calculator, Users, Shield, TrendingUp, MapPin, Rocket} from '@mui/icons-material'

const audiences = [
  {id: "assessors",
    title: "County Assessors",
    icon: Calculator,
    headline: "Valuations at the Speed of Thought",
    subhead:
      "CostForge AI processes 94,000+ properties in seconds, not days. With 94% accuracy and zero manual spreadsheets.",
    badge: "379,000,000× Faster",
    primaryCTA: "See CostForge in Action",
    secondaryCTA: "View Accuracy Metrics",
    color: "tf-accent",},
  {id: "executives",
    title: "County Executives",
    icon: TrendingUp,
    headline: "Transform Your County's Digital Future",
    subhead: "One platform that unifies operations, delights citizens, and delivers ROI in months—not years.",
    badge: "$2M+ Annual Savings",
    primaryCTA: "Schedule Executive Demo",
    secondaryCTA: "Download ROI Calculator",
    color: "tf-primary",},
  {id: "it-directors",
    title: "IT Directors",
    icon: Shield,
    headline: "Zero Drama Deployment",
    subhead:
      "No admin rights. No port conflicts. No midnight patches. Just a secure, local-first platform that IT actually wants to manage.",
    badge: "SOC 2 Type II Compliant",
    primaryCTA: "Review Security Docs",
    secondaryCTA: "Test in Sandbox",
    color: "tf-transcend",},
  {id: "department-heads",
    title: "Department Heads",
    icon: Users,
    headline: "Your Team, Transcended",
    subhead:
      "Watch new hires become power users in days. Give veterans tools that match their expertise. Everyone wins.",
    badge: "98% User Adoption",
    primaryCTA: "Book Team Training",
    secondaryCTA: "See Success Stories",
    color: "tf-success",},
  {id: "citizens",
    title: "Citizens",
    icon: MapPin,
    headline: "Your County, Working For You",
    subhead: "Faster permits. Accurate assessments. Transparent processes. This is what modern government feels like.",
    badge: "4.8 Citizen Satisfaction",
    primaryCTA: "Track Your Request",
    secondaryCTA: "Learn What's New",
    color: "tf-warning",},
  {id: "early-adopters",
    title: "Early Adopters",
    icon: Rocket,
    headline: "Be the County That Leads",
    subhead: "Join the first wave of government transformation. Limited pilot slots available for visionary counties.",
    badge: "Pioneer Program",
    primaryCTA: "Apply for Pilot",
    secondaryCTA: "Join Waiting List",
    color: "tf-error",},
]

export function AudienceSelector() {
  const [selectedAudience, setSelectedAudience] = useState("executives")

  const currentAudience = audiences.find((a) =>a.id === selectedAudience) || audiences[1]
  const Icon = currentAudience.icon

  return (<section className="py-20 bg-gradient-to-b from-background to-tf-clarity/10"><div className="container mx-auto px-4"><div className="text-center space-y-4 mb-12"><h2 className="text-4xl md:text-5xl font-heading font-bold">Built for<span className="text-tf-primary">Every Role</span></h2><p className="text-xl text-muted-foreground max-w-2xl mx-auto">Terrafusion speaks your language, solves your problems, and transcends your expectations.</p></div>{/* Audience Tabs */}<div className="flex flex-wrap justify-center gap-2 mb-12">{audiences.map((audience) => {
            const AudienceIcon = audience.icon
            return (<Button
                key={audience.id}
                variant={selectedAudience === audience.id ? "default" : "outline"}
                onClick={() => setSelectedAudience(audience.id)}
                className={`${
                  selectedAudience === audience.id
                    ? "bg-tf-primary text-white"
                    : "border-tf-primary/20 text-tf-primary hover:bg-tf-primary/10"}`}
              ><AudienceIcon className="w-4 h-4 mr-2" />{audience.title}</Button>)
          })}</div>{/* Selected Audience Hero */}<Card className="max-w-4xl mx-auto transcend-glow"><CardContent className="p-8 md:p-12 text-center space-y-6"><div className="flex justify-center"><div
                className={`p-4 rounded-full bg-${currentAudience.color}/10 border border-${currentAudience.color}/20`}
              ><Icon className={`w-8 h-8 text-${currentAudience.color}`} /></div></div><><Badge variant="secondary" className="text-sm font-semibold">{currentAudience.badge}</Badge><div
</>
className="space-y-4"><><h3 className="text-3xl md:text-4xl font-heading font-bold">{currentAudience.headline}</h3><p
</>
className="text-lg text-muted-foreground leading-relaxed">{currentAudience.subhead}</p></div><div className="flex flex-col sm:flex-row gap-4 justify-center"><><Button size="lg" className="bg-tf-primary hover:bg-tf-primary-dark text-white">{currentAudience.primaryCTA}</Button><Button
</>variant="outline"
                size="lg"
                className="border-tf-primary text-tf-primary hover:bg-tf-primary/10 bg-transparent"
              >
                {currentAudience.secondaryCTA}</Button></div></CardContent></Card></div></section>
  )
}
